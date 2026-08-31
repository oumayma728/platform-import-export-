from sqlalchemy import Column, String, DateTime, Enum, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.config.database import Base
import uuid

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    CLIENT = "CLIENT"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.CLIENT, nullable=False)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    company = relationship("Company", back_populates="user", uselist=False)

class TypeCompany(str, enum.Enum):
    EXPORTATEUR = "EXPORTATEUR"
    IMPORTATEUR = "IMPORTATEUR"

class StatutValidation(str, enum.Enum):
    EN_ATTENTE_VALIDATION = "EN_ATTENTE_VALIDATION"
    VALIDE = "VALIDE"
    REJETE = "REJETE"
    SUSPENDU = "SUSPENDU"

class StatutFacturation(str, enum.Enum):
    GRATUIT = "GRATUIT"
    LIMITE_ATTEINTE = "LIMITE_ATTEINTE"
    PAIEMENT_USAGE = "PAIEMENT_USAGE"
    ABONNE = "ABONNE"
    ABONNEMENT_EXPIRE = "ABONNEMENT_EXPIRE"

class UserQuota(Base):
    __tablename__ = "user_quotas"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), unique=True, nullable=False)
    chats_gratuits_restants = Column(Integer, default=50)
    chats_utilises = Column(Integer, default=0)
    
    company = relationship("Company", back_populates="quota")

class Billing(Base):
    __tablename__ = "billings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), unique=True, nullable=False)
    statut_facturation = Column(Enum(StatutFacturation), default=StatutFacturation.GRATUIT)
    depense_cumulee_usage = Column(Float, default=0.0)
    stripe_customer_id = Column(String, nullable=True)
    
    company = relationship("Company", back_populates="billing")

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    type = Column(Enum(TypeCompany), nullable=False)
    company_name = Column(String, nullable=False)
    numero_tva = Column(String, nullable=True)
    pays = Column(String, nullable=False)
    adresse = Column(String, nullable=False)
    statut_validation = Column(Enum(StatutValidation), default=StatutValidation.EN_ATTENTE_VALIDATION)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="company")
    listings = relationship("Listing", back_populates="company")
    quota = relationship("UserQuota", back_populates="company", uselist=False, cascade="all, delete-orphan")
    billing = relationship("Billing", back_populates="company", uselist=False, cascade="all, delete-orphan")

class TypeListing(str, enum.Enum):
    OFFRE = "OFFRE"
    DEMANDE = "DEMANDE"

class StatutListing(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDUE = "SUSPENDUE"
    CLOTUREE = "CLOTUREE"

class Listing(Base):
    __tablename__ = "listings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    type = Column(Enum(TypeListing), nullable=False)
    titre = Column(String, nullable=False)
    description = Column(String, nullable=False)
    categorie = Column(String, nullable=False)
    prix = Column(Float, nullable=False)
    quantite = Column(Float, nullable=False)
    pays = Column(String, nullable=False)
    incoterms = Column(String, nullable=True)
    delai_livraison = Column(String, nullable=True)
    certification = Column(String, nullable=True)
    documents_urls = Column(String, default="")
    statut = Column(Enum(StatutListing), default=StatutListing.ACTIVE)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_maj = Column(DateTime(timezone=True), onupdate=func.now())
    company = relationship("Company", back_populates="listings")
    conversations = relationship("Conversation", back_populates="listing", cascade="all, delete-orphan")

class StatutConversation(str, enum.Enum):
    SUGGEREE = "SUGGEREE"
    CONSULTEE = "CONSULTEE"
    EN_CONTACT = "EN_CONTACT"
    EN_NEGOCIATION = "EN_NEGOCIATION"
    CONCLUE = "CONCLUE"
    REJETEE = "REJETEE"

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String, ForeignKey("listings.id"), nullable=False)
    initiator_company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    statut = Column(Enum(StatutConversation), default=StatutConversation.EN_CONTACT)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_maj = Column(DateTime(timezone=True), onupdate=func.now())
    
    listing = relationship("Listing", back_populates="conversations")
    initiator_company = relationship("Company", foreign_keys=[initiator_company_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    contenu = Column(String, nullable=False)
    date_envoi = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    documents = relationship("DocumentMessage", back_populates="message", cascade="all, delete-orphan")

class DocumentMessage(Base):
    __tablename__ = "document_messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    
    message = relationship("Message", back_populates="documents")

class NotificationType(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"

class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    target = Column(String, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
