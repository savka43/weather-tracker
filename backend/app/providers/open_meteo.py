from datetime import datetime

import httpx

from app.providers.base import ProviderError
from app.schemas.weather import Condition, HourlyForecastItem, SourceForecast

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
HOURS = 6


def condition_from_wmo(code: int) -> Condition:
    if code in (0, 1):
        return "Clear"
    if code in (2, 3):
        return "Cloudy"
    if code in (45, 48):
        return "Fog"
    if code in (71, 73, 75, 77, 85, 86):
        return "Snow"
    if code >= 95:
        return "Thunderstorm"
    if 51 <= code <= 67 or 80 <= code <= 82:
        return "Rain"
    return "Cloudy"


class OpenMeteoProvider:
    name = "Open-Meteo"

    async def fetch(self, client: httpx.AsyncClient, lat: float, lon: float) -> SourceForecast:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl",
            "hourly": "temperature_2m,precipitation_probability,weather_code",
            "forecast_hours": HOURS,
            "timezone": "auto",
            "wind_speed_unit": "ms",
        }

        try:
            response = await client.get(FORECAST_URL, params=params)
            response.raise_for_status()
            data = response.json()
            current = data["current"]
            hourly = data["hourly"]
        except (httpx.HTTPError, KeyError, ValueError) as error:
            raise ProviderError(f"{self.name}: {error}") from error

        probabilities = [value or 0 for value in hourly.get("precipitation_probability", [])]
        codes = hourly.get("weather_code") or [None] * len(hourly["time"])
        items = [
            HourlyForecastItem(
                time=datetime.fromisoformat(time).strftime("%H:%M"),
                temperature=round(temperature, 1),
                rain_probability=int(probability),
                condition=condition_from_wmo(int(code)) if code is not None else None,
            )
            for time, temperature, probability, code in zip(hourly["time"], hourly["temperature_2m"], probabilities, codes)
        ]

        return SourceForecast(
            source=self.name,
            temperature=round(current["temperature_2m"], 1),
            condition=condition_from_wmo(int(current["weather_code"])),
            humidity=int(current["relative_humidity_2m"]),
            wind_speed=round(current["wind_speed_10m"], 1),
            pressure=round(current["pressure_msl"]),
            rain_probability=int(probabilities[0]) if probabilities else 0,
            hourly=items,
            utc_offset_seconds=data.get("utc_offset_seconds"),
        )
