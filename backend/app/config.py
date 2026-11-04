import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _str(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, "").strip()
    return value or default


def _float(name: str, default: float) -> float:
    value = _str(name)
    return float(value) if value else default


def _list(name: str, default: list[str]) -> list[str]:
    value = _str(name)
    return [item.strip() for item in value.split(",") if item.strip()] if value else default


@dataclass(frozen=True)
class Settings:
    cors_origins: list[str]
    provider_timeout_seconds: float
    openweather_api_key: str | None
    weatherapi_key: str | None
    # LLM: провайдер и модель задаются конфигом, ключ — один на любой провайдер.
    llm_provider: str
    llm_api_key: str | None
    llm_model: str
    llm_base_url: str | None
    llm_effort: str | None
    ai_timeout_seconds: float

    @property
    def ai_configured(self) -> bool:
        return bool(self.llm_api_key)


settings = Settings(
    cors_origins=_list("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"]),
    provider_timeout_seconds=_float("PROVIDER_TIMEOUT_SECONDS", 8),
    openweather_api_key=_str("OPENWEATHER_API_KEY"),
    weatherapi_key=_str("WEATHERAPI_KEY"),
    llm_provider=(_str("LLM_PROVIDER", "anthropic") or "anthropic").lower(),
    llm_api_key=_str("LLM_API_KEY"),
    llm_model=_str("LLM_MODEL", "claude-sonnet-5-5") or "claude-sonnet-5-5",
    llm_base_url=_str("LLM_BASE_URL"),
    llm_effort=_str("LLM_EFFORT"),
    ai_timeout_seconds=_float("AI_TIMEOUT_SECONDS", 15),
)
