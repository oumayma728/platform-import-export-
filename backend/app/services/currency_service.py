import requests
import json
from app.config.config import settings
from app.utils.redis_cache import get_cached_value, set_cached_value

class CurrencyService:
    def __init__(self):
        self.api_url = "https://api.exchangerate-api.com/v4/latest"
        
    def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()

        if from_currency == to_currency:
            return 1.0

        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        cached_rate = get_cached_value(cache_key)
        
        if cached_rate:
            return float(cached_rate)

        rate = 1.0
        try:
            url = f"{self.api_url}/{from_currency}"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                if to_currency in rates:
                    rate = rates[to_currency]
        except Exception as e:
            print(f"Erreur appel API de devise: {e}")
            pass
            
        set_cached_value(cache_key, str(rate), ttl_seconds=3600)
        return float(rate)

    def convert(self, amount: float, from_currency: str, to_currency: str) -> float:
        if not amount or from_currency == to_currency:
            return amount
            
        rate = self.get_exchange_rate(from_currency, to_currency)
        return round(amount * rate, 2)

currency_service = CurrencyService()
