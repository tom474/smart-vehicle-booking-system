"""
app/utils/info.py

Utility class for providing static API metadata and information
such as name, version, environment, and maintainer details.
"""

# Standard library imports
from typing import Dict, Any


# -----------------------------------------------------------------------------
# Info Utilities
# -----------------------------------------------------------------------------
class InfoUtils:
    """
    Provides internal metadata and basic information about the API.

    Responsibilities:
        - Store static metadata (name, version, environment, description).
        - Expose methods to retrieve metadata, version, or environment.
    """

    def __init__(self) -> None:
        """Initialize InfoUtils with predefined metadata."""
        self._metadata: Dict[str, Any] = {
            "api_name": "Trip Optimizer API",
            "version": "1.0.0",
            "environment": "internal",
            "description": (
                "Internal API for De Heus. "
                "Provides route and schedule optimization for vehicle trip requests, "
                "used by coordinators and drivers to improve operational efficiency."
            ),
            "maintainer": {
                "team": "WAO Team - RMIT University",
                "primary_contact": {
                    "name": "Phan Nhat Minh",
                    "role": "Project Manager / API Developer",
                    "email": "pnminh0905@gmail.com",
                },
            },
            "notes": (
                "This API is intended for internal use only. "
                "Please do not expose it to external services without approval."
            ),
        }

    # -------------------------------------------------------------------------
    # Public accessors
    # -------------------------------------------------------------------------
    def get_info(self) -> Dict[str, Any]:
        """
        Get full metadata details for the API.

        Returns:
            dict: Full metadata including name, version, description, and maintainer.
        """
        return self._metadata

    def get_version(self) -> str:
        """
        Get the current API version.

        Returns:
            str: Version string (e.g., '1.0.0').
        """
        return self._metadata["version"]

    def get_environment(self) -> str:
        """
        Get the current environment for the API.

        Returns:
            str: Environment type (e.g., 'internal', 'staging', 'production').
        """
        return self._metadata["environment"]
