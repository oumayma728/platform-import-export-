from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.billing import UserQuota
from app.models.conversations import Conversation, Message
from app.models.conversations import CONVERSATION_STATUSES
from app.models.user import User
from app.services.notification_service import create_notification

def conversation_dict(item: Conversation):
    return {"id": item.id, "initiateur_id": item.initiateur_id, "destinataire_id": item.destinataire_id,
            "listing_id": item.listing_id, "statut": item.statut, "created_at": item.created_at}


def is_member(conversation: Conversation, user_id: int):
    if user_id not in (conversation.initiateur_id, conversation.destinataire_id):
        raise HTTPException(status_code=403, detail="Vous ne faites pas partie de cette conversation")


def create_conversation(destinataire_id: int, listing_id: int | None, user_id: int, db: Session):
    if destinataire_id == user_id:
        raise HTTPException(status_code=400, detail="Impossible de créer une conversation avec soi-même")

    # Vérifier d'abord si la conversation existe déjà — ça ne consomme jamais de quota
    existing = db.query(Conversation).filter(
        Conversation.initiateur_id == user_id,
        Conversation.destinataire_id == destinataire_id,
        Conversation.listing_id == listing_id
    ).first()
    if existing:
        return conversation_dict(existing)

    # Seulement ensuite, vérifier le quota — puisqu'on sait que c'est vraiment un NOUVEAU chat
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        quota = UserQuota(user_id=user_id); db.add(quota); db.flush()
    if quota.statut not in ("ABONNE", "PAIEMENT_USAGE") and quota.chats_utilises >= quota.chats_gratuits:
        quota.statut = "LIMITE_ATTEINTE"; db.commit()
        emetteur = db.get(User, user_id)
        if emetteur:
            create_notification(db, user_id, "EMAIL", emetteur.email,
                "Vous avez atteint votre limite de 50 chats gratuits. Passez à l'abonnement ou au paiement à l'usage pour continuer.",
                sujet="Limite de chats gratuits atteinte")
        raise HTTPException(status_code=402, detail="Limite de 50 nouveaux chats atteinte. Un paiement ou abonnement est requis.")

    conversation = Conversation(initiateur_id=user_id, destinataire_id=destinataire_id, listing_id=listing_id)
    quota.chats_utilises += 1
    if quota.chats_utilises >= quota.chats_gratuits: quota.statut = "LIMITE_ATTEINTE"
    db.add(conversation); db.commit(); db.refresh(conversation)
    return conversation_dict(conversation)
 


def list_conversations(user_id: int, db: Session):
    rows = db.query(Conversation).filter(or_(Conversation.initiateur_id == user_id, Conversation.destinataire_id == user_id)).order_by(Conversation.updated_at.desc()).all()
    return [conversation_dict(row) for row in rows]


def get_conversation(conversation_id: int, user_id: int, db: Session):
    item = db.get(Conversation, conversation_id)
    if not item: raise HTTPException(status_code=404, detail="Conversation introuvable")
    is_member(item, user_id)
    return item


def add_message(conversation_id: int, user_id: int, contenu: str | None, document_url: str | None, db: Session):
    conversation = get_conversation(conversation_id, user_id, db)
    if not contenu and not document_url: raise HTTPException(status_code=400, detail="Un message ou document est requis")
    msg = Message(conversation_id=conversation.id, expediteur_id=user_id, contenu=contenu, document_url=document_url)
    if conversation.statut == "SUGGEREE": conversation.statut = "EN_CONTACT"
    conversation.updated_at = datetime.utcnow()
    db.add(msg); db.commit(); db.refresh(msg)
 
    destinataire_id = (
        conversation.destinataire_id if user_id == conversation.initiateur_id else conversation.initiateur_id
    )
    destinataire = db.get(User, destinataire_id)
    if destinataire:
        create_notification(
            db, destinataire_id, "EMAIL", destinataire.email,
            f"Vous avez reçu un nouveau message dans une conversation.",
            sujet="Nouveau message",
        )
 
    return {"id": msg.id, "conversation_id": msg.conversation_id, "expediteur_id": msg.expediteur_id,
            "contenu": msg.contenu, "document_url": msg.document_url, "created_at": msg.created_at}
 

def get_messages(conversation_id: int, user_id: int, db: Session):
    conversation = get_conversation(conversation_id, user_id, db)

    if conversation.statut == "SUGGEREE":
        conversation.statut = "CONSULTEE"
        db.commit()

    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()
    return [
        {
            "id": msg.id,
            "expediteur_id": msg.expediteur_id,
            "contenu": msg.contenu,
            "document_url": msg.document_url,
            "lu": msg.lu,
            "created_at": msg.created_at
        }
        for msg in messages
    ]
    
def update_conversation_status(conversation_id: int, user_id: int, statut: str, db: Session):
    if statut not in CONVERSATION_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs : {CONVERSATION_STATUSES}")
    conversation = get_conversation(conversation_id, user_id, db)
    conversation.statut = statut
    db.commit()
    return {"message": f"Statut mis à jour : {statut}"}

def upload_document(conversation_id: int, user_id: int, nom_fichier: str, url: str, type_fichier: str, taille: int, db: Session):
    from app.models.conversations import DocumentMessage
    conversation = get_conversation(conversation_id, user_id, db)
    msg = Message(
        conversation_id=conversation.id,
        expediteur_id=user_id,
        document_url=url
    )
    db.add(msg)
    db.flush()
    doc = DocumentMessage(
        message_id=msg.id,
        conversation_id=conversation.id,
        expediteur_id=user_id,
        nom_fichier=nom_fichier,
        url=url,
        type_fichier=type_fichier,
        taille=taille
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "message": "Document envoyé",
        "id": doc.id,
        "nom_fichier": doc.nom_fichier,
        "url": doc.url
    }