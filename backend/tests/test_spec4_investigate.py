"""Régression spec §5.2 / §6 — signalements et investigation admin :
création d'un signalement par l'utilisateur, listing/traitement admin,
lecture de la conversation cible, historique de modération.

Lancement : python tests/test_spec4_investigate.py [BASE_URL]
"""
import asyncio

from helpers import MARKER, check, client, login_admin, login_user, run, test

_created_report_id = None


async def _cleanup():
    from database import prisma

    await prisma.connect()
    try:
        if _created_report_id:
            await prisma.report.delete_many(where={"id": _created_report_id})
    finally:
        await prisma.disconnect()


def _first_conversation(token):
    """Renvoie une conversation réelle de l'utilisateur courant."""
    with client() as c:
        r = c.get("/api/conversations", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        convs = r.json()
        assert convs, "aucune conversation pour l'utilisateur seedé"
        return convs[0]


@test("signalement : création par l'utilisateur puis liste admin")
def t_report_create_and_list():
    global _created_report_id
    user_token = login_user()
    conversation = _first_conversation(user_token)
    conversation_id = conversation["id"]

    with client() as c:
        # 1. Création par l'utilisateur (cible = conversation).
        r = c.post(
            "/api/reports",
            json={
                "conversationId": conversation_id,
                "cibleType": "CONVERSATION",
                "type": "fraude",
                "motif": MARKER,
            },
            headers={"Authorization": f"Bearer {user_token}"},
        )
        r.raise_for_status()
        _created_report_id = r.json()["id"]
        check(r.json()["statut"] == "pending", "signalement créé hors statut pending")

        # 2. Visible côté admin.
        admin_token = login_admin()
        h = {"Authorization": f"Bearer {admin_token}"}
        r = c.get("/api/admin/reports", params={"limit": 100}, headers=h)
        r.raise_for_status()
        body = r.json()
        check("reports" in body and "total" in body, "structure {reports,total} attendue")
        report = next((rp for rp in body["reports"] if rp["id"] == _created_report_id), None)
        check(report is not None, "signalement créé absent de la liste admin")
        check(report["motif"] == MARKER, "motif non conservé")
        check(report["conversation"]["id"] == conversation_id, "lien conversation absent")

        # 3. Filtre par statut.
        r = c.get("/api/admin/reports", params={"statut": "pending"}, headers=h)
        r.raise_for_status()
        check(any(rp["id"] == _created_report_id for rp in r.json()["reports"]), "filtre statut pending")


@test("signalement : traitement admin (dismiss) + historique")
def t_report_treat_and_history():
    global _created_report_id
    if not _created_report_id:
        user_token = login_user()
        conversation = _first_conversation(user_token)
        with client() as c:
            r = c.post(
                "/api/reports",
                json={
                    "conversationId": conversation["id"],
                    "cibleType": "CONVERSATION",
                    "type": "fraude",
                    "motif": MARKER,
                },
                headers={"Authorization": f"Bearer {user_token}"},
            )
            r.raise_for_status()
            _created_report_id = r.json()["id"]

    admin_token = login_admin()
    h = {"Authorization": f"Bearer {admin_token}"}
    with client() as c:
        # 1. Traitement "dismiss" -> statut rejected.
        r = c.post(
            f"/api/admin/reports/{_created_report_id}/treat",
            json={"action": "dismiss", "motif": MARKER},
            headers=h,
        )
        r.raise_for_status()
        check(r.json().get("success") is True, "traitement doit renvoyer success")

        r = c.get("/api/admin/reports", params={"limit": 100}, headers=h)
        r.raise_for_status()
        report = next((rp for rp in r.json()["reports"] if rp["id"] == _created_report_id), None)
        check(report is not None and report["statut"] == "rejected", "statut rejeté attendu après dismiss")

        # 2. L'action est journalisée dans l'historique de modération.
        r = c.get("/api/admin/moderation-history", params={"limit": 200}, headers=h)
        r.raise_for_status()
        body = r.json()
        check("actions" in body and "total" in body, "structure {actions,total} attendue")
        check(
            any(a.get("metadata", {}).get("reportId") == _created_report_id for a in body["actions"]),
            "action de traitement absente de l'historique",
        )

        # 3. Un utilisateur normal ne peut pas traiter un signalement.
        user_token = login_user()
        r = c.post(
            f"/api/admin/reports/{_created_report_id}/treat",
            json={"action": "dismiss"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        check(r.status_code in (401, 403), f"admin requis, reçu {r.status_code}")


@test("investigation : lecture conversation cible (admin) + 404 + accès refusé")
def t_investigation():
    user_token = login_user()
    conversation = _first_conversation(user_token)
    conversation_id = conversation["id"]

    admin_token = login_admin()
    h = {"Authorization": f"Bearer {admin_token}"}
    with client() as c:
        # 1. Lecture autorisée pour l'admin : structure attendue.
        r = c.get(f"/api/admin/conversations/{conversation_id}", headers=h)
        r.raise_for_status()
        body = r.json()
        for field in ("id", "statut", "participants", "messages", "nombreMessages", "annonce", "createdAt"):
            check(field in body, f"champ investigation {field} manquant")
        check(len(body["participants"]) == 2, "deux participants attendus")
        check(body["id"] == conversation_id, "conversation incohérente")

        # 2. Conversation inexistante -> 404.
        r = c.get("/api/admin/conversations/00000000-0000-0000-0000-000000000000", headers=h)
        check(r.status_code == 404, f"conversation inconnue attendue 404, reçue {r.status_code}")

        # 3. Un utilisateur normal n'a pas accès à l'investigation.
        r = c.get(
            f"/api/admin/conversations/{conversation_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        check(r.status_code in (401, 403), f"admin requis, reçu {r.status_code}")


if __name__ == "__main__":
    try:
        exit_code = run()
    finally:
        asyncio.run(_cleanup())
    raise SystemExit(exit_code)
