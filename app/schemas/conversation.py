from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator


class ConversationStatus(str, Enum):
    SUGGEREE = "SUGGEREE"
    CONSULTEE = "CONSULTEE"
    EN_CONTACT = "EN_CONTACT"
    EN_NEGOCIATION = "EN_NEGOCIATION"
    CONCLUE = "CONCLUE"
    REJETEE = "REJETEE"


STATUS_MAP_OUT = {
    "SUGGEREE": "suggested",
    "CONSULTEE": "viewed",
    "EN_CONTACT": "in_contact",
    "EN_NEGOCIATION": "negotiating",
    "CONCLUE": "concluded",
    "REJETEE": "rejected",
}

STATUS_MAP_IN = {
    "suggested": "SUGGEREE",
    "viewed": "CONSULTEE",
    "in_contact": "EN_CONTACT",
    "negotiating": "EN_NEGOCIATION",
    "concluded": "CONCLUE",
    "rejected": "REJETEE",
}


class ConversationCreate(BaseModel):
    destinataire_id: int
    listing_id: Optional[int] = None


class StatusUpdate(BaseModel):
    statut: str

    @field_validator("statut", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if isinstance(v, str):
            lowered = v.lower()
            if lowered in STATUS_MAP_IN:
                return STATUS_MAP_IN[lowered]
            return v.upper()
        return v


class MessageCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    contenu: str = Field(
        min_length=1,
        max_length=5000,
        validation_alias=AliasChoices("contenu", "text"),
    )