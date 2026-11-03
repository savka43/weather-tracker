from typing import Literal

from fastapi import APIRouter, Query

from app.schemas.weather import ComparisonResponse, WeatherResponse
from app.services.weather_service import get_weather_by_city, get_weather_by_coords, get_weather_comparison

router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
async def get_weather_for_coords(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=200),
    lang: Literal["en", "ru"] = "en",
):
    return get_weather_by_coords(lat, lon, name, lang)


@router.get("/weather/{city}", response_model=WeatherResponse)
async def get_weather(city: str):
    return get_weather_by_city(city)


@router.get("/weather/{city}/comparison", response_model=ComparisonResponse)
async def get_comparison(city: str):
    return get_weather_comparison(city)
