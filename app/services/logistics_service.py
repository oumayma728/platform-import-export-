from math import asin, cos, radians, sin, sqrt

# Coordonnées de secours : les applications peuvent remplacer ce dictionnaire ou brancher OpenRouteService.
COUNTRIES = {"NG": (9.08, 8.68), "FR": (46.23, 2.21), "US": (37.09, -95.71), "CN": (35.86, 104.19), "DE": (51.17, 10.45), "GB": (55.38, -3.44)}

def estimate(origin: str, destination: str, cost_per_km: float = 0.75):
    a, b = COUNTRIES.get(origin.upper()), COUNTRIES.get(destination.upper())
    if not a or not b: raise ValueError("Pays inconnu : utilisez les codes ISO pris en charge (NG, FR, US, CN, DE, GB)")
    lat1, lon1, lat2, lon2 = map(radians, [a[0], a[1], b[0], b[1]])
    distance = 2 * 6371 * asin(sqrt(sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)**2))
    return {"origin": origin.upper(), "destination": destination.upper(), "distance_km": round(distance, 1), "estimated_cost_usd": round(distance * cost_per_km, 2), "estimated_days": max(1, round(distance / 650))}
