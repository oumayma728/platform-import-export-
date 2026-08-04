from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


def _valider_code_pays(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.strip().upper()
    if len(value) != 2 or not value.isalpha():
        raise ValueError(
            "Le pays doit être fourni au format ISO 3166-1 alpha-2 (ex: TN, FR, US)."
        )
    return value


class ListingCreate(BaseModel):
    titre: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    type: str = Field(pattern="^(offre|demande)$")
    categorie: Optional[str] = None
    quantite: Optional[float] = Field(default=None, gt=0)
    prix: Optional[float] = Field(default=None, ge=0)
    devise: str = Field(default="USD", min_length=3, max_length=3)
    pays_origine: Optional[str] = None
    pays_destination: Optional[str] = None
    incoterm: Optional[str] = None
    delai_livraison_jours: Optional[int] = Field(default=None, ge=0)
    certification: Optional[str] = None
    documents: Optional[list[str]] = None

    @field_validator("type")
    @classmethod
    def type_validator(cls, v):
        if v not in ("offre", "demande"):
            raise ValueError('Le type doit être "offre" ou "demande"')
        return v.lower()

    @field_validator("pays_origine", "pays_destination")
    @classmethod
    def pays_validator(cls, v):
        return _valider_code_pays(v)


class ListingUpdate(BaseModel):
    titre: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = None
    categorie: Optional[str] = None
    quantite: Optional[float] = Field(default=None, gt=0)
    prix: Optional[float] = Field(default=None, ge=0)
    devise: Optional[str] = Field(default=None, min_length=3, max_length=3)
    pays_origine: Optional[str] = None
    pays_destination: Optional[str] = None
    incoterm: Optional[str] = None
    delai_livraison_jours: Optional[int] = Field(default=None, ge=0)
    certification: Optional[str] = None
    documents: Optional[list[str]] = None

    @field_validator("pays_origine", "pays_destination")
    @classmethod
    def pays_validator(cls, v):
        return _valider_code_pays(v)


class ListingResponse(BaseModel):
    id: int
    user_id: int
    titre: str
    type: str
    categorie: Optional[str]
    prix: Optional[float]
    devise: Optional[str]
    prix_converti: Optional[float] = None
    devise_affichage: Optional[str] = None
    pays_origine: Optional[str]
    pays_destination: Optional[str]
    distance_km: Optional[float] = None
    estimated_cost_usd: Optional[float] = None
    estimated_days: Optional[int] = None
    statut: str
    created_at: datetime

    class Config:
        from_attributes = True