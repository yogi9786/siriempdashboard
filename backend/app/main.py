import sys
import os
from pathlib import Path

# Automatically ensure workspace root and backend folder are in sys.path
_current_dir = Path(__file__).resolve().parent  # app
_backend_dir = _current_dir.parent  # backend
_root_dir = _backend_dir.parent  # workspace root

for _p in [str(_root_dir), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, logger
from backend.app.core.database import engine, Base, auto_migrate_db_schema
from backend.app.seed.seed_data import seed_database
from backend.app.routers import (
    auth,
    dashboard,
    employees,
    customers,
    schemes,
    forms,
    google_reviews,
    attire,
    outdoor_marketing,
    audit,
)

# Setup structured logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} mode...")
    # Ensure media directory exists
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    # Initialize database tables & auto-migrate any missing columns
    try:
        auto_migrate_db_schema()
    except Exception as e:
        logger.warning(f"Auto-migration note: {e}")
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade internal employee & activity management dashboard for Siri Samruddhi Gold Palace (Yelahanka Showroom).",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Configure Robust CORS (Supports dynamic ports like 5173, 5174, 5175, 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media directory for static image uploads
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        field_loc = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        error_details.append(f"{field_loc}: {err['msg']}")

    msg = "Validation failed: " + "; ".join(error_details)
    logger.warning(f"Validation error on {request.url.path}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": msg, "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please try again or contact support."},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# Health check endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "branch": "Yelahanka",
        "role": "MANAGER",
    }


# Include all modular API routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(employees.router)
app.include_router(customers.router)
app.include_router(schemes.router)
app.include_router(forms.router)
app.include_router(google_reviews.router)
app.include_router(attire.router)
app.include_router(outdoor_marketing.router)
app.include_router(audit.router)
