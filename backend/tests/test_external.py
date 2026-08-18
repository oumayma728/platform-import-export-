"""
test_external.py â€” Tests des endpoints externes : devises et logistique
"""
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# â”€â”€â”€ Devises â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def test_currency_convert_success(client: TestClient, exporter_token: str):
    mock_result = {"amount": 100, "from": "EUR", "to": "USD", "rate": 1.085, "converted": 108.5}
    with patch("app.services.currency.CurrencyService.convert", new=AsyncMock(return_value=mock_result)):
        resp = client.get(
            "/currency/convert?amount=100&from_currency=EUR&to_currency=USD",
            headers=_auth(exporter_token),
        )
    assert resp.status_code == 200
    assert resp.json()["converted"] == 108.5


def test_currency_convert_negative_amount(client: TestClient, exporter_token: str):
    resp = client.get("/currency/convert?amount=-5&from_currency=EUR&to_currency=USD", headers=_auth(exporter_token))
    assert resp.status_code == 400


def test_currency_convert_invalid_code(client: TestClient, exporter_token: str):
    resp = client.get("/currency/convert?amount=10&from_currency=EUR&to_currency=XX", headers=_auth(exporter_token))
    assert resp.status_code == 400


def test_currency_convert_service_unavailable(client: TestClient, exporter_token: str):
    with patch("app.services.currency.CurrencyService.convert", new=AsyncMock(return_value=None)):
        resp = client.get("/currency/convert?amount=10&from_currency=EUR&to_currency=USD", headers=_auth(exporter_token))
    assert resp.status_code == 503


def test_currency_rates_success(client: TestClient, exporter_token: str):
    rates = {"USD": 1.08, "MAD": 10.9}
    with patch("app.services.currency.CurrencyService.get_all_rates", new=AsyncMock(return_value=rates)):
        resp = client.get("/currency/rates?base=EUR", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["base"] == "EUR"
    assert resp.json()["rates"]["USD"] == 1.08


def test_currency_rates_unavailable(client: TestClient, exporter_token: str):
    with patch("app.services.currency.CurrencyService.get_all_rates", new=AsyncMock(return_value=None)):
        resp = client.get("/currency/rates", headers=_auth(exporter_token))
    assert resp.status_code == 503


# â”€â”€â”€ Logistique â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def test_logistics_estimate_success(client: TestClient, exporter_token: str):
    estimate = {
        "origin_country": "FR",
        "destination_country": "MA",
        "distance_km": 2000.0,
        "estimated_cost_usd": 1500.0,
        "estimated_days": 6,
    }
    with patch("app.services.logistics.LogisticsService.calculate_route", new=AsyncMock(return_value=estimate)):
        resp = client.get("/logistics/estimate?from=FR&to=MA&weight_kg=1000", headers=_auth(exporter_token))
    assert resp.status_code == 200
    assert resp.json()["distance_km"] == 2000.0


def test_logistics_estimate_alt_params(client: TestClient, exporter_token: str):
    estimate = {"origin_country": "FR", "destination_country": "MA"}
    with patch("app.services.logistics.LogisticsService.calculate_route", new=AsyncMock(return_value=estimate)):
        resp = client.get("/logistics/estimate?from_country=FR&to_country=MA", headers=_auth(exporter_token))
    assert resp.status_code == 200


def test_logistics_estimate_missing_params(client: TestClient, exporter_token: str):
    resp = client.get("/logistics/estimate?from=FR", headers=_auth(exporter_token))
    assert resp.status_code == 400


def test_logistics_estimate_weight_zero(client: TestClient, exporter_token: str):
    resp = client.get("/logistics/estimate?from=FR&to=MA&weight_kg=0", headers=_auth(exporter_token))
    assert resp.status_code == 400


def test_logistics_estimate_route_error(client: TestClient, exporter_token: str):
    with patch(
        "app.services.logistics.LogisticsService.calculate_route",
        new=AsyncMock(return_value={"error": "Pays inconnu"}),
    ):
        resp = client.get("/logistics/estimate?from=FR&to=ZZ", headers=_auth(exporter_token))
    assert resp.status_code == 422

