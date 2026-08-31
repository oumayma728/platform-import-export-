from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.models import User, Company, Billing, UserQuota, StatutFacturation
from app.middleware.auth_middleware import get_current_user
from app.services.stripe_service import create_checkout_session
from typing import Dict, Any

router = APIRouter()

SEUIL_RECOMMANDATION_ABONNEMENT = 50.0 

@router.get("/status", response_model=Dict[str, Any])
def get_billing_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.company:
        raise HTTPException(status_code=403, detail="L'utilisateur n'appartient à aucune entreprise")
    
    company = db.query(Company).filter(Company.id == current_user.company.id).first()
    quota = company.quota
    billing = company.billing
    
    recommandation_abonnement = False
    if billing.statut_facturation in [StatutFacturation.GRATUIT, StatutFacturation.LIMITE_ATTEINTE, StatutFacturation.PAIEMENT_USAGE]:
        if billing.depense_cumulee_usage > SEUIL_RECOMMANDATION_ABONNEMENT:
            recommandation_abonnement = True

    return {
        "statut_facturation": billing.statut_facturation,
        "chats_gratuits_restants": quota.chats_gratuits_restants,
        "chats_utilises": quota.chats_utilises,
        "depense_cumulee_usage": billing.depense_cumulee_usage,
        "recommande_abonnement": recommandation_abonnement,
        "message": "Vous avez dépensé plus qu'un abonnement mensuel. Passez Premium pour des chats illimités !" if recommandation_abonnement else "Statut normal."
    }

@router.post("/create-payment-intent")
def create_payment(type_paiement: str, success_url: str = "http://localhost:3000/success", cancel_url: str = "http://localhost:3000/cancel", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.company:
        raise HTTPException(status_code=403, detail="L'utilisateur n'appartient à aucune entreprise")
    
    result = create_checkout_session(
        db=db, 
        company_id=current_user.company.id, 
        type_paiement=type_paiement,
        success_url=success_url,
        cancel_url=cancel_url
    )
    
    return result
