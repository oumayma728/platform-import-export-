import os
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.config.database import SessionLocal, get_db
from app.middleware.auth import verify_token
from app.models.conversations import Conversation
from app.schemas.conversation import (
    ConversationCreate,
    MessageCreate,
    StatusUpdate,
)

from app.controllers.conversation_controller import (
    add_message,
    conversation_dict,
    create_conversation,
    get_conversation as get_conversation_controller,
    list_conversations,
    get_messages,
    upload_document,
    update_conversation_status,
)


JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise Exception("JWT_SECRET non défini")

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256",
)


router = APIRouter(
    prefix="/conversations",
    tags=["Messagerie"],
)


# ---------------------------------------------------------------------------
# Document upload schema
# ---------------------------------------------------------------------------

class DocumentUpload(BaseModel):
    nom_fichier: str
    url: str
    type_fichier: Optional[str] = None
    taille: Optional[int] = None


# ---------------------------------------------------------------------------
# WebSocket manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.connections: dict[
            int,
            list[WebSocket]
        ] = {}

    async def connect(
        self,
        conversation_id: int,
        ws: WebSocket,
    ):
        await ws.accept()

        self.connections.setdefault(
            conversation_id,
            [],
        ).append(ws)

    def disconnect(
        self,
        conversation_id: int,
        ws: WebSocket,
    ):
        if (
            conversation_id in self.connections
            and ws in self.connections[conversation_id]
        ):
            self.connections[conversation_id].remove(ws)

    async def broadcast(
        self,
        conversation_id: int,
        message: dict,
    ):
        connections = self.connections.get(
            conversation_id,
            [],
        )[:]

        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(
                    conversation_id,
                    ws,
                )


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Créer une conversation
# ---------------------------------------------------------------------------

@router.post(
    "",
    status_code=201,
    summary="Initier une conversation",
    description=(
        "Créer une conversation entre deux utilisateurs "
        "liés à une annonce."
    ),
    responses={
        201: {
            "description": "Conversation créée"
        },
        400: {
            "description": "Conversation invalide"
        },
        401: {
            "description": "Non authentifié"
        },
        402: {
            "description": "Limite de chats atteinte"
        },
    },
)
def create(
    data: ConversationCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return create_conversation(
        data.destinataire_id,
        data.listing_id,
        user["id"],
        db,
    )


# ---------------------------------------------------------------------------
# Lister mes conversations
# ---------------------------------------------------------------------------

@router.get(
    "",
    summary="Lister mes conversations",
    description=(
        "Retourner l'historique des conversations "
        "auxquelles l'utilisateur participe."
    ),
    responses={
        200: {
            "description": "Liste des conversations"
        },
        401: {
            "description": "Non authentifié"
        },
    },
)
def list_all(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return list_conversations(
        user["id"],
        db,
    )


# ---------------------------------------------------------------------------
# Détail d'une conversation
# ---------------------------------------------------------------------------

@router.get(
    "/{conversation_id}",
    summary="Détail d'une conversation",
)
def conversation_detail(
    conversation_id: int,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    conv = get_conversation_controller(
        conversation_id,
        current_user["id"],
        db,
    )

    return conversation_dict(
        conv,
        current_user["id"],
        db,
    )


# ---------------------------------------------------------------------------
# Lire les messages
# ---------------------------------------------------------------------------

@router.get(
    "/{conversation_id}/messages",
    summary="Lire les messages",
    description=(
        "Récupérer les messages d'une "
        "conversation donnée."
    ),
    responses={
        200: {
            "description": "Messages retournés"
        },
        401: {
            "description": "Non authentifié"
        },
        404: {
            "description": "Conversation introuvable"
        },
    },
)
def messages(
    conversation_id: int,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return get_messages(
        conversation_id,
        user["id"],
        db,
    )


# ---------------------------------------------------------------------------
# Envoyer un message
# ---------------------------------------------------------------------------

@router.post(
    "/{conversation_id}/messages",
    status_code=201,
    summary="Envoyer un message",
    description=(
        "Publier un message texte dans une conversation."
    ),
    responses={
        201: {
            "description": "Message envoyé"
        },
        400: {
            "description": "Message invalide"
        },
        401: {
            "description": "Non authentifié"
        },
        404: {
            "description": "Conversation introuvable"
        },
    },
)
async def send(
    conversation_id: int,
    data: MessageCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    result = add_message(
        conversation_id,
        user["id"],
        data.contenu,
        None,
        db,
    )

    await manager.broadcast(
        conversation_id,
        result,
    )

    return result


# ---------------------------------------------------------------------------
# Upload document
# ---------------------------------------------------------------------------

@router.post(
    "/{conversation_id}/documents",
    status_code=201,
    summary="Associer un document à un message",
    description=(
        "Ajouter un vrai fichier à une conversation."
    ),
    responses={
        201: {
            "description": "Document associé"
        },
        401: {
            "description": "Non authentifié"
        },
        404: {
            "description": "Conversation introuvable"
        },
    },
)
async def document(
    conversation_id: int,
    file: UploadFile = File(...),
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    upload_dir = "uploads"

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    # Nom fichier sécurisé minimalement
    filename = os.path.basename(
        file.filename or "document"
    )

    filepath = os.path.join(
        upload_dir,
        filename,
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer,
        )

    result = upload_document(
        conversation_id,
        user["id"],
        filename,
        filepath,
        file.content_type or "application/octet-stream",
        os.path.getsize(filepath),
        db,
    )

    await manager.broadcast(
        conversation_id,
        result,
    )

    return result


# ---------------------------------------------------------------------------
# Changer le statut
# ---------------------------------------------------------------------------

@router.put(
    "/{conversation_id}/status",
    summary="Changer le statut d'une mise en relation",
    description=(
        "Mettre à jour le statut d'une conversation."
    ),
    responses={
        200: {
            "description": "Statut mis à jour"
        },
        400: {
            "description": "Statut invalide"
        },
        401: {
            "description": "Non authentifié"
        },
        404: {
            "description": "Conversation introuvable"
        },
    },
)
def change_status(
    conversation_id: int,
    data: StatusUpdate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return update_conversation_status(
        conversation_id,
        user["id"],
        data.statut.value,
        db,
    )


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------

@router.websocket(
    "/ws/{conversation_id}"
)
async def websocket(
    conversation_id: int,
    websocket: WebSocket,
):
    """
    Connexion WebSocket.
    Le JWT est fourni en query string :

        ?token=<JWT>
    """

    from jose import jwt

    token = websocket.query_params.get(
        "token",
        "",
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        db = SessionLocal()

        try:
            get_conversation_controller(
                conversation_id,
                payload["id"],
                db,
            )
        finally:
            db.close()

    except Exception:
        await websocket.close(
            code=1008
        )
        return

    await manager.connect(
        conversation_id,
        websocket,
    )

    try:
        while True:
            data = await websocket.receive_json()

            contenu = data.get("contenu")

            # Compatibilité avec le Front
            if contenu is None:
                contenu = data.get("text")

            db = SessionLocal()

            try:
                result = add_message(
                    conversation_id,
                    payload["id"],
                    contenu,
                    None,
                    db,
                )
            finally:
                db.close()

            await manager.broadcast(
                conversation_id,
                result,
            )

    except WebSocketDisconnect:
        manager.disconnect(
            conversation_id,
            websocket,
        )

    except Exception:
        manager.disconnect(
            conversation_id,
            websocket,
        )