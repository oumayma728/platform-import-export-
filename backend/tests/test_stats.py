"""
test_stats.py — Tests des statistiques du dashboard exportateur
"""
from fastapi.testclient import TestClient

from app.models import Stand


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_stats_exporter_forbidden_for_importer(client: TestClient, importer_token: str):
    resp = client.get("/stats/exporter", headers=_auth(importer_token))
    assert resp.status_code == 403


def test_stats_exporter_empty(client: TestClient, exporter_token: str):
    resp = client.get("/stats/exporter", headers=_auth(exporter_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_stands"] == 0
    assert data["total_rdvs"] == 0
    assert data["total_conversations"] == 0
    assert data["total_ads"] == 0
    assert len(data["chart_data"]) == 7


def test_stats_exporter_with_data(client: TestClient, exporter_token: str, db):
    stand = Stand(
        id="test-stand-stat",
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Stand Stats",
        status="VALIDE",
    )
    db.add(stand)
    db.commit()

    resp = client.get("/stats/exporter", headers=_auth(exporter_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_stands"] == 1
    assert len(data["chart_data"]) == 7
    assert data["chart_data"][0]["name"] == "Jan"
