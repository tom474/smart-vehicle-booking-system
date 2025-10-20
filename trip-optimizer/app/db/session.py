"""
app/db/session.py

Database session and engine configuration for the application.
Handles engine creation, session factory, and schema initialization.
"""

# Third-party imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Local application imports
from app.core.config import settings


# -----------------------------------------------------------------------------
# Engine Configuration
# -----------------------------------------------------------------------------
# SQLite requires 'check_same_thread=False' to allow usage across threads
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)


# -----------------------------------------------------------------------------
# Session Factory
# -----------------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# -----------------------------------------------------------------------------
# Declarative Base
# -----------------------------------------------------------------------------
Base = declarative_base()


# -----------------------------------------------------------------------------
# Database Initialization
# -----------------------------------------------------------------------------
def create_db_and_tables():
    """
    Create all database tables defined by ORM models.

    This should be called on application startup to ensure the database schema
    is present. Model imports are done inside to ensure metadata is bound.
    """
    print("[DB] Creating database tables...")
    from app.db import models  # Import models to register them with Base.metadata
    Base.metadata.create_all(bind=engine)
    print("[DB] Database tables creation complete.")
