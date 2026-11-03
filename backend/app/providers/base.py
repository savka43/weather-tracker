from typing import Protocol

import httpx

from app.schemas.weather import SourceForecast


class ProviderError(Exception):
    pass


class WeatherProvider(Protocol):
    name: str

    async def fetch(self, client: httpx.AsyncClient, lat: float, lon: float) -> SourceForecast: ...
