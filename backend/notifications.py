"""
Notifications de modération (spec §5.1 / §5.2).

Chaque décision de modération (validation, rejet, suspension, réactivation)
crée une ligne `Notification` et tente l'envoi email via le service SMTP
partagé (`emailer.py`). Si SMTP n'est pas configuré, la ligne est conservée
en statut "failed" pour un ré-envoi ultérieur.
"""
from datetime import datetime, timezone

from database import prisma
from emailer import send_email


async def notify_user(user_id: str, titre: str, contenu: str, email_html: str | None = None) -> dict | None:
    """Crée une notification et tente l'envoi d'email. Retourne la notification ou None."""
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        return None

    html = email_html or f"""
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #14161C;">{titre}</h2>
          <p style="color: #6B6D76; line-height: 1.7;">{contenu}</p>
        </div>
        """

    notif = await prisma.notification.create(
        data={
            "utilisateurId": user_id,
            "titre": titre,
            "contenu": contenu,
            "typeNotification": "EMAIL",
            "statut": "pending",
            "emailDestinataire": user.email,
        }
    )

    ok = send_email(user.email, titre, html)
    await prisma.notification.update(
        where={"id": notif.id},
        data={
            "statut": "sent" if ok else "failed",
            "dateEnvoi": datetime.now(timezone.utc) if ok else None,
            "tentativesEnvoi": 1,
        },
    )
    return notif
