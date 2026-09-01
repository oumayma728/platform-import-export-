"""
messaging.py — Système de messagerie avec WebSocket
Conversations entre importateurs et exportateurs autour d'un stand.

Statuts de conversation :
  SUGGEREE → CONSULTEE → EN_CONTACT → EN_NEGOCIATION → CONCLUE | REJETEE
"""
import json
import logging
from datetime import datetime
from typing import List, Optional

import os
import uuid
import jwt
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from ..models import Company, Conversation, Message, Stand, User, UserQuota
from ..routes.auth import get_current_user, require_role, SECRET_KEY, ALGORITHM
from ..schemas import (
    ConversationCreate, ConversationRead, ConversationStatusUpdate,
    MessageCreate, MessageRead, UserRead,
)
from ..services.email import new_message_email_html, quota_exceeded_email_html
from ..services.notification import NotificationService
from ..websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()

CONVERSATION_STATUSES = [
    "SUGGEREE", "CONSULTEE", "EN_CONTACT", "EN_NEGOCIATION", "CONCLUE", "REJETEE"
]

FREE_CHAT_LIMIT = 50  # Messages gratuits par compte


def _check_chat_quota(user_id: str, db: Session) -> None:
    """Vérifie si l'utilisateur a dépassé son quota de messages gratuits en utilisant UserQuota."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        # Création fallback
        quota = UserQuota(user_id=user_id)
        db.add(quota)
        db.commit()

    if quota.status in ("ABONNE", "PAIEMENT_USAGE"):
        return
        
    if quota.chats_used >= FREE_CHAT_LIMIT or quota.status == "LIMITE_ATTEINTE":
        if quota.status != "LIMITE_ATTEINTE":
            quota.status = "LIMITE_ATTEINTE"
            db.commit()
            _notify_quota_exceeded(user_id, db)
            
        raise HTTPException(
            status_code=402,
            detail={
                "code": "QUOTA_EXCEEDED",
                "message": f"Vous avez utilisé vos {FREE_CHAT_LIMIT} messages gratuits. Passez à un abonnement pour continuer.",
                "free_chats_used": quota.chats_used,
                "limit": FREE_CHAT_LIMIT,
            },
        )


def _notify_quota_exceeded(user_id: str, db: Session) -> None:
    """Envoie l'alerte de dépassement du quota gratuit via NotificationService."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            NotificationService.send_email(
                to=user.email,
                subject="⚠️ Quota de messages gratuits atteint",
                body=quota_exceeded_email_html(user.full_name),
                user_id=user.id,
                db=db,
            )
    except Exception as n_err:
        logger.error(f"Erreur notification quota dépassé pour {user_id}: {n_err}")


def _notify_new_message(conv: Conversation, sender_user: UserRead, db: Session) -> None:
    """Notifie par email les autres participants de la conversation (nouveau message)."""
    try:
        stand = db.query(Stand).filter(Stand.id == conv.stand_id).first()
        importer = db.query(Company).filter(Company.id == conv.importer_id).first()

        recipients = []
        if importer and importer.owner_id and importer.owner_id != sender_user.id:
            recipients.append(importer.owner_id)
        if stand and stand.exporter_id:
            exporter = db.query(Company).filter(Company.id == stand.exporter_id).first()
            if exporter and exporter.owner_id and exporter.owner_id != sender_user.id:
                recipients.append(exporter.owner_id)

        sender_name = sender_user.full_name or sender_user.email
        for owner_id in set(recipients):
            owner = db.query(User).filter(User.id == owner_id).first()
            if owner:
                NotificationService.send_email(
                    to=owner.email,
                    subject=f"💬 Nouveau message de {sender_name}",
                    body=new_message_email_html(sender_name, conv.id),
                    user_id=owner.id,
                    db=db,
                )
    except Exception as n_err:
        logger.error(f"Erreur notification nouveau message: {n_err}")


