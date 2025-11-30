from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import db
from core.config import settings
from api.v1 import schemas


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    await db.connect_db()
    yield
    # Shutdown
    await db.close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for DB Maker - A visual database schema designer",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(schemas.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": "DB Maker API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
