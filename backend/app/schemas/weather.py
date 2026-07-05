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
    condition: str
    humidity: int
    wind_speed: float
    pressure: int
    rain_probability: int
    confidence: int
    summary: str
    hourly_forecast: list[HourlyForecastItem]
    sources: list[WeatherSourceForecast]


class ComparisonResponse(BaseModel):
    city: str
    sources: list[WeatherSourceForecast]
