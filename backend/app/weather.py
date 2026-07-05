from fastapi import APIRouter

from app.schemas.weather import ComparisonResponse, WeatherResponse
from app.services.weather_service import get_weather_by_city, get_weather_comparison

router = APIRouter()


@router.get("/weather/{city}", response_model=WeatherResponse)
async def get_weather(city: str):
    return get_weather_by_city(city)


@router.get("/weather/{city}/comparison", response_model=ComparisonResponse)
async def get_comparison(city: str):
    return get_weather_comparison(city)
