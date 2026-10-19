from dataclasses import dataclass
import os
from typing import Optional


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value


def _get_optional_env(name: str) -> Optional[str]:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return None
    return value.strip()


def _parse_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str = "local"
    app_name: str = "Jolly"
    app_version: str = "0.2.0"
    log_level: str = "INFO"
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
    database_url: Optional[str] = None
    llm_api_key: Optional[str] = None
    embedding_api_key: Optional[str] = None
    storage_bucket: Optional[str] = None
    vector_database_url: Optional[str] = None
    # Bolna voice layer (https://www.bolna.ai/docs/api-reference/introduction)
    bolna_api_key: Optional[str] = None
    bolna_base_url: str = "https://api.bolna.ai"
    bolna_agent_id: Optional[str] = None
    bolna_from_number: Optional[str] = None
    # Shared secret Bolna sends back to us (query param or header) on
    # webhooks and custom-function tool calls. Optional for local dev.
    bolna_webhook_secret: Optional[str] = None


def get_settings() -> Settings:
    cors_origins = _parse_csv(
        _get_env("CORS_ORIGINS", "http://localhost:5173")
    )

    return Settings(
        app_env=_get_env("APP_ENV", "local"),
        app_name=_get_env("APP_NAME", "Jolly"),
        app_version=_get_env("APP_VERSION", "0.2.0"),
        log_level=_get_env("LOG_LEVEL", "INFO").upper(),
        cors_origins=tuple(cors_origins),
        database_url=_get_optional_env("DATABASE_URL"),
        llm_api_key=_get_optional_env("LLM_API_KEY"),
        embedding_api_key=_get_optional_env("EMBEDDING_API_KEY"),
        storage_bucket=_get_optional_env("STORAGE_BUCKET"),
        vector_database_url=_get_optional_env("VECTOR_DATABASE_URL"),
        bolna_api_key=_get_optional_env("BOLNA_API_KEY"),
        bolna_base_url=_get_env("BOLNA_BASE_URL", "https://api.bolna.ai").rstrip("/"),
        bolna_agent_id=_get_optional_env("BOLNA_AGENT_ID"),
        bolna_from_number=_get_optional_env("BOLNA_FROM_NUMBER"),
        bolna_webhook_secret=_get_optional_env("BOLNA_WEBHOOK_SECRET"),
    )