# ─────────────────────────────────────────────────────────────────────────────
# CONVERSATIONS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ConversationRead])
def list_conversations(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les conversations de l'utilisateur."""
    query = db.query(Conversation)

    if current_user.role_id == "importer":
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        query = query.filter(Conversation.importer_id.in_(owned_ids))
    elif current_user.role_id == "exporter":
        # L'exportateur voit les conversations sur ses stands
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        stand_ids = [
            s.id for s in db.query(Stand).filter(Stand.exporter_id.in_(owned_ids)).all()
        ]
        query = query.filter(Conversation.stand_id.in_(stand_ids))

    return [ConversationRead.model_validate(c) for c in query.order_by(Conversation.updated_at.desc()).all()]


@router.post("/", response_model=ConversationRead, status_code=201)
def create_conversation(
    payload: ConversationCreate,
    current_user: UserRead = Depends(require_role("admin", "importer")),
    db: Session = Depends(get_db),
):
    """Crée une nouvelle conversation (importateur initie le contact)."""
    stand = db.query(Stand).filter(Stand.id == payload.stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")
    if stand.status != "VALIDE":
        raise HTTPException(status_code=400, detail="Le stand doit être validé pour démarrer une conversation")

    importer = db.query(Company).filter(Company.id == payload.importer_id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Entreprise importatrice introuvable")
    if current_user.role_id == "importer" and importer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez créer une conversation qu'avec votre propre entreprise")

    # Vérifier si une conversation existe déjà
    existing = db.query(Conversation).filter(
        Conversation.stand_id == payload.stand_id,
        Conversation.importer_id == payload.importer_id,
    ).first()
    if existing:
        return ConversationRead.model_validate(existing)

    conv = Conversation(
        stand_id=payload.stand_id,
        importer_id=payload.importer_id,
        status="SUGGEREE",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationRead.model_validate(conv)


@router.get("/{conv_id}", response_model=ConversationRead)
def get_conversation(
    conv_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère une conversation et la marque comme CONSULTEE."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    # Marquer comme consultée
    if conv.status == "SUGGEREE":
        conv.status = "CONSULTEE"
        conv.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conv)

    return ConversationRead.model_validate(conv)


@router.patch("/{conv_id}/status", response_model=ConversationRead)
def update_conversation_status(
    conv_id: str,
    payload: ConversationStatusUpdate,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Met à jour le statut d'une conversation (exportateur/admin)."""
    if payload.status not in CONVERSATION_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs : {CONVERSATION_STATUSES}")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    conv.status = payload.status
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conv)
    return ConversationRead.model_validate(conv)


# ─────────────────────────────────────────────────────────────────────────────
# MESSAGES
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{conv_id}/messages", response_model=List[MessageRead])
def list_messages(
    conv_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historique des messages d'une conversation."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    messages = db.query(Message).filter(
        Message.conversation_id == conv_id
    ).order_by(Message.created_at).all()

    return [MessageRead.model_validate(m) for m in messages]


@router.post("/{conv_id}/messages", response_model=MessageRead, status_code=201)
def send_message(
    conv_id: str,
    payload: MessageCreate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Envoie un message dans une conversation (endpoint REST, fallback du WebSocket)."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    if not payload.content and not payload.document_url:
        raise HTTPException(status_code=400, detail="Le message doit contenir du texte ou un document")

    # Vérifier le quota de chats gratuits
    _check_chat_quota(current_user.id, db)

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=payload.content,
        document_url=payload.document_url,
        document_name=payload.document_name,
    )
    db.add(msg)

    # Incrémenter le compteur de messages gratuits si applicable
    quota = db.query(UserQuota).filter(UserQuota.user_id == current_user.id).first()
    if quota and quota.status in ("GRATUIT", "ABONNEMENT_EXPIRE"):
        quota.chats_used += 1
        if quota.chats_used >= FREE_CHAT_LIMIT:
            quota.status = "LIMITE_ATTEINTE"

    # Mettre à jour le statut de la conversation
    if conv.status in ("SUGGEREE", "CONSULTEE"):
        conv.status = "EN_CONTACT"
    conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)

    # Notification email aux autres participants (via NotificationService + NotificationLog)
    _notify_new_message(conv, current_user, db)

    return MessageRead.model_validate(msg)


@router.post("/{conv_id}/documents", response_model=MessageRead, status_code=201)
def upload_conversation_document(
    conv_id: str,
    file: UploadFile = File(...),
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload un document dans la conversation et crée le message correspondant."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    _check_chat_quota(current_user.id, db)

    # Dossier de stockage des uploads
    upload_dir = os.path.join("app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    document_url = f"/static/uploads/{unique_filename}"

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=f"📎 Document partagé : {file.filename}",
        document_url=document_url,
        document_name=file.filename,
    )
    db.add(msg)

    quota = db.query(UserQuota).filter(UserQuota.user_id == current_user.id).first()
    if quota and quota.status in ("GRATUIT", "ABONNEMENT_EXPIRE"):
        quota.chats_used += 1
        if quota.chats_used >= FREE_CHAT_LIMIT:
            quota.status = "LIMITE_ATTEINTE"

    if conv.status in ("SUGGEREE", "CONSULTEE"):
        conv.status = "EN_CONTACT"
    conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)
    return MessageRead.model_validate(msg)


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET
# ─────────────────────────────────────────────────────────────────────────────
@router.websocket("/ws/{conv_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conv_id: str,
    token: Optional[str] = Query(default=None),
):
    """
    Connexion WebSocket pour la messagerie temps réel.
    URL : ws://localhost:8000/conversations/ws/{conv_id}?token=<JWT>
    """
    # Authentification via query param token
    if not token:
        await websocket.close(code=4001, reason="Token manquant")
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close(code=4001, reason="Token invalide")
            return
    except jwt.PyJWTError:
        await websocket.close(code=4001, reason="Token invalide ou expiré")
        return

    # Connexion au gestionnaire
    await ws_manager.connect(websocket, conv_id)

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            document_url = data.get("document_url")
            document_name = data.get("document_name")

            if not content and not document_url:
                continue

            # Sauvegarder en DB
            db = SessionLocal()
            try:
                # Vérifier quota
                quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
                if not quota:
                    quota = UserQuota(user_id=user_id)
                    db.add(quota)
                    
                if quota.status not in ("ABONNE", "PAIEMENT_USAGE") and quota.chats_used >= FREE_CHAT_LIMIT:
                    if quota.status != "LIMITE_ATTEINTE":
                        quota.status = "LIMITE_ATTEINTE"
                        db.commit()
                        _notify_quota_exceeded(user_id, db)
                        
                    await websocket.send_json({
                        "type": "error",
                        "code": "QUOTA_EXCEEDED",
                        "message": f"Quota de {FREE_CHAT_LIMIT} messages gratuits atteint. Abonnez-vous pour continuer.",
                    })
                    continue

                msg = Message(
                    conversation_id=conv_id,
                    sender_id=user_id,
                    content=content,
                    document_url=document_url,
                    document_name=document_name,
                )
                db.add(msg)

                if quota.status in ("GRATUIT", "ABONNEMENT_EXPIRE"):
                    quota.chats_used += 1
                    if quota.chats_used >= FREE_CHAT_LIMIT:
                        quota.status = "LIMITE_ATTEINTE"

                # Mettre à jour statut conversation
                conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
                if conv and conv.status in ("SUGGEREE", "CONSULTEE"):
                    conv.status = "EN_CONTACT"
                    conv.updated_at = datetime.utcnow()

                db.commit()
                db.refresh(msg)

                # Diffuser à tous les participants
                broadcast_data = {
                    "type": "message",
                    "id": msg.id,
                    "conversation_id": conv_id,
                    "sender_id": user_id,
                    "content": msg.content,
                    "document_url": msg.document_url,
                    "document_name": msg.document_name,
                    "created_at": msg.created_at.isoformat(),
                }
                await ws_manager.broadcast(broadcast_data, conv_id)

            finally:
                db.close()

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, conv_id)
