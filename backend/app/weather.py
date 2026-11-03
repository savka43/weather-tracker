from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas.weather import ComparisonResponse, WeatherResponse
from app.services.forecast_service import NoSourcesError, get_forecast
from app.services.weather_service import get_weather_by_city, get_weather_comparison

router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
async def get_weather_for_coords(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=200),
    lang: Literal["en", "ru"] = "en",
):
    try:
        return await get_forecast(request.app.state.http, lat, lon, name)
    except NoSourcesError as error:
        raise HTTPException(status_code=503, detail="Weather providers are unavailable") from error


@router.get("/weather/{city}", response_model=WeatherResponse)
async def get_weather(city: str):
    return get_weather_by_city(city)


@router.get("/weather/{city}/comparison", response_model=ComparisonResponse)
async def get_comparison(city: str):
    return get_weather_comparison(city)
