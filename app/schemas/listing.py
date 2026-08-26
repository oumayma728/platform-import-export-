from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator, model_validator


def _valider_code_pays(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.strip().upper()
    # Accepte soit un code ISO alpha-2, soit un nom de pays ajouté au référentiel.
    # Les pays connus sont convertis en ISO par _country_to_iso avant ce validateur.
    if len(value) == 2 and value.isalpha():
        return value
    if 2 <= len(value) <= 100:
        return value
    raise ValueError("Pays invalide")


def _country_to_iso(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    mapping = {
        "TUNISIE": "TN", "FRANCE": "FR", "ITALIE": "IT", "ESPAGNE": "ES",
        "ALLEMAGNE": "DE", "BELGIQUE": "BE", "PAYS-BAS": "NL", "MAROC": "MA",
        "ALGERIE": "DZ", "EGYPTE": "EG", "TURQUIE": "TR",
        "CHINE": "CN", "INDE": "IN", "ETATS-UNIS": "US", "CANADA": "CA",
    }
    normalized = value.strip().upper().replace("É", "E").replace("È", "E").replace("À", "A").replace("Ç", "C")
    # Pour un pays non présent dans le mapping, on conserve son nom.
    # Cela permet les valeurs ajoutées dynamiquement depuis le frontend.
    return mapping.get(normalized, value.strip())


class ListingCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    titre: str = Field(min_length=3, max_length=200, validation_alias=AliasChoices("titre", "product"))
    description: Optional[str] = Field(default=None, validation_alias=AliasChoices("description", "details"))
    type: str = Field(validation_alias=AliasChoices("type", "listing_type"))
    categorie: Optional[str] = Field(default=None, validation_alias=AliasChoices("categorie", "category"))
    quantite: Optional[float] = Field(default=None, gt=0, validation_alias=AliasChoices("quantite", "quantity"))
    prix: Optional[float] = Field(default=None, ge=0, validation_alias=AliasChoices("prix", "price"))
    devise: str = Field(default="USD", min_length=3, max_length=3, validation_alias=AliasChoices("devise", "currency"))
    pays_origine: Optional[str] = Field(default=None, validation_alias=AliasChoices("pays_origine", "country", "pays_depart"))
    pays_destination: Optional[str] = Field(default=None, validation_alias=AliasChoices("pays_destination", "destination_country", "pays_arrivee"))
    incoterm: Optional[str] = Field(default=None, validation_alias=AliasChoices("incoterm", "shipping_term"))
    delai_livraison_jours: Optional[int] = Field(default=None, ge=0, validation_alias=AliasChoices("delai_livraison_jours", "deadline_days"))
    certification: Optional[str] = Field(default=None, validation_alias=AliasChoices("certification", "certifications"))
    documents: Optional[list[str]] = Field(default=None, validation_alias=AliasChoices("documents", "attachments"))
    quantity_unit: Optional[str] = Field(
    default=None,
    max_length=30,
    validation_alias=AliasChoices(
        "quantity_unit",
        "quantityUnit",
        "unit",
    ),
)

    deadline: Optional[date] = Field(
    default=None,
    validation_alias=AliasChoices(
        "deadline",
        "date_limite",
    ),
)
    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_fields(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        if "product" in normalized and "titre" not in normalized:
            normalized["titre"] = normalized["product"]

        if "quantity" in normalized and "quantite" not in normalized:
            normalized["quantite"] = normalized["quantity"]

        if "category" in normalized and "categorie" not in normalized:
            normalized["categorie"] = normalized["category"]

        if "price" in normalized and "prix" not in normalized:
            normalized["prix"] = normalized["price"]

        if "currency" in normalized and "devise" not in normalized:
            normalized["devise"] = normalized["currency"]

        if "country" in normalized and "pays_origine" not in normalized:
            normalized["pays_origine"] = normalized["country"]

        if "destination_country" in normalized and "pays_destination" not in normalized:
            normalized["pays_destination"] = normalized["destination_country"]

        if "listing_type" in normalized and "type" not in normalized:
            normalized["type"] = normalized["listing_type"]

        if "offer" in normalized and "type" not in normalized:
            normalized["type"] = normalized["offer"]

        if "demand" in normalized and "type" not in normalized:
            normalized["type"] = normalized["demand"]

        if "type" in normalized and isinstance(normalized["type"], str):
            value = normalized["type"].strip().lower()
            if value in {"offer", "offre"}:
                normalized["type"] = "offre"
            elif value in {"demand", "demande"}:
                normalized["type"] = "demande"

        if "certifications" in normalized and "certification" not in normalized:
            certs = normalized["certifications"]
            if isinstance(certs, list):
                normalized["certification"] = ", ".join(str(item) for item in certs if str(item).strip())
            elif isinstance(certs, str):
                normalized["certification"] = certs

        if "attachments" in normalized and "documents" not in normalized:
            attachments = normalized["attachments"]
            if isinstance(attachments, list):
                normalized["documents"] = [str(item.get("name") if isinstance(item, dict) else item) for item in attachments if str(item).strip() or (isinstance(item, dict) and item.get("name"))]

        if "pays_origine" in normalized and normalized["pays_origine"] is not None:
            normalized["pays_origine"] = _country_to_iso(str(normalized["pays_origine"]))
        if "pays_destination" in normalized and normalized["pays_destination"] is not None:
            normalized["pays_destination"] = _country_to_iso(str(normalized["pays_destination"]))

        return normalized

    @field_validator("type")
    @classmethod
    def type_validator(cls, v):
        if v not in ("offre", "demande"):
            raise ValueError('Le type doit être "offre" ou "demande"')
        return v.lower()

    @field_validator("pays_origine", "pays_destination")
    @classmethod
    def pays_validator(cls, v):
        if v is None:
            return v
        return _valider_code_pays(v)


class ListingUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    titre: Optional[str] = Field(default=None, min_length=3, max_length=200, validation_alias=AliasChoices("titre", "product"))
    description: Optional[str] = Field(default=None, validation_alias=AliasChoices("description", "details"))
    categorie: Optional[str] = Field(default=None, validation_alias=AliasChoices("categorie", "category"))
    quantite: Optional[float] = Field(default=None, gt=0, validation_alias=AliasChoices("quantite", "quantity"))
    prix: Optional[float] = Field(default=None, ge=0, validation_alias=AliasChoices("prix", "price"))
    devise: Optional[str] = Field(default=None, min_length=3, max_length=3, validation_alias=AliasChoices("devise", "currency"))
    pays_origine: Optional[str] = Field(default=None, validation_alias=AliasChoices("pays_origine", "country", "pays_depart"))
    pays_destination: Optional[str] = Field(default=None, validation_alias=AliasChoices("pays_destination", "destination_country", "pays_arrivee"))
    incoterm: Optional[str] = Field(default=None, validation_alias=AliasChoices("incoterm", "shipping_term"))
    delai_livraison_jours: Optional[int] = Field(default=None, ge=0, validation_alias=AliasChoices("delai_livraison_jours", "deadline_days"))
    certification: Optional[str] = Field(default=None, validation_alias=AliasChoices("certification", "certifications"))
    documents: Optional[list[str]] = Field(default=None, validation_alias=AliasChoices("documents", "attachments"))
    quantity_unit: Optional[str] = Field(
    default=None,
    max_length=30,
    validation_alias=AliasChoices(
        "quantity_unit",
        "quantityUnit",
        "unit",
    ),
)

    deadline: Optional[date] = Field(
    default=None,
    validation_alias=AliasChoices(
        "deadline",
        "date_limite",
    ),
)
    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_fields(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        if "product" in normalized and "titre" not in normalized:
            normalized["titre"] = normalized["product"]
        if "quantity" in normalized and "quantite" not in normalized:
            normalized["quantite"] = normalized["quantity"]
        if "category" in normalized and "categorie" not in normalized:
            normalized["categorie"] = normalized["category"]
        if "price" in normalized and "prix" not in normalized:
            normalized["prix"] = normalized["price"]
        if "currency" in normalized and "devise" not in normalized:
            normalized["devise"] = normalized["currency"]
        if "country" in normalized and "pays_origine" not in normalized:
            normalized["pays_origine"] = normalized["country"]
        if "destination_country" in normalized and "pays_destination" not in normalized:
            normalized["pays_destination"] = normalized["destination_country"]
        if "certifications" in normalized and "certification" not in normalized:
            certs = normalized["certifications"]
            if isinstance(certs, list):
                normalized["certification"] = ", ".join(str(item) for item in certs if str(item).strip())
            elif isinstance(certs, str):
                normalized["certification"] = certs
        if "attachments" in normalized and "documents" not in normalized:
            attachments = normalized["attachments"]
            if isinstance(attachments, list):
                normalized["documents"] = [str(item.get("name") if isinstance(item, dict) else item) for item in attachments if str(item).strip() or (isinstance(item, dict) and item.get("name"))]
        if "pays_origine" in normalized and normalized["pays_origine"] is not None:
            normalized["pays_origine"] = _country_to_iso(str(normalized["pays_origine"]))
        if "pays_destination" in normalized and normalized["pays_destination"] is not None:
            normalized["pays_destination"] = _country_to_iso(str(normalized["pays_destination"]))
        return normalized

    @field_validator("pays_origine", "pays_destination")
    @classmethod
    def pays_validator(cls, v):
        if v is None:
            return v
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

    model_config = ConfigDict(from_attributes=True)