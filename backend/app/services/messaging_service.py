from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Conversation, Message, DocumentMessage, Listing, Company, User, StatutConversation
from app.schemas.messaging import ConversationCreate, MessageCreate, ConversationUpdateStatus
from typing import List
import uuid

def create_conversation(db: Session, listing_id: str, initiator_company_id: str) -> Conversation:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing non trouvé")
        
    if listing.company_id == initiator_company_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas initier une conversation sur votre propre annonce")

    existing_conv = db.query(Conversation).filter(
        Conversation.listing_id == listing_id,
        Conversation.initiator_company_id == initiator_company_id
    ).first()
    
    if existing_conv:
        return existing_conv
        
    from app.models.models import StatutFacturation
    initiator_company = db.query(Company).filter(Company.id == initiator_company_id).first()
    
    if initiator_company.billing.statut_facturation == StatutFacturation.GRATUIT:
        if initiator_company.quota.chats_gratuits_restants <= 0:
            raise HTTPException(status_code=402, detail="Quota de 50 conversations gratuites dépassé. Veuillez souscrire à un abonnement ou acheter un pack de conversations.")
        
        initiator_company.quota.chats_gratuits_restants -= 1
        initiator_company.quota.chats_utilises += 1
        
        if initiator_company.quota.chats_gratuits_restants == 0:
            initiator_company.billing.statut_facturation = StatutFacturation.LIMITE_ATTEINTE

    db_conv = Conversation(
        listing_id=listing_id,
        initiator_company_id=initiator_company_id
    )
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return db_conv

def get_company_conversations(db: Session, company_id: str) -> List[Conversation]:
    return db.query(Conversation).join(Listing).filter(
        (Conversation.initiator_company_id == company_id) | 
        (Listing.company_id == company_id)
    ).all()

def get_conversation_messages(db: Session, conversation_id: str, current_user: User) -> List[Message]:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
    if not current_user.company:
        raise HTTPException(status_code=403, detail="L'utilisateur n'appartient à aucune entreprise")
        
    company_id = current_user.company.id
    if conversation.initiator_company_id != company_id and conversation.listing.company_id != company_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette conversation")
        
    return conversation.messages

def add_message(db: Session, conversation_id: str, sender_id: str, contenu: str) -> Message:
    db_message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        contenu=contenu
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Notification: New Message
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        target_user = conversation.listing.company.user if sender_id == conversation.initiator_company.user_id else conversation.initiator_company.user
        from app.services.notification_service import notification_service
        notification_service.send_email(
            db, target_user.id, target_user.email,
            "Nouveau message sur Indeed2",
            f"Vous avez reçu un nouveau message concernant l'annonce '{conversation.listing.titre}'. Connectez-vous pour répondre."
        )
        
    return db_message

def update_conversation_status(db: Session, conversation_id: str, statut: StatutConversation, current_company_id: str) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
    if conversation.initiator_company_id != current_company_id and conversation.listing.company_id != current_company_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette conversation")

    conversation.statut = statut
    db.commit()
    db.refresh(conversation)
    return conversation

def add_document_to_message(db: Session, message_id: str, file_url: str, file_name: str, file_type: str) -> DocumentMessage:
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
        
    db_doc = DocumentMessage(
        message_id=message_id,
        file_url=file_url,
        file_name=file_name,
        file_type=file_type
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc
