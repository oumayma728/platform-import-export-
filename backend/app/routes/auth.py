"""
auth.py — Authentification JWT avec PostgreSQL
Endpoints : register, login, me, update profile
"""
import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, HTTPException, Header, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserQuota, Billing
from ..schemas import LoginRequest, TokenResponse, UserCreate, UserRead, UserUpdate
from ..services.email import welcome_email_html
from ..services.notification import NotificationService

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "salons-virtuels-secret")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
REFRESH_TOKEN_EXPIRE_DAYS = 7

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> UserRead:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    token_type = payload.get("type")
    
    if not user_id or token_type != "access":
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return UserRead.model_validate(user)


def require_role(*roles: str):
    def dependency(current_user: UserRead = Depends(get_current_user)) -> UserRead:
        if current_user.role_id not in roles:
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return current_user
    return dependency


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")

    verification_token = str(uuid.uuid4())
    
    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name,
        role_id=payload.role_id,
        hashed_password=hash_password(payload.password),
        status="EN_ATTENTE_VALIDATION",
        is_email_verified=False,
        email_verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Création des modèles Billing et UserQuota liés
    quota = UserQuota(user_id=user.id)
    billing = Billing(user_id=user.id)
    db.add(quota)
    db.add(billing)
    db.commit()
    db.refresh(user)

    # Email de bienvenue (via NotificationService + NotificationLog)
    try:
        NotificationService.send_email(
            to=user.email,
            subject="Bienvenue sur Salons Virtuels",
            body=welcome_email_html(user.full_name),
            user_id=user.id,
            db=db,
        )
    except Exception as n_err:
        logger.error(f"Erreur envoi email de bienvenue à {user.email}: {n_err}")

    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Connexion — retourne un JWT."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe invalide")

    token_payload = {
        "user_id": user.id,
        "email": user.email,
        "role_id": user.role_id,
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get("/profile", response_model=UserRead)
@router.get("/me", response_model=UserRead)
def get_profile(current_user: UserRead = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur connecté."""
    return current_user


@router.put("/profile", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Met à jour le profil de l'utilisateur connecté."""
    current_user = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Vérifier que le nouvel email n'est pas déjà pris
        existing = db.query(User).filter(
            User.email == payload.email.lower().strip(),
            User.id != user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        user.email = payload.email.lower().strip()

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.get("/users", response_model=list[UserRead])
def list_users(
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Liste tous les utilisateurs (admin uniquement)."""
    users = db.query(User).all()
    return [UserRead.model_validate(u) for u in users]


@router.patch("/users/{user_id}/validate", response_model=UserRead)
def validate_user(
    user_id: str,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Valide le compte d'un utilisateur (admin uniquement)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.status = "VALIDE"
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Génère un nouvel access_token via un refresh_token."""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")
        
    user_id = payload.get("user_id")
    token_type = payload.get("type")
    
    if not user_id or token_type != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token invalide")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        
    token_payload = {
        "user_id": user.id,
        "email": user.email,
        "role_id": user.role_id,
    }
    
    new_access = create_access_token(token_payload)
    new_refresh = create_refresh_token(token_payload)
    
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Valide l'email d'un utilisateur à l'aide d'un token de vérification."""
    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
        
    user.is_email_verified = True
    user.email_verification_token = None
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Email vérifié avec succès"}
