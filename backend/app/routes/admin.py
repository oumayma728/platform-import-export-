from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.middleware.auth_middleware import get_db, require_admin
from app.models.models import User, StatutValidation, StatutListing
from app.schemas.identity import CompanyOut
from app.schemas.listing import ListingOut
from app.services import admin_service

router = APIRouter()

@router.patch(
    "/companies/{id}/status", 
    response_model=CompanyOut,
    summary="Modifier le statut d'une entreprise",
    description="Permet à l'Administrateur de valider, rejeter ou suspendre une entreprise."
)
def update_company_status(
    id: str,
    statut: StatutValidation = Query(..., description="Le nouveau statut à appliquer"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return admin_service.change_company_status(db, id, statut)

@router.patch(
    "/listings/status/{id}", 
    response_model=ListingOut,
    summary="Modifier le statut d'une annonce",
    description="Permet à l'Administrateur de suspendre, clôturer ou réactiver n'importe quelle annonce."
)
def update_listing_status(
    id: str,
    statut: StatutListing = Query(..., description="Le nouveau statut à appliquer"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return admin_service.change_listing_status(db, id, statut)
