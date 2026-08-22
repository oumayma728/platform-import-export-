from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.schemas.user import UserRegister, UserLogin, UserUpdate, ValidationUpdate
from app.controllers.auth_controller import (
    register_user, login_user, update_profile,
    require_admin, user_payload, refresh_access_token
)
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.user import User
from pydantic import BaseModel
import os
import shutil
from app.models.company import Company
class RefreshRequest(BaseModel):
    refresh_token: str



router = APIRouter(prefix="/auth", tags=["Authentification"])

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

@router.post("/forgot-password", summary="demande de réinitialisation")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    if email:
        db.query(User).filter(User.email == email).first()
    return {"success": True, "message": "Si ce compte existe, un email de réinitialisation a été envoyé."}

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