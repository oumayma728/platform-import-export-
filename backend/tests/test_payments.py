"""
test_payments.py — Tests des paiements Stripe pour les stands
Couvre : checkout (dev mode), statut de paiement, webhooks stand_payment.
"""
from fastapi.testclient import TestClient

from app.models import Stand


def _seed_stand(db, stand_id="test-stand-pay", status="VALIDE", payment_status="PENDING"):
    stand = Stand(
        id=stand_id,
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Stand Pay Test",
        products="Produits test",
        status=status,
        payment_status=payment_status,
    )
    db.add(stand)
    db.commit()
    return stand


def test_stand_checkout_dev_mode(client: TestClient, exporter_token: str, db):
    """Sans clé Stripe configurée, le checkout retourne une session mockée."""
    _seed_stand(db)
    resp = client.post(
        "/payments/stands/test-stand-pay/checkout",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"].startswith("cs_test_mock_")
    assert data["currency"] == "EUR"
    assert data["amount"] == 1000.0  # stand_price du salon seed
    assert "checkout_url" in data


def test_stand_checkout_404(client: TestClient, exporter_token: str):
    resp = client.post(
        "/payments/stands/inexistant/checkout",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert resp.status_code == 404


def test_stand_checkout_already_paid(client: TestClient, exporter_token: str, db):
    _seed_stand(db, payment_status="PAID")
    resp = client.post(
        "/payments/stands/test-stand-pay/checkout",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert resp.status_code == 400
    assert "déjà été payé" in str(resp.json()["detail"]).lower()


def test_stand_checkout_forbidden_for_importer(client: TestClient, importer_token: str, db):
    _seed_stand(db)
    resp = client.post(
        "/payments/stands/test-stand-pay/checkout",
        headers={"Authorization": f"Bearer {importer_token}"},
    )
    assert resp.status_code == 403


def test_stand_payment_status(client: TestClient, exporter_token: str, db):
    _seed_stand(db)
    resp = client.get(
        "/payments/stands/test-stand-pay/status",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["stand_id"] == "test-stand-pay"
    assert data["payment_status"] == "PENDING"


def test_stand_payment_status_404(client: TestClient, exporter_token: str):
    resp = client.get(
        "/payments/stands/inexistant/status",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert resp.status_code == 404


def test_webhook_stand_payment_paid(client: TestClient, db):
    """Webhook checkout.session.completed → stand PAID + EN_ATTENTE_VALIDATION."""
    _seed_stand(db)
    payload = {
        "id": "evt_stand_1",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_webhook_1",
                "metadata": {"type": "stand_payment", "stand_id": "test-stand-pay"},
            }
        },
    }
    resp = client.post(
        "/payments/webhooks/stripe",
        json=payload,
        headers={"stripe-signature": "simulated_sig"},
    )
    assert resp.status_code == 200
    assert resp.json()["received"] is True

    stand = db.query(Stand).filter(Stand.id == "test-stand-pay").first()
    assert stand.payment_status == "PAID"
    assert stand.status == "EN_ATTENTE_VALIDATION"
    assert stand.stripe_session_id == "cs_test_webhook_1"


def test_webhook_stand_payment_failed(client: TestClient, db):
    """Webhook checkout.session.expired → stand FAILED."""
    _seed_stand(db)
    payload = {
        "type": "checkout.session.expired",
        "data": {
            "object": {
                "metadata": {"type": "stand_payment", "stand_id": "test-stand-pay"},
            }
        },
    }
    resp = client.post("/payments/webhooks/stripe", json=payload)
    assert resp.status_code == 200

    stand = db.query(Stand).filter(Stand.id == "test-stand-pay").first()
    assert stand.payment_status == "FAILED"


def test_webhook_stand_payment_unknown_stand(client: TestClient):
    """Un stand_id inconnu ne doit pas provoquer d'erreur."""
    payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {"type": "stand_payment", "stand_id": "inexistant"},
            }
        },
    }
    resp = client.post("/payments/webhooks/stripe", json=payload)
    assert resp.status_code == 200
