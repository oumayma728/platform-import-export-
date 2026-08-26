"""Régression spec §5 (Trust & Safety) — dashboard, filtres, KYB checklist,
avis, badges, score de fiabilité.

Lancement : python tests/test_spec4_trust.py [BASE_URL]
Nécessite un backend démarré (uvicorn) et le seed exécuté
(admin@platform.com / importer@test.com).
"""
import asyncio

from helpers import (
    MARKER,
    USER_EMAIL,
    check,
    client,
    login_admin,
    login_user,
    run,
    test,
)

EXPECTED_CHECKLIST = {
    "siret",
    "registre_commerce",
    "consulaire",
    "piece_identite",
    "siege_social",
    "tva",
    "certifications",
    "beneficiaires",
}


# ── Cleanup direct base (lignes de régression) ────────────────────────────

async def _cleanup():
    from database import prisma

    await prisma.connect()
    try:
        # Avis de régression (commentaire marqué).
        await prisma.review.delete_many(where={"commentaire": {"contains": MARKER}})
        # Vérifications KYB de régression : retour à l'état pending.
        await prisma.kybverification.update_many(
            where={"commentaire": {"contains": MARKER}},
            data={"statut": "pending", "score": None, "checklist": "[]", "commentaire": None},
        )
    finally:
        await prisma.disconnect()


# ── Tests ────────────────────────────────────────────────────────────────

@test("auth admin : login + /auth/me + token superadmin")
def t_admin_auth():
    token = login_admin()
    with client() as c:
        r = c.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {token}"})
        check(r.status_code == 200, f"GET /auth/me -> {r.status_code}")
        body = r.json()
        check(body.get("role") == "superadmin", f"role attendu superadmin, reçu {body.get('role')}")


@test("dashboard : 9 métriques présentes")
def t_dashboard():
    token = login_admin()
    with client() as c:
        r = c.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        for field in (
            "totalUsers",
            "pendingValidation",
            "validated",
            "rejected",
            "suspended",
            "totalEntreprises",
            "totalAnnonces",
            "totalReports",
            "pendingReports",
        ):
            check(field in r.json(), f"champ dashboard {field} manquant")


@test("entreprises : liste paginée + filtres statut/date")
def t_entreprises_filters():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        r = c.get("/api/admin/enterprises", params={"limit": 5}, headers=h)
        r.raise_for_status()
        body = r.json()
        check("entreprises" in body and "total" in body, "structure {entreprises,total} attendue")
        check(body["total"] >= 1, "au moins une entreprise attendue")
        check(len(body["entreprises"]) == min(5, body["total"]), "pagination limit=5")

        # Filtre date : plage dans le passé lointain doit renvoyer 0.
        r = c.get(
            "/api/admin/enterprises",
            params={
                "dateDebut": "2000-01-01T00:00:00",
                "dateFin": "2000-12-31T23:59:59",
            },
            headers=h,
        )
        r.raise_for_status()
        check(r.json()["total"] == 0, f"date 2000 attendue à 0, reçue {r.json()['total']}")

        # Filtre date : plage couvrant le seed doit renvoyer >= 1.
        r = c.get(
            "/api/admin/enterprises",
            params={
                "dateDebut": "2020-01-01T00:00:00",
                "dateFin": "2026-12-31T23:59:59",
            },
            headers=h,
        )
        r.raise_for_status()
        check(r.json()["total"] >= 1, "seed attendu dans la plage 2020-2026")


@test("utilisateurs : liste + filtre date")
def t_users_filters():
    token = login_admin()
    with client() as c:
        r = c.get(
            "/api/admin/users",
            params={"limit": 5, "dateDebut": "2020-01-01T00:00:00", "dateFin": "2026-12-31T23:59:59"},
            headers={"Authorization": f"Bearer {token}"},
        )
        r.raise_for_status()
        body = r.json()
        check("users" in body and "total" in body, "structure {users,total} attendue")
        check(body["total"] >= 1, "au moins un utilisateur attendu")


