"""
test_rendezvous.py — Tests des rendez-vous
"""
from fastapi.testclient import TestClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_rdv(client: TestClient, importer_token: str, dt: str = "2027-01-02T14:00:00") -> str:
    resp = client.post(
        "/rendez-vous/",
        headers=_auth(importer_token),
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": dt,
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_create_rendezvous(client: TestClient, importer_token: str):
    response = client.post(
        "/rendez-vous/",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2027-01-02T14:00:00"
        }
    )
    assert response.status_code == 201
    assert response.json()["status"] == "PROPOSE"


def test_confirm_rendezvous(client: TestClient, importer_token: str, exporter_token: str):
    # D'abord, créer un RDV via l'importateur
    response = client.post(
        "/rendez-vous/",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2027-01-02T15:00:00"
        }
    )
    assert response.status_code == 201
    rdv_id = response.json()["id"]

    # Ensuite, le confirmer via l'exportateur
    confirm_response = client.patch(
        f"/rendez-vous/{rdv_id}/confirm",
        headers={"Authorization": f"Bearer {exporter_token}"},
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["status"] == "CONFIRME"


def test_propose_alternative(client: TestClient, importer_token: str, exporter_token: str):
    # Créer un RDV via l'importateur
    response = client.post(
        "/rendez-vous/",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2027-01-02T16:00:00"
        }
    )
    assert response.status_code == 201
    rdv_id = response.json()["id"]

    # Proposer alternative via l'exportateur
    alt_response = client.patch(
        f"/rendez-vous/{rdv_id}/alternative",
        headers={"Authorization": f"Bearer {exporter_token}"},
        json={
            "alternative_datetimes": ["2027-01-02T17:00:00", "2027-01-03T09:00:00"],
            "notes": "Je ne suis pas dispo à 16h, que pensez-vous de ces horaires ?"
        }
    )
    assert alt_response.status_code == 200
    assert alt_response.json()["status"] == "ALTERNATIVE_PROPOSEE"
    assert len(alt_response.json()["alternative_datetimes"]) == 2


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_list_rendezvous(client: TestClient, importer_token: str):
    _create_rdv(client, importer_token)
    resp = client.get("/rendez-vous/", headers=_auth(importer_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_create_rendezvous_past_datetime(client: TestClient, importer_token: str):
    resp = client.post(
        "/rendez-vous/",
        headers=_auth(importer_token),
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2020-01-01T10:00:00",
        },
    )
    assert resp.status_code == 400


def test_create_rendezvous_invalid_datetime(client: TestClient, importer_token: str):
    resp = client.post(
        "/rendez-vous/",
        headers=_auth(importer_token),
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "pas-une-date",
        },
    )
    assert resp.status_code == 400


def test_create_rendezvous_same_company(client: TestClient, importer_token: str):
    resp = client.post(
        "/rendez-vous/",
        headers=_auth(importer_token),
        json={
            "salon_id": "test-salon",
            "exporter_id": "test-importer-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2027-01-02T14:00:00",
        },
    )
    assert resp.status_code == 400


def test_create_rendezvous_salon_not_valid(client: TestClient, importer_token: str, db):
    from app.models import Salon

    brouillon = Salon(
        id="test-salon-brouillon",
        title="Salon Brouillon",
        status="BROUILLON",
    )
    db.add(brouillon)
    db.commit()
    resp = client.post(
        "/rendez-vous/",
        headers=_auth(importer_token),
        json={
            "salon_id": "test-salon-brouillon",
            "exporter_id": "test-exporter-co",
            "importer_id": "test-importer-co",
            "proposed_datetime": "2027-01-02T14:00:00",
        },
    )
    assert resp.status_code == 400


def test_refuse_rendezvous(client: TestClient, importer_token: str, exporter_token: str):
    rdv_id = _create_rdv(client, importer_token)
    resp = client.patch(f"/rendez-vous/{rdv_id}/refuse", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "REFUSE"


def test_complete_rendezvous(client: TestClient, importer_token: str, exporter_token: str):
    rdv_id = _create_rdv(client, importer_token)
    resp = client.patch(f"/rendez-vous/{rdv_id}/complete", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "TERMINE"


def test_propose_alternative_empty(client: TestClient, importer_token: str, exporter_token: str):
    rdv_id = _create_rdv(client, importer_token)
    resp = client.patch(
        f"/rendez-vous/{rdv_id}/alternative",
        headers=_auth(exporter_token),
        json={"alternative_datetimes": []},
    )
    assert resp.status_code == 400


def test_confirm_rendezvous_wrong_status(client: TestClient, importer_token: str, exporter_token: str):
    rdv_id = _create_rdv(client, importer_token)
    # Confirmer une 2ème fois → le statut CONFIRME n'est pas confirmable
    resp = client.patch(f"/rendez-vous/{rdv_id}/confirm", headers=_auth(exporter_token))
    assert resp.status_code == 200
    resp2 = client.patch(f"/rendez-vous/{rdv_id}/confirm", headers=_auth(exporter_token))
    assert resp2.status_code == 400


def test_rdv_404(client: TestClient, exporter_token: str):
    resp = client.patch("/rendez-vous/inexistant/confirm", headers=_auth(exporter_token))
    assert resp.status_code == 404


# ─── Notifications email déclenchées par statut ──────────────────────────────
def test_create_rendezvous_sends_proposed_email(client: TestClient, importer_token: str):
    from unittest.mock import patch

    with patch("app.routes.rendezvous.send_rdv_proposed_email") as mock_email:
        resp = client.post(
            "/rendez-vous/",
            headers=_auth(importer_token),
            json={
                "salon_id": "test-salon",
                "exporter_id": "test-exporter-co",
                "importer_id": "test-importer-co",
                "proposed_datetime": "2027-01-02T14:00:00",
            },
        )
    assert resp.status_code == 201
    mock_email.assert_called_once()
    assert mock_email.call_args.kwargs["to"] == "exporter@test.com"


def test_confirm_rendezvous_sends_confirmation_email(
    client: TestClient, importer_token: str, exporter_token: str
):
    from unittest.mock import patch

    rdv_id = _create_rdv(client, importer_token)
    with patch("app.routes.rendezvous.send_rdv_confirmed_email") as mock_email, patch(
        "app.routes.rendezvous.send_sms", return_value=True
    ):
        resp = client.patch(f"/rendez-vous/{rdv_id}/confirm", headers=_auth(exporter_token))
    assert resp.status_code == 200
    # Confirmation envoyée aux deux parties (exportateur + importateur)
    recipients = {c.kwargs["to"] for c in mock_email.call_args_list}
    assert recipients == {"exporter@test.com", "importer@test.com"}
