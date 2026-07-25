from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import TypeListing, StatutListing

class ListingBase(BaseModel):
    type: TypeListing
    titre: str
    description: str
    categorie: str
    prix: float
    quantite: float
    pays: str
    incoterms: Optional[str] = None
    delai_livraison: Optional[str] = None
    certification: Optional[str] = None
    documents_urls: Optional[List[str]] = None

    @field_validator('documents_urls', mode='before')
    @classmethod
    def parse_documents_urls(cls, v):
        if isinstance(v, str):
            if not v.strip():
                return []
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    type: Optional[TypeListing] = None
    titre: Optional[str] = None
    description: Optional[str] = None
    categorie: Optional[str] = None
    prix: Optional[float] = None
    quantite: Optional[float] = None
    pays: Optional[str] = None
    incoterms: Optional[str] = None
    delai_livraison: Optional[str] = None
    certification: Optional[str] = None
    documents_urls: Optional[List[str]] = None

class ListingOut(ListingBase):
    id: str
    company_id: str
    statut: StatutListing
    date_creation: datetime
    date_maj: Optional[datetime] = None

    class Config:
        from_attributes = True
