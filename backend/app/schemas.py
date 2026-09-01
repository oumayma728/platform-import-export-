"""
schemas.py — Schémas Pydantic pour la validation et la sérialisation
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field, EmailStr, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role_id: Literal["admin", "exporter", "importer"] = "exporter"
    role: Optional[str] = None

    @model_validator(mode='after')
    def validate_role(self) -> UserCreate:
        if self.role and self.role != self.role_id:
            self.role_id = self.role  # type: ignore
        return self


class UserQuotaRead(BaseModel):
    chats_used: int
    status: str

    class Config:
        from_attributes = True


class BillingRead(BaseModel):
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    total_spent: float

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


class UserRead(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role_id: Literal["admin", "exporter", "importer"]
    is_active: bool
    status: str
    is_email_verified: bool
    quota: Optional[UserQuotaRead] = None
    billing: Optional[BillingRead] = None

    @property
    def role(self) -> str:
        return self.role_id

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: "UserRead"


# ─────────────────────────────────────────────────────────────────────────────
# COMPANY
# ─────────────────────────────────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str
    is_exporter: bool = False
    is_importer: bool = False
    country: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    registration_number: Optional[str] = None
    certification_docs: List[Any] = Field(default_factory=list)


class CompanyRead(BaseModel):
    id: str
    name: str
    is_exporter: bool
    is_importer: bool
    country: str
    description: Optional[str] = None
    owner_id: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    registration_number: Optional[str] = None
    certification_docs: List[Any] = Field(default_factory=list)
    profile_status: str

    class Config:
        from_attributes = True


class CompanyStatusUpdate(BaseModel):
    profile_status: str


# ─────────────────────────────────────────────────────────────────────────────
# SALON
# ─────────────────────────────────────────────────────────────────────────────
class SalonBase(BaseModel):
    title: str
    theme: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stand_price: Optional[float] = None


class SalonCreate(SalonBase):
    pass


class SalonUpdate(BaseModel):
    title: Optional[str] = None
    theme: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stand_price: Optional[float] = None
    status: Optional[str] = None


class SalonRead(BaseModel):
    id: str
    title: str
    theme: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stand_price: Optional[float] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# STAND
# ─────────────────────────────────────────────────────────────────────────────
class StandCreate(BaseModel):
    exporter_id: str
    company_name: str
    products: Optional[str] = None
    certifications: Optional[str] = None
    video_url: Optional[str] = None
    documents: List[dict] = Field(default_factory=list)


class StandRead(BaseModel):
    id: str
    salon_id: str
    exporter_id: str
    company_name: str
    products: Optional[str] = None
    certifications: Optional[str] = None
    video_url: Optional[str] = None
    documents: List[Any] = Field(default_factory=list)
    payment_status: str
    stripe_session_id: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# RENDEZ-VOUS
# ─────────────────────────────────────────────────────────────────────────────
class RendezVousCreate(BaseModel):
    salon_id: str
    stand_id: Optional[str] = None
    exporter_id: str
    importer_id: str
    proposed_datetime: str
    notes: Optional[str] = None


class RendezVousUpdate(BaseModel):
    status: Optional[str] = None
    alternative_datetimes: Optional[List[str]] = None
    notes: Optional[str] = None


class RendezVousRead(BaseModel):
    id: str
    salon_id: str
    stand_id: Optional[str] = None
    exporter_id: str
    importer_id: str
    proposed_datetime: str
    alternative_datetimes: List[str] = Field(default_factory=list)
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


# ─────────────────────────────────────────────────────────────────────────────
# MESSAGERIE
# ─────────────────────────────────────────────────────────────────────────────
class ConversationCreate(BaseModel):
    stand_id: str
    importer_id: str


class ConversationStatusUpdate(BaseModel):
    status: str  # SUGGEREE | CONSULTEE | EN_CONTACT | EN_NEGOCIATION | CONCLUE | REJETEE


class ConversationRead(BaseModel):
    id: str
    stand_id: str
    importer_id: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: Optional[str] = None
    document_url: Optional[str] = None
    document_name: Optional[str] = None


class MessageRead(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: Optional[str] = None
    document_url: Optional[str] = None
    document_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────────────────────────────────────────
# ANNONCE (Marketplace)
# ─────────────────────────────────────────────────────────────────────────────
class AnnonceCreate(BaseModel):
    type: Literal["OFFRE", "DEMANDE"] = Field(..., description="Type d'annonce : offre de vente ou demande d'achat")
    title: str = Field(..., description="Titre de l'annonce", example="Vente d'huile d'argan bio")
    category: str = Field(..., description="Catégorie de produit", example="Agroalimentaire")
    description: str = Field(..., description="Description détaillée")
    price: Optional[float] = Field(None, description="Prix unitaire proposé")
    quantity: Optional[str] = Field(None, description="Quantité disponible/recherchée (ex: 1000 Litres)")
    incoterms: Optional[str] = Field(None, description="Incoterms (ex: FOB, CIF)")
    delivery_time: Optional[str] = Field(None, description="Délai de livraison (ex: 30 jours)")
    documents: List[dict] = Field(default_factory=list, description="Documents joints (photos, fiches techniques)")

class AnnonceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[str] = None
    incoterms: Optional[str] = None
    delivery_time: Optional[str] = None
    documents: Optional[List[dict]] = None
    status: Optional[str] = Field(None, description="ACTIVE, INACTIVE, ou CLOTUREE")

class AnnonceRead(BaseModel):
    id: str
    type: str
    title: str
    category: str
    description: str
    price: Optional[float] = None
    quantity: Optional[str] = None
    incoterms: Optional[str] = None
    delivery_time: Optional[str] = None
    documents: List[dict] = Field(default_factory=list)
    company_id: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    price_converted: Optional[float] = Field(None, description="Prix converti (si to_currency fourni)")
    price_currency: Optional[str] = Field(None, description="Devise du prix converti")
    price_rate: Optional[float] = Field(None, description="Taux de change appliqué")

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# ABONNEMENTS PAR CATÉGORIE (Story 5.2)
# ─────────────────────────────────────────────────────────────────────────────
class CategorySubscriptionCreate(BaseModel):
    company_id: str
    category: str


class CategorySubscriptionRead(BaseModel):
    id: str
    company_id: str
    category: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
