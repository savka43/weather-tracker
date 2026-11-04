import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import weather
from app.ai.client import build_client
from app.config import settings

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(timeout=settings.provider_timeout_seconds) as client:
        app.state.http = client
        app.state.ai = build_client(settings)
        logging.getLogger(__name__).info(
            "AI: %s", f"{settings.llm_provider}/{settings.llm_model}" if app.state.ai else "not configured"
        )
        try:
            yield
        finally:
            if app.state.ai is not None:
                await app.state.ai.close()


app = FastAPI(title="AI Weather Analyzer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
