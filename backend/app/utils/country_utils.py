import json
import requests
import unicodedata
from app.utils.redis_cache import get_cached_value, set_cached_value

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = str(text).lower().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')



def translate_to_english(name: str):
    try:
        import requests
        url = f"https://nominatim.openstreetmap.org/search?country={name}&format=json&accept-language=en"
        headers = {"User-Agent": "PlatformImportExportAPI/1.0"}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                english_name = data[0].get("name")
                lat = data[0].get("lat")
                lon = data[0].get("lon")
                if english_name:
                    return english_name, float(lat) if lat else None, float(lon) if lon else None
    except:
        pass
    return name, None, None

def get_country_info(search_name: str):
    search_norm = normalize_text(search_name)
    if not search_norm:
        return None
        
    cache_key = f"country_info_apininjas_{search_norm}"
    cached = get_cached_value(cache_key)
    if cached:
        try:
            parsed = json.loads(cached)
            # Invalidate old cache entries that don't have latlng
            if "latlng" in parsed:
                return parsed
        except:
            pass

    english_name, lat, lon = translate_to_english(search_norm)
    
    try:
        from app.config.config import settings
        url = f"https://api.api-ninjas.com/v1/country?name={english_name}"
        headers = {'X-Api-Key': settings.API_NINJAS_KEY}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                country_data = data[0]
                currency = country_data.get("currency", {})
                currency_code = currency.get("code")
                
                result = {
                    "currency": currency_code
                }
                if lat is not None and lon is not None:
                    result["latlng"] = [lat, lon]
                    
                set_cached_value(cache_key, json.dumps(result), ttl_seconds=86400)
                return result
    except Exception as e:
        pass
        
    return None
