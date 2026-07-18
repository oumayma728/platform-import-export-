from sqlalchemy.orm import Session
from app.models.notification import NotificationLog

def log_notification(db: Session, canal: str, destinataire: str, contenu: str, sujet: str | None = None):
    row = NotificationLog(
        canal=canal,
        destinataire=destinataire,
        sujet=sujet,
        contenu=contenu,
        statut="EN_ATTENTE"
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "statut": row.statut}