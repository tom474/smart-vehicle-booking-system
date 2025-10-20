"""
app/dependencies.py

FastAPI dependency functions:
- Provides a database session per request.
- Validates incoming API keys for protected routes.
"""

# Third-party imports
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

# Local application imports
from app.core.config import settings
from app.db.session import SessionLocal


# -----------------------------------------------------------------------------
# API Key Security Scheme
# -----------------------------------------------------------------------------
api_key_header = APIKeyHeader(name="X-API-Key")


# -----------------------------------------------------------------------------
# Database Dependency
# -----------------------------------------------------------------------------
def get_db():
    """
    Provide a database session for a request.

    Yields:
        Session: SQLAlchemy session instance.

    Ensures:
        The session is closed after the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------------------------------------------------------
# API Key Dependency
# -----------------------------------------------------------------------------
def get_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Validate the provided API key against the configured value.

    Args:
        api_key (str): API key from the request header `X-API-Key`.

    Returns:
        str: The validated API key.

    Raises:
        HTTPException: If the API key is missing or invalid.
    """
    if api_key == settings.API_KEY:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials",
    )
