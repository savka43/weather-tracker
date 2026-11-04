import asyncio
from datetime import datetime, timedelta, timezone

import httpx

from app.providers.base import ProviderError
from app.schemas.weather import Condition, HourlyForecastItem, SourceForecast

BASE_URL = "https://api.openweathermap.org/data/2.5"
HOURS = 6


def condition_from_owm(code: int) -> Condition:
    if 200 <= code < 300:
        return "Thunderstorm"
    if 300 <= code < 600:
        return "Rain"
    if 600 <= code < 700:
        return "Snow"
    if 700 <= code < 800:
        return "Fog"
    if code in (800, 801):
        return "Clear"
    return "Cloudy"


def local_time(timestamp: int, offset_seconds: int) -> str:
    moment = datetime.fromtimestamp(timestamp, tz=timezone.utc) + timedelta(seconds=offset_seconds)
    return moment.strftime("%H:%M")


class OpenWeatherProvider:
    """Бесплатный тариф: текущая погода + прогноз с шагом 3 часа."""

    name = "OpenWeather"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(self, client: httpx.AsyncClient, lat: float, lon: float) -> SourceForecast:
        params = {"lat": lat, "lon": lon, "appid": self.api_key, "units": "metric"}

        try:
            current_response, forecast_response = await asyncio.gather(
                client.get(f"{BASE_URL}/weather", params=params),
                client.get(f"{BASE_URL}/forecast", params={**params, "cnt": 3}),
            )
            current_response.raise_for_status()
            forecast_response.raise_for_status()
            current = current_response.json()
            forecast = forecast_response.json()

            now = current["dt"]
            offset = forecast["city"]["timezone"]
            slots = [slot for slot in forecast["list"] if slot["dt"] < now + HOURS * 3600]
            items = [
                HourlyForecastItem(
                    time=local_time(slot["dt"], offset),
                    temperature=round(slot["main"]["temp"], 1),
                    rain_probability=round(slot.get("pop", 0) * 100),
                    condition=condition_from_owm(int(slot["weather"][0]["id"])),
                )
                for slot in slots
            ]

            return SourceForecast(
                source=self.name,
                temperature=round(current["main"]["temp"], 1),
                condition=condition_from_owm(int(current["weather"][0]["id"])),
                humidity=int(current["main"]["humidity"]),
                wind_speed=round(current["wind"]["speed"], 1),
                pressure=round(current["main"]["pressure"]),
                rain_probability=items[0].rain_probability if items else 0,
                hourly=items,
                utc_offset_seconds=offset,
            )
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
            raise ProviderError(f"{self.name}: {type(error).__name__}") from error
