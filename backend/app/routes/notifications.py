from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.auth_middleware import get_db, get_current_user
from app.models.models import User, NotificationLog

router = APIRouter()

@router.get("/")
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer les notifications / emails envoyés à l'utilisateur courant.
    """
    logs = db.query(NotificationLog).filter(NotificationLog.user_id == current_user.id).order_by(NotificationLog.created_at.desc()).all()
    
    # Format the response
    return [
        {
            "id": log.id,
            "type": log.type,
            "target": log.target,
            "status": log.status,
            "error_message": log.error_message,
            "created_at": log.created_at
        }
        for log in logs
    ]
