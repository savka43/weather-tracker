from app.schemas.weather import ComparisonResponse, HourlyForecastItem, WeatherResponse, WeatherSourceForecast


def _source_forecasts() -> list[WeatherSourceForecast]:
    return [
        WeatherSourceForecast(source="Open-Meteo", temperature=18.1, rain_probability=61, wind_speed=5.1, confidence=78),
        WeatherSourceForecast(source="OpenWeather", temperature=18.8, rain_probability=66, wind_speed=5.8, confidence=74),
        WeatherSourceForecast(source="WeatherAPI", temperature=18.4, rain_probability=59, wind_speed=4.9, confidence=76),
        WeatherSourceForecast(source="AI Model", temperature=18.5, rain_probability=64, wind_speed=5.4, confidence=82),
    ]


def get_weather_by_city(city: str) -> WeatherResponse:
    normalized_city = city.strip() or "Unknown"

    return WeatherResponse(
        city=normalized_city,
        country="Mock Country",
        temperature=18.5,
        condition="Cloudy",
        humidity=72,
        wind_speed=5.4,
        pressure=1012,
        rain_probability=64,
        confidence=82,
        summary=(
            f"AI model expects cloudy weather in {normalized_city} with a moderate chance of rain. "
            "Wind should stay comfortable, while humidity remains elevated through the evening."
        ),
        hourly_forecast=[
            HourlyForecastItem(time="15:00", temperature=18.5, rain_probability=54),
            HourlyForecastItem(time="16:00", temperature=18.2, rain_probability=58),
            HourlyForecastItem(time="17:00", temperature=17.9, rain_probability=64),
            HourlyForecastItem(time="18:00", temperature=17.3, rain_probability=68),
            HourlyForecastItem(time="19:00", temperature=16.8, rain_probability=62),
            HourlyForecastItem(time="20:00", temperature=16.1, rain_probability=49),
        ],
        sources=_source_forecasts(),
    )


def get_weather_comparison(city: str) -> ComparisonResponse:
    normalized_city = city.strip() or "Unknown"

    return ComparisonResponse(city=normalized_city, sources=_source_forecasts())