@test("KYB : checklist (8 critères) + score dérivé + rejet code inconnu")
def t_kyb_checklist():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        # 1. Liste des critères.
        r = c.get("/api/admin/kyb/checklist", headers=h)
        r.raise_for_status()
        codes = {item["code"] for item in r.json()}
        check(codes == EXPECTED_CHECKLIST, f"critères attendus manquants : {EXPECTED_CHECKLIST - codes}")

        # 2. Création d'une vérification de régression sur une entreprise.
        r = c.get("/api/admin/enterprises", params={"limit": 1}, headers=h)
        r.raise_for_status()
        entreprise_id = r.json()["entreprises"][0]["id"]
        r = c.post("/api/admin/kyb", json={"entrepriseId": entreprise_id}, headers=h)
        r.raise_for_status()
        created_kyb_id = r.json()["id"]

        # 3. Revue avec 6/8 critères validés -> score 75.
        selected = ["siret", "registre_commerce", "consulaire", "piece_identite", "siege_social", "tva"]
        r = c.post(
            f"/api/admin/kyb/{created_kyb_id}/review",
            json={"statut": "verified", "commentaire": MARKER, "checklist": selected},
            headers=h,
        )
        r.raise_for_status()
        check(r.json().get("success") is True, "review KYB doit renvoyer success")

        # 4. La vérification porte bien le score dérivé + la checklist.
        r = c.get("/api/admin/kyb", headers=h)
        r.raise_for_status()
        kyb = next((k for k in r.json() if k["id"] == created_kyb_id), None)
        check(kyb is not None, "vérification créée introuvable dans GET /kyb")
        check(kyb["score"] == 75, f"score dérivé attendu 75, reçu {kyb.get('score')}")
        check(set(kyb["checklist"]) == set(selected), "checklist stockée non conforme")

        # 5. Code inconnu -> 400.
        r = c.post(
            f"/api/admin/kyb/{created_kyb_id}/review",
            json={"statut": "verified", "checklist": ["siret", "faux_critere"]},
            headers=h,
        )
        check(r.status_code == 400, f"code inconnu attendu 400, reçu {r.status_code}")


@test("avis : création post-conclue, gardes anti-abus, flag reviewed, cleanup")
def t_reviews():
    token = login_user(USER_EMAIL)
    h = {"Authorization": f"Bearer {token}"}

    with client() as c:
        # 1. Récupérer une conversation conclue non encore notée.
        r = c.get("/api/conversations", headers=h)
        r.raise_for_status()
        convs = r.json()
        concluded = [
            cv
            for cv in convs
            if cv["status"] in ("conclue", "concluded")
            and not cv["reviewed"]
            and cv["counterpart"].get("entrepriseId")
        ]
        non_concluded = [cv for cv in convs if cv["status"] not in ("conclue", "concluded")]
        check(len(concluded) >= 1, "aucune conversation conclue non notée disponible")
        target = concluded[0]
        ent_id = target["counterpart"]["entrepriseId"]

        # 2. Création d'un avis (note entre 1 et 5).
        r = c.post(
            "/api/reviews",
            json={
                "entrepriseId": ent_id,
                "conversationId": target["id"],
                "note": 4,
                "commentaire": MARKER,
            },
            headers=h,
        )
        r.raise_for_status()
        check(r.json()["note"] == 4, "note renvoyée incorrecte")

        # 3. reviewed passe à True après l'avis.
        r = c.get("/api/conversations", headers=h)
        r.raise_for_status()
        updated = next(cv for cv in r.json() if cv["id"] == target["id"])
        check(updated["reviewed"] is True, "flag reviewed non remonté")

        # 4. Doublon -> 400.
        r = c.post(
            "/api/reviews",
            json={"entrepriseId": ent_id, "conversationId": target["id"], "note": 5},
            headers=h,
        )
        check(r.status_code == 400, f"doublon attendu 400, reçu {r.status_code}")

        # 5. Avis sur conversation non conclue -> 400.
        if non_concluded:
            r = c.post(
                "/api/reviews",
                json={
                    "entrepriseId": ent_id,
                    "conversationId": non_concluded[0]["id"],
                    "note": 5,
                },
                headers=h,
            )
            check(r.status_code == 400, f"conversation non conclue attendue 400, reçu {r.status_code}")

        # 6. Note hors bornes -> 400.
        r = c.post(
            "/api/reviews",
            json={"entrepriseId": ent_id, "conversationId": target["id"], "note": 6},
            headers=h,
        )
        check(r.status_code == 400, f"note 6 attendue 400, reçu {r.status_code}")


