"""
test_currency.py — Tests unitaires du service de change (CurrencyService)
"""
from unittest.mock import patch

import httpx
import pytest

from app.services.currency import CurrencyService, _cache_get, _cache_set, _fetch_rates, _memory_cache


@pytest.mark.asyncio
async def test_convert_same_currency():
    result = await CurrencyService.convert(100, "eur", "EUR")
    assert result["rate"] == 1.0
    assert result["converted"] == 100
    assert result["from"] == "EUR"


@pytest.mark.asyncio
async def test_convert_cross_currency():
    async def fake_fetch(base):
        return {"USD": 1.085, "MAD": 10.6}

    with patch("app.services.currency._fetch_rates", fake_fetch):
        result = await CurrencyService.convert(100, "EUR", "USD")
    assert result["converted"] == 108.5
    assert result["to"] == "USD"


@pytest.mark.asyncio
async def test_convert_currency_not_in_rates():
    async def fake_fetch(base):
        return {"USD": 1.085}

    with patch("app.services.currency._fetch_rates", fake_fetch):
        result = await CurrencyService.convert(100, "EUR", "XYZ")
    assert result is None


@pytest.mark.asyncio
async def test_convert_no_rates():
    async def fake_fetch(base):
        return None

    with patch("app.services.currency._fetch_rates", fake_fetch):
        result = await CurrencyService.convert(100, "EUR", "USD")
    assert result is None


@pytest.mark.asyncio
async def test_get_all_rates():
    _memory_cache.clear()
    async def fake_fetch(base):
        return {"USD": 1.0, "MAD": 10.0}

    with patch("app.services.currency._fetch_rates", fake_fetch):
        rates = await CurrencyService.get_all_rates("EUR")
    assert rates["USD"] == 1.0


def test_memory_cache_set_get():
    _memory_cache.clear()
    _cache_set("EUR", {"USD": 1.1})
    assert _cache_get("EUR") == {"USD": 1.1}
    _memory_cache.clear()
    assert _cache_get("EUR") is None


@pytest.mark.asyncio
async def test_fetch_rates_from_api():
    _memory_cache.clear()

    def handler(request):
        return httpx.Response(200, json={"result": "success", "rates": {"USD": 1.1, "MAD": 10.5}})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=10.0)
    with patch("httpx.AsyncClient", return_value=client):
        rates = await _fetch_rates("EUR")
    assert rates["USD"] == 1.1
    # Le résultat doit être mis en cache
    assert _cache_get("EUR")["USD"] == 1.1
    _memory_cache.clear()


@pytest.mark.asyncio
async def test_fetch_rates_api_failure():
    _memory_cache.clear()

    def handler(request):
        return httpx.Response(500, json={})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=10.0)
    with patch("httpx.AsyncClient", return_value=client):
        rates = await _fetch_rates("EUR")
    assert rates is None
    _memory_cache.clear()
