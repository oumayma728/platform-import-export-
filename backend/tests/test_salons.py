"""
test_salons.py — Tests des salons
"""
from fastapi.testclient import TestClient
from app.models import Stand


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_list_salons(client: TestClient, exporter_token: str):
    response = client.get("/salons/", headers={"Authorization": f"Bearer {exporter_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Salon Test"


def test_create_salon_admin(client: TestClient, admin_token: str):
    response = client.post(
        "/salons/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Nouveau Salon",
            "category": "Tech",
            "start_date": "2027-05-01",
            "end_date": "2027-05-05",
            "stand_price": 500.0
        }
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Nouveau Salon"


def test_create_salon_exporter_forbidden(client: TestClient, exporter_token: str):
    response = client.post(
        "/salons/",
        headers={"Authorization": f"Bearer {exporter_token}"},
        json={"title": "Mon Salon"}
    )
    assert response.status_code == 403


def test_update_salon_status(client: TestClient, admin_token: str):
    response = client.patch(
        "/salons/test-salon/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "CLOTURE"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CLOTURE"


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_get_salon(client: TestClient, exporter_token: str):
    resp = client.get("/salons/test-salon", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["title"] == "Salon Test"


def test_get_salon_404(client: TestClient, exporter_token: str):
    resp = client.get("/salons/inexistant", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_list_salons_filter_status(client: TestClient, exporter_token: str):
    resp = client.get("/salons/?status=VALIDE", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_create_salon_invalid_dates(client: TestClient, admin_token: str):
    resp = client.post(
        "/salons/",
        headers=_auth(admin_token),
        json={
            "title": "Mauvaises dates",
            "start_date": "2027-06-01",
            "end_date": "2027-05-01",
        },
    )
    assert resp.status_code == 400


def test_create_salon_negative_price(client: TestClient, admin_token: str):
    resp = client.post(
        "/salons/",
        headers=_auth(admin_token),
        json={"title": "Prix négatif", "stand_price": -10.0},
    )
    assert resp.status_code == 400


def test_update_salon(client: TestClient, admin_token: str):
    resp = client.put("/salons/test-salon", headers=_auth(admin_token), json={"title": "Salon MAJ"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Salon MAJ"


def test_update_salon_404(client: TestClient, admin_token: str):
    resp = client.put("/salons/inexistant", headers=_auth(admin_token), json={"title": "X"})
    assert resp.status_code == 404


def test_update_salon_invalid_status(client: TestClient, admin_token: str):
    resp = client.put(
        "/salons/test-salon",
        headers=_auth(admin_token),
        json={"status": "STATUT_INCONNU"},
    )
    assert resp.status_code == 400


def test_patch_salon_status_invalid(client: TestClient, admin_token: str):
    resp = client.patch(
        "/salons/test-salon/status",
        headers=_auth(admin_token),
        json={"status": "STATUT_INCONNU"},
    )
    assert resp.status_code == 400


def test_list_stands_by_salon(client: TestClient, exporter_token: str, db):
    stand = Stand(
        id="test-stand-in-salon",
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Stand Du Salon",
        status="VALIDE",
    )
    db.add(stand)
    db.commit()
    resp = client.get("/salons/test-salon/stands", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_stands_by_salon_404(client: TestClient, exporter_token: str):
    resp = client.get("/salons/inexistant/stands", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_create_stand_invalid_salon(client: TestClient, exporter_token: str):
    resp = client.post(
        "/salons/inexistant/stands",
        headers=_auth(exporter_token),
        json={"exporter_id": "test-exporter-co", "company_name": "Co"},
    )
    assert resp.status_code == 404


def test_create_stand_company_not_exporter(client: TestClient, exporter_token: str):
    # exporter_token tente avec une société d'import
    resp = client.post(
        "/salons/test-salon/stands",
        headers=_auth(exporter_token),
        json={"exporter_id": "test-importer-co", "company_name": "Stand Import"},
    )
    assert resp.status_code == 400


def test_create_stand_company_forbidden(client: TestClient, exporter_token: str, db):
    # Société inconnue → 400 (le check de propriété n'est pas atteint)
    resp = client.post(
        "/salons/test-salon/stands",
        headers=_auth(exporter_token),
        json={"exporter_id": "test-exporter-co-other", "company_name": "Stand Autre"},
    )
    assert resp.status_code == 400


def test_create_stand_company_profile_not_valid(client: TestClient, exporter_token: str, db):
    from app.models import Company

    other_co = Company(
        id="test-exporter-co-2",
        name="Export 2",
        is_exporter=True,
        is_importer=False,
        country="SN",
        owner_id="test-exporter-user",
        profile_status="EN_ATTENTE_VALIDATION",
    )
    db.add(other_co)
    db.commit()
    resp = client.post(
        "/salons/test-salon/stands",
        headers=_auth(exporter_token),
        json={"exporter_id": "test-exporter-co-2", "company_name": "Stand Non Validé"},
    )
    assert resp.status_code == 403
