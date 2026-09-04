from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.config.database import Base
from sqlalchemy.orm import relationship

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    canal = Column(String(20), nullable=False)
    destinataire = Column(String(255), nullable=False)
    sujet = Column(String(255), nullable=True)
    contenu = Column(Text, nullable=True)
    statut = Column(String(30), default="EN_ATTENTE")
    lu= Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    tentatives = Column(Integer, default=0)
    derniere_tentative = Column(DateTime, nullable=True)
    
    user = relationship("User", backref="notifications")