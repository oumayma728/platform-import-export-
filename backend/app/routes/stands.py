"""
stands.py — CRUD Stands avec PostgreSQL
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company, Stand
from ..routes.auth import get_current_user, require_role
from ..schemas import StandRead, UserRead

router = APIRouter()


@router.get("/", response_model=List[StandRead])
def list_stands(
    status: Optional[str] = None,
    salon_id: Optional[str] = None,
    exporter_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Liste les stands avec filtres.
    - Exportateur : voit seulement ses stands
    - Importateur/Admin : voit tous les stands (filtrables)
    - search : recherche par nom d'entreprise (insensible à la casse)
    """
    query = db.query(Stand)

    if current_user.role_id == "exporter":
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        query = query.filter(Stand.exporter_id.in_(owned_ids))

    if status:
        query = query.filter(Stand.status == status)
    if salon_id:
        query = query.filter(Stand.salon_id == salon_id)
    if exporter_id:
        query = query.filter(Stand.exporter_id == exporter_id)
    if search:
        query = query.filter(Stand.company_name.ilike(f"%{search}%"))

    return [StandRead.model_validate(s) for s in query.order_by(Stand.created_at.desc()).all()]


@router.get("/{stand_id}", response_model=dict)
def get_stand(
    stand_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère le détail d'un stand avec les infos de l'entreprise."""
    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    company = db.query(Company).filter(Company.id == stand.exporter_id).first()
    result = StandRead.model_validate(stand).model_dump()
    result["company"] = {
        "id": company.id,
        "name": company.name,
        "country": company.country,
        "description": company.description,
        "website": company.website,
        "logo_url": company.logo_url,
        "certification_docs": company.certification_docs,
    } if company else None

    return result


@router.patch("/{stand_id}/validate", response_model=StandRead)
def validate_stand(
    stand_id: str,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Valide un stand (admin uniquement)."""
    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    stand.status = "VALIDE"
    stand.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stand)
    return StandRead.model_validate(stand)


@router.patch("/{stand_id}/reject", response_model=StandRead)
def reject_stand(
    stand_id: str,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Rejette un stand (admin uniquement)."""
    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    stand.status = "REJETE"
    stand.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stand)
    return StandRead.model_validate(stand)
