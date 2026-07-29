import json
import os
from math import asin, cos, radians, sin, sqrt

# Coordonnées des ~250 pays/territoires, embarquées localement (source : jeu de données
# ouvert mledoze/countries, licence ODbL). Ces coordonnées ne changent jamais dans le temps
# -> aucune raison de dépendre d'un appel réseau externe pour cette donnée statique,
# contrairement au taux de change ou aux paiements Stripe qui, eux, varient réellement.
_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "countries_coords.json")

with open(_DATA_PATH, encoding="utf-8") as f:
    COUNTRIES: dict[str, list[float]] = json.load(f)


def estimate(origin: str, destination: str, cost_per_km: float = 0.75):
    a = COUNTRIES.get(origin.upper())
    b = COUNTRIES.get(destination.upper())
    if not a or not b:
        raise ValueError("Pays inconnu : utilisez un code ISO 3166-1 alpha-2 (ex: FR, TN, US).")

    lat1, lon1, lat2, lon2 = map(radians, [a[0], a[1], b[0], b[1]])
    distance = 2 * 6371 * asin(sqrt(sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2))

    return {
        "origin": origin.upper(),
        "destination": destination.upper(),
        "distance_km": round(distance, 1),
        "estimated_cost_usd": round(distance * cost_per_km, 2),
        "estimated_days": max(1, round(distance / 650)),
    }