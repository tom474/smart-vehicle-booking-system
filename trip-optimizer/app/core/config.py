"""
app/core/config.py

Centralized application settings using Pydantic.
Loads configuration from environment variables and .env file.
"""

# Standard library imports
import os

# Third-party imports
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

NODE_ENV = os.getenv("NODE_ENV", "development").lower()
is_production = NODE_ENV == "production"

# -----------------------------------------------------------------------------
# Load environment variables from .env file
# -----------------------------------------------------------------------------
if not is_production:
    load_dotenv()
    print("[CONFIG] Loaded .env for development environment.")
else:
    print("[CONFIG] Running in production mode. Skipping .env loading.")



class Settings(BaseSettings):
    """
    Application configuration settings.

    Values are loaded from environment variables (or .env) and provide:
      - API metadata and authentication
      - Database connection
      - Google Maps API parameters
      - Solver configuration for optimization
    """

    # -------------------------------------------------------------------------
    # API Settings
    # -------------------------------------------------------------------------
    PROJECT_NAME: str = "De Heus - Trip Optimizer API"
    API_VERSION: str = "1.0.0"
    API_V1_STR: str = "/optimizer/api/v1"

    # API key for authentication (technical admin only)
    API_KEY: str

    # Local API database for storing temporary data
    DATABASE_URL: str = "sqlite:///./optimizer_local.db"

    # -------------------------------------------------------------------------
    # Google Maps API Settings
    # -------------------------------------------------------------------------
    # API key for distance/time matrix calculation
    GOOGLE_MAPS_API_KEY: str
    # Units for Google Maps API. Accepts "metric" or "imperial".
    GOOGLE_MAPS_UNITS: str = "metric"

    # Central depot coordinates (all vehicles start/end here by default)
    DEPOT_LATITUDE: float = 10.823099
    DEPOT_LONGITUDE: float = 106.629662

    # Distance matrix caching and fallback
    DIST_MATRIX_CACHE_TTL_SECONDS: int = 600
    DIST_MATRIX_CACHE_MAXSIZE: int = 256
    DISTANCE_FALLBACK_ENABLED: bool = True
    FALLBACK_SPEED_KMH: float = 40.0

    # -------------------------------------------------------------------------
    # OR-Tools Solver Settings
    # -------------------------------------------------------------------------
    # Time limit for the solver to find a solution (in seconds)
    SOLVER_TIME_LIMIT_SECONDS: int = 30
    # Maximum number of solutions to search for
    SOLVER_SOLUTION_LIMIT: int = 1000

    # Strategy for finding the first solution (e.g., PATH_CHEAPEST_ARC)
    SOLVER_SOLUTION_STRATEGY: str = "PATH_CHEAPEST_ARC"
    # Local search metaheuristic strategy (e.g., GUIDED_LOCAL_SEARCH)
    SOLVER_LOCAL_SEARCH_METAHEURISTIC: str = "GUIDED_LOCAL_SEARCH"

    # Maximum waiting time at a stop (in minutes)
    SOLVER_MAX_WAITING_TIME_MINUTES: int = 720
    # Maximum route duration for any single vehicle (in minutes)
    SOLVER_MAX_VEHICLE_TIME_MINUTES: int = 720
    # Penalty cost for leaving a request unassigned (pickup/drop both dropped)
    SOLVER_UNASSIGNED_PENALTY: int = 1_000_000

    # -------------------------------------------------------------------------
    # Pydantic model configuration
    # -------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env" if not is_production else None,
        env_file_encoding="utf-8"
    )


# -----------------------------------------------------------------------------
# Global settings instance
# -----------------------------------------------------------------------------
settings = Settings()
