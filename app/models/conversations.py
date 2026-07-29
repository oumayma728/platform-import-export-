from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
from sqlalchemy import Enum

CONVERSATION_STATUSES = (
    "SUGGEREE",
    "CONSULTEE",
    "EN_CONTACT",
    "EN_NEGOCIATION",
    "CONCLUE",
    "REJETEE",
)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    initiateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destinataire_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("annonces.id"), nullable=True)
    statut = Column(Enum(*CONVERSATION_STATUSES, name="conversation_status"), nullable=False, default="SUGGEREE")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    initiateur = relationship("User", foreign_keys=[initiateur_id], backref="conversations_initiees")
    destinataire = relationship("User", foreign_keys=[destinataire_id], backref="conversations_recues")
    listing = relationship("Listing", backref="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    expediteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contenu = Column(Text, nullable=True)
    document_url = Column(String(500), nullable=True)
    lu = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    expediteur = relationship("User", foreign_keys=[expediteur_id], backref="messages_envoyes")
    documents = relationship("DocumentMessage", back_populates="message", cascade="all, delete-orphan")
    
 
class DocumentMessage(Base):
    __tablename__ = "document_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    expediteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nom_fichier = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    type_fichier = Column(String(50), nullable=True)
    taille = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relations
    message = relationship("Message", back_populates="documents")
    expediteur = relationship("User", foreign_keys=[expediteur_id])
    conversation = relationship("Conversation", backref="documents")