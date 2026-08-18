"""
test_stands.py — Tests des stands
"""
from fastapi.testclient import TestClient
from app.models import Stand


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _seed_stand(db, stand_id="test-stand-detail", status="EN_ATTENTE_VALIDATION", company_name="Stand Détail"):
    stand = Stand(
        id=stand_id,
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name=company_name,
        products="Produits locaux",
        status=status,
    )
    db.add(stand)
    db.commit()
    return stand


def test_create_stand(client: TestClient, exporter_token: str):
    response = client.post(
        "/salons/test-salon/stands",
        headers={"Authorization": f"Bearer {exporter_token}"},
        json={
            "exporter_id": "test-exporter-co",
            "company_name": "Stand Test Export",
            "products": "Produits locaux"
        }
    )
    assert response.status_code == 201
    assert response.json()["company_name"] == "Stand Test Export"
    assert response.json()["status"] == "EN_ATTENTE_VALIDATION"


def test_create_stand_importer_forbidden(client: TestClient, importer_token: str):
    response = client.post(
        "/salons/test-salon/stands",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={
            "exporter_id": "test-importer-co",  # Is an importer, not exporter
            "company_name": "Stand Test Import",
        }
    )
    # Should be 400 because only exporters can reserve stands, or 403 based on role.
    assert response.status_code in [400, 403]


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_list_stands_importer_all(client: TestClient, importer_token: str, db):
    _seed_stand(db, "stand-a", "VALIDE")
    _seed_stand(db, "stand-b", "EN_ATTENTE_VALIDATION")
    resp = client.get("/stands/", headers=_auth(importer_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_stands_filters(client: TestClient, importer_token: str, db):
    _seed_stand(db, "stand-c", "VALIDE", company_name="Alpha Export")
    _seed_stand(db, "stand-d", "EN_ATTENTE_VALIDATION", company_name="Beta Export")
    # Filtre statut
    resp = client.get("/stands/?status=VALIDE", headers=_auth(importer_token))
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == "stand-c"
    # Filtre salon
    resp = client.get("/stands/?salon_id=test-salon", headers=_auth(importer_token))
    assert len(resp.json()) == 2
    # Recherche par nom d'entreprise
    resp = client.get("/stands/?search=alpha", headers=_auth(importer_token))
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == "stand-c"


def test_list_stands_exporter_only_own(client: TestClient, exporter_token: str, db):
    _seed_stand(db, "stand-e", "VALIDE")
    resp = client.get("/stands/", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_stand_detail(client: TestClient, exporter_token: str, db):
    _seed_stand(db)
    resp = client.get("/stands/test-stand-detail", headers=_auth(exporter_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "test-stand-detail"
    assert data["company"]["id"] == "test-exporter-co"
    assert data["company"]["name"] == "Export Test SA"


def test_get_stand_404(client: TestClient, exporter_token: str):
    resp = client.get("/stands/inexistant", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_validate_stand_admin(client: TestClient, admin_token: str, db):
    _seed_stand(db)
    resp = client.patch("/stands/test-stand-detail/validate", headers=_auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "VALIDE"


def test_validate_stand_forbidden_for_exporter(client: TestClient, exporter_token: str, db):
    _seed_stand(db)
    resp = client.patch("/stands/test-stand-detail/validate", headers=_auth(exporter_token))
    assert resp.status_code == 403


def test_validate_stand_404(client: TestClient, admin_token: str):
    resp = client.patch("/stands/inexistant/validate", headers=_auth(admin_token))
    assert resp.status_code == 404


def test_reject_stand_admin(client: TestClient, admin_token: str, db):
    _seed_stand(db)
    resp = client.patch("/stands/test-stand-detail/reject", headers=_auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJETE"


def test_reject_stand_404(client: TestClient, admin_token: str):
    resp = client.patch("/stands/inexistant/reject", headers=_auth(admin_token))
    assert resp.status_code == 404
