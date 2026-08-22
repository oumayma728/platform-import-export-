from datetime import datetime, timedelta, timezone
import os
from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.billing import UserQuota
from app.models.company import Company
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister, UserUpdate
from uuid import uuid4
from app.models.user import RefreshToken
import hashlib

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET non défini dans les variables d'environnement")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROLE_MAP = {"EXPORTATEUR": "exporter", "IMPORTATEUR": "importer"}
STATUS_MAP = {
    "VALIDE": "validated",
    "EN_ATTENTE_VALIDATION": "pending",
    "REJETE": "rejected",
    "SUSPENDU": "suspended",
}


def map_role(role_value: str | None):
    """Traduit un ou plusieurs rôles FR (BDD, ex: "EXPORTATEUR,IMPORTATEUR")
    vers l'anglais attendu par le frontend. Retourne une liste si plusieurs
    rôles sont déclarés (ex: ["exporter", "importer"]), une simple chaîne
    sinon. Une valeur inconnue (ex: "ADMIN") est laissée inchangée."""
    if not role_value:
        return role_value
    parts = [p.strip() for p in str(role_value).split(",") if p.strip()]
    if len(parts) <= 1:
        return ROLE_MAP.get(role_value, role_value)
    return [ROLE_MAP.get(p, p) for p in parts]


def user_payload(user: User, company: Company | None = None):
    certifications = []
    if company and company.certifications:
        certifications = [c.strip() for c in company.certifications.split(",") if c.strip()]

    return {
        "id": user.id, "nom": user.nom, "email": user.email, "type_compte": user.type_compte,
        "pays": user.pays, "telephone": user.telephone, "entreprise": user.entreprise,
        "adresse": user.adresse,
        "role": map_role(user.role),
        "statut_validation": user.statut_validation,
        "profileStatus": STATUS_MAP.get(user.statut_validation, "pending"),
        "email_verifie": user.email_verifie, "logo_url": user.logo_url,
        "created_at": user.created_at, "updated_at": user.updated_at,
        "profile": {
            "companyName": (company.nom if company else None) or user.entreprise,
            "country": (company.pays if company else None) or user.pays,
            "sector": company.secteur if company else None,
            "certifications": certifications,
            "logoUrl": user.logo_url,
            "description": company.description if company else None,
        },
    }


def create_token(data: dict, expires_minutes: int | None = None):
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or JWT_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def register_user(user: UserRegister, db: Session):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email déjà utilisé")

    nom = (user.nom or "Utilisateur").strip() or "Utilisateur"
    pays = (user.pays or "Tunisie").strip() or "Tunisie"
    entreprise = (user.entreprise or f"Entreprise de {nom}").strip()

    new_user = User(nom=nom, email=user.email, mot_de_passe=pwd_context.hash(user.mot_de_passe),
                    type_compte=user.type_compte, role=user.type_compte, pays=pays,
                    telephone=user.telephone, entreprise=entreprise)
    db.add(new_user)
    db.flush()
    db.add(UserQuota(user_id=new_user.id))
    db.add(Company(user_id=new_user.id, nom=entreprise, pays=pays))
    db.commit()
    db.refresh(new_user)
    token = create_token({"id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {"message": "Compte créé avec succès", "access_token": token, "token": token,
            "token_type": "bearer", "user": user_payload(new_user)}


def login_user(credentials: UserLogin, db: Session):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not pwd_context.verify(credentials.mot_de_passe, user.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if user.statut_validation == "SUSPENDU":
        raise HTTPException(status_code=403, detail="Compte suspendu")

    raw_token, hashed_token = create_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token=hashed_token,
        expire_at=datetime.utcnow() + timedelta(days=30)
    ))
    db.commit()

    token = create_token({"id": user.id, "email": user.email, "role": user.role})
    company = db.query(Company).filter(Company.user_id == user.id).first()
    return {
        "message": "Connexion réussie",
        "access_token": token,
        "token": token,
        "refresh_token": raw_token,
        "token_type": "bearer",
        "user": user_payload(user, company)
    }


def update_profile(user: User, data: UserUpdate, db: Session):
    if data.email:
        existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email déjà utilisé par un autre utilisateur")

    values = data.model_dump(exclude_unset=True)
    company_country = values.pop("country", None)
    company_sector = values.pop("sector", None)
    company_certifications = values.pop("certifications", None)
    company_description = values.pop("description", None)
    company_name = values.get("entreprise")

    for key, value in values.items():
        setattr(user, key, value)

    company_touched = any(
        v is not None
        for v in (company_country, company_sector, company_certifications, company_description, company_name)
    )
    if company_touched:
        company = db.query(Company).filter(Company.user_id == user.id).first()
        if not company:
            company = Company(user_id=user.id, nom=company_name or user.entreprise or user.nom)
            db.add(company)
        if company_name is not None:
            company.nom = company_name
        if company_country is not None:
            company.pays = company_country
        if company_sector is not None:
            company.secteur = company_sector
        if company_certifications is not None:
            company.certifications = ", ".join(
                str(c).strip() for c in company_certifications if str(c).strip()
            )
        if company_description is not None:
            company.description = company_description

    db.commit()
    db.refresh(user)
    company = db.query(Company).filter(Company.user_id == user.id).first()
    return user_payload(user, company)


def require_admin(payload: dict):
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Accès administrateur requis")


def refresh_access_token(refresh_token: str, db: Session):
    hashed = hash_refresh_token(refresh_token)
    token_db = db.query(RefreshToken).filter(
        RefreshToken.token == hashed,
        RefreshToken.expire_at > datetime.utcnow()
    ).first()
    if not token_db:
        raise HTTPException(status_code=401, detail="Refresh token invalide")
    user = db.query(User).filter(User.id == token_db.user_id).first()
    return {
        "access_token": create_token({"id": user.id, "email": user.email, "role": user.role}),
        "token_type": "bearer",
    }


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_refresh_token():
    raw_token = str(uuid4())
    return raw_token, hash_refresh_token(raw_token)