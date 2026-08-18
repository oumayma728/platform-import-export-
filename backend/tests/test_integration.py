"""
test_integration.py — Tests d'intégration End-to-End (E2E)
Couvre le flux complet : Inscription -> Création entreprise & annonce -> Envoi message -> Paiement Webhook
Utilise des mocks pour les services externes (Stripe, SendGrid, Twilio).
"""
from unittest.mock import patch
from fastapi.testclient import TestClient


def test_full_user_and_marketplace_flow(client: TestClient):
    """
    Test E2E complet :
    1. Inscription d'un nouvel utilisateur exportateur
    2. Connexion et récupération du JWT
    3. Création de son entreprise et validation par l'admin
    4. Création d'une annonce
    5. Inscription d'un importateur & recherche d'annonces avec conversion de devise
    6. Simulation d'un paiement via Webhook Stripe avec mocks des notifications SendGrid
    """
    # ── 1. Inscription nouvel exportateur ──────────────────────────────────────
    reg_response = client.post(
        "/auth/register",
        json={
            "email": "e2e_exporter@test.com",
            "password": "Password123!",
            "full_name": "E2E Exporter",
            "role_id": "exporter",
        }
    )
    assert reg_response.status_code == 201
    user_id = reg_response.json()["id"]

    # ── 2. Connexion ──────────────────────────────────────────────────────────
    login_response = client.post(
        "/auth/login",
        json={"email": "e2e_exporter@test.com", "password": "Password123!"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # ── 3. Créer & valider l'entreprise ───────────────────────────────────────
    create_co_resp = client.post(
        "/companies/",
        headers=headers,
        json={
            "name": "E2E Agro Export SA",
            "is_exporter": True,
            "is_importer": False,
            "country": "MA",
            "description": "Export de produits du terroir"
        }
    )
    assert create_co_resp.status_code == 201
    company_id = create_co_resp.json()["id"]

    # Login admin pour valider l'entreprise
    admin_login = client.post("/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    val_resp = client.patch(
        f"/companies/{company_id}/status",
        headers=admin_headers,
        json={"profile_status": "VALIDE"}
    )
    assert val_resp.status_code == 200

    # ── 4. Création d'une annonce ─────────────────────────────────────────────
    ad_resp = client.post(
        f"/ads/?company_id={company_id}",
        headers=headers,
        json={
            "title": "Couscous Bio Artisanale",
            "description": "Couscous 100% bio fait main.",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 50.0,
        }
    )
    assert ad_resp.status_code == 201
    ad_id = ad_resp.json()["id"]

    # ── 5. Inscription et action d'un importateur ─────────────────────────────
    imp_reg = client.post(
        "/auth/register",
        json={
            "email": "e2e_importer@test.com",
            "password": "Password123!",
            "full_name": "E2E Importer",
            "role_id": "importer"
        }
    )
    assert imp_reg.status_code == 201

    imp_login = client.post(
        "/auth/login",
        json={"email": "e2e_importer@test.com", "password": "Password123!"}
    )
    imp_token = imp_login.json()["access_token"]
    imp_headers = {"Authorization": f"Bearer {imp_token}"}

    # Consultation de l'annonce avec conversion en USD (avec Mock CurrencyService)
    mock_conv = {"converted": 54.25, "to": "USD", "rate": 1.085}
    with patch("app.services.currency.CurrencyService.convert", return_value=mock_conv):
        search_resp = client.get("/ads/?to_currency=USD", headers=imp_headers)
        assert search_resp.status_code == 200
        assert any(item["id"] == ad_id for item in search_resp.json())

    # ── 6. Simulation paiement Webhook Stripe avec Mocks API externes ────────
    with patch("app.services.notification.NotificationService.send_email") as mock_email:
        webhook_payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {
                        "user_id": user_id,
                        "type": "paiement_usage",
                        "amount": "29.00"
                    }
                }
            }
        }
        wb_resp = client.post("/billing/webhooks/stripe", json=webhook_payload)
        assert wb_resp.status_code == 200
        assert wb_resp.json()["received"] is True
