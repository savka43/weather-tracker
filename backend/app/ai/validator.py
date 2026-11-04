"""Проверка ответа ИИ: JSON по схеме Decision + значения в допустимых диапазонах."""

from pydantic import ValidationError

from app.ai.client import AIError
from app.schemas.decision import Decision
from app.schemas.weather import SourceForecast

MARGIN = 2.0
RANGE_ERRORS = {"greater_than", "greater_than_equal", "less_than", "less_than_equal"}


def parse_decision(text: str) -> Decision:
    try:
        return Decision.model_validate_json(text)
    except ValidationError as error:
        # Число вне 0–100 и т.п. — это ошибка смысла, а не формата.
        code = "out_of_range" if all(item["type"] in RANGE_ERRORS for item in error.errors()) else "invalid_json"
        raise AIError(code, f"{error.error_count()} schema errors", retry=True) from error


def _check(name: str, value: float, values: list[float]) -> None:
    low, high = min(values) - MARGIN, max(values) + MARGIN
    if not low <= value <= high:
        raise AIError("out_of_range", f"{name}={value} not in [{low}, {high}]", retry=True)


def check_ranges(decision: Decision, sources: list[SourceForecast], timeline: list[str]) -> None:
    _check("temperature", decision.temperature, [source.temperature for source in sources])
    _check("wind_speed", decision.wind_speed, [source.wind_speed for source in sources])

    if [item.time for item in decision.hourly] != timeline:
        raise AIError("out_of_range", "hourly times do not match timeline", retry=True)

    for item in decision.hourly:
        temperatures = [hour.temperature for source in sources for hour in source.hourly if hour.time == item.time]
        _check(f"hourly[{item.time}].temperature", item.temperature, temperatures)

    known = {source.source for source in sources}
    if not set(decision.trusted_sources) <= known:
        raise AIError("out_of_range", "unknown trusted source", retry=True)