@test("profil public : trustScore, note moyenne, avis, badges")
def t_public_account():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        # Un utilisateur rattaché à une entreprise (id exposé par /admin/users).
        r = c.get("/api/admin/users", params={"limit": 100}, headers=h)
        r.raise_for_status()
        users = r.json()["users"]
        owner = next((u for u in users if u.get("companyName")), None)
        check(owner is not None, "aucun utilisateur rattaché à une entreprise trouvé")

        r = c.get(f"/api/accounts/{owner['id']}")
        r.raise_for_status()
        acc = r.json()
        for field in ("trustScore", "averageRating", "reviewCount", "reviews", "badges"):
            check(field in acc, f"champ public {field} manquant")
        check(isinstance(acc["reviews"], list), "reviews doit être une liste")
        check(isinstance(acc["badges"], list), "badges doit être une liste")
        check(acc["companyName"] == owner["companyName"], "companyName incohérente")
        for badge in acc["badges"]:
            check(
                isinstance(badge, dict) and "type" in badge,
                f"badge public invalide (objet {{type, description}} attendu) : {badge!r}",
            )


@test("badges : définitions + badges actifs")
def t_badges():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        r = c.get("/api/admin/badges/definitions", headers=h)
        r.raise_for_status()
        check(isinstance(r.json(), list) and len(r.json()) >= 1, "au moins une définition attendue")

        r = c.get("/api/admin/badges", headers=h)
        r.raise_for_status()
        check(isinstance(r.json(), list), "badges actifs attendus sous forme de liste")


@test("score de fiabilité : recalcul d'une entreprise + recompute-all")
def t_trust_score():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        r = c.get("/api/admin/enterprises", params={"limit": 1}, headers=h)
        r.raise_for_status()
        entreprise_id = r.json()["entreprises"][0]["id"]

        r = c.get(f"/api/admin/reliability-score/{entreprise_id}", headers=h)
        r.raise_for_status()
        details = r.json()
        for field in ("score", "computed_at", "components", "badges"):
            check(field in details, f"champ trust {field} manquant")
        check(0 <= details["score"] <= 100, f"score hors bornes : {details['score']}")
        check("kyb_verified" in details["components"], "composante kyb_verified absente")

        r = c.post("/api/admin/trust/recompute-all", headers=h)
        r.raise_for_status()
        check(r.json().get("success") is True, "recompute-all doit renvoyer success")
        check(r.json().get("updated", 0) >= 1, "recompute-all doit mettre à jour >= 1 entreprise")


@test("endpoint interne §5.5 : score consommé par le matcher")
def t_internal_endpoint():
    token = login_admin()
    h = {"Authorization": f"Bearer {token}"}
    with client() as c:
        r = c.get("/api/admin/enterprises", params={"limit": 1}, headers=h)
        r.raise_for_status()
        entreprise_id = r.json()["entreprises"][0]["id"]

        r = c.get(f"/internal/entreprises/{entreprise_id}/trust-score")
        r.raise_for_status()
        body = r.json()
        check("score" in body and "badges" in body, "contrat interne (score+badges) attendu")


if __name__ == "__main__":
    try:
        exit_code = run()
    finally:
        asyncio.run(_cleanup())
    raise SystemExit(exit_code)
