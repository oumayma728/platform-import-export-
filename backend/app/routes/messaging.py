from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.config.database import get_db
from app.schemas.messaging import ConversationOut, ConversationCreate, MessageOut, ConversationUpdateStatus, DocumentMessageOut
from app.services import messaging_service
from app.middleware.auth_middleware import get_current_user
from app.models.models import User
from app.utils.websocket_manager import manager
from app.config.security import verify_token

router = APIRouter(prefix="/messaging", tags=["Messaging"])
ws_router = APIRouter(tags=["WebSockets"])

@router.post("/conversations", response_model=ConversationOut)
def initiate_conversation(
    conv_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company:
        raise HTTPException(status_code=403, detail="Vous devez être rattaché à une entreprise pour initier une conversation")
    return messaging_service.create_conversation(db, conv_in.listing_id, current_user.company.id)

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company:
        raise HTTPException(status_code=403, detail="Vous devez être rattaché à une entreprise")
    return messaging_service.get_company_conversations(db, current_user.company.id)

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return messaging_service.get_conversation_messages(db, conversation_id, current_user)

@router.put("/conversations/{conversation_id}/status", response_model=ConversationOut)
def update_status(
    conversation_id: str,
    status_update: ConversationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company:
        raise HTTPException(status_code=403, detail="Vous devez être rattaché à une entreprise")
    return messaging_service.update_conversation_status(db, conversation_id, status_update.statut, current_user.company.id)

@router.post("/messages/{conversation_id}/documents", response_model=DocumentMessageOut)
def upload_document(
    conversation_id: str,
    message_id: str = Query(..., description="ID of the message to attach the document to"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ALLOWED_TYPES = [
        "application/pdf", 
        "image/jpeg", 
        "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ]
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé. Seuls les PDF, JPEG, PNG, DOCX et PPTX sont acceptés."
        )

    fake_url = f"https://cdn.plateforme-import-export.com/documents/{uuid.uuid4()}-{file.filename}"
    
    doc = messaging_service.add_document_to_message(
        db=db,
        message_id=message_id,
        file_url=fake_url,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream"
    )
    return doc

@ws_router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    conversation_id: str,
    token: str = Query(...)
):
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Token invalide")
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            db = next(get_db())
            new_msg = messaging_service.add_message(db, conversation_id, user_id, data)
            
            message_data = {
                "id": new_msg.id,
                "conversation_id": new_msg.conversation_id,
                "sender_id": new_msg.sender_id,
                "contenu": new_msg.contenu,
                "date_envoi": new_msg.date_envoi.isoformat()
            }
            await manager.broadcast_to_conversation(message_data, conversation_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
