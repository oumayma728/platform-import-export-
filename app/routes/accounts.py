from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.user import User
from app.models.company import Company
from app.controllers.auth_controller import map_role, STATUS_MAP

router = APIRouter(prefix="/accounts", tags=["Comptes (infos publiques)"])


@router.get("/{user_id}", summary="Infos publiques d'un compte (avant de contacter un vendeur/acheteur)")
def get_public_account(user_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Compte introuvable")

    company = db.query(Company).filter(Company.user_id == user_id).first()
    certifications = []
    if company and company.certifications:
        certifications = [c.strip() for c in company.certifications.split(",") if c.strip()]

    return {
        "id": user.id,
        "role": map_role(user.type_compte) or "exporter",
        "companyName": (company.nom if company else user.entreprise) or user.nom,
        "country": (company.pays if company else user.pays) or "",
        "sector": company.secteur if company else None,
        "certifications": certifications,
        "memberSince": str(user.created_at.year) if user.created_at else None,
        "profileStatus": STATUS_MAP.get(user.statut_validation, "pending"),
        "description": company.description if company else None,
    }