from fastapi import APIRouter, Depends, File, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.config.database import SessionLocal, get_db
from app.controllers.conversation_controller import add_message, create_conversation, get_conversation, list_conversations
from app.middleware.auth import verify_token
from app.schemas.conversation import ConversationCreate, MessageCreate, StatusUpdate

router = APIRouter(prefix="/conversations", tags=["Messagerie"])

class ConnectionManager:
    def __init__(self): self.connections: dict[int, list[WebSocket]] = {}
    async def connect(self, conversation_id: int, ws: WebSocket):
        await ws.accept(); self.connections.setdefault(conversation_id, []).append(ws)
    def disconnect(self, conversation_id: int, ws: WebSocket):
        if conversation_id in self.connections and ws in self.connections[conversation_id]: self.connections[conversation_id].remove(ws)
    async def broadcast(self, conversation_id: int, message: dict):
        for ws in self.connections.get(conversation_id, [])[:]: await ws.send_json(message)

manager = ConnectionManager()

@router.post("", status_code=201, summary="Initier une conversation", description="Créer une conversation entre deux utilisateurs liés à une annonce.", responses={201: {"description": "Conversation créée"}, 400: {"description": "Conversation invalide"}, 401: {"description": "Non authentifié"}})
def create(data: ConversationCreate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return create_conversation(data.destinataire_id, data.listing_id, user["id"], db)

@router.get("", summary="Lister mes conversations", description="Retourner l'historique des conversations auxquelles l'utilisateur participe.", responses={200: {"description": "Liste des conversations"}, 401: {"description": "Non authentifié"}})
def list_all(user: dict = Depends(verify_token), db: Session = Depends(get_db)): return list_conversations(user["id"], db)

@router.get("/{conversation_id}/messages", summary="Lire les messages", description="Récupérer les messages d'une conversation donnée.", responses={200: {"description": "Messages retournés"}, 401: {"description": "Non authentifié"}, 404: {"description": "Conversation introuvable"}})
def messages(conversation_id: int, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    conversation = get_conversation(conversation_id, user["id"], db)
    return [{"id": m.id, "expediteur_id": m.expediteur_id, "contenu": m.contenu, "document_url": m.document_url, "created_at": m.created_at} for m in conversation.messages]

@router.post("/{conversation_id}/messages", status_code=201, summary="Envoyer un message", description="Publier un message texte dans une conversation.", responses={201: {"description": "Message envoyé"}, 401: {"description": "Non authentifié"}, 404: {"description": "Conversation introuvable"}})
async def send(conversation_id: int, data: MessageCreate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    result = add_message(conversation_id, user["id"], data.contenu, None, db)
    await manager.broadcast(conversation_id, result)
    return result

@router.post("/{conversation_id}/documents", status_code=201, summary="Associer un document à un message", description="Ajouter une métadonnée de document à un message de conversation.", responses={201: {"description": "Document associé"}, 401: {"description": "Non authentifié"}, 404: {"description": "Conversation introuvable"}})
async def document(conversation_id: int, file: UploadFile = File(...), user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    result = add_message(conversation_id, user["id"], None, f"upload://{file.filename}", db)
    await manager.broadcast(conversation_id, result)
    return result

@router.put("/{conversation_id}/status", summary="Changer le statut d'une mise en relation", description="Mettre à jour le statut d'une conversation.", responses={200: {"description": "Statut mis à jour"}, 401: {"description": "Non authentifié"}, 404: {"description": "Conversation introuvable"}})
def change_status(conversation_id: int, data: StatusUpdate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    item = get_conversation(conversation_id, user["id"], db); item.statut = data.statut.value; db.commit()
    return {"id": item.id, "statut": item.statut}

@router.websocket("/ws/{conversation_id}")
async def websocket(conversation_id: int, websocket: WebSocket):
    # Le jeton est fourni en query string: ?token=<JWT> ; validation effectuée avant la connexion.
    from jose import jwt, JWTError
    import os
    try:
        payload = jwt.decode(websocket.query_params.get("token", ""), os.getenv("JWT_SECRET", "change-me-in-production"), algorithms=[os.getenv("JWT_ALGORITHM", "HS256")])
        db = SessionLocal(); get_conversation(conversation_id, payload["id"], db); db.close()
    except Exception:
        await websocket.close(code=1008); return
    await manager.connect(conversation_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            db = SessionLocal(); result = add_message(conversation_id, payload["id"], data.get("contenu"), None, db); db.close()
            await manager.broadcast(conversation_id, result)
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
