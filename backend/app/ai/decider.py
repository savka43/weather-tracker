"""Сбор контекста → вызов LLM → проверенный Decision. Один повтор, кэш на 10 минут."""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.ai.client import AIError, LLMClient
from app.ai.validator import check_ranges, parse_decision
from app.schemas.decision import Decision
from app.schemas.weather import SourceForecast

logger = logging.getLogger(__name__)

PROMPT_VERSION = "decide_v1"
PROMPTS_DIR = Path(__file__).parent / "prompts"
LANGUAGES = {"ru": "Russian", "en": "English"}
CACHE_TTL_SECONDS = 600
STAT_FIELDS = ("temperature", "rain_probability", "wind_speed", "humidity", "pressure")
CONDITIONS = ["Clear", "Cloudy", "Fog", "Rain", "Snow", "Thunderstorm"]

# Схема для structured output. Числовые границы не задаём — их проверяют Pydantic и validator.
DECISION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "temperature", "condition", "rain_probability", "wind_speed", "confidence",
        "trusted_sources", "reasoning", "recommendations", "hourly",
    ],
    "properties": {
        "temperature": {"type": "number"},
        "condition": {"type": "string", "enum": CONDITIONS},
        "rain_probability": {"type": "integer"},
        "wind_speed": {"type": "number"},
        "confidence": {"type": "integer"},
        "trusted_sources": {"type": "array", "items": {"type": "string"}},
        "reasoning": {"type": "string"},
        "recommendations": {"type": "array", "items": {"type": "string"}},
        "hourly": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["time", "temperature", "rain_probability"],
                "properties": {
                    "time": {"type": "string"},
                    "temperature": {"type": "number"},
                    "rain_probability": {"type": "integer"},
                },
            },
        },
    },
}


@lru_cache
def load_prompt(version: str = PROMPT_VERSION) -> str:
    return (PROMPTS_DIR / f"{version}.md").read_text(encoding="utf-8")


def system_prompt(lang: str) -> str:
    return load_prompt().replace("{language}", LANGUAGES.get(lang, "English"))


def source_stats(sources: list[SourceForecast]) -> dict[str, dict[str, float]]:
    stats = {}
    for field in STAT_FIELDS:
        values = [getattr(source, field) for source in sources]
        stats[field] = {"min": min(values), "max": max(values), "spread": round(max(values) - min(values), 1)}
    return stats


def local_now(sources: list[SourceForecast]) -> datetime:
    offset = next((source.utc_offset_seconds for source in sources if source.utc_offset_seconds is not None), 0)
    return datetime.now(timezone.utc) + timedelta(seconds=offset)


def time_of_day(hour: int) -> str:
    if hour < 6:
        return "night"
    if hour < 12:
        return "morning"
    if hour < 18:
        return "afternoon"
    return "evening"


def build_user_message(sources: list[SourceForecast], timeline: list[str], city: str) -> str:
    now = local_now(sources)
    context = {
        "location": city,
        "local_datetime": now.strftime("%Y-%m-%d %H:%M"),
        "time_of_day": time_of_day(now.hour),
        "timeline": timeline,
        "stats": source_stats(sources),
        "sources": [source.model_dump(exclude={"utc_offset_seconds"}) for source in sources],
    }
    return json.dumps(context, ensure_ascii=False)


class DecisionCache:
    def __init__(self, ttl: float = CACHE_TTL_SECONDS):
        self.ttl = ttl
        self._items: dict[str, tuple[float, Decision]] = {}

    def get(self, key: str) -> Decision | None:
        item = self._items.get(key)
        if item is None:
            return None
        expires, decision = item
        if expires < time.monotonic():
            del self._items[key]
            return None
        return decision

    def set(self, key: str, decision: Decision) -> None:
        now = time.monotonic()
        self._items = {k: v for k, v in self._items.items() if v[0] >= now}
        self._items[key] = (now + self.ttl, decision)

    def clear(self) -> None:
        self._items.clear()


cache = DecisionCache()


def cache_key(lat: float, lon: float, lang: str) -> str:
    """Город (координаты, округлённые до ~1 км) + час + язык ответа."""
    return f"{lat:.2f},{lon:.2f}|{datetime.now(timezone.utc):%Y-%m-%dT%H}|{lang}"


async def decide(
    client: LLMClient,
    sources: list[SourceForecast],
    timeline: list[str],
    city: str,
    lang: str,
    key: str,
    timeout: float,
) -> Decision:
    cached = cache.get(key)
    if cached is not None:
        return cached

    system = system_prompt(lang)
    user = build_user_message(sources, timeline, city)

    for attempt in (1, 2):
        try:
            try:
                text = await asyncio.wait_for(client.complete_json(system, user, DECISION_SCHEMA), timeout)
            except TimeoutError as error:
                raise AIError("timeout", retry=True) from error
            decision = parse_decision(text)
            check_ranges(decision, sources, timeline)
        except AIError as error:
            if attempt == 1 and error.retry:
                logger.info("ai retry: code=%s city=%s", error.code, city)
                await asyncio.sleep(error.pause)
                continue
            raise
        cache.set(key, decision)
        return decision

    raise AssertionError("unreachable")
