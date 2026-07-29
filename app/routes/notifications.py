from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.services.notification_service import (
    create_notification,
    list_notifications_for_user,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/me",
    summary="Lister mes notifications",
    description="Récupère les notifications de l'utilisateur connecté, pour affichage sur le site (cloche de notifications).",
    responses={200: {"description": "Liste des notifications"}, 401: {"description": "Non authentifié"}},
)
def my_notifications(
    non_lues: bool = False,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return list_notifications_for_user(db, user["id"], non_lues_seulement=non_lues)


@router.patch(
    "/{notification_id}/read",
    summary="Marquer une notification comme lue",
    responses={
        200: {"description": "Notification marquée comme lue"},
        401: {"description": "Non authentifié"},
        404: {"description": "Notification introuvable"},
    },
)
def read_notification(notification_id: int, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    result = mark_notification_read(db, notification_id, user["id"])
    if not result:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return result


@router.post(
    "/email",
    summary="Envoyer une notification e-mail",
    description="Créer et tenter d'envoyer une notification par e-mail (réellement envoyée si SENDGRID_API_KEY est configurée).",
    responses={200: {"description": "Notification créée"}, 401: {"description": "Non authentifié"}},
)
def send_email(to: str, subject: str, body: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return create_notification(db, user["id"], "EMAIL", to, body, subject)


@router.post(
    "/sms",
    summary="Envoyer une notification SMS",
    description="Créer et tenter d'envoyer une notification par SMS (réellement envoyée si les identifiants Twilio sont configurés).",
    responses={200: {"description": "Notification créée"}, 401: {"description": "Non authentifié"}},
)
def send_sms(to: str, message: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return create_notification(db, user["id"], "SMS", to, message)