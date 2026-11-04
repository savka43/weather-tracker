import httpx

from app.providers.base import ProviderError
from app.schemas.weather import Condition, HourlyForecastItem, SourceForecast

FORECAST_URL = "https://api.weatherapi.com/v1/forecast.json"
HOURS = 6

CLEAR = {1000}
CLOUDY = {1003, 1006, 1009}
FOG = {1030, 1135, 1147}
THUNDER = {1087, 1273, 1276, 1279, 1282}
SNOW = {1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264}


def condition_from_code(code: int) -> Condition:
    if code in CLEAR:
        return "Clear"
    if code in CLOUDY:
        return "Cloudy"
    if code in FOG:
        return "Fog"
    if code in THUNDER:
        return "Thunderstorm"
    if code in SNOW:
        return "Snow"
    return "Rain"


def precipitation_chance(hour: dict) -> int:
    return int(max(hour.get("chance_of_rain") or 0, hour.get("chance_of_snow") or 0))


def kph_to_ms(value: float) -> float:
    return round(value / 3.6, 1)


class WeatherApiProvider:
    name = "WeatherAPI"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(self, client: httpx.AsyncClient, lat: float, lon: float) -> SourceForecast:
        # days=2: окно в 6 часов может перейти через полночь.
        params = {"key": self.api_key, "q": f"{lat},{lon}", "days": 2, "aqi": "no", "alerts": "no"}

        try:
            response = await client.get(FORECAST_URL, params=params)
            response.raise_for_status()
            data = response.json()
            current = data["current"]
            now = data["location"]["localtime_epoch"]

            hours = [hour for day in data["forecast"]["forecastday"] for hour in day["hour"]]
            upcoming = [hour for hour in hours if hour["time_epoch"] > now - 3600][:HOURS]
            items = [
                HourlyForecastItem(
                    time=hour["time"][-5:],
                    temperature=round(hour["temp_c"], 1),
                    rain_probability=precipitation_chance(hour),
                    condition=condition_from_code(int(hour["condition"]["code"])),
                )
                for hour in upcoming
            ]

            return SourceForecast(
                source=self.name,
                temperature=round(current["temp_c"], 1),
                condition=condition_from_code(int(current["condition"]["code"])),
                humidity=int(current["humidity"]),
                wind_speed=kph_to_ms(current["wind_kph"]),
                pressure=round(current["pressure_mb"]),
                rain_probability=items[0].rain_probability if items else 0,
                hourly=items,
            )
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
            raise ProviderError(f"{self.name}: {type(error).__name__}") from error
