"""
test_billing.py — Tests de la facturation et du webhook Stripe
"""
from types import SimpleNamespace
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.models import Billing, UserQuota


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _ensure_quota_and_billing(db, user_id="test-importer-user"):
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        quota = UserQuota(user_id=user_id)
        db.add(quota)
    billing = db.query(Billing).filter(Billing.user_id == user_id).first()
    if not billing:
        billing = Billing(user_id=user_id, total_spent=0.0)
        db.add(billing)
    db.commit()
    return quota, billing


def test_stripe_webhook_payment_success(client: TestClient, db):
    """Test unit/intégration pour le webhook Stripe lors de la confirmation d'un paiement."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == "test-importer-user").first()
    if not quota:
        quota = UserQuota(user_id="test-importer-user")
        db.add(quota)
    quota.status = "LIMITE_ATTEINTE"
    quota.chats_used = 50

    billing = db.query(Billing).filter(Billing.user_id == "test-importer-user").first()
    if not billing:
        billing = Billing(user_id="test-importer-user", total_spent=0.0)
        db.add(billing)
    db.commit()

    # Payload de simulation d'un event Stripe `checkout.session.completed`
    event_payload = {
        "id": "evt_test_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_abc",
                "metadata": {
                    "user_id": "test-importer-user",
                    "type": "paiement_usage",
                    "amount": "9.90"
                }
            }
        }
    }

    # Mock du service de notification SendGrid/SMS pour isoler la DB et Stripe
    with patch("app.services.notification.NotificationService.send_email") as mock_send_email:
        response = client.post(
            "/billing/webhooks/stripe",
            json=event_payload,
            headers={"stripe-signature": "simulated_sig"}
        )
        assert response.status_code == 200
        assert response.json()["received"] is True

    # Vérification des mises à jour en DB
    db.refresh(quota)
    db.refresh(billing)
    assert quota.status == "PAIEMENT_USAGE"
    assert billing.total_spent == 9.90


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_create_payment_intent_no_stripe(client: TestClient, exporter_token: str):
    """Sans clé Stripe configurée → 503."""
    resp = client.post("/billing/create-payment-intent", headers=_auth(exporter_token))
    assert resp.status_code == 503


def test_create_payment_intent_success(client: TestClient, exporter_token: str, db):
    _ensure_quota_and_billing(db, "test-exporter-user")
    billing = db.query(Billing).filter(Billing.user_id == "test-exporter-user").first()
    billing.total_spent = 40.0  # > 29€ → recommandation abonnement
    db.commit()

    with patch("app.routes.billing._require_stripe"), patch(
        "stripe.checkout.Session.create",
        return_value=SimpleNamespace(id="cs_abc", url="https://checkout.stripe.com/test"),
    ):
        resp = client.post(
            "/billing/create-payment-intent",
            params={"amount": 9.90},
            headers=_auth(exporter_token),
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "cs_abc"
    assert data["recommendation"]
    assert "recommandons" in data["recommendation"].lower()


def test_subscribe_already_subscribed(client: TestClient, exporter_token: str, db):
    quota, _ = _ensure_quota_and_billing(db, "test-exporter-user")
    quota.status = "ABONNE"
    db.commit()

    with patch("app.routes.billing._require_stripe"):
        resp = client.post("/billing/subscribe", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["active"] is True


def test_subscribe_creates_session(client: TestClient, exporter_token: str, db):
    quota, billing = _ensure_quota_and_billing(db, "test-exporter-user")
    quota.status = "GRATUIT"
    db.commit()

    with patch("app.routes.billing._require_stripe"), patch(
        "stripe.Customer.create", return_value=SimpleNamespace(id="cus_new")
    ) as m_cust, patch(
        "stripe.checkout.Session.create",
        return_value=SimpleNamespace(id="cs_sub", url="https://checkout.stripe.com/sub"),
    ):
        resp = client.post("/billing/subscribe", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["session_id"] == "cs_sub"
    m_cust.assert_called_once()
    db.refresh(billing)
    assert billing.stripe_customer_id == "cus_new"


def test_webhook_subscription_updated(client: TestClient, db):
    quota, billing = _ensure_quota_and_billing(db)
    billing.stripe_subscription_id = "sub_test_1"
    db.commit()

    payload = {
        "type": "customer.subscription.updated",
        "data": {"object": {"id": "sub_test_1", "status": "active"}},
    }
    resp = client.post("/billing/webhooks/stripe", json=payload)
    assert resp.status_code == 200
    db.refresh(quota)
    assert quota.status == "ABONNE"


def test_webhook_subscription_not_active(client: TestClient, db):
    quota, billing = _ensure_quota_and_billing(db)
    billing.stripe_subscription_id = "sub_test_2"
    db.commit()

    payload = {
        "type": "customer.subscription.created",
        "data": {"object": {"id": "sub_test_2", "status": "past_due"}},
    }
    resp = client.post("/billing/webhooks/stripe", json=payload)
    assert resp.status_code == 200
    db.refresh(quota)
    assert quota.status == "ABONNEMENT_EXPIRE"


def test_webhook_subscription_deleted(client: TestClient, db):
    quota, billing = _ensure_quota_and_billing(db)
    billing.stripe_subscription_id = "sub_test_3"
    billing.stripe_customer_id = "cus_1"
    db.commit()

    payload = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_test_3"}},
    }
    resp = client.post("/billing/webhooks/stripe", json=payload)
    assert resp.status_code == 200
    db.refresh(quota)
    assert quota.status == "ABONNEMENT_EXPIRE"
    db.refresh(billing)
    assert billing.stripe_subscription_id is None


def test_webhook_payment_confirm_notification(client: TestClient, db):
    """Le webhook paiement_usage envoie une notification de confirmation."""
    quota, billing = _ensure_quota_and_billing(db)
    payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {"user_id": "test-importer-user", "type": "paiement_usage", "amount": "19.80"},
            }
        },
    }
    with patch("app.services.notification.NotificationService.send_email") as mock_email:
        resp = client.post("/billing/webhooks/stripe", json=payload)
    assert resp.status_code == 200
    mock_email.assert_called_once()
    db.refresh(quota)
    db.refresh(billing)
    assert quota.status == "PAIEMENT_USAGE"
    assert billing.total_spent == 19.80
