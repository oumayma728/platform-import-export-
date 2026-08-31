# pyrefly: ignore [missing-import]
import redis
from app.config.config import settings

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

def get_cached_value(key: str) -> str | None:
    try:
        return redis_client.get(key)
    except Exception as e:
        return None

def set_cached_value(key: str, value: str, ttl_seconds: int = 3600) -> bool:
    try:
        redis_client.setex(key, ttl_seconds, value)
        return True
    except Exception as e:
        return False
