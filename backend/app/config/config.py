from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Platform Import Export API"
    VERSION: str = "1.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_key_change_me_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/platform_import_export"
    REDIS_URL: str = "redis://localhost:6379/0"
    ORS_API_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PACK: str = ""
    STRIPE_PRICE_SUB: str = ""
    API_NINJAS_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    @property
    def sync_database_url(self) -> str:
        if "?schema=" in self.DATABASE_URL:
            return self.DATABASE_URL.split("?")[0]
        return self.DATABASE_URL
        
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
