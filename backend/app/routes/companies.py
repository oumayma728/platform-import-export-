"""
companies.py — CRUD Entreprises avec PostgreSQL
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company
from ..routes.auth import get_current_user, require_role
from ..schemas import CompanyCreate, CompanyRead, CompanyStatusUpdate, UserRead

router = APIRouter()

ALLOWED_STATUSES = {"EN_ATTENTE_VALIDATION", "VALIDE", "REJETE"}


@router.get("/", response_model=List[CompanyRead])
def list_companies(
    is_exporter: Optional[bool] = None,
    is_importer: Optional[bool] = None,
    profile_status: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les entreprises avec filtres optionnels."""
    query = db.query(Company)

    # Filtres par rôle
    if current_user.role == "exporter":
        query = query.filter(Company.owner_id == current_user.id)
    elif current_user.role == "importer":
        if is_exporter:
            query = query.filter(Company.is_exporter == True)
        else:
            query = query.filter(
                (Company.owner_id == current_user.id) | (Company.is_exporter == True)
            )

    # Filtres additionnels
    if is_exporter is not None:
        query = query.filter(Company.is_exporter == is_exporter)
    if is_importer is not None:
        query = query.filter(Company.is_importer == is_importer)
    if profile_status is not None:
        query = query.filter(Company.profile_status == profile_status)

    return [CompanyRead.model_validate(c) for c in query.all()]


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère une entreprise par son ID."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    if current_user.role == "exporter" and company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé à cette entreprise")
    if current_user.role == "importer" and not (
        company.owner_id == current_user.id or company.is_exporter
    ):
        raise HTTPException(status_code=403, detail="Accès refusé à cette entreprise")

    return CompanyRead.model_validate(company)


@router.post("/", response_model=CompanyRead, status_code=201)
def create_company(
    payload: CompanyCreate,
    current_user: UserRead = Depends(require_role("admin", "exporter", "importer")),
    db: Session = Depends(get_db),
):
    """Crée une nouvelle entreprise."""
    company = Company(
        **payload.model_dump(),
        owner_id=current_user.id,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return CompanyRead.model_validate(company)


@router.put("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: str,
    payload: CompanyCreate,
    current_user: UserRead = Depends(require_role("admin", "exporter", "importer")),
    db: Session = Depends(get_db),
):
    """Met à jour une entreprise."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    if current_user.role != "admin" and company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres entreprises")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)
    return CompanyRead.model_validate(company)


@router.patch("/{company_id}/status", response_model=CompanyRead)
def update_company_status(
    company_id: str,
    payload: CompanyStatusUpdate,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Met à jour le statut de validation d'une entreprise (admin uniquement)."""
    if payload.profile_status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs acceptées : {ALLOWED_STATUSES}")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    company.profile_status = payload.profile_status
    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)
    return CompanyRead.model_validate(company)
