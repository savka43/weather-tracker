import asyncio
import logging
import time
from collections import Counter
from collections.abc import Iterable
from statistics import mean, pstdev

import httpx

from app.ai.client import AIError, LLMClient
from app.ai.decider import cache_key, decide
from app.config import settings
from app.providers.base import WeatherProvider
from app.providers.open_meteo import OpenMeteoProvider
from app.providers.openweather import OpenWeatherProvider
from app.providers.weatherapi import WeatherApiProvider
from app.services.tips import build_tips
from app.schemas.weather import AiError as AiErrorCode, HourlyForecastItem, SourceForecast, WeatherResponse, WeatherSourceForecast

logger = logging.getLogger(__name__)


def build_providers() -> list[WeatherProvider]:
    """Open-Meteo работает без ключа; остальные подключаются, только если ключ задан в .env."""
    providers: list[WeatherProvider] = [OpenMeteoProvider()]
    if settings.openweather_api_key:
        providers.append(OpenWeatherProvider(settings.openweather_api_key))
    if settings.weatherapi_key:
        providers.append(WeatherApiProvider(settings.weatherapi_key))
    return providers


PROVIDERS: list[WeatherProvider] = build_providers()


class NoSourcesError(Exception):
    pass


async def collect_sources(client: httpx.AsyncClient, lat: float, lon: float) -> list[SourceForecast]:
    results = await asyncio.gather(
        *(provider.fetch(client, lat, lon) for provider in PROVIDERS),
        return_exceptions=True,
    )

    sources: list[SourceForecast] = []
    for provider, result in zip(PROVIDERS, results):
        if isinstance(result, BaseException):
            logger.warning("provider %s failed: %s", provider.name, result)
        else:
            sources.append(result)

    return sources


def spread_confidence(sources: list[SourceForecast]) -> int | None:
    if len(sources) < 2:
        return None

    temperature_spread = pstdev(source.temperature for source in sources)
    rain_spread = pstdev(source.rain_probability for source in sources)

    return max(0, min(100, round(100 - temperature_spread * 15 - rain_spread * 0.8)))


def most_common(values: Iterable[str | None]) -> str | None:
    counter = Counter(value for value in values if value)
    return counter.most_common(1)[0][0] if counter else None


def average_hourly(sources: list[SourceForecast]) -> list[HourlyForecastItem]:
    """Шкала времени — у источника с самым подробным прогнозом; в каждый час усредняем тех, у кого он есть.

    У OpenWeather шаг 3 часа, поэтому выравниваем по времени, а не по индексу.
    """
    timeline = max(sources, key=lambda source: len(source.hourly)).hourly
    by_time = [{item.time: item for item in source.hourly} for source in sources]

    hourly: list[HourlyForecastItem] = []
    for slot in timeline:
        items = [hours[slot.time] for hours in by_time if slot.time in hours]
        hourly.append(
            HourlyForecastItem(
                time=slot.time,
                temperature=round(mean(item.temperature for item in items), 1),
                rain_probability=round(mean(item.rain_probability for item in items)),
                condition=most_common(item.condition for item in items),
            )
        )
    return hourly


def average_forecast(sources: list[SourceForecast]) -> dict:
    hourly = average_hourly(sources)

    return {
        "temperature": round(mean(source.temperature for source in sources), 1),
        "condition": most_common(source.condition for source in sources) or "Cloudy",
        "humidity": round(mean(source.humidity for source in sources)),
        "wind_speed": round(mean(source.wind_speed for source in sources), 1),
        "pressure": round(mean(source.pressure for source in sources)),
        "rain_probability": round(mean(source.rain_probability for source in sources)),
        "hourly_forecast": hourly,
    }


async def get_forecast(
    client: httpx.AsyncClient,
    ai: LLMClient | None,
    lat: float,
    lon: float,
    name: str | None,
    lang: str,
) -> WeatherResponse:
    sources = await collect_sources(client, lat, lon)

    if not sources:
        raise NoSourcesError("no weather provider responded")

    city = (name or "").strip() or f"{lat:.2f}, {lon:.2f}"
    average = average_forecast(sources)
    base = {
        "city": city,
        "country": None,
        "humidity": average["humidity"],
        "pressure": average["pressure"],
        "sources": [
            WeatherSourceForecast(
                source=source.source,
                temperature=source.temperature,
                rain_probability=source.rain_probability,
                wind_speed=source.wind_speed,
            )
            for source in sources
        ],
    }

    def fallback(code: AiErrorCode) -> WeatherResponse:
        return WeatherResponse(
            **base,
            temperature=average["temperature"],
            condition=average["condition"],
            wind_speed=average["wind_speed"],
            rain_probability=average["rain_probability"],
            hourly_forecast=average["hourly_forecast"],
            confidence=spread_confidence(sources),
            reasoning=None,
            recommendations=build_tips(
                average["temperature"],
                average["condition"],
                average["wind_speed"],
                average["rain_probability"],
                average["hourly_forecast"],
                lang,
            ),
            ai_failed=True,
            ai_error=code,
        )

    if ai is None:
        return fallback("not_configured")

    timeline = [item.time for item in average["hourly_forecast"]]
    started = time.monotonic()
    try:
        decision = await decide(ai, sources, timeline, city, lang, cache_key(lat, lon, lang), settings.ai_timeout_seconds)
    except AIError as error:
        logger.warning(
            "ai failed: code=%s city=%s duration=%.2fs detail=%s",
            error.code, city, time.monotonic() - started, error,
        )
        return fallback(error.code)  # type: ignore[arg-type]

    conditions = {item.time: item.condition for item in average["hourly_forecast"]}
    return WeatherResponse(
        **base,
        temperature=decision.temperature,
        condition=decision.condition,
        wind_speed=decision.wind_speed,
        rain_probability=decision.rain_probability,
        hourly_forecast=[
            item.model_copy(update={"condition": item.condition or conditions.get(item.time)}) for item in decision.hourly
        ],
        confidence=decision.confidence,
        trusted_sources=decision.trusted_sources,
        reasoning=decision.reasoning,
        recommendations=decision.recommendations,
        ai_failed=False,
        ai_error=None,
    )
