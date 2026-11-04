from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas.weather import WeatherResponse
from app.services.forecast_service import NoSourcesError, get_forecast

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
        return await get_forecast(request.app.state.http, request.app.state.ai, lat, lon, name, lang)
    except NoSourcesError as error:
        raise HTTPException(status_code=503, detail="Weather providers are unavailable") from error
