"""
currency.py — Service de conversion de devises (CurrencyService)

- Provider : ExchangeRate-API (https://exchangerate-api.com)
  URL et clé configurables via CURRENCY_API_URL / CURRENCY_API_KEY
  (fallback : endpoint gratuit open.er-api.com sans clé)
- Cache : Redis (TTL 1 heure) avec fallback mémoire si Redis indisponible.
"""
import json
import logging
import os
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ─── Configuration ───────────────────────────────────────────────────────────
CURRENCY_API_KEY = os.getenv("CURRENCY_API_KEY", "") or os.getenv("EXCHANGE_RATE_API_KEY", "")
CURRENCY_API_URL = os.getenv("CURRENCY_API_URL", "")  # ex: https://v6.exchangerate-api.com/v6/{key}/latest/{base}
REDIS_URL = os.getenv("REDIS_URL", "")

CACHE_TTL = 3600  # 1 heure

# ─── Cache Redis (avec fallback mémoire) ─────────────────────────────────────
_memory_cache: dict = {}  # { base: { "rates": {...}, "fetched_at": timestamp } }

try:
    import redis as _redis
    HAS_REDIS_LIB = True
except ImportError:
    HAS_REDIS_LIB = False

_redis_client = None
if HAS_REDIS_LIB and REDIS_URL:
    try:
        _redis_client = _redis.from_url(REDIS_URL, socket_connect_timeout=2)
        _redis_client.ping()
        logger.info("📈 Cache de taux de change configuré sur Redis")
    except Exception as e:
        logger.warning(f"⚠️ Redis indisponible, utilisation du cache mémoire : {e}")
        _redis_client = None


def _cache_key(base: str) -> str:
    return f"fx:{base.upper()}"


def _cache_get(base: str) -> Optional[dict]:
    if _redis_client:
        try:
            raw = _redis_client.get(_cache_key(base))
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning(f"Erreur lecture cache Redis: {e}")
            return None

    entry = _memory_cache.get(base.upper())
    if entry and (time.time() - entry["fetched_at"]) < CACHE_TTL:
        return entry["rates"]
    return None


def _cache_set(base: str, rates: dict) -> None:
    if _redis_client:
        try:
            _redis_client.setex(_cache_key(base), CACHE_TTL, json.dumps(rates))
            return
        except Exception as e:
            logger.warning(f"Erreur écriture cache Redis: {e}")

    _memory_cache[base.upper()] = {"rates": rates, "fetched_at": time.time()}


async def _fetch_rates(base: str) -> Optional[dict]:
    """Récupère les taux de change depuis l'API, avec cache TTL 1h."""
    base = base.upper()

    cached = _cache_get(base)
    if cached:
        return cached

    # URLs candidates : configurée via CURRENCY_API_URL, puis API officielle, puis fallback gratuit
    urls = []
    if CURRENCY_API_URL:
        urls.append(CURRENCY_API_URL.format(key=CURRENCY_API_KEY, base=base))
    if CURRENCY_API_KEY:
        urls.append(f"https://v6.exchangerate-api.com/v6/{CURRENCY_API_KEY}/latest/{base}")
    urls.append(f"https://open.er-api.com/v6/latest/{base}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        for url in urls:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    rates = data.get("rates") or data.get("conversion_rates")
                    if rates:
                        _cache_set(base, rates)
                        return rates
            except Exception as e:
                logger.warning(f"Erreur fetch taux ({url}) : {e}")

    return None


class CurrencyService:
    """Service centralisé de conversion de devises avec cache."""

    @staticmethod
    async def convert(amount: float, from_currency: str, to_currency: str) -> Optional[dict]:
        """
        Convertit un montant d'une devise à une autre.
        Retourne le résultat de conversion ou None en cas d'erreur.
        """
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()

        if from_currency == to_currency:
            return {
                "amount": amount,
                "from": from_currency,
                "to": to_currency,
                "rate": 1.0,
                "converted": amount,
            }

        rates = await _fetch_rates(from_currency)
        if not rates:
            return None

        rate = rates.get(to_currency)
        if not rate:
            return None

        return {
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
            "rate": rate,
            "converted": round(amount * rate, 2),
        }

    @staticmethod
    async def get_all_rates(base: str = "EUR") -> Optional[dict]:
        """Retourne tous les taux de change pour une devise de base."""
        return await _fetch_rates(base.upper())


# ─── Rétrocompatibilité (appelé par external.py) ─────────────────────────────
async def convert(amount: float, from_currency: str, to_currency: str) -> Optional[dict]:
    """Alias de CurrencyService.convert (rétrocompatibilité)."""
    return await CurrencyService.convert(amount, from_currency, to_currency)


async def get_all_rates(base: str = "EUR") -> Optional[dict]:
    """Alias de CurrencyService.get_all_rates (rétrocompatibilité)."""
    return await CurrencyService.get_all_rates(base)
