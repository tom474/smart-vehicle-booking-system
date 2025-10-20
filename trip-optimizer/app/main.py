"""
main.py

This is the main entry point for the FastAPI application.

Responsibilities:
- Initialize and configure the FastAPI application.
- Set up database tables on application startup (via lifespan event).
- Mount static files if needed.
- Include API routers for public and optimizer-related endpoints.
- Expose a simple root endpoint for health and identification.

Author: Phan Nhat Minh - WAO Team - RMIT University Vietnam
"""

# Standard Library Imports
from contextlib import asynccontextmanager

# Third-Party Imports
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  # Optional: only if you serve static assets

# Internal Application Imports
from app.api.routes import public_router, optimizer_router
from app.core.config import settings
from app.db.session import create_db_and_tables


# Lifespan Event Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.

    Called once on startup and once on shutdown.
    - On startup: Ensures database and tables are created before handling requests.
    - On shutdown: Allows cleanup logic if necessary (e.g., closing DB connections).

    Args:
        app (FastAPI): The FastAPI application instance.

    Yields:
        None
    """
    print("Application starting up...")
    create_db_and_tables()
    yield
    print("Application shutting down...")


# FastAPI Application Instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",     # Swagger UI
    redoc_url="/redoc",   # ReDoc
    lifespan=lifespan,
)


# Router Inclusion
# Public endpoints (e.g., /health)
app.include_router(public_router, prefix=settings.API_V1_STR)
# Optimizer-related endpoints
app.include_router(optimizer_router, prefix=settings.API_V1_STR)


# Root Endpoint
@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint.

    Returns:
        dict: A welcome message indicating the application is running.
    """
    return {"message": f"Welcome to the {settings.PROJECT_NAME}"}
