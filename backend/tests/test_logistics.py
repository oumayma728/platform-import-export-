"""
test_logistics.py — Tests unitaires du service de logistique (LogisticsService)
"""
from unittest.mock import patch

import httpx
import pytest

from app.services.logistics import (
    FALLBACK_COORDS,
    LogisticsService,
    estimate_logistics,
    get_country_coords,
    haversine,
)


def test_haversine_distance():
    # Distance FR -> MA ≈ 1900 km
    distance = haversine(46.23, 2.21, 31.79, -7.09)
    assert 1700 < distance < 2200
    # Même point → 0
    assert haversine(46.23, 2.21, 46.23, 2.21) == 0


@pytest.mark.asyncio
async def test_get_country_coords_fallback():
    coords = await get_country_coords("FR")
    assert coords == tuple(FALLBACK_COORDS["FR"])


@pytest.mark.asyncio
async def test_get_country_coords_unknown_returns_none():
    def handler(request):
        return httpx.Response(404, json={})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=5.0)
    with patch("httpx.AsyncClient", return_value=client):
        coords = await get_country_coords("ZZ")
    assert coords is None


@pytest.mark.asyncio
async def test_get_country_coords_from_api():
    def handler(request):
        return httpx.Response(200, json=[{"latlng": [48.85, 2.35], "name": "France"}])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=5.0)
    with patch("httpx.AsyncClient", return_value=client):
        coords = await get_country_coords("FRA")
    assert coords == (48.85, 2.35)


@pytest.mark.asyncio
async def test_calculate_route_fr_ma():
    result = await LogisticsService.calculate_route("FR", "MA", weight_kg=1000, incoterm="FOB")
    assert result["origin_country"] == "FR"
    assert result["destination_country"] == "MA"
    assert result["distance_km"] > 0
    assert result["estimated_cost_usd"] > 0
    assert result["estimated_cost_eur"] > 0
    assert result["estimated_days"] > 0
    assert result["incoterm"] == "FOB"
    assert result["incoterm_multiplier"] == 1.0
    assert result["weight_kg"] == 1000


@pytest.mark.asyncio
async def test_calculate_route_default_coords_on_unknown():
    # Pays inconnus (aucune coordonnée) → coords de secours FR/MA, sans réseau
    async def fake_coords(iso_code):
        return None

    with patch("app.services.logistics.get_country_coords", new=fake_coords):
        result = await LogisticsService.calculate_route("ZZ", "ZZ", weight_kg=500, incoterm="CIF")
    assert result["distance_km"] > 0
    assert result["incoterm"] == "CIF"
    assert result["incoterm_multiplier"] == 0.85


@pytest.mark.asyncio
async def test_estimate_logistics_alias():
    res = await estimate_logistics("FR", "MA", weight_kg=2000.0)
    assert res["from_country"] == "FR"
    assert res["to_country"] == "MA"
    assert "cout_estime_eur" in res
    assert "delai_min_jours" in res
    assert "delai_max_jours" in res
