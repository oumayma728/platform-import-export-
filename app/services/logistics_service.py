import json
import os
import time
import asyncio
import urllib.request
import urllib.error
import urllib.parse
from math import asin, cos, radians, sin, sqrt

# Mapping code ISO -> nom de pays, nécessaire pour interroger OpenRouteService
# (données statiques et non sensibles : le nom d'un pays ne change jamais).
_NAMES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "country_names.json")
with open(_NAMES_PATH, encoding="utf-8") as f:
    COUNTRY_NAMES: dict[str, str] = json.load(f)

ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
_coords_cache: dict[str, tuple[tuple[float, float], float]] = {}
_CACHE_DUREE_SECONDES = 24 * 3600  # les coordonnées d'un pays ne changent jamais -> cache 24h suffit largement


def _fetch_country_coords(code: str) -> tuple[float, float]:
    api_key = os.getenv("LOGISTICS_API_KEY")
    if not api_key:
        raise ValueError("LOGISTICS_API_KEY non configurée.")

    nom_pays = COUNTRY_NAMES.get(code)
    if not nom_pays:
        raise ValueError(f"Code pays inconnu : '{code}'. Utilisez un code ISO 3166-1 alpha-2 (ex: FR, TN, US).")

    params = urllib.parse.urlencode({
        "api_key": api_key,
        "text": nom_pays,
        "layers": "country",
        "size": 1,
    })
    url = f"{ORS_GEOCODE_URL}?{params}"

    try:
        with urllib.request.urlopen(url, timeout=8) as response:
            data = json.loads(response.read())
            features = data.get("features", [])
            if not features:
                raise ValueError(f"Aucun résultat OpenRouteService pour '{nom_pays}'.")
            lon, lat = features[0]["geometry"]["coordinates"]  # ORS renvoie [lon, lat]
            return (lat, lon)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, KeyError, IndexError) as exc:
        raise ValueError(f"Impossible de géolocaliser '{nom_pays}' via OpenRouteService.") from exc


async def _get_country_coords(code: str) -> tuple[float, float]:
    code = code.upper()
    cached = _coords_cache.get(code)
    if cached and time.time() - cached[1] < _CACHE_DUREE_SECONDES:
        return cached[0]

    coords = await asyncio.to_thread(_fetch_country_coords, code)
    _coords_cache[code] = (coords, time.time())
    return coords


async def estimate(origin: str, destination: str, cost_per_km: float = 0.75):
    lat1, lon1 = await _get_country_coords(origin)
    lat2, lon2 = await _get_country_coords(destination)

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    distance = 2 * 6371 * asin(sqrt(sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2))

    return {
        "origin": origin.upper(),
        "destination": destination.upper(),
        "distance_km": round(distance, 1),
        "estimated_cost_usd": round(distance * cost_per_km, 2),
        "estimated_days": max(1, round(distance / 650)),
    }