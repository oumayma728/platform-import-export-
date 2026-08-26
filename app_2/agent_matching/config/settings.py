from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@localhost:5432/agent_matching_db"
    listings_api_url: str = "http://localhost:8001/api/listings"
    trust_api_url: str = "http://localhost:8004/api/trust"
    logistics_api_url: str = "http://localhost:8002/api/logistics"
    notification_webhook_url: str = "http://localhost:8002/api/notify"
    score_threshold_high: float = 0.8
    use_mock_data: bool = True
    frontend_origin: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()