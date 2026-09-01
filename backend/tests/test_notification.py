"""
test_notification.py â€” Tests du service unifiÃ© de notifications (NotificationService)
"""
from unittest.mock import patch

from app.models import NotificationLog
from app.services.notification import NotificationService


def test_send_sms_success_logged(db):
    """SMS en mode simulation â†’ NotificationLog SENT."""
    ok = NotificationService.send_sms(
        "+33612345678",
        "Message de test",
        user_id="test-importer-user",
        db=db,
    )
    assert ok is True
    log = db.query(NotificationLog).filter(NotificationLog.channel == "SMS").first()
    assert log is not None
    assert log.status == "SENT"
    assert log.recipient == "+33612345678"


def test_send_sms_failure_logged(db):
    """Ã‰chec Twilio simulÃ© â†’ NotificationLog FAILED et retour False."""
    with patch("app.services.notification._twilio_send_sms", return_value=False):
        ok = NotificationService.send_sms("+33600000000", "Test", user_id="test-importer-user", db=db)
    assert ok is False
    log = db.query(NotificationLog).filter(NotificationLog.channel == "SMS").first()
    assert log.status == "FAILED"


def test_send_email_dev_mode(db):
    """Email sans SendGrid/SMTP configurÃ© â†’ mode dev, log SENT."""
    ok = NotificationService.send_email(
        "destinataire@test.com",
        "Sujet test",
        "<p>Contenu</p>",
        user_id="test-admin",
        db=db,
    )
    assert ok is True
    log = db.query(NotificationLog).filter(NotificationLog.channel == "EMAIL").first()
    assert log.status == "SENT"


def test_send_email_failure(db):
    with patch("app.services.notification._smtp_send_email", return_value=False):
        ok = NotificationService.send_email("a@b.com", "S", "<p>B</p>", user_id="test-admin", db=db)
    assert ok is False
    log = db.query(NotificationLog).filter(NotificationLog.channel == "EMAIL").first()
    assert log.status == "FAILED"
    assert log.error_message is not None


def test_send_email_sendgrid_fallback_smtp(db):
    """SendGrid configurÃ© mais indisponible (ImportError) â†’ fallback SMTP."""
    import app.services.notification as notif_mod

    with patch.object(notif_mod, "SENDGRID_API_KEY", "valid-key"), patch(
        "app.services.notification._smtp_send_email", return_value=True
    ) as m_smtp:
        ok = NotificationService.send_email("a@b.com", "S", "<p>B</p>", db=db)
    assert ok is True
    assert m_smtp.called
    log = db.query(NotificationLog).filter(NotificationLog.channel == "EMAIL").first()
    assert log.status == "SENT"


def test_retry_failed_notifications(db):
    """Les notifications FAILED sous max_retries sont rejouÃ©es et passent SENT."""
    with patch("app.services.notification._smtp_send_email", return_value=False):
        NotificationService.send_email("fail@test.com", "S", "<p>B</p>", user_id="test-admin", db=db)

    failed = db.query(NotificationLog).filter(NotificationLog.status == "FAILED").first()
    assert failed is not None

    with patch("app.services.notification._smtp_send_email", return_value=True):
        replayed = NotificationService.retry_failed_notifications(db, max_retries=3)
    assert replayed >= 1
    db.refresh(failed)
    assert failed.status == "SENT"
    assert failed.retries == 1


def test_retry_failed_notifications_exceeds_max_retries(db):
    """Une notification dÃ©jÃ  au max de retries n'est pas rejouÃ©e."""
    from datetime import datetime

    log = NotificationLog(
        user_id="test-admin",
        channel="EMAIL",
        recipient="x@test.com",
        subject="S",
        content="<p>B</p>",
        status="FAILED",
        retries=3,
        updated_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()

    with patch("app.services.notification._smtp_send_email", return_value=True):
        replayed = NotificationService.retry_failed_notifications(db, max_retries=3)
    assert replayed == 0

