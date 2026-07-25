from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Platform Import Export API"
    VERSION: str = "1.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_key_change_me_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/platform_import_export"

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
