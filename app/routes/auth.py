from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserRegister, UserLogin, UserUpdate
from app.controllers.auth_controller import (
    register_user, login_user, update_profile,
    require_admin, user_payload, refresh_access_token
)
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.user import User

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
    return user_payload(user)

@router.put("/profile", summary="Modifier son profil")
def edit_profile(data: UserUpdate, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    return update_profile(user, data, db)

@router.post("/refresh", summary="Rafraîchir le token")
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    return refresh_access_token(refresh_token, db)

@router.get("/admin/users", summary="Lister les utilisateurs")
def list_users(statut: str = None, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    require_admin(current_user)
    query = db.query(User)
    if statut:
        query = query.filter(User.statut_validation == statut)
    return [user_payload(u) for u in query.all()]

@router.patch("/admin/users/{user_id}/validation", summary="Valider ou suspendre un compte")
def validate_user(user_id: int, statut: str, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    require_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user.statut_validation = statut
    db.commit()
    return user_payload(user)