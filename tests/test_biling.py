"""Tests du module facturation : quota, Stripe (payment intent, subscribe), webhooks."""
from unittest.mock import patch


def test_billing_status_utilisateur_gratuit(client, registered_user):
    r = client.get("/api/billing/status", headers=registered_user["headers"])
    assert r.status_code == 200
    data = r.json()
    assert data["statut"] == "GRATUIT"
    assert data["chats_gratuits"] == 50
    assert data["chats_utilises"] == 0


def test_create_payment_intent(client, registered_user, mock_stripe_payment_intent):
    r = client.post("/api/billing/create-payment-intent", json={"amount": 500, "currency": "usd"},
                     headers=registered_user["headers"])
    assert r.status_code == 200
    assert r.json()["client_secret"] == "pi_test_secret_123"
    mock_stripe_payment_intent.assert_called_once()


def test_create_payment_intent_montant_trop_bas_rejete(client, registered_user, mock_stripe_payment_intent):
    r = client.post("/api/billing/create-payment-intent", json={"amount": 10, "currency": "usd"},
                     headers=registered_user["headers"])
    assert r.status_code == 422
    mock_stripe_payment_intent.assert_not_called()


def test_subscribe_cree_session_checkout(client, registered_user, mock_stripe_checkout_session):
    r = client.post("/api/billing/subscribe", json={
        "price_id": "price_test123", "success_url": "https://example.com/ok", "cancel_url": "https://example.com/ko",
    }, headers=registered_user["headers"])
    assert r.status_code == 200
    assert r.json()["checkout_url"] == "https://checkout.stripe.com/test"


def test_subscribe_price_id_invalide_rejete_par_schema(client, registered_user, mock_stripe_checkout_session):
    r = client.post("/api/billing/subscribe", json={
        "price_id": "prod_pas_un_price_id", "success_url": "https://example.com/ok", "cancel_url": "https://example.com/ko",
    }, headers=registered_user["headers"])
    assert r.status_code == 422
    # La validation Pydantic doit rejeter la requête avant même d'atteindre Stripe
    mock_stripe_checkout_session.assert_not_called()


def test_stripe_webhook_signature_invalide_rejetee(client):
    r = client.post("/api/webhooks/stripe", content=b'{"type": "payment_intent.succeeded"}',
                     headers={"Stripe-Signature": "signature-invalide"})
    assert r.status_code == 400


def test_stripe_webhook_payment_success(client, registered_user, db_session):
    """Vérifie que payment_intent.succeeded met bien à jour le quota et incrémente
    depense_usage, en contournant la vérification de signature (testée séparément
    ci-dessus) pour isoler la logique métier du webhook."""
    from app.models.billing import UserQuota
    quota = db_session.query(UserQuota).filter(UserQuota.user_id == registered_user["id"]).first()
    quota.stripe_customer_id = "cus_test_webhook"
    db_session.commit()

    fake_event = {
        "id": "evt_payment_success_test",
        "type": "payment_intent.succeeded",
        "data": {"object": type("obj", (), {"to_dict": lambda self: {
            "amount": 5000,  # 50.00 dans l'unité de la devise
            "metadata": {"user_id": str(registered_user["id"])},
        }})()},
    }

    with patch("app.routes.webhooks.stripe.Webhook.construct_event", return_value=fake_event):
        r = client.post("/api/webhooks/stripe", content=b"{}", headers={"Stripe-Signature": "peu-importe-ici"})
    assert r.status_code == 200

    r_status = client.get("/api/billing/status", headers=registered_user["headers"])
    assert r_status.json()["statut"] == "PAIEMENT_USAGE"
    assert r_status.json()["depense_usage"] == 50.0


def test_stripe_webhook_idempotent(client, registered_user):
    """Le même event_id envoyé deux fois ne doit être traité qu'une seule fois."""
    fake_event = {
        "id": "evt_duplique_test",
        "type": "payment_intent.succeeded",
        "data": {"object": type("obj", (), {"to_dict": lambda self: {
            "amount": 1000, "metadata": {"user_id": str(registered_user["id"])},
        }})()},
    }
    with patch("app.routes.webhooks.stripe.Webhook.construct_event", return_value=fake_event):
        r1 = client.post("/api/webhooks/stripe", content=b"{}", headers={"Stripe-Signature": "x"})
        r2 = client.post("/api/webhooks/stripe", content=b"{}", headers={"Stripe-Signature": "x"})
    assert r1.status_code == 200
    assert r2.status_code == 200

    r_status = client.get("/api/billing/status", headers=registered_user["headers"])
    # depense_usage ne doit avoir été incrémentée qu'une fois (10.0), pas deux (20.0)
    assert r_status.json()["depense_usage"] == 10.0