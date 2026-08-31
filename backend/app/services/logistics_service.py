import math
import requests
from app.config.config import settings
from app.utils.country_utils import get_country_info

class LogisticsService:
    def __init__(self):
        self.ors_api_key = settings.ORS_API_KEY

    def get_country_coordinates(self, country_name: str):
        info = get_country_info(country_name)
        if info and info.get("latlng") and len(info["latlng"]) == 2:
            return info["latlng"][0], info["latlng"][1]
        return None, None

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a)) 
        
        r = 6371 
        return c * r

    def get_ors_distance(self, lon1, lat1, lon2, lat2):
        if not self.ors_api_key:
            return None
            
        try:
            headers = {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Authorization': self.ors_api_key,
                'Content-Type': 'application/json; charset=utf-8'
            }
            body = {"coordinates": [[lon1, lat1], [lon2, lat2]]}
            response = requests.post('https://api.openrouteservice.org/v2/directions/driving-car', json=body, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                dist_m = data['routes'][0]['summary']['distance']
                return dist_m / 1000.0
        except Exception as e:
            print(f"Erreur API ORS : {e}")
            
        return None

    def calculate_route(self, origin_country: str, destination_country: str):
        lat1, lon1 = self.get_country_coordinates(origin_country)
        lat2, lon2 = self.get_country_coordinates(destination_country)
        
        if lat1 is None or lat2 is None:
            return {
                "error": f"Impossible de localiser avec précision '{origin_country}' ou '{destination_country}'.",
                "distance_km": 0,
                "estimated_cost_usd": 0,
                "estimated_days": 0
            }
            
        distance_km = self.get_ors_distance(lon1, lat1, lon2, lat2)
        provider = "Fret Routier (OpenRouteService)"
        
        if distance_km is None:
            distance_km = self.haversine_distance(lat1, lon1, lat2, lon2)
            provider = "Fret Maritime/Aérien (Distance Directe)"
            
        distance_km = round(distance_km, 2)
        
        estimated_days = max(1, math.ceil(distance_km / 500))
        
        estimated_cost_usd = round(distance_km * 1.5, 2)
        
        from app.utils.country_utils import get_country_info
        from app.services.currency_service import currency_service
        
        origin_info = get_country_info(origin_country)
        origin_currency = "USD"
        if origin_info and "currency" in origin_info:
            origin_currency = origin_info["currency"]
            
        estimated_cost_local = currency_service.convert(estimated_cost_usd, "USD", origin_currency)
        
        return {
            "origin": origin_country,
            "destination": destination_country,
            "provider": provider,
            "distance_km": distance_km,
            "estimated_cost_usd": estimated_cost_usd,
            "estimated_cost_local": estimated_cost_local,
            "currency": origin_currency,
            "estimated_days": estimated_days
        }

logistics_service = LogisticsService()
