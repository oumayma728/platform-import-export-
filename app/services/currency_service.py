import json
import os
import asyncio
import urllib.request
import urllib.error
import redis

_CACHE_TTL_SECONDES = 3600  # 1 heure, comme demandé par le CDC


def _get_redis_client():
    """Connexion Redis paresseuse (créée au premier besoin, pas à l'import)."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis.Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)


def _fetch_rates(base_currency: str) -> dict[str, float]:
    api_key = os.getenv("CURRENCY_API_KEY")
    api_url = os.getenv("CURRENCY_API_URL", "https://v6.exchangerate-api.com/v6")
    if not api_key:
        raise ValueError("CURRENCY_API_KEY non configurée.")

    url = f"{api_url}/{api_key}/latest/{base_currency}"
    try:
        with urllib.request.urlopen(url, timeout=8) as response:
            data = json.loads(response.read())
            if data.get("result") != "success":
                raise ValueError(f"Erreur API de change : {data.get('error-type', 'inconnue')}")
            return data["conversion_rates"]
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, KeyError) as exc:
        raise ValueError("Taux de change indisponible pour cette paire de devises") from exc


def _get_cached_rate(base_currency: str, target_currency: str) -> float | None:
    """Lit le taux depuis Redis (cache TTL 1h). Retourne None si absent/expiré
    ou si Redis est injoignable (dégradation silencieuse, pas de crash)."""
    try:
        client = _get_redis_client()
        cached = client.get(f"fx:{base_currency}:{target_currency}")
        return float(cached) if cached is not None else None
    except redis.RedisError:
        return None


def _set_cached_rates(base_currency: str, rates: dict[str, float]) -> None:
    """Écrit tous les taux d'une base dans Redis en une fois, avec TTL 1h.
    Si Redis est indisponible, on continue sans cache plutôt que de planter."""
    try:
        client = _get_redis_client()
        pipeline = client.pipeline()
        for devise, taux in rates.items():
            pipeline.set(f"fx:{base_currency}:{devise}", taux, ex=_CACHE_TTL_SECONDES)
        pipeline.execute()
    except redis.RedisError:
        pass


async def convert(amount: float, from_currency: str, to_currency: str):
    from_currency, to_currency = from_currency.upper(), to_currency.upper()

    if from_currency == to_currency:
        return {
            "amount": amount, "from": from_currency, "to": to_currency,
            "converted_amount": amount, "rate": 1.0,
        }

    rate = await asyncio.to_thread(_get_cached_rate, from_currency, to_currency)

    if rate is None:
        rates = await asyncio.to_thread(_fetch_rates, from_currency)
        try:
            rate = float(rates[to_currency])
        except KeyError as exc:
            raise ValueError("Taux de change indisponible pour cette paire de devises") from exc
        await asyncio.to_thread(_set_cached_rates, from_currency, rates)

    return {
        "amount": amount, "from": from_currency, "to": to_currency,
        "converted_amount": round(amount * rate, 2), "rate": rate,
    }