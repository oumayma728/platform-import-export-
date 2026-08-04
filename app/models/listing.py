from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Listing(Base):
    __tablename__ = "annonces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    titre = Column(String(200), nullable=False)
    description = Column(String, nullable=True)
    type = Column(String(10), nullable=False)
    categorie = Column(String(100), nullable=True)
    quantite = Column(Float, nullable=True)
    prix = Column(Float, nullable=True)
    devise = Column(String(10), default="USD")
    pays_origine = Column(String(100), nullable=True)
    pays_destination = Column(String(100), nullable=True)
    incoterm = Column(String(20), nullable=True)
    delai_livraison_jours = Column(Integer, nullable=True)
    certification = Column(String(100), nullable=True)
    documents = Column(String, nullable=True)  # URLs séparées par des virgules
    statut = Column(String(20), default="active")
    suspendue = Column(Boolean, default=False, nullable=False)
    
    distance_km = Column(Float, nullable=True)
    estimated_cost_usd = Column(Float, nullable=True)
    estimated_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index =True)
    owner = relationship("User", back_populates="annonces")
    company = relationship("Company", back_populates="annonces")
