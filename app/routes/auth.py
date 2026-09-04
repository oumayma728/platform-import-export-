from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.schemas.user import UserRegister, UserLogin, UserUpdate, ValidationUpdate, ChangePasswordRequest
from app.controllers.auth_controller import (
    register_user, login_user, update_profile,
    require_admin, user_payload, refresh_access_token, change_password
)
from sqlalchemy import func
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.user import User
from pydantic import BaseModel
import os
import shutil
from app.models.company import Company

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from app.services.email_service import send_email

class RefreshRequest(BaseModel):
    refresh_token: str

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str

    new_password: str = Field(
        min_length=8
    )

    confirm_password: str = Field(
        min_length=8
    )


def _jwt_secret():
    secret = os.getenv("JWT_SECRET")

    if not secret:
        raise RuntimeError(
            "JWT_SECRET non configuré"
        )

    return secret


def create_password_reset_token(
    user_id: int,
    email: str,
):
    algorithm = os.getenv(
        "JWT_ALGORITHM",
        "HS256",
    )

    expiration = (
        datetime.now(timezone.utc)
        + timedelta(minutes=30)
    )

    payload = {
        "sub": str(user_id),
        "email": email,
        "purpose": "password_reset",
        "exp": expiration,
    }

    return jwt.encode(
        payload,
        _jwt_secret(),
        algorithm=algorithm,
    )


def decode_password_reset_token(
    token: str,
):
    algorithm = os.getenv(
        "JWT_ALGORITHM",
        "HS256",
    )

    try:
        payload = jwt.decode(
            token,
            _jwt_secret(),
            algorithms=[algorithm],
        )

    except JWTError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le lien de réinitialisation "
                "est invalide ou a expiré."
            ),
        )

    if (
        payload.get("purpose")
        != "password_reset"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Token de réinitialisation invalide."
            ),
        )

    return payload

router = APIRouter(prefix="/auth", tags=["Authentification"])
@router.post(
    "/reset-password",
    summary="Définir un nouveau mot de passe avec le token reçu par email",
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    if (
        data.new_password
        != data.confirm_password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Les mots de passe "
                "ne correspondent pas."
            ),
        )

    password = data.new_password

    if not any(
        char.isupper()
        for char in password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Le mot de passe doit contenir "
                "au moins une majuscule."
            ),
        )

    if not any(
        char.isdigit()
        for char in password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Le mot de passe doit contenir "
                "au moins un chiffre."
            ),
        )

    payload = decode_password_reset_token(
        data.token
    )

    try:
        user_id = int(
            payload["sub"]
        )

    except (KeyError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Token invalide.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le lien de réinitialisation "
                "n'est plus valide."
            ),
        )

    token_email = payload.get("email")

    if (
        token_email
        and token_email.lower()
        != user.email.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Token invalide.",
        )

    user.mot_de_passe = (
        pwd_context.hash(
            data.new_password
        )
    )

    db.commit()

    return {
        "success": True,
        "message": (
            "Votre mot de passe a été "
            "réinitialisé avec succès."
        ),
    }
@router.post("/register", status_code=201, summary="Créer un compte")
def register(user: UserRegister, db: Session = Depends(get_db)):
    return register_user(user, db)

@router.post("/login", summary="Se connecter")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    return login_user(credentials, db)

@router.get("/profile", summary="Voir son profil")
def profile(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):   
    user = db.query(User).filter(User.id == current_user["id"]).first()    
    company = db.query(Company).filter(Company.user_id == user.id).first()    
    return user_payload(user, company)

@router.put("/profile", summary="Modifier son profil")
def edit_profile(data: UserUpdate, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    return update_profile(user, data, db)

@router.post("/refresh", summary="Rafraîchir le token")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(data.refresh_token, db)

@router.get("/me", summary="retourne le profil courant")
def me(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):    
    user = db.query(User).filter(User.id == current_user["id"]).first()    
    company = db.query(Company).filter(Company.user_id == user.id).first()   
    return user_payload(user, company)

@router.post("/profile/logo", summary="upload de logo d'entreprise")
async def upload_logo(logo: UploadFile = File(...), current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    upload_dir = "uploads/logos"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"company_{current_user['id']}_{logo.filename}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(logo.file, buffer)

    user = db.query(User).filter(User.id == current_user["id"]).first()    
    logo_url = f"/uploads/logos/{filename}"    
    if user:        
        user.entreprise = user.entreprise or "Entreprise"        
        user.logo_url = logo_url        
        db.commit()     
    return {"logoUrl": logo_url}



@router.post("/change-password", summary="Changer son mot de passe")
def change_own_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    return change_password(
        user,
        data.current_password,
        data.new_password,
        db,
    )

@router.post(
    "/forgot-password",
    summary="Demander une réinitialisation du mot de passe",
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_response = {
        "success": True,
        "message": (
            "Si un compte est associé à cette adresse email, "
            "vous recevrez un lien de réinitialisation."
        ),
    }

    user = (
        db.query(User)
        .filter(
            func.lower(User.email)
            == data.email.lower()
        )
        .first()
    )

    # On ne révèle jamais si l'adresse existe.
    if not user:
        return generic_response

    token = create_password_reset_token(
        user.id,
        user.email,
    )

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5175",
    ).rstrip("/")

    reset_url = (
        f"{frontend_url}/reset-password"
        f"?token={token}"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
      <body style="
        font-family: Arial, sans-serif;
        background:#f6f5f2;
        padding:30px;
        color:#14161c;
      ">
        <div style="
          max-width:600px;
          margin:auto;
          background:white;
          padding:32px;
          border-radius:16px;
        ">

          <h1 style="margin-top:0;">
            Indeed²
          </h1>

          <h2>
            Réinitialisation de votre mot de passe
          </h2>

          <p>
            Bonjour,
          </p>

          <p>
            Une demande de réinitialisation du mot de passe
            a été effectuée pour votre compte Indeed².
          </p>

          <p style="margin:30px 0;">
            <a
              href="{reset_url}"
              style="
                background:#B8720A;
                color:white;
                text-decoration:none;
                padding:12px 22px;
                border-radius:8px;
                font-weight:bold;
              "
            >
              Réinitialiser mon mot de passe
            </a>
          </p>

          <p>
            Ce lien est valable pendant
            <strong>30 minutes</strong>.
          </p>

          <p>
            Si vous n'êtes pas à l'origine de cette demande,
            ignorez simplement cet email.
          </p>

        </div>
      </body>
    </html>
    """

    try:
        send_email(
            user.email,
            "Réinitialisation de votre mot de passe Indeed²",
            html_content,
        )

    except Exception as exc:
        # Le détail réel reste uniquement dans le terminal.
        print(
            "[FORGOT PASSWORD] Email non envoyé :",
            repr(exc),
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Le service d'envoi d'email "
                "est temporairement indisponible."
            ),
        )

    return generic_response

@router.get("/admin/users", summary="Lister les utilisateurs")
def list_users(statut: str = None, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    require_admin(current_user)
    query = db.query(User)
    if statut:
        query = query.filter(User.statut_validation == statut)
    return [user_payload(u) for u in query.all()]

@router.patch("/admin/users/{user_id}/validation", summary="Valider ou suspendre un compte")
def validate_user(user_id: int, data: ValidationUpdate, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    require_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user.statut_validation = data.statut.value
    db.commit()
    return user_payload(user)