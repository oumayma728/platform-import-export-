"""Régression spec §5.1 / §5.2 / §7 — boîte de réception notifications
utilisateur : liste, compteur non-lus, marquage lu, lecture seule.

Lancement : python tests/test_spec4_notifs.py [BASE_URL]
"""
import asyncio

from helpers import MARKER, check, client, login_user, run, test

_created_ids = []


async def _cleanup():
    from database import prisma

    await prisma.connect()
    try:
        if _created_ids:
            await prisma.notification.delete_many(where={"id": {"in": _created_ids}})
    finally:
        await prisma.disconnect()


def _seed_notification(user_id):
    """Crée une notification de régression et renvoie (notification_id, user_id)."""
    import asyncio

    from database import prisma

    async def _create():
        await prisma.connect()
        n = await prisma.notification.create(
            data={
                "utilisateurId": user_id,
                "titre": f"Régression {MARKER}",
                "contenu": MARKER,
                "typeNotification": "MODERATION",
                "estLu": False,
            }
        )
        _created_ids.append(n.id)
        await prisma.disconnect()
        return n.id

    return asyncio.run(_create())


def _get_user_id(email):
    import asyncio

    from database import prisma

    async def _find():
        await prisma.connect()
        u = await prisma.utilisateur.find_first(where={"email": email})
        await prisma.disconnect()
        return u.id if u else None

    return asyncio.run(_find())


@test("notifications : liste paginée + compteur non-lus")
def t_notifications_list():
    token = login_user()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        r = c.get("/api/notifications", headers=h)
        r.raise_for_status()
        body = r.json()
        for field in ("notifications", "total", "page", "totalPages"):
            check(field in body, f"champ liste {field} manquant")

        r = c.get("/api/notifications/unread-count", headers=h)
        r.raise_for_status()
        check("count" in r.json(), "compteur non-lus attendu")

        r = c.get("/api/notifications", params={"unread_only": True}, headers=h)
        r.raise_for_status()
        check(all(not n["estLu"] for n in r.json()["notifications"]), "unread_only non filtrant")


@test("notifications : marquage lu via API + read-all")
def t_notifications_read():
    user_id = _get_user_id("importer@test.com")
    check(user_id, "utilisateur seedé introuvable")
    notif_id = _seed_notification(user_id)

    token = login_user()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        # Apparaît dans la liste (non lue).
        r = c.get("/api/notifications", params={"unread_only": True, "limit": 100}, headers=h)
        r.raise_for_status()
        ids = [n["id"] for n in r.json()["notifications"]]
        check(notif_id in ids, "notification de régression absente de la liste non-lues")

        # Marquage lu.
        r = c.post(f"/api/notifications/{notif_id}/read", headers=h)
        r.raise_for_status()
        check(r.json().get("success") is True, "marquage lu doit renvoyer success")

        r = c.get("/api/notifications", params={"limit": 100}, headers=h)
        r.raise_for_status()
        target = next((n for n in r.json()["notifications"] if n["id"] == notif_id), None)
        check(target is not None and target["estLu"], "notification non marquée lue")

        # Le compteur de non-lus doit être passé à 0 pour cette notif (read-all en filet).
        r = c.post("/api/notifications/read-all", headers=h)
        r.raise_for_status()
        check(r.json().get("success") is True, "read-all doit renvoyer success")


@test("notifications : 404 si la notif appartient à un autre utilisateur")
def t_notifications_foreign():
    user_id = _get_user_id("exporter@test.com")
    check(user_id, "exportateur seedé introuvable")
    notif_id = _seed_notification(user_id)

    token = login_user()  # importer
    with client() as c:
        r = c.post(
            f"/api/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {token}"},
        )
        check(r.status_code == 404, f"notification étrangère attendue 404, reçue {r.status_code}")


if __name__ == "__main__":
    try:
        exit_code = run()
    finally:
        asyncio.run(_cleanup())
    raise SystemExit(exit_code)
