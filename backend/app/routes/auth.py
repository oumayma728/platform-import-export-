from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.middleware import auth_middleware
from app.schemas.identity import UserCreate, UserLogin, Token, UserOut, UserUpdate
from app.models.models import User
from app.services import auth_service

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(auth_middleware.get_db)):
    return auth_service.register_user(db, user_in)

@router.post("/login", response_model=Token, description="Route standard pour l'application Frontend.")
def login(user_login: UserLogin, db: Session = Depends(auth_middleware.get_db)):
    return auth_service.login_user_oauth2(db, user_login.email, user_login.password)

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(auth_middleware.get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(auth_middleware.get_current_user),
    db: Session = Depends(auth_middleware.get_db)
):
    return auth_service.update_user_profile(db, current_user, user_update)
