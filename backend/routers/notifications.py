"""
Notifications utilisateur (spec §5.1 / §5.2 / §7).

Les décisions de modération créent des lignes `Notification` (via
`notifications.notify_user`). Ce router expose la boîte de réception côté
utilisateur : lecture, marquage lu/non-lu, compteur de non-lus.

Le canal de diffusion (email SMTP) reste le service partagé `emailer.py` ;
ici on ne lit que la table, jamais on n'envoie.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from database import prisma
from deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    user=Depends(get_current_user),
):
    where: dict = {"utilisateurId": user.id}
    if unread_only:
        where["estLu"] = False

    total = await prisma.notification.count(where=where)
    notifications = await prisma.notification.find_many(
        where=where,
        order=[{"estLu": "asc"}, {"createdAt": "desc"}],
        skip=(page - 1) * limit,
        take=limit,
    )

    return {
        "notifications": [
            {
                "id": n.id,
                "titre": n.titre,
                "contenu": n.contenu,
                "typeNotification": n.typeNotification,
                "statut": n.statut,
                "estLu": n.estLu,
                "dateEnvoi": n.dateEnvoi.isoformat() if n.dateEnvoi else None,
                "dateLecture": n.dateLecture.isoformat() if n.dateLecture else None,
                "createdAt": n.createdAt.isoformat() if n.createdAt else None,
            }
            for n in notifications
        ],
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


@router.get("/unread-count")
async def unread_notifications_count(user=Depends(get_current_user)):
    count = await prisma.notification.count(where={"utilisateurId": user.id, "estLu": False})
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user=Depends(get_current_user)):
    notification = await prisma.notification.find_unique(where={"id": notification_id})
    if not notification or notification.utilisateurId != user.id:
        raise HTTPException(status_code=404, detail="Notification introuvable")

    if not notification.estLu:
        await prisma.notification.update(
            where={"id": notification_id},
            data={"estLu": True, "dateLecture": datetime.now(timezone.utc)},
        )
    return {"success": True}


@router.post("/read-all")
async def mark_all_notifications_read(user=Depends(get_current_user)):
    await prisma.notification.update_many(
        where={"utilisateurId": user.id, "estLu": False},
        data={"estLu": True},
    )
    return {"success": True}
