from pydantic import BaseModel, ConfigDict, EmailStr, AliasChoices, Field, field_validator, model_validator
from typing import Optional
from enum import Enum
import re


class TypeCompte(str, Enum):
    EXPORTATEUR = "EXPORTATEUR"
    IMPORTATEUR = "IMPORTATEUR"


class UserRegister(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nom: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: EmailStr
    mot_de_passe: str = Field(
        ...,
        min_length=8,
        max_length=72,
        validation_alias=AliasChoices("mot_de_passe", "password"),
    )
    type_compte: str = Field(
        ..., validation_alias=AliasChoices("type_compte", "role")
    )
    pays: Optional[str] = Field(default=None, min_length=2, max_length=100)
    telephone: Optional[str] = Field(None, min_length=8, max_length=15)
    entreprise: Optional[str] = Field(None, min_length=2, max_length=100)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_fields(cls, data):
        if not isinstance(data, dict):
            return data

        if "password" in data and "mot_de_passe" not in data:
            data["mot_de_passe"] = data["password"]

        role_source = data.get("role", data.get("type_compte"))

        if role_source is not None:
            mapping = {
                "importer": "IMPORTATEUR", "importateur": "IMPORTATEUR",
                "exporter": "EXPORTATEUR", "exportateur": "EXPORTATEUR",
            }

            if isinstance(role_source, list):
                roles = []
                for item in role_source:
                    key = str(item).strip().lower()
                    mapped = mapping.get(key, str(item).strip().upper())
                    if mapped:
                        roles.append(mapped)
                combined = sorted(set(roles))
                data["type_compte"] = ",".join(combined) if combined else "EXPORTATEUR"
            else:
                key = str(role_source).strip().lower()
                data["type_compte"] = mapping.get(key, str(role_source).strip().upper())

        if "nom" not in data or not data["nom"]:
            data["nom"] = "Utilisateur"

        if "pays" not in data or not data["pays"]:
            data["pays"] = "Tunisie"

        return data

    @field_validator("type_compte")
    @classmethod
    def valider_type_compte(cls, v):
        valeurs_valides = {"EXPORTATEUR", "IMPORTATEUR"}
        roles = [r.strip() for r in v.split(",") if r.strip()]
        if not roles or any(r not in valeurs_valides for r in roles):
            raise ValueError("type_compte doit être EXPORTATEUR, IMPORTATEUR, ou les deux")
        return ",".join(sorted(set(roles)))

    @field_validator('mot_de_passe')
    @classmethod
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not re.search(r'[0-9]', v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

    @field_validator('nom')
    @classmethod
    def nom_validator(cls, v):
        if v is None:
            return "Utilisateur"
        if not v.strip():
            raise ValueError('Le nom ne peut pas être vide')
        return v.strip()


class UserLogin(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    mot_de_passe: str = Field(
        ..., validation_alias=AliasChoices("mot_de_passe", "password")
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_fields(cls, data):
        if isinstance(data, dict) and "password" in data and "mot_de_passe" not in data:
            data["mot_de_passe"] = data["password"]
        return data


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    pays: Optional[str] = None
    telephone: Optional[str] = None
    entreprise: Optional[str] = Field(None, validation_alias=AliasChoices("entreprise", "companyName", "company_name"))
    description: Optional[str] = None
    adresse: Optional[str] = None
    country: Optional[str] = Field(None, validation_alias=AliasChoices("country", "company_country"))
    sector: Optional[str] = Field(None, validation_alias=AliasChoices("sector", "secteur"))
    certifications: Optional[list[str]] = None
    type_compte: Optional[str] = Field(None, validation_alias=AliasChoices("type_compte", "role"))

    @field_validator("type_compte", mode="before")
    @classmethod
    def normalize_roles_update(cls, v):
        if v is None:
            return v
        mapping = {"importer": "IMPORTATEUR", "exporter": "EXPORTATEUR",
                   "importateur": "IMPORTATEUR", "exportateur": "EXPORTATEUR"}
        if isinstance(v, list):
            roles = [mapping.get(str(r).strip().lower(), str(r).strip().upper()) for r in v]
            return ",".join(sorted(set(roles)))
        return mapping.get(str(v).strip().lower(), str(v).strip().upper())


class UserResponse(BaseModel):
    id: int
    nom: str
    email: str
    type_compte: str
    pays: str


class ValidationStatus(str, Enum):
    EN_ATTENTE_VALIDATION = "EN_ATTENTE_VALIDATION"
    VALIDE = "VALIDE"
    REJETE = "REJETE"
    SUSPENDU = "SUSPENDU"


class ValidationUpdate(BaseModel):
    statut: ValidationStatus

    model_config = ConfigDict(from_attributes=True)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=72)
    new_password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, value: str):
        if not re.search(r"[A-Z]", value):
            raise ValueError("Le nouveau mot de passe doit contenir au moins une majuscule")
        if not re.search(r"[0-9]", value):
            raise ValueError("Le nouveau mot de passe doit contenir au moins un chiffre")
        return value

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Les nouveaux mots de passe ne correspondent pas")
        return self
