"""
subscriptions.py — Abonnements des importateurs par catégorie de salon
Permet de cibler la notification de publication d'un salon (Story 5.2).
"""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CategorySubscription, Company
from ..routes.auth import get_current_user, require_role
from ..schemas import CategorySubscriptionCreate, CategorySubscriptionRead, UserRead

router = APIRouter()


def _company_owned_by(company: Company, user: UserRead) -> bool:
    return user.role_id == "admin" or company.owner_id == user.id


@router.get("/", response_model=List[CategorySubscriptionRead])
def list_subscriptions(
    company_id: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les abonnements. Par défaut : uniquement ceux de l'utilisateur connecté."""
    query = db.query(CategorySubscription)

    if company_id:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Entreprise introuvable")
        if not _company_owned_by(company, current_user):
            raise HTTPException(status_code=403, detail="Accès refusé à cet abonnement")
        query = query.filter(CategorySubscription.company_id == company_id)
    elif current_user.role_id != "admin":
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        query = query.filter(CategorySubscription.company_id.in_(owned_ids))

    return [CategorySubscriptionRead.model_validate(s) for s in query.order_by(
        CategorySubscription.category.asc()
    ).all()]


@router.post("/", response_model=CategorySubscriptionRead, status_code=201)
def create_subscription(
    payload: CategorySubscriptionCreate,
    current_user: UserRead = Depends(require_role("admin", "exporter", "importer")),
    db: Session = Depends(get_db),
):
    """Abonne une entreprise de l'utilisateur à une catégorie de salon."""
    if not payload.category.strip():
        raise HTTPException(status_code=400, detail="Catégorie requise")

    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    if not _company_owned_by(company, current_user):
        raise HTTPException(status_code=403, detail="Vous ne pouvez abonner que vos propres entreprises")

    existing = db.query(CategorySubscription).filter(
        CategorySubscription.company_id == payload.company_id,
        CategorySubscription.category == payload.category.strip(),
    ).first()
    if existing:
        return CategorySubscriptionRead.model_validate(existing)

    sub = CategorySubscription(
        company_id=payload.company_id,
        category=payload.category.strip(),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return CategorySubscriptionRead.model_validate(sub)


@router.delete("/{subscription_id}", status_code=204)
def delete_subscription(
    subscription_id: str,
    current_user: UserRead = Depends(require_role("admin", "exporter", "importer")),
    db: Session = Depends(get_db),
):
    """Désabonne une entreprise d'une catégorie de salon."""
    sub = db.query(CategorySubscription).filter(
        CategorySubscription.id == subscription_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable")

    company = db.query(Company).filter(Company.id == sub.company_id).first()
    if not _company_owned_by(company, current_user):
        raise HTTPException(status_code=403, detail="Accès refusé à cet abonnement")

    db.delete(sub)
    db.commit()
