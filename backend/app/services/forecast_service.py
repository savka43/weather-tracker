import asyncio
import logging
from collections import Counter
from collections.abc import Iterable
from statistics import mean, pstdev

import httpx

from app.providers.base import WeatherProvider
from app.providers.open_meteo import OpenMeteoProvider
from app.schemas.weather import HourlyForecastItem, SourceForecast, WeatherResponse, WeatherSourceForecast

logger = logging.getLogger(__name__)

PROVIDERS: list[WeatherProvider] = [OpenMeteoProvider()]


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


def average_forecast(sources: list[SourceForecast]) -> dict:
    hours = min(len(source.hourly) for source in sources)
    hourly = [
        HourlyForecastItem(
            time=sources[0].hourly[index].time,
            temperature=round(mean(source.hourly[index].temperature for source in sources), 1),
            rain_probability=round(mean(source.hourly[index].rain_probability for source in sources)),
            condition=most_common(source.hourly[index].condition for source in sources),
        )
        for index in range(hours)
    ]

    return {
        "temperature": round(mean(source.temperature for source in sources), 1),
        "condition": most_common(source.condition for source in sources) or "Cloudy",
        "humidity": round(mean(source.humidity for source in sources)),
        "wind_speed": round(mean(source.wind_speed for source in sources), 1),
        "pressure": round(mean(source.pressure for source in sources)),
        "rain_probability": round(mean(source.rain_probability for source in sources)),
        "hourly_forecast": hourly,
    }


async def get_forecast(client: httpx.AsyncClient, lat: float, lon: float, name: str | None) -> WeatherResponse:
    sources = await collect_sources(client, lat, lon)

    if not sources:
        raise NoSourcesError("no weather provider responded")

    return WeatherResponse(
        city=(name or "").strip() or f"{lat:.2f}, {lon:.2f}",
        country=None,
        confidence=spread_confidence(sources),
        summary=None,
        sources=[
            WeatherSourceForecast(
                source=source.source,
                temperature=source.temperature,
                rain_probability=source.rain_probability,
                wind_speed=source.wind_speed,
            )
            for source in sources
        ],
        ai_failed=True,
        ai_error="not_configured",
        **average_forecast(sources),
    )
