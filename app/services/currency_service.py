import time
import json
import asyncio
import urllib.request
import urllib.error

_cache: dict[str, tuple[float, float]] = {}

def _fetch_rates(base_currency: str) -> dict[str, float]:
    url = f"https://open.er-api.com/v6/latest/{base_currency}"
    try:
        with urllib.request.urlopen(url, timeout=8) as response:
            body = response.read()
            data = json.loads(body)
            return data["rates"]
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, KeyError) as exc:
        raise ValueError("Taux de change indisponible pour cette paire de devises") from exc

async def convert(amount: float, from_currency: str, to_currency: str):
    if from_currency.upper() == to_currency.upper():
        return {
            "amount": amount,
            "from": from_currency.upper(),
            "to": to_currency.upper(),
            "converted_amount": amount,
            "rate": 1.0,
        }

    key = f"{from_currency.upper()}:{to_currency.upper()}"
    cached = _cache.get(key)
    if cached and time.time() - cached[1] < 3600:
        rate = cached[0]
    else:
        rates = await asyncio.to_thread(_fetch_rates, from_currency.upper())
        try:
            rate = float(rates[to_currency.upper()])
        except KeyError as exc:
            raise ValueError("Taux de change indisponible pour cette paire de devises") from exc
        _cache[key] = (rate, time.time())

    return {
        "amount": amount,
        "from": from_currency.upper(),
        "to": to_currency.upper(),
        "converted_amount": round(amount * rate, 2),
        "rate": rate,
    }
