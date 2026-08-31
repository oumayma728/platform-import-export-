import pytest
from app.services.notification_service import NotificationService
from app.models.models import User, NotificationType

def test_send_email_notification(client, db_session):
    # Setup test user
    response = client.post("/api/v1/auth/register", json={
        "email": "notif@entreprise.com", "password": "Password123!",
        "company_name": "Notif Company", "type": "EXPORTATEUR",
        "pays": "France", "adresse": "123", "numero_tva": "123"
    })
    
    user = db_session.query(User).filter_by(email="notif@entreprise.com").first()
    
    notif_service = NotificationService()
    
    # Simulate sending email
    result = notif_service.send_email(
        db=db_session,
        user_id=user.id,
        to_email="notif@entreprise.com",
        subject="Test Notif",
        content="Contenu de la notif"
    )
    
    assert result is True
    
    # Get user notifications
    from app.models.models import NotificationLog
    logs = db_session.query(NotificationLog).filter_by(user_id=user.id).all()
    assert len(logs) >= 1
    assert logs[0].target == "notif@entreprise.com"

def test_send_sms_notification(client, db_session):
    user = db_session.query(User).filter_by(email="notif@entreprise.com").first()
    if not user:
        client.post("/api/v1/auth/register", json={
            "email": "notif@entreprise.com", "password": "Password123!",
            "company_name": "Notif Company", "type": "EXPORTATEUR",
            "pays": "France", "adresse": "123", "numero_tva": "123"
        })
        user = db_session.query(User).filter_by(email="notif@entreprise.com").first()
        
    notif_service = NotificationService()
    
    result = notif_service.send_sms(
        db=db_session,
        user_id=user.id,
        to_phone="+33612345678",
        message="Test SMS"
    )
    assert result is True
