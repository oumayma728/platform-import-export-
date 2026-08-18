"""
rendezvous.py — Gestion des Rendez-vous avec PostgreSQL
Inclut la proposition d'alternatives de créneaux.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company, RendezVous, Salon
from ..routes.auth import get_current_user, require_role
from ..schemas import RendezVousCreate, RendezVousRead, RendezVousUpdate, UserRead
from ..services.email import send_rdv_confirmed_email, send_rdv_proposed_email
from ..services.sms import send_sms

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_RDV_STATUSES = {"PROPOSE", "CONFIRME", "REFUSE", "TERMINE", "ALTERNATIVE_PROPOSEE"}


@router.get("/", response_model=List[RendezVousRead])
def list_rendezvous(
    exporter_id: Optional[str] = None,
    importer_id: Optional[str] = None,
    status: Optional[str] = None,
    salon_id: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les rendez-vous avec filtres."""
    query = db.query(RendezVous)

    # Filtrage par rôle
    if current_user.role_id == "exporter":
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        query = query.filter(RendezVous.exporter_id.in_(owned_ids))
    elif current_user.role_id == "importer":
        owned_ids = [
            c.id for c in db.query(Company).filter(Company.owner_id == current_user.id).all()
        ]
        query = query.filter(RendezVous.importer_id.in_(owned_ids))

    if exporter_id:
        query = query.filter(RendezVous.exporter_id == exporter_id)
    if importer_id:
        query = query.filter(RendezVous.importer_id == importer_id)
    if status:
        query = query.filter(RendezVous.status == status)
    if salon_id:
        query = query.filter(RendezVous.salon_id == salon_id)

    return [RendezVousRead.model_validate(r) for r in query.order_by(RendezVous.created_at.desc()).all()]


@router.post("/", response_model=RendezVousRead, status_code=201)
def create_rendezvous(
    payload: RendezVousCreate,
    current_user: UserRead = Depends(require_role("admin", "importer")),
    db: Session = Depends(get_db),
):
    """Crée un rendez-vous (importateur propose, exportateur confirme)."""
    salon = db.query(Salon).filter(Salon.id == payload.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon introuvable")
    if salon.status not in ("VALIDE", "PUBLIE"):
        raise HTTPException(status_code=400, detail="Le salon doit être publié pour planifier un rendez-vous")

    exporter = db.query(Company).filter(Company.id == payload.exporter_id).first()
    if not exporter or not exporter.is_exporter:
        raise HTTPException(status_code=400, detail="Exportateur introuvable ou invalide")
    if exporter.profile_status != "VALIDE":
        raise HTTPException(status_code=403, detail="Le profil de l'exportateur doit être validé")

    importer = db.query(Company).filter(Company.id == payload.importer_id).first()
    if not importer or not importer.is_importer:
        raise HTTPException(status_code=400, detail="Importateur introuvable ou invalide")
    if importer.profile_status != "VALIDE":
        raise HTTPException(status_code=403, detail="Le profil de l'importateur doit être validé")
    if current_user.role_id == "importer" and importer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez créer un rendez-vous qu'avec votre propre société")

    if payload.exporter_id == payload.importer_id:
        raise HTTPException(status_code=400, detail="L'exportateur et l'importateur doivent être différents")

    try:
        proposed = datetime.fromisoformat(payload.proposed_datetime)
    except ValueError:
        raise HTTPException(status_code=400, detail="Date et heure invalides pour le rendez-vous")

    if proposed <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="La date du rendez-vous doit être dans le futur")

    rdv = RendezVous(
        salon_id=payload.salon_id,
        stand_id=payload.stand_id,
        exporter_id=payload.exporter_id,
        importer_id=payload.importer_id,
        proposed_datetime=payload.proposed_datetime,
        notes=payload.notes,
        alternative_datetimes=[],
    )
    db.add(rdv)
    db.commit()
    db.refresh(rdv)

    # Notification "demande RDV" → exportateur
    try:
        exporter_owner = exporter.owner
        if exporter_owner and exporter_owner.email:
            send_rdv_proposed_email(
                to=exporter_owner.email,
                proposed_datetime=rdv.proposed_datetime,
                exporter_name=exporter.name,
            )
    except Exception as e:
        logger.error(f"Erreur notification demande RDV pour {exporter.id}: {e}")

    return RendezVousRead.model_validate(rdv)


@router.patch("/{rdv_id}/confirm", response_model=RendezVousRead)
def confirm_rendezvous(
    rdv_id: str,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Confirme un rendez-vous (exportateur ou admin)."""
    rdv = db.query(RendezVous).filter(RendezVous.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    if rdv.status not in ("PROPOSE", "ALTERNATIVE_PROPOSEE"):
        raise HTTPException(status_code=400, detail="Ce rendez-vous ne peut pas être confirmé dans son état actuel")

    rdv.status = "CONFIRME"
    rdv.updated_at = datetime.utcnow()

    # Créer le canal d'échange dédié (Conversation) s'il existe un stand
    if rdv.stand_id and rdv.importer_id:
        from ..models import Conversation
        existing_conv = db.query(Conversation).filter(
            Conversation.stand_id == rdv.stand_id,
            Conversation.importer_id == rdv.importer_id,
        ).first()

        if not existing_conv:
            new_conv = Conversation(
                stand_id=rdv.stand_id,
                importer_id=rdv.importer_id,
                status="EN_CONTACT",
            )
            db.add(new_conv)

    # Notification "confirmation RDV" → les deux parties (exportateur & importateur)
    try:
        parties = {rdv.exporter_company.owner, rdv.importer_company.owner}
        for owner in parties:
            if owner and owner.email:
                send_rdv_confirmed_email(
                    to=owner.email,
                    proposed_datetime=rdv.proposed_datetime,
                )
    except Exception as e:
        logger.error(f"Erreur notification confirmation RDV {rdv.id}: {e}")

    # Envoi de SMS simulé (numéro fictif)
    send_sms(
        to_number="+33612345678", 
        message=f"Salons Virtuels: Votre rendez-vous {rdv.id} a été CONFIRMÉ par l'exportateur."
    )
    db.commit()
    db.refresh(rdv)
    return RendezVousRead.model_validate(rdv)


@router.patch("/{rdv_id}/refuse", response_model=RendezVousRead)
def refuse_rendezvous(
    rdv_id: str,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Refuse un rendez-vous (exportateur ou admin)."""
    rdv = db.query(RendezVous).filter(RendezVous.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")

    rdv.status = "REFUSE"
    rdv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rdv)
    return RendezVousRead.model_validate(rdv)


@router.patch("/{rdv_id}/alternative", response_model=RendezVousRead)
def propose_alternative(
    rdv_id: str,
    payload: RendezVousUpdate,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Propose des créneaux alternatifs (exportateur ou admin)."""
    rdv = db.query(RendezVous).filter(RendezVous.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    if not payload.alternative_datetimes:
        raise HTTPException(status_code=400, detail="Au moins un créneau alternatif est requis")

    rdv.alternative_datetimes = payload.alternative_datetimes
    rdv.status = "ALTERNATIVE_PROPOSEE"
    if payload.notes:
        rdv.notes = payload.notes
    rdv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rdv)
    return RendezVousRead.model_validate(rdv)


@router.patch("/{rdv_id}/complete", response_model=RendezVousRead)
def complete_rendezvous(
    rdv_id: str,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """Marque un rendez-vous comme terminé."""
    rdv = db.query(RendezVous).filter(RendezVous.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")

    rdv.status = "TERMINE"
    rdv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rdv)
    return RendezVousRead.model_validate(rdv)
