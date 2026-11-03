from pydantic import BaseModel


class WeatherBase(BaseModel):
    city: str
    temperature: float
    condition: str
    humidity: int | None = None
    wind_speed: float | None = None
    pressure: int | None = None
    visibility: float | None = None


class HourlyForecastItem(BaseModel):
    time: str
    temperature: float
    rain_probability: int
    condition: str | None = None


class WeatherSourceForecast(BaseModel):
    source: str
    temperature: float
    rain_probability: int
    wind_speed: float
    confidence: int | None = None


class SourceForecast(BaseModel):
    source: str
    temperature: float
    condition: str
    humidity: int
    wind_speed: float
    pressure: int
    rain_probability: int
    hourly: list[HourlyForecastItem]


class WeatherResponse(BaseModel):
    city: str
    country: str | None = None
    temperature: float
    condition: str
    humidity: int
    wind_speed: float
    pressure: int
    rain_probability: int
    confidence: int | None
    summary: str | None
    hourly_forecast: list[HourlyForecastItem]
    sources: list[WeatherSourceForecast]
    ai_failed: bool = False
    ai_error: str | None = None


class ComparisonResponse(BaseModel):
    city: str
    sources: list[WeatherSourceForecast]
