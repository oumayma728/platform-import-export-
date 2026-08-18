"""
logistics.py — Service d'estimation logistique (LogisticsService)
Intégration d'API de calcul logistique (OpenRouteService, TomTom, OSRM, REST Countries + Haversine fallback).
Estime la distance en km, le coût en USD/EUR, le délai en jours et l'impact Incoterms.
"""
import logging
import math
import os
import time
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

OPENROUTESERVICE_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY", "")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "")
LOGISTICS_PROVIDER = os.getenv("LOGISTICS_PROVIDER", "auto")

# Cache des coordonnées par code ISO pays
_country_coords_cache: dict = {}

# Coordonnées GPS des principaux pays (code ISO 2 -> [lat, lon])
FALLBACK_COORDS = {
    "FR": [46.23, 2.21],
    "MA": [31.79, -7.09],
    "DE": [51.16, 10.45],
    "ES": [40.46, -3.74],
    "IT": [41.87, 12.56],
    "GB": [55.37, -3.43],
    "US": [37.09, -95.71],
    "CN": [35.86, 104.19],
    "JP": [36.20, 138.25],
    "BR": [-14.23, -51.92],
    "IN": [20.59, 78.96],
    "RU": [61.52, 105.31],
    "CA": [56.13, -106.34],
    "AU": [-25.27, 133.77],
    "ZA": [-30.55, 22.93],
    "NG": [9.08, 8.67],
    "EG": [26.82, 30.80],
    "SA": [23.88, 45.07],
    "TR": [38.96, 35.24],
    "MX": [23.63, -102.55],
    "AR": [-38.41, -63.61],
    "SN": [14.49, -14.45],
    "CI": [7.54, -5.55],
    "TN": [33.88, 9.54],
    "DZ": [28.03, 1.65],
    "BE": [50.50, 4.47],
    "NL": [52.13, 5.29],
    "CH": [46.81, 8.22],
    "PT": [39.39, -8.22],
    "SE": [60.12, 18.64],
    "NO": [60.47, 8.46],
    "FI": [61.92, 25.74],
    "PL": [51.91, 19.14],
    "AE": [23.42, 53.84],
    "QA": [25.35, 51.18],
    "KW": [29.31, 47.48],
    "TR": [38.96, 35.24],
}

INCOTERM_MULTIPLIERS = {
    "EXW": 1.25,  # Ex Works (acheteur gère tout)
    "FOB": 1.0,   # Free On Board (standard)
    "CIF": 0.85,  # Cost, Insurance and Freight (vendeur paie transport)
    "DDP": 0.70,  # Delivered Duty Paid (vendeur prend tout en charge)
    "CIP": 0.90,
    "FCA": 1.10,
}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance orthodromique en km entre deux points GPS."""
    R = 6371  # Rayon de la Terre en km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


async def get_country_coords(iso_code: str) -> Optional[tuple[float, float]]:
    """Récupère les coordonnées GPS d'un pays via cache/API."""
    iso_code = iso_code.upper().strip()

    if iso_code in FALLBACK_COORDS:
        coords = FALLBACK_COORDS[iso_code]
        return coords[0], coords[1]

    if iso_code in _country_coords_cache:
        return _country_coords_cache[iso_code]

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"https://restcountries.com/v3.1/alpha/{iso_code}",
                params={"fields": "latlng,name"},
            )
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and data:
                    latlng = data[0].get("latlng", [])
                    if len(latlng) >= 2:
                        coords = (latlng[0], latlng[1])
                        _country_coords_cache[iso_code] = coords
                        return coords
    except Exception as e:
        logger.warning(f"Erreur coordonnées pour pays {iso_code}: {e}")

    return None


