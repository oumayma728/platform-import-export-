"""
ads.py — CRUD Annonces (Marketplace) avec PostgreSQL
"""
import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Annonce, Company
from ..routes.auth import get_current_user, require_role
from ..schemas import AnnonceCreate, AnnonceRead, AnnonceUpdate, UserRead
from ..services.currency import CurrencyService

router = APIRouter()

ALLOWED_AD_STATUSES = {"ACTIVE", "INACTIVE", "CLOTUREE"}

DEFAULT_PRICE_CURRENCY = "EUR"


@router.get("/", response_model=List[AnnonceRead])
async def list_ads(
    type: Optional[str] = Query(None, description="Filtrer par type (OFFRE ou DEMANDE)"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    status: Optional[str] = Query("ACTIVE", description="Filtrer par statut (défaut: ACTIVE)"),
    search: Optional[str] = Query(None, description="Recherche textuelle dans le titre ou la description"),
    company_id: Optional[str] = Query(None, description="Filtrer par entreprise"),
    min_price: Optional[float] = Query(None, description="Prix minimum"),
    max_price: Optional[float] = Query(None, description="Prix maximum"),
    incoterms: Optional[str] = Query(None, description="Filtrer par Incoterms (ex: FOB, CIF)"),
    country: Optional[str] = Query(None, description="Filtrer par pays de l'entreprise"),
    to_currency: Optional[str] = Query(None, description="Devise d'affichage des prix (ex: USD). Convertit price en price_converted."),
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les annonces avec filtres avancés (type, catégorie, prix, pays, incoterms)."""
    query = db.query(Annonce)

    if country:
        query = query.join(Company).filter(Company.country.ilike(f"%{country}%"))
    if status:
        query = query.filter(Annonce.status == status)
    if type:
        query = query.filter(Annonce.type == type.upper())
    if category:
        query = query.filter(Annonce.category.ilike(f"%{category}%"))
    if company_id:
        query = query.filter(Annonce.company_id == company_id)
    if incoterms:
        query = query.filter(Annonce.incoterms.ilike(f"%{incoterms}%"))
    if min_price is not None:
        query = query.filter(Annonce.price >= min_price)
    if max_price is not None:
        query = query.filter(Annonce.price <= max_price)
    if search:
        query = query.filter(
            or_(
                Annonce.title.ilike(f"%{search}%"),
                Annonce.description.ilike(f"%{search}%"),
            )
        )

    ads = query.order_by(Annonce.created_at.desc()).all()

    # Conversion des prix selon la devise de l'utilisateur
    converted = []
    if to_currency and len(to_currency) == 3:
        results = await asyncio.gather(
            *[_convert_ad_price(a, to_currency) for a in ads]
        )
        converted = results

    items = []
    for ad, conv in zip(ads, converted or [None] * len(ads)):
        data = AnnonceRead.model_validate(ad).model_dump()
        if conv:
            data["price_converted"] = conv["converted"]
            data["price_currency"] = conv["to"]
            data["price_rate"] = conv["rate"]
        items.append(data)

    return items


async def _convert_ad_price(ad: Annonce, to_currency: str) -> Optional[dict]:
    """Convertit le prix d'une annonce (exprimé en EUR) vers to_currency."""
    if ad.price is None:
        return None
    conv = await CurrencyService.convert(ad.price, DEFAULT_PRICE_CURRENCY, to_currency)
    if not conv:
        return None
    return {
        "converted": conv["converted"],
        "to": conv["to"],
        "rate": conv["rate"],
    }


@router.get("/{ad_id}", response_model=AnnonceRead)
def get_ad(
    ad_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère une annonce par son ID."""
    ad = db.query(Annonce).filter(Annonce.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    return AnnonceRead.model_validate(ad)


@router.get("/{ad_id}/logistics-estimate", response_model=dict)
async def get_ad_logistics_estimate(
    ad_id: str,
    destination_country: str = Query(..., description="Code ISO 2 ou nom du pays de destination"),
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Estime les coûts et délais logistiques pour l'annonce vers un pays destinataire."""
    ad = db.query(Annonce).filter(Annonce.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    company = db.query(Company).filter(Company.id == ad.company_id).first()
    origin_country = company.country if company and company.country else "FR"

    from ..services.logistics import LogisticsService
    estimate = await LogisticsService.calculate_route(
        origin_country=origin_country,
        destination_country=destination_country,
        incoterm=ad.incoterms or "FOB"
    )
    return {
        "ad_id": ad_id,
        "ad_title": ad.title,
        "origin_country": origin_country,
        "destination_country": destination_country,
        "incoterms": ad.incoterms,
        "logistics": estimate,
    }


@router.post("/", response_model=AnnonceRead, status_code=201)
def create_ad(
    payload: AnnonceCreate,
    company_id: str = Query(..., description="L'ID de l'entreprise qui publie l'annonce"),
    current_user: UserRead = Depends(require_role("exporter", "importer", "admin")),
    db: Session = Depends(get_db),
):
    """Crée une nouvelle annonce."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    
    if current_user.role_id != "admin" and company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez publier une annonce que pour votre propre entreprise")

    # Une offre est publiée par un exportateur, une demande par un importateur
    if payload.type == "OFFRE" and not company.is_exporter:
        raise HTTPException(status_code=400, detail="Seul un exportateur peut publier une OFFRE")
    if payload.type == "DEMANDE" and not company.is_importer:
        raise HTTPException(status_code=400, detail="Seul un importateur peut publier une DEMANDE")

    if company.profile_status != "VALIDE":
        raise HTTPException(status_code=403, detail="Votre profil d'entreprise doit être validé pour publier une annonce")

    ad = Annonce(
        **payload.model_dump(),
        company_id=company_id,
        status="ACTIVE",
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return AnnonceRead.model_validate(ad)


@router.put("/{ad_id}", response_model=AnnonceRead)
def update_ad(
    ad_id: str,
    payload: AnnonceUpdate,
    current_user: UserRead = Depends(require_role("exporter", "importer", "admin")),
    db: Session = Depends(get_db),
):
    """Met à jour une annonce."""
    ad = db.query(Annonce).filter(Annonce.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    if current_user.role_id != "admin":
        company = db.query(Company).filter(Company.id == ad.company_id).first()
        if not company or company.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres annonces")

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in updates and updates["status"] not in ALLOWED_AD_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs acceptées: {ALLOWED_AD_STATUSES}")

    for key, value in updates.items():
        setattr(ad, key, value)
    
    ad.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ad)
    return AnnonceRead.model_validate(ad)


@router.delete("/{ad_id}", status_code=204)
def delete_ad(
    ad_id: str,
    current_user: UserRead = Depends(require_role("exporter", "importer", "admin")),
    db: Session = Depends(get_db),
):
    """Supprime une annonce."""
    ad = db.query(Annonce).filter(Annonce.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    if current_user.role_id != "admin":
        company = db.query(Company).filter(Company.id == ad.company_id).first()
        if not company or company.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres annonces")

    db.delete(ad)
    db.commit()
    return None
