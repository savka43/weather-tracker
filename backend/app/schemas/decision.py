from pydantic import BaseModel, ConfigDict, Field

from app.schemas.weather import Condition, HourlyForecastItem


class Decision(BaseModel):
    """Итоговый прогноз, который возвращает ИИ. Диапазоны относительно источников проверяет validator."""

    model_config = ConfigDict(extra="forbid")

    temperature: float
    condition: Condition
    rain_probability: int = Field(ge=0, le=100)
    wind_speed: float = Field(ge=0)
    confidence: int = Field(ge=0, le=100)
    trusted_sources: list[str]
    reasoning: str = Field(min_length=1)
    recommendations: list[str]
    hourly: list[HourlyForecastItem]
