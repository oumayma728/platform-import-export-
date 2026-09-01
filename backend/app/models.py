"""
models.py — Modèles SQLAlchemy ORM pour PostgreSQL
Tous les modèles de données de la plateforme Salons Virtuels.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# ROLE
# ─────────────────────────────────────────────────────────────────────────────
class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True)  # ex: 'admin', 'exporter', 'importer'
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

    users = relationship("User", back_populates="role_rel")


# ─────────────────────────────────────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False, default="exporter")
    hashed_password = Column(String, nullable=False, default="")
    is_active = Column(Boolean, default=True)
    status = Column(String, default="EN_ATTENTE_VALIDATION")  # EN_ATTENTE_VALIDATION | VALIDE | REJETE | SUSPENDU
    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    role_rel = relationship("Role", back_populates="users")
    companies = relationship("Company", back_populates="owner", foreign_keys="Company.owner_id")
    sent_messages = relationship("Message", back_populates="sender")
    quota = relationship("UserQuota", back_populates="user", uselist=False, cascade="all, delete-orphan")
    billing = relationship("Billing", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="user")


# ─────────────────────────────────────────────────────────────────────────────
# BILLING ET QUOTAS
# ─────────────────────────────────────────────────────────────────────────────
class UserQuota(Base):
    __tablename__ = "user_quotas"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    chats_used = Column(Integer, default=0)
    # GRATUIT | LIMITE_ATTEINTE | PAIEMENT_USAGE | ABONNE | ABONNEMENT_EXPIRE
    status = Column(String, default="GRATUIT")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="quota")


class Billing(Base):
    __tablename__ = "billing"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    total_spent = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="billing")


# ─────────────────────────────────────────────────────────────────────────────
# COMPANY
# ─────────────────────────────────────────────────────────────────────────────
class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    is_exporter = Column(Boolean, default=False)
    is_importer = Column(Boolean, default=False)
    country = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    certification_docs = Column(JSON, default=list)  # [{"name": "...", "url": "..."}]
    profile_status = Column(String, default="EN_ATTENTE_VALIDATION")  # EN_ATTENTE_VALIDATION | VALIDE | REJETE

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    owner = relationship("User", back_populates="companies", foreign_keys=[owner_id])
    stands = relationship("Stand", back_populates="exporter_company", foreign_keys="Stand.exporter_id")
    rdvs_as_exporter = relationship("RendezVous", back_populates="exporter_company", foreign_keys="RendezVous.exporter_id")
    rdvs_as_importer = relationship("RendezVous", back_populates="importer_company", foreign_keys="RendezVous.importer_id")
    category_subscriptions = relationship("CategorySubscription", back_populates="company")


# ─────────────────────────────────────────────────────────────────────────────
# SALON
# ─────────────────────────────────────────────────────────────────────────────
class Salon(Base):
    __tablename__ = "salons"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    theme = Column(String, nullable=True)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    stand_price = Column(Float, nullable=True)
    status = Column(String, default="BROUILLON")  # BROUILLON | VALIDE | CLOTURE

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    stands = relationship("Stand", back_populates="salon")
    rendezvous = relationship("RendezVous", back_populates="salon")


# ─────────────────────────────────────────────────────────────────────────────
# STAND
# ─────────────────────────────────────────────────────────────────────────────
class Stand(Base):
    __tablename__ = "stands"

    id = Column(String, primary_key=True, default=generate_uuid)
    salon_id = Column(String, ForeignKey("salons.id"), nullable=False)
    exporter_id = Column(String, ForeignKey("companies.id"), nullable=False)
    company_name = Column(String, nullable=False)
    products = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
    documents = Column(JSON, default=list)  # [{"name": "...", "url": "..."}]

    # Paiement
    payment_status = Column(String, default="PENDING")  # PENDING | PAID | FAILED
    stripe_session_id = Column(String, nullable=True)

    # Validation
    status = Column(String, default="EN_ATTENTE_VALIDATION")  # EN_ATTENTE_VALIDATION | VALIDE | REJETE

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    salon = relationship("Salon", back_populates="stands")
    exporter_company = relationship("Company", back_populates="stands", foreign_keys=[exporter_id])
    conversations = relationship("Conversation", back_populates="stand")
    rendezvous = relationship("RendezVous", back_populates="stand")


# ─────────────────────────────────────────────────────────────────────────────
# RENDEZ-VOUS
# ─────────────────────────────────────────────────────────────────────────────
class RendezVous(Base):
    __tablename__ = "rendezvous"

    id = Column(String, primary_key=True, default=generate_uuid)
    salon_id = Column(String, ForeignKey("salons.id"), nullable=False)
    stand_id = Column(String, ForeignKey("stands.id"), nullable=True)
    exporter_id = Column(String, ForeignKey("companies.id"), nullable=False)
    importer_id = Column(String, ForeignKey("companies.id"), nullable=False)
    proposed_datetime = Column(String, nullable=False)
    alternative_datetimes = Column(JSON, default=list)  # ["2026-09-15T10:00", ...]
    status = Column(String, default="PROPOSE")  # PROPOSE | CONFIRME | REFUSE | TERMINE | ALTERNATIVE_PROPOSEE
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    salon = relationship("Salon", back_populates="rendezvous")
    stand = relationship("Stand", back_populates="rendezvous")
    exporter_company = relationship("Company", back_populates="rdvs_as_exporter", foreign_keys=[exporter_id])
    importer_company = relationship("Company", back_populates="rdvs_as_importer", foreign_keys=[importer_id])


# ─────────────────────────────────────────────────────────────────────────────
# CONVERSATION (Messagerie)
# ─────────────────────────────────────────────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    stand_id = Column(String, ForeignKey("stands.id"), nullable=False)
    importer_id = Column(String, ForeignKey("companies.id"), nullable=False)

    # Statuts du cycle de relation commerciale
    status = Column(
        String,
        default="SUGGEREE",
    )
    # Valeurs : SUGGEREE | CONSULTEE | EN_CONTACT | EN_NEGOCIATION | CONCLUE | REJETEE

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    stand = relationship("Stand", back_populates="conversations")
    importer_company = relationship("Company", foreign_keys=[importer_id])
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


# ─────────────────────────────────────────────────────────────────────────────
# MESSAGE
# ─────────────────────────────────────────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)
    document_url = Column(String, nullable=True)  # partage de fichier
    document_name = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")


# ─────────────────────────────────────────────────────────────────────────────
# ANNONCE (Marketplace)
# ─────────────────────────────────────────────────────────────────────────────
class Annonce(Base):
    __tablename__ = "annonces"

    id = Column(String, primary_key=True, default=generate_uuid)
    type = Column(String, nullable=False) # 'OFFRE' ou 'DEMANDE'
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=True)
    quantity = Column(String, nullable=True)
    incoterms = Column(String, nullable=True)
    delivery_time = Column(String, nullable=True)
    documents = Column(JSON, default=list)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE | INACTIVE | CLOTUREE

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    company = relationship("Company", foreign_keys=[company_id])


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION LOG
# ─────────────────────────────────────────────────────────────────────────────
class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    channel = Column(String, nullable=False)  # EMAIL | SMS
    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # catégorie de salon (Story 5.2)
    status = Column(String, default="SENT")  # SENT | FAILED
    error_message = Column(Text, nullable=True)
    retries = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="notifications")


# ─────────────────────────────────────────────────────────────────────────────
# ABONNEMENT IMPORTATEUR PAR CATÉGORIE (Story 5.2)
# ─────────────────────────────────────────────────────────────────────────────
class CategorySubscription(Base):
    __tablename__ = "category_subscriptions"
    __table_args__ = (
        UniqueConstraint("company_id", "category", name="uq_company_category"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    category = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    company = relationship("Company", back_populates="category_subscriptions")
