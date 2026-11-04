from typing import Annotated, Literal

from pydantic import BaseModel, Field

Condition = Literal["Clear", "Cloudy", "Fog", "Rain", "Snow", "Thunderstorm"]

AiError = Literal[
    "timeout",
    "rate_limited",
    "provider_error",
    "auth_error",
    "billing_error",
    "network_error",
    "invalid_json",
    "out_of_range",
    "not_configured",
]

Percent = Annotated[int, Field(ge=0, le=100)]


class HourlyForecastItem(BaseModel):
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    temperature: float
    rain_probability: Percent
    condition: Condition | None = None


class SourceForecast(BaseModel):
    source: str
    temperature: float
    condition: Condition
    humidity: Percent
    wind_speed: float = Field(ge=0)
    pressure: int
    rain_probability: Percent
    hourly: list[HourlyForecastItem]
    utc_offset_seconds: int | None = None


class WeatherSourceForecast(BaseModel):
    source: str
    temperature: float
    rain_probability: int
    wind_speed: float
    confidence: int | None = None


class WeatherResponse(BaseModel):
    city: str
    country: str | None = None
    temperature: float
    condition: Condition
    humidity: int
    wind_speed: float
    pressure: int
    rain_probability: int
    confidence: int | None
    trusted_sources: list[str] = []
    reasoning: str | None = None
    recommendations: list[str] = []
    hourly_forecast: list[HourlyForecastItem]
    sources: list[WeatherSourceForecast]
    ai_failed: bool = False
    ai_error: AiError | None = None
