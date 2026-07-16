from datetime import datetime, timedelta, timezone
import os
from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.billing import UserQuota
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister, UserUpdate
from uuid import uuid4
from app.models.user import RefreshToken


JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def user_payload(user: User):
    return {"id": user.id, "nom": user.nom, "email": user.email, "type_compte": user.type_compte,
            "pays": user.pays, "telephone": user.telephone, "entreprise": user.entreprise,
            "adresse": user.adresse, "role": user.role, "statut_validation": user.statut_validation,
            "email_verifie": user.email_verifie}


def create_token(data: dict, expires_minutes: int | None = None):
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or JWT_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def register_user(user: UserRegister, db: Session):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email déjà utilisé")
    new_user = User(nom=user.nom, email=user.email, mot_de_passe=pwd_context.hash(user.mot_de_passe),
                    type_compte=user.type_compte.value, role=user.type_compte.value, pays=user.pays,
                    telephone=user.telephone, entreprise=user.entreprise)
    db.add(new_user)
    db.flush()
    db.add(UserQuota(user_id=new_user.id))
    db.commit()
    db.refresh(new_user)
    return {"message": "Compte créé avec succès", "access_token": create_token({"id": new_user.id, "email": new_user.email, "role": new_user.role}),
            "token_type": "bearer", "user": user_payload(new_user)}


def login_user(credentials: UserLogin, db: Session):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Vérifier AVANT de créer le token
    if not user or not pwd_context.verify(credentials.mot_de_passe, user.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if user.statut_validation == "SUSPENDU":
        raise HTTPException(status_code=403, detail="Compte suspendu")
    
    # Créer refresh token APRÈS vérification
    refresh = create_refresh_token()
    db.add(RefreshToken(
        user_id=user.id, 
        token=refresh, 
        expire_at=datetime.utcnow() + timedelta(days=30)
    ))
    db.commit()
    
    return {
        "message": "Connexion réussie",
        "access_token": create_token({"id": user.id, "email": user.email, "role": user.role}),
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": user_payload(user)
    }


def update_profile(user: User, data: UserUpdate, db: Session):
    
    if data.email:
        existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email déjà utilisé par un autre utilisateur")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user_payload(user)


def require_admin(payload: dict):
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Accès administrateur requis")

def refresh_access_token(refresh_token: str, db: Session):
    token_db = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token
    ).first()

    if not token_db:
        raise HTTPException(
            status_code=401,
            detail="Refresh token invalide"
        )

    if token_db.expire_at < datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Refresh token expiré"
        )

    user = db.query(User).filter(User.id == token_db.user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur associé au refresh token non trouvé"
        )

    access_token = create_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
   
   

def create_refresh_token():
    return str(uuid4())

