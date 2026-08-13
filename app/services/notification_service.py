import logging
import os
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.models.notification import NotificationLog
from app.services.email_service import send_email
from app.services.sms_service import send_sms
from datetime import datetime, timedelta

logger = logging.getLogger("import_export_api")


def create_notification(
    db: Session,
    user_id: int | None,
    canal: str,
    destinataire: str,
    contenu: str,
    sujet: str | None = None,
):
    """
    Crée une notification dans la base de données et tente de l'envoyer via le canal spécifié.
    
    Args:
        db: Session SQLAlchemy
        user_id: ID de l'utilisateur (optionnel)
        canal: Type de canal ("EMAIL", "SMS", "IN_APP")
        destinataire: Adresse email ou numéro de téléphone
        contenu: Contenu du message
        sujet: Sujet (optionnel, principalement pour les emails)
    
    Returns:
        dict avec les informations de la notification créée
    """
    try:
        # Créer l'enregistrement de notification dans la base de données
        notification = NotificationLog(
            user_id=user_id,
            canal=canal,
            destinataire=destinataire,
            sujet=sujet,
            contenu=contenu,
            statut="EN_ATTENTE",
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Tenter d'envoyer la notification via le canal approprié
        try:
            if canal == "EMAIL":
                _send_email_notification(destinataire, sujet or "Notification", contenu)
                notification.statut = "ENVOYEE"
            elif canal == "SMS":
                _send_sms_notification(destinataire, contenu)
                notification.statut = "ENVOYEE"
            elif canal == "IN_APP":
                notification.statut = "ENVOYEE"
            
            db.commit()
            logger.info(f"Notification {canal} envoyée avec succès à {destinataire}")
        except Exception as e:
            # Si l'envoi échoue, marquer comme échoué mais ne pas lever d'exception
            notification.statut = "ECHEC"
            db.commit()
            logger.warning(f"Erreur lors de l'envoi de la notification {canal} à {destinataire}: {str(e)}")

        return {
            "id": notification.id,
            "statut": notification.statut,
            "canal": notification.canal,
            "destinataire": notification.destinataire,
        }

    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Erreur lors de l'enregistrement de la notification.")
        raise HTTPException(
            status_code=500,
            detail="Impossible d'enregistrer la notification."
        )


def list_notifications_for_user(
    db: Session,
    user_id: int,
    non_lues_seulement: bool = False,
):
    """
    Récupère les notifications d'un utilisateur.
    
    Args:
        db: Session SQLAlchemy
        user_id: ID de l'utilisateur
        non_lues_seulement: Si True, retourner uniquement les notifications non lues
    
    Returns:
        Liste des notifications au format dict
    """
    try:
        query = db.query(NotificationLog).filter(NotificationLog.user_id == user_id)
        
        # Filtrer par statut si demandé
        if non_lues_seulement:
            query = query.filter(NotificationLog.lu == False)
        
        # Trier par date décroissante (les plus récentes en premier)
        notifications = query.order_by(NotificationLog.created_at.desc()).all()
        
        return [
            {
                "id": n.id,
                "canal": n.canal,
                "destinataire": n.destinataire,
                "sujet": n.sujet,
                "contenu": n.contenu,
                "statut": n.statut,
                "lu": n.lu,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ]
    except SQLAlchemyError as e:
        logger.exception("Erreur lors de la récupération des notifications.")
        raise HTTPException(
            status_code=500,
            detail="Impossible de récupérer les notifications."
        )


def mark_notification_read(db, notification_id, user_id):
    try:
        notification = db.query(NotificationLog).filter(
            NotificationLog.id == notification_id,
            NotificationLog.user_id == user_id,
        ).first()

        if not notification:
            return None

        notification.lu = True
        db.commit()
        db.refresh(notification)

        return {
            "id": notification.id,
            "canal": notification.canal,
            "destinataire": notification.destinataire,
            "sujet": notification.sujet,
            "contenu": notification.contenu,
            "statut": notification.statut,
            "lu": notification.lu,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Erreur lors de la mise à jour de la notification.")

        raise HTTPException(
            status_code=500,
            detail="Impossible de mettre à jour la notification."
        )


def _send_email_notification(to_email: str, subject: str, content: str):
    
    result = send_email(to_email, subject, content)
    
    if result.get("error"):
        raise Exception(f"Erreur d'envoi email: {result.get('error')}")
    
    logger.info(f"Email envoyé avec succès à {to_email}")


def _send_sms_notification(to_phone: str, message: str):
    """
    Envoie une notification par SMS via Twilio.
    
    Args:
        to_phone: Numéro de téléphone destinataire
        message: Contenu du SMS
    
    Raises:
        Exception si l'envoi échoue
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        logger.warning("Twilio n'est pas configuré. SMS non envoyé.")
        raise Exception("Twilio n'est pas configuré")
    
    result = send_sms(to_phone, message)
    
    if result.get("error"):
        raise Exception(f"Erreur Twilio: {result.get('error')}")
    
    logger.info(f"SMS envoyé avec succès à {to_phone}")


# Compatibilité avec l'ancien code
def log_notification(
    db: Session,
    canal: str,
    destinataire: str,
    contenu: str,
    sujet: str | None = None,
    user_id: int | None = None,
):
    """Alias pour create_notification pour la compatibilité avec le code existant."""
    return create_notification(
        db=db,
        user_id=user_id,
        canal=canal,
        destinataire=destinataire,
        contenu=contenu,
        sujet=sujet,
    )

MAX_TENTATIVES = 3
DELAI_ENTRE_TENTATIVES = timedelta(minutes=5)


def retry_failed_notifications(db: Session) -> dict:
    """
    Parcourt les notifications en ÉCHEC et retente l'envoi
    (max MAX_TENTATIVES essais, avec un délai minimum entre 2 tentatives).
    À appeler périodiquement (scheduler) ou via l'endpoint /notifications/retry-failed.
    """
    maintenant = datetime.utcnow()
    a_retenter = (
        db.query(NotificationLog)
        .filter(NotificationLog.statut == "ECHEC")
        .filter(NotificationLog.tentatives < MAX_TENTATIVES)
        .all()
    )

    resultats = {"retentees": 0, "reussies": 0, "definitivement_echouees": 0}

    for notif in a_retenter:
        if notif.derniere_tentative and (maintenant - notif.derniere_tentative) < DELAI_ENTRE_TENTATIVES:
            continue  # trop tôt pour retenter

        resultats["retentees"] += 1
        notif.tentatives += 1
        notif.derniere_tentative = maintenant

        try:
            if notif.canal == "EMAIL":
                _send_email_notification(notif.destinataire, notif.sujet or "Notification", notif.contenu)
            elif notif.canal == "SMS":
                _send_sms_notification(notif.destinataire, notif.contenu)

            notif.statut = "ENVOYEE"
            resultats["reussies"] += 1
            logger.info(f"Retry réussi pour la notification {notif.id} ({notif.canal})")
        except Exception as e:
            if notif.tentatives >= MAX_TENTATIVES:
                notif.statut = "ECHEC_DEFINITIF"
                resultats["definitivement_echouees"] += 1
            logger.warning(f"Retry {notif.tentatives}/{MAX_TENTATIVES} échoué pour {notif.id}: {e}")

        db.commit()

    return resultats