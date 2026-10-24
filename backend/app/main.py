from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.config import settings
from backend.app.services.history_service import history_service

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("shopsmart")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database
    logger.info("Initializing ShopSmart backend persistence...")
    await history_service.init_db()
    logger.info("ShopSmart backend ready.")
    yield
    # Shutdown
    logger.info("ShopSmart backend shutting down.")


app = FastAPI(
    title="ShopSmart Backend API",
    version="1.0.0",
    description="Local backend for ShopSmart Shopping Assistant: scraping, normalization, local persistence, and ScaleMax AI integration.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "ShopSmart Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "/api/status",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "shopsmart-backend"}
