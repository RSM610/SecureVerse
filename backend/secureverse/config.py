"""SecureVerse application configuration."""
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str
    infura_url: str
    didregistry_address: str
    rbacmanager_address: str
    auditlog_address: str
    hmac_secret: str
    rs256_private_key_path: str = "./private.pem"
    rs256_public_key_path: str = "./public.pem"
    cors_origins: str = "http://localhost:5173"

    infura_project_id: Optional[str] = None
    deployer_private_key: Optional[str] = None

    def get_cors_origins(self) -> list[str]:
        """Return list of allowed CORS origins."""
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
