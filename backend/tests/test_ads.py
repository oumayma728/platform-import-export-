"""
test_ads.py — Tests des annonces (listings)
"""
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_ad(client: TestClient, token: str, title: str = "Huile d'olive Vierge Extra Bio") -> str:
    resp = client.post(
        "/ads/?company_id=test-exporter-co",
        headers=_auth(token),
        json={
            "title": title,
            "description": "Description de l'annonce de test.",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 12.50,
            "incoterms": "FOB",
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_create_listing(client: TestClient, exporter_token: str):
    """Test unit/intégration pour la création d'une annonce par un exportateur."""
    response = client.post(
        "/ads/?company_id=test-exporter-co",
        headers={"Authorization": f"Bearer {exporter_token}"},
        json={
            "title": "Huile d'olive Vierge Extra Bio",
            "description": "Huile d'olive de qualité supérieure, première pression à froid.",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 12.50,
            "incoterms": "FOB",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Huile d'olive Vierge Extra Bio"
    assert data["type"] == "OFFRE"
    assert data["price"] == 12.50
    assert data["status"] == "ACTIVE"


def test_list_ads_with_currency_conversion(client: TestClient, exporter_token: str):
    """Test de listage des annonces avec conversion de devise demandée (ex: USD)."""
    # 1. Créer une annonce
    post_resp = client.post(
        "/ads/?company_id=test-exporter-co",
        headers={"Authorization": f"Bearer {exporter_token}"},
        json={
            "title": "Dattes Medjool Premium",
            "description": "Dattes Medjool de premier choix",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 100.0,
        }
    )
    assert post_resp.status_code == 201

    # 2. Lister les annonces avec mock du service de change
    mock_conv = {"converted": 108.50, "to": "USD", "rate": 1.085}
    with patch("app.services.currency.CurrencyService.convert", return_value=mock_conv):
        response = client.get(
            "/ads/?to_currency=USD",
            headers={"Authorization": f"Bearer {exporter_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        ad = data[0]
        assert "price_converted" in ad
        assert ad["price_currency"] == "USD"


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_list_ads_filters(client: TestClient, exporter_token: str):
    _create_ad(client, exporter_token, title="Dattes Medjool Premium")
    resp = client.get(
        "/ads/?type=OFFRE&min_price=10&max_price=20&incoterms=FOB&search=Medjool&company_id=test-exporter-co",
        headers=_auth(exporter_token),
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["title"] == "Dattes Medjool Premium"


def test_get_ad(client: TestClient, exporter_token: str):
    ad_id = _create_ad(client, exporter_token)
    resp = client.get(f"/ads/{ad_id}", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["id"] == ad_id


def test_get_ad_404(client: TestClient, exporter_token: str):
    resp = client.get("/ads/inexistant", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_update_ad(client: TestClient, exporter_token: str):
    ad_id = _create_ad(client, exporter_token)
    resp = client.put(f"/ads/{ad_id}", headers=_auth(exporter_token), json={"price": 20.0})
    assert resp.status_code == 200
    assert resp.json()["price"] == 20.0


def test_update_ad_invalid_status(client: TestClient, exporter_token: str):
    ad_id = _create_ad(client, exporter_token)
    resp = client.put(f"/ads/{ad_id}", headers=_auth(exporter_token), json={"status": "BROUILLON"})
    assert resp.status_code == 400


def test_update_ad_forbidden(client: TestClient, exporter_token: str, importer_token: str):
    ad_id = _create_ad(client, exporter_token)
    resp = client.put(f"/ads/{ad_id}", headers=_auth(importer_token), json={"price": 5.0})
    assert resp.status_code == 403


def test_update_ad_404(client: TestClient, exporter_token: str):
    resp = client.put("/ads/inexistant", headers=_auth(exporter_token), json={"price": 5.0})
    assert resp.status_code == 404


def test_delete_ad(client: TestClient, exporter_token: str):
    ad_id = _create_ad(client, exporter_token)
    resp = client.delete(f"/ads/{ad_id}", headers=_auth(exporter_token))
    assert resp.status_code == 204
    # L'annonce a bien été supprimée
    resp_get = client.get(f"/ads/{ad_id}", headers=_auth(exporter_token))
    assert resp_get.status_code == 404


def test_delete_ad_404(client: TestClient, exporter_token: str):
    resp = client.delete("/ads/inexistant", headers=_auth(exporter_token))
    assert resp.status_code == 404


def test_create_ad_forbidden_other_company(client: TestClient, importer_token: str):
    resp = client.post(
        "/ads/?company_id=test-exporter-co",
        headers=_auth(importer_token),
        json={
            "title": "Offre non autorisée",
            "description": "Test",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 10.0,
        },
    )
    assert resp.status_code == 403


def test_create_ad_wrong_type_for_company(client: TestClient, importer_token: str):
    # La société d'import ne peut pas publier une OFFRE
    resp = client.post(
        "/ads/?company_id=test-importer-co",
        headers=_auth(importer_token),
        json={
            "title": "Offre impossible",
            "description": "Test",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 10.0,
        },
    )
    assert resp.status_code == 400


def test_create_ad_company_not_found(client: TestClient, exporter_token: str):
    resp = client.post(
        "/ads/?company_id=inexistante",
        headers=_auth(exporter_token),
        json={
            "title": "Test",
            "description": "Test",
            "category": "Agroalimentaire",
            "type": "OFFRE",
            "price": 10.0,
        },
    )
    assert resp.status_code == 404


def test_get_ad_logistics_estimate(client: TestClient, exporter_token: str):
    ad_id = _create_ad(client, exporter_token)
    estimate = {"distance_km": 1900.0, "estimated_cost_usd": 1200.0}
    with patch("app.services.logistics.LogisticsService.calculate_route", new=AsyncMock(return_value=estimate)):
        resp = client.get(
            f"/ads/{ad_id}/logistics-estimate?destination_country=MA",
            headers=_auth(exporter_token),
        )
    assert resp.status_code == 200
    assert resp.json()["origin_country"] == "MA"  # pays de la société d'export
    assert resp.json()["destination_country"] == "MA"
    assert resp.json()["logistics"]["distance_km"] == 1900.0


def test_get_ad_logistics_estimate_404(client: TestClient, exporter_token: str):
    resp = client.get(
        "/ads/inexistant/logistics-estimate?destination_country=MA",
        headers=_auth(exporter_token),
    )
    assert resp.status_code == 404
