"""
test_subscriptions.py — Abonnements par catégorie (Story 5.2)
Ciblage de la notification de publication d'un salon.
"""
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.models import CategorySubscription, Company, NotificationLog


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _add_importer(db, co_id: str, name: str, owner_id: str) -> Company:
    co = Company(
        id=co_id,
        name=name,
        is_exporter=False,
        is_importer=True,
        country="FR",
        owner_id=owner_id,
        profile_status="VALIDE",
    )
    db.add(co)
    db.commit()
    return co


# ─── CRUD des abonnements ────────────────────────────────────────────────────
def test_create_subscription(client: TestClient, importer_token: str):
    resp = client.post(
        "/subscriptions/",
        headers=_auth(importer_token),
        json={"company_id": "test-importer-co", "category": "Agroalimentaire"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["company_id"] == "test-importer-co"
    assert data["category"] == "Agroalimentaire"


def test_create_subscription_duplicate_idempotent(client: TestClient, importer_token: str, db):
    db.add(CategorySubscription(company_id="test-importer-co", category="Tech"))
    db.commit()
    resp = client.post(
        "/subscriptions/",
        headers=_auth(importer_token),
        json={"company_id": "test-importer-co", "category": "Tech"},
    )
    assert resp.status_code == 201
    assert db.query(CategorySubscription).filter_by(company_id="test-importer-co").count() == 1


def test_create_subscription_other_company_forbidden(client: TestClient, importer_token: str, db):
    _add_importer(db, "test-importer-co-2", "Import 2", "test-exporter-user")
    resp = client.post(
        "/subscriptions/",
        headers=_auth(importer_token),
        json={"company_id": "test-importer-co-2", "category": "Tech"},
    )
    assert resp.status_code == 403


def test_create_subscription_unknown_company(client: TestClient, importer_token: str):
    resp = client.post(
        "/subscriptions/",
        headers=_auth(importer_token),
        json={"company_id": "inexistante", "category": "Tech"},
    )
    assert resp.status_code == 404


def test_create_subscription_empty_category(client: TestClient, importer_token: str):
    resp = client.post(
        "/subscriptions/",
        headers=_auth(importer_token),
        json={"company_id": "test-importer-co", "category": "  "},
    )
    assert resp.status_code == 400


def test_list_subscriptions_own_only(client: TestClient, importer_token: str, db):
    db.add(CategorySubscription(company_id="test-importer-co", category="Tech"))
    db.add(CategorySubscription(company_id="test-exporter-co", category="Agro"))
    db.commit()

    resp = client.get("/subscriptions/", headers=_auth(importer_token))
    assert resp.status_code == 200
    assert [s["category"] for s in resp.json()] == ["Tech"]


def test_list_subscriptions_filtered_by_company(client: TestClient, admin_token: str, db):
    db.add(CategorySubscription(company_id="test-importer-co", category="Tech"))
    db.commit()

    resp = client.get(
        "/subscriptions/?company_id=test-importer-co",
        headers=_auth(admin_token),
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_subscriptions_other_company_forbidden(client: TestClient, importer_token: str, db):
    _add_importer(db, "test-importer-co-3", "Import 3", "test-exporter-user")
    db.add(CategorySubscription(company_id="test-importer-co-3", category="Tech"))
    db.commit()
    resp = client.get(
        "/subscriptions/?company_id=test-importer-co-3",
        headers=_auth(importer_token),
    )
    assert resp.status_code == 403


def test_delete_subscription(client: TestClient, importer_token: str, db):
    sub = CategorySubscription(company_id="test-importer-co", category="Tech")
    db.add(sub)
    db.commit()

    resp = client.delete(f"/subscriptions/{sub.id}", headers=_auth(importer_token))
    assert resp.status_code == 204
    assert db.query(CategorySubscription).filter_by(id=sub.id).count() == 0


def test_delete_subscription_other_owner_forbidden(client: TestClient, importer_token: str, db):
    _add_importer(db, "test-importer-co-4", "Import 4", "test-exporter-user")
    sub = CategorySubscription(company_id="test-importer-co-4", category="Tech")
    db.add(sub)
    db.commit()

    resp = client.delete(f"/subscriptions/{sub.id}", headers=_auth(importer_token))
    assert resp.status_code == 403


def test_delete_subscription_404(client: TestClient, importer_token: str):
    resp = client.delete("/subscriptions/inexistant", headers=_auth(importer_token))
    assert resp.status_code == 404


# ─── Ciblage de la notification à la publication ─────────────────────────────
def test_publish_targets_subscribed_importers_only(client: TestClient, admin_token: str, db):
    # Deux importateurs validés ; seul "test-importer-co" est abonné à "Test" (catégorie du salon)
    _add_importer(db, "test-importer-co-b", "Import B", "test-importer-user")
    db.add(CategorySubscription(company_id="test-importer-co", category="Test"))
    db.commit()

    with patch("app.routes.salons.send_salon_invitation_email") as mock_invite:
        resp = client.patch(
            "/salons/test-salon/status",
            headers=_auth(admin_token),
            json={"status": "PUBLIE"},
        )
    assert resp.status_code == 200
    mock_invite.assert_called_once()
    assert mock_invite.call_args.kwargs["to"] == "importer@test.com"
    assert mock_invite.call_args.kwargs["category"] == "Test"


def test_publish_fallback_when_no_subscribers(client: TestClient, admin_token: str, db):
    db.add(CategorySubscription(company_id="test-importer-co", category="Tech"))
    db.commit()

    with patch("app.routes.salons.send_salon_invitation_email") as mock_invite:
        resp = client.patch(
            "/salons/test-salon/status",
            headers=_auth(admin_token),
            json={"status": "PUBLIE"},
        )
    assert resp.status_code == 200
    # Salon catégorie "Test" ≠ "Tech" → aucun abonné → fallback : tous les importateurs
    mock_invite.assert_called_once()
    assert mock_invite.call_args.kwargs["to"] == "importer@test.com"
    assert mock_invite.call_args.kwargs["category"] == "Test"


def test_publish_logs_notification_with_category(client: TestClient, admin_token: str, db):
    resp = client.patch(
        "/salons/test-salon/status",
        headers=_auth(admin_token),
        json={"status": "PUBLIE"},
    )
    assert resp.status_code == 200
    logs = db.query(NotificationLog).filter(NotificationLog.category == "Test").all()
    assert len(logs) == 1
    assert logs[0].recipient == "importer@test.com"
    assert "Salon Test" in logs[0].subject


def test_publish_via_valide_status_notifies(client: TestClient, admin_token: str, db):
    # Le bouton admin "Publier" passe le salon à VALIDE → doit notifier aussi
    resp = client.patch(
        "/salons/test-salon/status",
        headers=_auth(admin_token),
        json={"status": "BROUILLON"},
    )
    assert resp.status_code == 200
    with patch("app.routes.salons.send_salon_invitation_email") as mock_invite:
        resp = client.patch(
            "/salons/test-salon/status",
            headers=_auth(admin_token),
            json={"status": "VALIDE"},
        )
    assert resp.status_code == 200
    mock_invite.assert_called_once()
    logs = db.query(NotificationLog).filter(NotificationLog.channel == "EMAIL").all()
    assert len(logs) == 1
