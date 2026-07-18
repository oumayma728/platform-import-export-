from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ConversationStatus(str, Enum):
    SUGGEREE = "SUGGEREE"
    CONSULTEE = "CONSULTEE"
    EN_CONTACT = "EN_CONTACT"
    EN_NEGOCIATION = "EN_NEGOCIATION"
    CONCLUE = "CONCLUE"
    REJETEE = "REJETEE"


class ConversationCreate(BaseModel):
    destinataire_id: int
    listing_id: Optional[int] = None


class StatusUpdate(BaseModel):
    statut: ConversationStatus


class MessageCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=5000)
