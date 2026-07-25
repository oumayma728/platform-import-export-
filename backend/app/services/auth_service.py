from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import User, Company
from app.schemas.identity import UserCreate, UserLogin, UserUpdate
from app.config.security import get_password_hash, verify_password, create_access_token, create_refresh_token

def register_user(db: Session, user_in: UserCreate):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=409, detail="Email deja utilisé")
    
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role="CLIENT"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    new_company = Company(
        user_id=new_user.id,
        company_name=user_in.company_name,
        type=user_in.type,
        pays=user_in.pays,
        adresse=user_in.adresse,
        numero_tva=user_in.numero_tva
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(subject=new_user.id)
    refresh_token = create_refresh_token(subject=new_user.id)
    return {"message": "Inscription réussie !", "access_token": access_token, "refresh_token": refresh_token, "user": new_user}

def login_user(db: Session, user_in: UserLogin):
    return login_user_oauth2(db, user_in.email, user_in.password)

def login_user_oauth2(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {"message": "connexion réussie", "access_token": access_token, "refresh_token": refresh_token, "user": user}

def update_user_profile(db: Session, current_user: User, user_update: UserUpdate):
    if user_update.email:
        user = db.query(User).filter(User.email == user_update.email).first()
        if user and user.id != current_user.id:
            raise HTTPException(status_code=409, detail="Email deja utilisé")
        current_user.email = user_update.email
        
    if user_update.password:
        current_user.password_hash = get_password_hash(user_update.password)
        
    if user_update.company and current_user.company:
        if user_update.company.company_name:
            current_user.company.company_name = user_update.company.company_name
        if user_update.company.pays:
            current_user.company.pays = user_update.company.pays
        if user_update.company.adresse:
            current_user.company.adresse = user_update.company.adresse
        if user_update.company.numero_tva:
            current_user.company.numero_tva = user_update.company.numero_tva

    db.commit()
    db.refresh(current_user)
    return current_user
