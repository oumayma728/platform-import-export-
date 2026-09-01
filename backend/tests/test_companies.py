"""
test_companies.py — Tests CRUD des entreprises
"""
from fastapi.testclient import TestClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_list_companies_exporter_sees_only_own(client: TestClient, exporter_token: str):
    resp = client.get("/companies/", headers=_auth(exporter_token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == "test-exporter-co"


def test_list_companies_importer_sees_all_exporters(client: TestClient, importer_token: str):
    resp = client.get("/companies/", headers=_auth(importer_token))
    assert resp.status_code == 200
    ids = [c["id"] for c in resp.json()]
    assert "test-exporter-co" in ids
    assert "test-importer-co" in ids


def test_get_company(client: TestClient, exporter_token: str):
    resp = client.get("/companies/test-exporter-co", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Export Test SA"


def test_get_company_forbidden_for_other_exporter(client: TestClient, exporter_token: str):
    resp = client.get("/companies/test-importer-co", headers=_auth(exporter_token))
    assert resp.status_code == 403


def test_get_company_404(client: TestClient, exporter_token: str):
    resp = client.get("/companies/inexistante", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_create_company(client: TestClient, exporter_token: str):
    resp = client.post(
        "/companies/",
        headers=_auth(exporter_token),
        json={
            "name": "Nouvelle Co Test",
            "is_exporter": True,
            "is_importer": False,
            "country": "SN",
            "description": "Description",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["owner_id"] == "test-exporter-user"
    assert resp.json()["profile_status"] == "EN_ATTENTE_VALIDATION"


def test_update_company_own(client: TestClient, exporter_token: str):
    resp = client.put(
        "/companies/test-exporter-co",
        headers=_auth(exporter_token),
        json={"name": "Export Test Renommé", "is_exporter": True, "is_importer": False, "country": "MA"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Export Test Renommé"


def test_update_company_forbidden(client: TestClient, exporter_token: str):
    resp = client.put(
        "/companies/test-importer-co",
        headers=_auth(exporter_token),
        json={"name": "Tentative", "is_exporter": False, "is_importer": True, "country": "FR"},
    )
    assert resp.status_code == 403


def test_update_company_status_invalid(client: TestClient, admin_token: str):
    resp = client.patch(
        "/companies/test-exporter-co/status",
        headers=_auth(admin_token),
        json={"profile_status": "BROUILLON"},
    )
    assert resp.status_code == 400


def test_update_company_status_ok(client: TestClient, admin_token: str):
    resp = client.patch(
        "/companies/test-exporter-co/status",
        headers=_auth(admin_token),
        json={"profile_status": "REJETE"},
    )
    assert resp.status_code == 200
    assert resp.json()["profile_status"] == "REJETE"


def test_update_company_status_404(client: TestClient, admin_token: str):
    resp = client.patch(
        "/companies/inexistante/status",
        headers=_auth(admin_token),
        json={"profile_status": "VALIDE"},
    )
    assert resp.status_code == 404
