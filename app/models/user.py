from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.config.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import JSON


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    type_compte = Column(String(64))
    pays = Column(String(100))
    telephone = Column(String(20))
    role = Column(String(64), default="EXPORTATEUR", nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    statut_validation = Column(String(30), default="EN_ATTENTE_VALIDATION", nullable=False)
    email_verifie = Column(Boolean, default=False, nullable=False)
    entreprise = Column(String(150), nullable=True)
    adresse = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    company = relationship("Company", back_populates="user", uselist=False)
    annonces = relationship("Listing", back_populates="owner")
    role_obj = relationship("Role", back_populates="users")
    quota = relationship("UserQuota", back_populates="user", uselist=False, cascade="all, delete-orphan")
    logo_url = Column(String(255), nullable=True)
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), nullable=False, unique=True)
    expire_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    user = relationship("User", back_populates="refresh_tokens")