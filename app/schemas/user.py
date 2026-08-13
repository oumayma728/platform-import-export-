from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from enum import Enum
from pydantic import Field
from pydantic import field_validator
import re

class TypeCompte(str, Enum):
    EXPORTATEUR = "EXPORTATEUR"
    IMPORTATEUR = "IMPORTATEUR"
class UserRegister(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mot_de_passe: str = Field(..., min_length=8, max_length=72)
    type_compte: TypeCompte
    pays: str = Field(..., min_length=2, max_length=100)
    telephone: Optional[str] = Field(None, min_length=8, max_length=15)
    entreprise: Optional[str] = Field(None, min_length=2, max_length=100)

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
        if not v.strip():
            raise ValueError('Le nom ne peut pas être vide')
        return v.strip()
class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str
    
class UserUpdate(BaseModel):

    nom: Optional[str] = None

    email: Optional[EmailStr] = None

    pays: Optional[str] = None

    telephone: Optional[str] = None

    entreprise: Optional[str] = None

    adresse: Optional[str] = None


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
