from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.services.notification_service import log_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/email", summary="Journaliser et envoyer une notification e-mail", description="Enregistrer et envoyer une notification par e-mail.", responses={200: {"description": "Notification enregistrée"}, 401: {"description": "Non authentifié"}})
def send_email(to: str, subject: str, body: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return log_notification(db, "EMAIL", to, body, subject)

@router.post("/sms", summary="Journaliser et envoyer une notification SMS", description="Enregistrer et envoyer une notification par SMS.", responses={200: {"description": "Notification enregistrée"}, 401: {"description": "Non authentifié"}})
def send_sms(to: str, message: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return log_notification(db, "SMS", to, message)
