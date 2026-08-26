"""Régression contrat Stagiaire 3 → Stagiaire 4 : artefacts de fiabilité
consommés par l'Agent IA de Matching (spec §5.5 et doc docs/reliability_score.md).

Vérifie la *forme* de l'artefact (stabilité du contrat v1) : score borné,
composantes présentes, badges, et le profil public utilisé par les pages.

Lancement : python tests/test_spec3_new.py [BASE_URL]
"""
from helpers import check, client, login_admin, login_user, run, test


@test("contrat §5.5 : endpoint interne trust-score (forme v1)")
def t_internal_contract():
    token = login_admin()
    with client() as c:
        r = c.get("/api/admin/enterprises", params={"limit": 1}, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        entreprise_id = r.json()["entreprises"][0]["id"]

        r = c.get(f"/internal/entreprises/{entreprise_id}/trust-score")
        r.raise_for_status()
        body = r.json()

        check(isinstance(body.get("score"), (int, float)), "score manquant")
        check(0 <= body["score"] <= 100, f"score hors bornes [0,100] : {body['score']}")
        check(body.get("computed_at"), "computed_at manquant (ISO 8601 attendu)")

        comp = body.get("components", {})
        for key in ("kyb_verified", "avg_review_score", "review_count", "response_rate", "account_age_months", "flags_penalty"):
            check(key in comp, f"composante {key} absente")

        check(isinstance(body.get("badges"), list), "badges doit être une liste de chaînes")
        check(all(isinstance(b, str) for b in body["badges"]), "badges internes doivent être des chaînes")


@test("contrat §5.5 : 404 entreprise inconnue")
def t_internal_404():
    with client() as c:
        r = c.get("/internal/entreprises/00000000-0000-0000-0000-000000000000/trust-score")
        check(r.status_code == 404, f"entreprise inconnue attendue 404, reçue {r.status_code}")


@test("contrat : profil public (pages listing/matching)")
def t_public_contract():
    token = login_admin()
    with client() as c:
        r = c.get("/api/admin/users", params={"limit": 100}, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        owner = next((u for u in r.json()["users"] if u.get("companyName")), None)
        check(owner is not None, "aucun utilisateur avec entreprise trouvé")

        r = c.get(f"/api/accounts/{owner['id']}")
        r.raise_for_status()
        acc = r.json()
        for field in ("companyName", "country", "sector", "certifications", "badges", "trustScore", "averageRating", "reviewCount", "reviews", "profileStatus"):
            check(field in acc, f"champ public {field} manquant")
        check(isinstance(acc["certifications"], list), "certifications doit être une liste")
        check(isinstance(acc["reviews"], list), "reviews doit être une liste")


@test("contrat : matching-results (structure du match)")
def t_matching_contract():
    token = login_user()
    with client() as c:
        r = c.get("/api/matching-results", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        results = r.json()
        check(isinstance(results, list), "matching-results doit être une liste")
        for m in results:
            check(m.get("matchScore") is not None, "matchScore manquant")
            check(isinstance(m.get("reasons"), dict), "reasons doit être un objet")
            check("ownerId" in m.get("counterpart", {}), "counterpart.ownerId manquant (profil public)")
            if m.get("matchScore") is not None:
                check(0 <= m["matchScore"] <= 100, "matchScore hors bornes")


if __name__ == "__main__":
    raise SystemExit(run())
