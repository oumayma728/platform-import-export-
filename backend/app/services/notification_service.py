import logging
from app.config.config import settings
from sqlalchemy.orm import Session
from app.models.models import NotificationLog, NotificationType, NotificationStatus

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.twilio_client = None

    def _log_notification(self, db: Session, user_id: str, type: NotificationType, target: str, status: NotificationStatus, error_message: str = None, subject: str = None, content: str = None):
        log = NotificationLog(
            user_id=user_id,
            type=type,
            target=target,
            subject=subject,
            content=content,
            status=status,
            error_message=error_message
        )
        db.add(log)
        db.commit()

    def send_email(self, db: Session, user_id: str, to_email: str, subject: str, content: str):
        # MOCK EMAIL
        logger.info(f"MOCK EMAIL to {to_email}: {subject} - {content}")
        self._log_notification(db, user_id, NotificationType.EMAIL, to_email, NotificationStatus.SENT, subject=subject, content=content)
        return True

    def send_sms(self, db: Session, user_id: str, to_phone: str, message: str):
        # MOCK SMS
        logger.info(f"MOCK SMS to {to_phone}: {message}")
        self._log_notification(db, user_id, NotificationType.SMS, to_phone, NotificationStatus.SENT, content=message)
        return True

    def retry_failed_notifications(self, db: Session):
        failed_logs = db.query(NotificationLog).filter(NotificationLog.status == NotificationStatus.FAILED).all()
        retried_count = 0
        for log in failed_logs:
            if log.type == NotificationType.EMAIL and log.subject and log.content:
                success = self.send_email(db, log.user_id, log.target, log.subject, log.content)
                if success:
                    log.status = NotificationStatus.SENT
                    db.commit()
                    retried_count += 1
            elif log.type == NotificationType.SMS and log.content:
                success = self.send_sms(db, log.user_id, log.target, log.content)
                if success:
                    log.status = NotificationStatus.SENT
                    db.commit()
                    retried_count += 1
        return retried_count
            
notification_service = NotificationService()
