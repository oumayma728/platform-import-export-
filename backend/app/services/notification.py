"""
notification.py — Service unifié de notifications (NotificationService)
Combine les notifications par Email (SendGrid / SMTP) et SMS (Twilio)
Tracé complet avec historisation dans NotificationLog et retry automatique.
"""
import logging
import os
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import NotificationLog
from ..services.email import send_email as _smtp_send_email
from ..services.sms import send_sms as _twilio_send_sms

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


class NotificationService:
    """Service centralisé de gestion et traçabilité des notifications."""

    @staticmethod
    def send_email(
        to: str,
        subject: str,
        body: str,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> bool:
        """
        Envoie un email (via SendGrid ou SMTP fallback) et consigne l'action dans NotificationLog.
        """
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        log_entry = NotificationLog(
            user_id=user_id,
            channel="EMAIL",
            recipient=to,
            subject=subject,
            content=body[:500],
            status="SENT",
            retries=0
        )

        success = False
        try:
            # 1. Essayer SendGrid si clé configurée
            if SENDGRID_API_KEY and SENDGRID_API_KEY != "your-sendgrid-api-key":
                try:
                    import sendgrid
                    from sendgrid.helpers.mail import Mail
                    sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
                    message = Mail(
                        from_email=os.getenv("EMAIL_FROM", "noreply@salonsvirtuels.com"),
                        to_emails=to,
                        subject=subject,
                        html_content=body
                    )
                    resp = sg.send(message)
                    success = resp.status_code in (200, 201, 202)
                except Exception as sg_err:
                    logger.warning(f"SendGrid error, fallback to SMTP: {sg_err}")
                    success = _smtp_send_email(to=to, subject=subject, html_body=body)
            else:
                # 2. Fallback SMTP ou Dev Mode
                success = _smtp_send_email(to=to, subject=subject, html_body=body)

            if not success:
                log_entry.status = "FAILED"
                log_entry.error_message = "Échec d'envoi SMTP/SendGrid"
        except Exception as ex:
            logger.error(f"Erreur envoi email: {ex}")
            log_entry.status = "FAILED"
            log_entry.error_message = str(ex)

        try:
            db.add(log_entry)
            db.commit()
        except Exception as db_err:
            logger.error(f"Erreur écriture NotificationLog: {db_err}")
            db.rollback()
        finally:
            if should_close_db:
                db.close()

        return success

    @staticmethod
    def send_sms(
        phone: str,
        message: str,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> bool:
        """
        Envoie un SMS (via Twilio ou log dev mode) et consigne l'action dans NotificationLog.
        """
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        log_entry = NotificationLog(
            user_id=user_id,
            channel="SMS",
            recipient=phone,
            subject="SMS Notification",
            content=message[:500],
            status="SENT",
            retries=0
        )

        success = _twilio_send_sms(to_number=phone, message=message)
        if not success:
            log_entry.status = "FAILED"
            log_entry.error_message = "Échec envoi Twilio SMS"

        try:
            db.add(log_entry)
            db.commit()
        except Exception as db_err:
            logger.error(f"Erreur écriture NotificationLog SMS: {db_err}")
            db.rollback()
        finally:
            if should_close_db:
                db.close()

        return success

    @staticmethod
    def retry_failed_notifications(db: Session, max_retries: int = 3) -> int:
        """
        Rejoue les notifications échouées n'ayant pas dépassé max_retries.
        Retourne le nombre de notifications rejouées avec succès.
        """
        failed_logs = db.query(NotificationLog).filter(
            NotificationLog.status == "FAILED",
            NotificationLog.retries < max_retries
        ).all()

        replayed_count = 0
        for log in failed_logs:
            log.retries += 1
            if log.channel == "EMAIL":
                ok = _smtp_send_email(to=log.recipient, subject=log.subject or "Notification", html_body=log.content or "")
            else:
                ok = _twilio_send_sms(to_number=log.recipient, message=log.content or "")

            if ok:
                log.status = "SENT"
                log.error_message = None
                replayed_count += 1
            else:
                log.status = "FAILED"

            log.updated_at = datetime.utcnow()

        db.commit()
        return replayed_count
