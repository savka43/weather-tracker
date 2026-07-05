import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import weather

app = FastAPI(title="AI Weather Analyzer API")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

configured_origins = os.getenv("CORS_ORIGINS")
origins = [origin.strip() for origin in configured_origins.split(",")] if configured_origins else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
