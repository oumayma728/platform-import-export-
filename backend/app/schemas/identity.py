from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import Role, TypeCompany, StatutValidation, StatutFacturation

class CompanyCreate(BaseModel):
    company_name: str
    type: TypeCompany
    pays: str
    adresse: str
    numero_tva: Optional[str] = None

class CompanyOut(CompanyCreate):
    id: str
    user_id: str
    statut_validation: StatutValidation
    date_creation: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    type: TypeCompany
    pays: str
    adresse: str
    numero_tva: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    role: Role
    date_creation: datetime
    company: Optional[CompanyOut] = None

    class Config:
        from_attributes = True

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    pays: Optional[str] = None
    adresse: Optional[str] = None
    numero_tva: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    company: Optional[CompanyUpdate] = None

class Token(BaseModel):
    message: str
    access_token: str
    refresh_token: str
    user: UserOut
