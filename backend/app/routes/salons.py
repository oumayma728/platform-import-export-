"""
salons.py — CRUD Salons + Stands avec PostgreSQL
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CategorySubscription, Company, NotificationLog, Salon, Stand
from ..routes.auth import get_current_user, require_role
from ..schemas import SalonCreate, SalonRead, SalonUpdate, StandCreate, StandRead, UserRead
from ..services.email import salon_invitation_email_html, send_salon_invitation_email

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_SALON_STATUSES = {"BROUILLON", "VALIDE", "PUBLIE", "EN_COURS", "TERMINE", "CLOTURE"}


def _should_notify_published(salon: Salon, previous_status: str) -> bool:
    """True si le salon vient d'être publié (VALIDE ou PUBLIE) sans double envoi.

    VALIDE → PUBLIE notifie (publication officielle), mais VALIDE → VALIDE
    (simple mise à jour) ne renvoie pas d'invitation.
    """
    if salon.status == "PUBLIE":
        return previous_status != "PUBLIE"
    if salon.status == "VALIDE":
        return previous_status not in ("VALIDE", "PUBLIE")
    return False


def _notify_importers_salon_published(db: Session, salon: Salon) -> None:
    """Envoie l'invitation du salon publié aux importateurs validés.

    Ciblage (Story 5.2) : si des importateurs sont abonnés à la catégorie du
    salon, seuls ceux-ci sont notifiés. À défaut d'abonnés pour cette catégorie,
    tous les importateurs validés sont notifiés (comportement historique).
    """
    salon_dates = (
        f"{salon.start_date} → {salon.end_date}"
        if salon.start_date and salon.end_date
        else "dates à venir"
    )

    query = db.query(Company).filter(
        Company.is_importer.is_(True),
        Company.profile_status == "VALIDE",
    )
    if salon.category:
        subscribed_ids = {
            row[0]
            for row in db.query(CategorySubscription.company_id)
            .filter(CategorySubscription.category == salon.category)
            .all()
        }
        if subscribed_ids:
            query = query.filter(Company.id.in_(subscribed_ids))

    importers = query.all()
    if not importers:
        logger.info(f"Salon {salon.id} : aucun importateur ciblé pour la catégorie {salon.category}")
        return

    for importer in importers:
        owner = importer.owner
        if not owner or not owner.email:
            continue
        try:
            send_salon_invitation_email(
                to=owner.email,
                salon_title=salon.title,
                salon_dates=salon_dates,
                company_name=importer.name,
                category=salon.category,
            )
            db.add(
                NotificationLog(
                    user_id=owner.id,
                    channel="EMAIL",
                    recipient=owner.email,
                    subject=f"🎪 Invitation : {salon.title}",
                    content=salon_invitation_email_html(
                        salon.title, salon_dates, importer.name
                    )[:500],
                    category=salon.category,
                )
            )
        except Exception as e:
            logger.error(f"Erreur invitation salon {salon.id} vers {importer.id}: {e}")
    db.commit()


def _validate_salon_dates(start_date: Optional[str], end_date: Optional[str]) -> None:
    """Valide que la date de début est antérieure à la date de fin."""
    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Dates invalides pour le salon")
        if start >= end:
            raise HTTPException(
                status_code=400,
                detail="La date de début doit être antérieure à la date de fin",
            )


# ─────────────────────────────────────────────────────────────────────────────
# SALONS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[SalonRead])
def list_salons(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les salons avec filtres optionnels."""
    query = db.query(Salon)
    if status:
        query = query.filter(Salon.status == status)
    if category:
        query = query.filter(Salon.category.ilike(f"%{category}%"))
    return [SalonRead.model_validate(s) for s in query.order_by(Salon.created_at.desc()).all()]


@router.get("/{salon_id}", response_model=SalonRead)
def get_salon(
    salon_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère un salon par son ID."""
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")
    return SalonRead.model_validate(salon)


@router.post("/", response_model=SalonRead, status_code=201)
def create_salon(
    payload: SalonCreate,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Crée un nouveau salon (admin uniquement)."""
    _validate_salon_dates(payload.start_date, payload.end_date)
    if payload.stand_price is not None and payload.stand_price < 0:
        raise HTTPException(status_code=400, detail="Le prix du stand doit être positif")

    salon = Salon(**payload.model_dump())
    db.add(salon)
    db.commit()
    db.refresh(salon)
    return SalonRead.model_validate(salon)


@router.put("/{salon_id}", response_model=SalonRead)
def update_salon(
    salon_id: str,
    payload: SalonUpdate,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Met à jour un salon (admin uniquement)."""
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in updates and updates["status"] not in ALLOWED_SALON_STATUSES:
        raise HTTPException(status_code=400, detail="Statut de salon invalide")

    _validate_salon_dates(
        updates.get("start_date", salon.start_date),
        updates.get("end_date", salon.end_date),
    )

    previous_status = salon.status
    for key, value in updates.items():
        setattr(salon, key, value)
    salon.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(salon)

    # Publication → invitation ciblée aux importateurs
    if _should_notify_published(salon, previous_status):
        _notify_importers_salon_published(db, salon)

    return SalonRead.model_validate(salon)


@router.patch("/{salon_id}/status", response_model=SalonRead)
def patch_salon_status(
    salon_id: str,
    payload: SalonUpdate,
    current_user: UserRead = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Change le statut d'un salon (admin uniquement)."""
    if not payload.status or payload.status not in ALLOWED_SALON_STATUSES:
        raise HTTPException(status_code=400, detail="Statut de salon invalide")

    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")

    previous_status = salon.status
    salon.status = payload.status
    salon.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(salon)

    # Publication → invitation ciblée aux importateurs
    if _should_notify_published(salon, previous_status):
        _notify_importers_salon_published(db, salon)

    return SalonRead.model_validate(salon)


# ─────────────────────────────────────────────────────────────────────────────
# STANDS dans un SALON
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{salon_id}/stands", response_model=List[StandRead])
def list_stands_by_salon(
    salon_id: str,
    status: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les stands d'un salon."""
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")

    query = db.query(Stand).filter(Stand.salon_id == salon_id)
    if status:
        query = query.filter(Stand.status == status)
    return [StandRead.model_validate(s) for s in query.all()]


@router.post("/{salon_id}/stands", response_model=StandRead, status_code=201)
def create_stand_in_salon(
    salon_id: str,
    payload: StandCreate,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Réserve un stand dans un salon."""
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")

    company = db.query(Company).filter(Company.id == payload.exporter_id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Entreprise exportatrice introuvable")
    if not company.is_exporter:
        raise HTTPException(status_code=400, detail="Seuls les exportateurs peuvent réserver un stand")
    if company.profile_status != "VALIDE":
        raise HTTPException(status_code=403, detail="Le profil exportateur doit être validé avant de réserver un stand")
    if current_user.role_id == "exporter" and company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez réserver un stand que pour votre propre entreprise")

    stand = Stand(
        **payload.model_dump(),
        salon_id=salon_id,
    )
    db.add(stand)
    db.commit()
    db.refresh(stand)
    return StandRead.model_validate(stand)
