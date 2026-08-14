from pydantic import BaseModel, Field 
from typing import Literal, Optional
from datetime import date

class Listing(BaseModel):
    id: str
    type: Literal["offre", "demande"]
    produit: str
    categorie: str
    prix_unitaire: float
    quantite: int
    pays: str
    date_disponibilite: Optional[date] = None
    date_limite: Optional[date] = None
    entreprise_id: str

class ProfilEntreprise(BaseModel):
    entreprise_id: str
    reputation_score: float = Field(ge=0, le=1)
    certification: list[str] = []
    nb_transactions: int = 0
class DonneesLogistiques(BaseModel):
    pays_origine: str
    pays_destination: str
    distance_km: float
    cout_transport: float
    delai_transport_jours: int

class MatchingCriteria(BaseModel):
    #Les 5 critères de matching, chacun normalisé sur [0, 1]
    produit: float = Field(ge=0, le=1)
    prix_quantite: float = Field(ge=0, le=1)
    geo_logistique: float = Field(ge=0, le=1)
    fiabilite: float = Field(ge=0, le=1)
    delais: float = Field(ge=0, le=1)


class MatchResult(BaseModel):
    listing_id: str
    score_global: float
    scores_detailles: MatchingCriteria
    explication: str
    



