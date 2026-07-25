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
    chats_gratuits_restants = Column(Integer, default=50)
    statut_facturation = Column(Enum(StatutFacturation), default=StatutFacturation.GRATUIT)
    depense_cumulee_usage = Column(Float, default=0.0)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="company")
    listings = relationship("Listing", back_populates="company")

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
