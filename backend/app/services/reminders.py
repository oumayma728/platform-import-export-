"""
reminders.py — Job planifié : rappels automatiques 24h avant les rendez-vous confirmés.
Idempotent : chaque rappel (RDV + destinataire) n'est envoyé qu'une seule fois,
traçé dans NotificationLog.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import NotificationLog, RendezVous
from ..services.email import rdv_reminder_email_html
from ..services.notification import NotificationService

logger = logging.getLogger(__name__)

REMINDER_WINDOW_HOURS = 24


def _reminder_already_sent(db: Session, rdv_id: str, recipient: str) -> bool:
    """Vrai si un rappel a déjà été envoyé pour ce RDV à ce destinataire."""
    return (
        db.query(NotificationLog)
        .filter(
            NotificationLog.channel == "EMAIL",
            NotificationLog.recipient == recipient,
            NotificationLog.subject.like(f"%{rdv_id}%"),
        )
        .first()
        is not None
    )


def _remind_recipient(db: Session, rdv: RendezVous, email: str, user_id: str, company_name: str) -> bool:
    return NotificationService.send_email(
        to=email,
        subject=f"⏰ Rappel : rendez-vous {rdv.id} dans moins de 24h",
        body=rdv_reminder_email_html(
            exporter_name=company_name,
            proposed_datetime=rdv.proposed_datetime,
            rdv_id=rdv.id,
        ),
        user_id=user_id,
        db=db,
    )


def run_rdv_reminders(db: Optional[Session] = None) -> int:
    """
    Envoie les rappels pour les rendez-vous confirmés dans les prochaines 24h.
    Retourne le nombre de rappels envoyés. Ne lève jamais (job scheduler).
    """
    should_close = db is None
    if db is None:
        db = SessionLocal()

    try:
        now = datetime.utcnow()
        horizon = now + timedelta(hours=REMINDER_WINDOW_HOURS)

        rdvs = db.query(RendezVous).filter(RendezVous.status == "CONFIRME").all()
        sent = 0

        for rdv in rdvs:
            try:
                rdv_time = datetime.fromisoformat(rdv.proposed_datetime)
            except (ValueError, TypeError):
                continue

            if rdv_time <= now or rdv_time > horizon:
                continue

            recipients = set()
            for company in (rdv.exporter_company, rdv.importer_company):
                if company and company.owner and company.owner.email:
                    recipients.add((company.owner.email, company.owner.id, company.name))

            for email, user_id, company_name in recipients:
                if _reminder_already_sent(db, rdv.id, email):
                    continue
                try:
                    if _remind_recipient(db, rdv, email, user_id, company_name):
                        sent += 1
                except Exception as e:
                    logger.error(f"Erreur rappel RDV {rdv.id} → {email}: {e}")

        return sent
    except Exception as e:
        logger.error(f"Erreur job rappels RDV : {e}")
        return 0
    finally:
        if should_close:
            db.close()