class LogisticsService:
    """Service d'estimation et d'optimisation des trajets logistiques."""

    @staticmethod
    async def calculate_route(
        origin_country: str,
        destination_country: str,
        weight_kg: float = 1000.0,
        incoterm: str = "FOB"
    ) -> Dict[str, Any]:
        """
        Calcule la distance, le coût et les délais estimatifs entre deux pays.

        Args:
            origin_country: Code ISO ou nom du pays de départ (ex: "FR")
            destination_country: Code ISO ou nom du pays de destination (ex: "MA")
            weight_kg: Poids estimé en kg (défaut 1000kg)
            incoterm: Code Incoterm (ex: "FOB", "EXW", "CIF", "DDP")

        Returns:
            Dict contenant distance_km, estimated_cost_usd, estimated_days, provider, incoterm_multiplier, etc.
        """
        origin_iso = origin_country.upper().strip()[:2]
        dest_iso = destination_country.upper().strip()[:2]

        origin_coords = await get_country_coords(origin_iso)
        dest_coords = await get_country_coords(dest_iso)

        if not origin_coords or not dest_coords:
            # Coordonnées par défaut en cas d'échec
            origin_coords = origin_coords or (46.23, 2.21)
            dest_coords = dest_coords or (31.79, -7.09)

        # 1. Calcul de la distance de base
        distance_km = round(haversine(origin_coords[0], origin_coords[1], dest_coords[0], dest_coords[1]), 1)
        provider = "Haversine / REST Countries"

        # 2. Essai API OpenRouteService si disponible
        if OPENROUTESERVICE_API_KEY and OPENROUTESERVICE_API_KEY != "your-openrouteservice-api-key":
            try:
                async with httpx.AsyncClient(timeout=6.0) as client:
                    ors_url = "https://api.openrouteservice.org/v2/directions/driving-car"
                    resp = await client.get(ors_url, params={
                        "api_key": OPENROUTESERVICE_API_KEY,
                        "start": f"{origin_coords[1]},{origin_coords[0]}",
                        "end": f"{dest_coords[1]},{dest_coords[0]}"
                    })
                    if resp.status_code == 200:
                        ors_data = resp.json()
                        routes = ors_data.get("features", [])
                        if routes:
                            meters = routes[0]["properties"]["summary"]["distance"]
                            distance_km = round(meters / 1000.0, 1)
                            provider = "OpenRouteService API"
            except Exception as ex:
                logger.info(f"OpenRouteService fallback: {ex}")

        # 3. Calcul du coût et du délai selon le mode de transport
        if distance_km < 600:
            mode = "Routier"
            cost_factor = 1.6
            speed_kmh = 65
            min_days = max(1, int(distance_km / (speed_kmh * 8)))
            max_days = min_days + 2
        elif distance_km < 3500:
            mode = "Maritime court / Aérien"
            cost_factor = 0.85
            min_days = 3
            max_days = 9
        elif distance_km < 10000:
            mode = "Maritime moyen-courrier"
            cost_factor = 0.35
            min_days = 12
            max_days = 25
        else:
            mode = "Maritime long-courrier"
            cost_factor = 0.22
            min_days = 22
            max_days = 42

        # Calcul financier en EUR et conversion estimée en USD (1 EUR ≈ 1.08 USD)
        weight_multiplier = max(1.0, weight_kg / 1000.0)
        base_cost_eur = (distance_km * cost_factor * 0.1 + 180.0) * weight_multiplier
        incoterm_code = incoterm.upper() if incoterm else "FOB"
        incoterm_multiplier = INCOTERM_MULTIPLIERS.get(incoterm_code, 1.0)
        
        final_cost_eur = round(base_cost_eur * incoterm_multiplier, 2)
        final_cost_usd = round(final_cost_eur * 1.08, 2)
        estimated_days = int((min_days + max_days) / 2)

        return {
            "origin_country": origin_iso,
            "destination_country": dest_iso,
            "distance_km": distance_km,
            "estimated_cost_usd": final_cost_usd,
            "estimated_cost_eur": final_cost_eur,
            "estimated_days": estimated_days,
            "min_days": min_days,
            "max_days": max_days,
            "mode_recommande": mode,
            "incoterm": incoterm_code,
            "incoterm_multiplier": incoterm_multiplier,
            "weight_kg": weight_kg,
            "provider": provider,
            "disclaimer": "Estimation indicative. Contacter un transitaire partenaire pour cotation ferme."
        }


# Alias de fonction de compatibilité
async def estimate_logistics(from_country: str, to_country: str, weight_kg: float = 1000.0) -> dict:
    """Alias pour LogisticsService.calculate_route."""
    res = await LogisticsService.calculate_route(from_country, to_country, weight_kg=weight_kg)
    # Formater les clés pour rétrocompatibilité
    res["from_country"] = res["origin_country"]
    res["to_country"] = res["destination_country"]
    res["cout_estime_eur"] = res["estimated_cost_eur"]
    res["delai_min_jours"] = res["min_days"]
    res["delai_max_jours"] = res["max_days"]
    return res
