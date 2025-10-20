# tests/conftest.py

import sys
import pathlib
import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv
import os

# ------------------------------------------------------------------
# Make sure project root is in sys.path
# ------------------------------------------------------------------
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

# ------------------------------------------------------------------
# Load environment variables from .env at project root
# ------------------------------------------------------------------
project_root = pathlib.Path(__file__).resolve().parents[1]
dotenv_path = project_root / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Fallback defaults if not in .env
os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("GOOGLE_MAPS_API_KEY", "dummy")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

# ------------------------------------------------------------------
# Import the FastAPI app after env vars are loaded
# ------------------------------------------------------------------
from app.main import app
from app.db.session import create_db_and_tables

# ------------------------------------------------------------------
# Pytest fixture
# ------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Setup database tables before running tests."""
    print("[TEST SETUP] Creating test database tables...")
    create_db_and_tables()
    print("[TEST SETUP] Test database tables created.")

@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient that uses environment variables from .env."""
    with TestClient(app) as c:
        yield c
