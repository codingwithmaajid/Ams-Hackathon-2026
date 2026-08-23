from dataclasses import dataclass
import os
from typing import Optional


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value


def _parse_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str = "local"
    app_name: str = "AIRA"
    app_version: str = "0.1.0"
    log_level: str = "INFO"
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
    database_url: Optional[str] = None
    llm_api_key: Optional[str] = None
    embedding_api_key: Optional[str] = None
    voice_api_key: Optional[str] = None
    storage_bucket: Optional[str] = None
    vector_database_url: Optional[str] = None


def get_settings() -> Settings:
    cors_origins = _parse_csv(
        _get_env("CORS_ORIGINS", "http://localhost:5173")
    )

    return Settings(
        app_env=_get_env("APP_ENV", "local"),
        app_name=_get_env("APP_NAME", "AIRA"),
        app_version=_get_env("APP_VERSION", "0.1.0"),
        log_level=_get_env("LOG_LEVEL", "INFO").upper(),
        cors_origins=tuple(cors_origins),
        database_url=os.getenv("DATABASE_URL"),
        llm_api_key=os.getenv("LLM_API_KEY"),
        embedding_api_key=os.getenv("EMBEDDING_API_KEY"),
        voice_api_key=os.getenv("VOICE_API_KEY"),
        storage_bucket=os.getenv("STORAGE_BUCKET"),
        vector_database_url=os.getenv("VECTOR_DATABASE_URL"),
    )
