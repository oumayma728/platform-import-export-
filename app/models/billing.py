from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.config.database import Base
from sqlalchemy.orm import relationship


class BillingEvent(Base):
    __tablename__ = "billing_events"

    id = Column(Integer, primary_key=True, index=True)
    stripe_event_id = Column(String(255), unique=True, nullable=True)
    event_type = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", backref="billing_events")


class UserQuota(Base):
    __tablename__ = "user_quotas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # IMPORTANT : on garde les noms physiques historiques de PostgreSQL
    # (chats_utilises / chats_gratuits) pour éviter une migration risquée,
    # mais dans le code Python on utilise désormais la vraie sémantique :
    # 50 MESSAGES gratuits.
    messages_utilises = Column("chats_utilises", Integer, default=0, nullable=False)
    messages_gratuits = Column("chats_gratuits", Integer, default=50, nullable=False)

    is_premium = Column(Boolean, default=False, nullable=False)
    statut = Column(String(30), default="GRATUIT", nullable=False)
    depense_usage = Column(Float, default=0.0, nullable=False)
    stripe_customer_id = Column(String(255), nullable=True, unique=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="quota")
