from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str
    infura_url: str
    didregistry_address: str
    rbacmanager_address: str
    auditlog_address: str
    hmac_secret: str
    rs256_private_key_path: str = "./private.pem"
    rs256_public_key_path: str  = "./public.pem"
    cors_origins: str           = "http://localhost:5173"

    # Deployment-only fields (optional — only needed for hardhat deploy)
    infura_project_id:    Optional[str] = None
    deployer_private_key: Optional[str] = None

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

settings = Settings()