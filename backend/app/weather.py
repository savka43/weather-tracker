from fastapi import APIRouter


router = APIRouter()

@router.get("/weather/{city}")
async def get_weather(city: str):
    return {
        "city": f'{city}',
        "temprature": 43
    }