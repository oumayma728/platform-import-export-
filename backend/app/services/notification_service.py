import logging
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from app.config.config import settings
from sqlalchemy.orm import Session
from app.models.models import NotificationLog, NotificationType, NotificationStatus

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.sg_client = None
        self.twilio_client = None
        
        if settings.SENDGRID_API_KEY:
            self.sg_client = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def _log_notification(self, db: Session, user_id: str, type: NotificationType, target: str, status: NotificationStatus, error_message: str = None):
        log = NotificationLog(
            user_id=user_id,
            type=type,
            target=target,
            status=status,
            error_message=error_message
        )
        db.add(log)
        db.commit()

    def send_email(self, db: Session, user_id: str, to_email: str, subject: str, content: str):
        if not self.sg_client:
            logger.info(f"MOCK EMAIL to {to_email}: {subject} - {content}")
            self._log_notification(db, user_id, NotificationType.EMAIL, to_email, NotificationStatus.SENT)
            return True

        try:
            from_email = Email("contact@indeed2.com")
            to_email_obj = To(to_email)
            content_obj = Content("text/plain", content)
            mail = Mail(from_email, to_email_obj, subject, content_obj)
            response = self.sg_client.client.mail.send.post(request_body=mail.get())
            if response.status_code in [200, 201, 202]:
                self._log_notification(db, user_id, NotificationType.EMAIL, to_email, NotificationStatus.SENT)
                return True
            else:
                self._log_notification(db, user_id, NotificationType.EMAIL, to_email, NotificationStatus.FAILED, str(response.body))
                return False
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            self._log_notification(db, user_id, NotificationType.EMAIL, to_email, NotificationStatus.FAILED, str(e))
            return False

    def send_sms(self, db: Session, user_id: str, to_phone: str, message: str):
        if not self.twilio_client or not settings.TWILIO_FROM_NUMBER:
            logger.info(f"MOCK SMS to {to_phone}: {message}")
            self._log_notification(db, user_id, NotificationType.SMS, to_phone, NotificationStatus.SENT)
            return True

        try:
            msg = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_FROM_NUMBER,
                to=to_phone
            )
            self._log_notification(db, user_id, NotificationType.SMS, to_phone, NotificationStatus.SENT)
            return True
        except TwilioRestException as e:
            logger.error(f"Failed to send SMS: {e}")
            self._log_notification(db, user_id, NotificationType.SMS, to_phone, NotificationStatus.FAILED, str(e))
            return False
            
notification_service = NotificationService()
