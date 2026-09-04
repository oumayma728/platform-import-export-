from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.config.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Float
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    nom = Column(String(150), nullable=False)
    secteur = Column(String(100), nullable=True)
    pays = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    certifications = Column(String, nullable=True)
    site_web = Column(String(200), nullable=True)
    telephone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="company")
    annonces = relationship("Listing", back_populates="company")
    
    reputation_score = Column(
    Float,
    nullable=True,
    default=0.0,
)