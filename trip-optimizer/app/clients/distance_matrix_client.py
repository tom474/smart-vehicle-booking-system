"""
app/clients/distance_matrix_client.py

Client for fetching distance and time matrices from the Google Maps Distance Matrix API.
"""

# Standard library imports
from typing import List, Tuple, Dict, Any
import time
from math import radians, cos, sin, asin, sqrt

# Third-party imports
import requests

# Local application imports
from app.core.config import settings
"""Note: This client now returns time values in SECONDS.
The solver expects seconds for its time dimension; previously, we
were converting to minutes which caused durations to be too small.
"""


class DistanceMatrixClient:
    """
    A client for interacting with the Google Maps Distance Matrix API.

    Provides:
        - Retrieval of raw API response data.
        - Conversion of results into distance and time matrices.
    """

    def __init__(self):
        """
        Initialize the DistanceMatrixClient.

        Raises:
            ValueError: If the required GOOGLE_MAPS_API_KEY is not configured.
        """
        # Allow fallback when no API key is set
        self._api_key = settings.GOOGLE_MAPS_API_KEY if settings.GOOGLE_MAPS_API_KEY else None

        # Simple in-memory LRU cache with TTL
        self._cache: Dict[str, Tuple[float, Tuple[List[List[int]], List[List[int]]]]] = {}
        self._cache_order: List[str] = []
        self._cache_ttl = settings.DIST_MATRIX_CACHE_TTL_SECONDS
        self._cache_maxsize = settings.DIST_MATRIX_CACHE_MAXSIZE

    def _fetch_raw_data(self, origins: List[str], destinations: List[str]) -> dict:
        """
        Fetch raw JSON data from the Google Maps Distance Matrix API.

        Args:
            origins (List[str]): List of origin addresses/coordinates.
            destinations (List[str]): List of destination addresses/coordinates.

        Returns:
            dict: The raw JSON response from the API.

        Raises:
            requests.HTTPError: If the HTTP request fails.
        """
        # Prepare parameters
        origin_str = "|".join(origins)
        dest_str = "|".join(destinations)
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": origin_str,
            "destinations": dest_str,
            "key": self._api_key,
            "units": settings.GOOGLE_MAPS_UNITS,
        }

        # Perform request
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    # -----------------------------
    # Caching helpers
    # -----------------------------
    @staticmethod
    def _round_coords(coords: List[str], places: int = 5) -> List[str]:
        out: List[str] = []
        for c in coords:
            try:
                lat_s, lon_s = c.split(",")
                lat = round(float(lat_s), places)
                lon = round(float(lon_s), places)
                out.append(f"{lat},{lon}")
            except Exception:
                out.append(c)
        return out

    def _cache_key(self, origins: List[str], destinations: List[str]) -> str:
        ro = self._round_coords(origins)
        rd = self._round_coords(destinations)
        return f"o:{'|'.join(ro)};d:{'|'.join(rd)}"

    def _get_from_cache(self, key: str):
        if key in self._cache:
            ts, value = self._cache[key]
            if (time.time() - ts) <= self._cache_ttl:
                # Refresh LRU order
                if key in self._cache_order:
                    self._cache_order.remove(key)
                self._cache_order.append(key)
                return value
            # Expired
            del self._cache[key]
            if key in self._cache_order:
                self._cache_order.remove(key)
        return None

    def _put_in_cache(self, key: str, value: Tuple[List[List[int]], List[List[int]]]):
        # Evict if necessary
        if key not in self._cache and len(self._cache_order) >= self._cache_maxsize:
            evict_key = self._cache_order.pop(0)
            if evict_key in self._cache:
                del self._cache[evict_key]
        self._cache[key] = (time.time(), value)
        if key in self._cache_order:
            self._cache_order.remove(key)
        self._cache_order.append(key)

    # -----------------------------
    # Fallback helpers
    # -----------------------------
    @staticmethod
    def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # distance in meters
        R = 6371000.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        return R * c

    def _approximate_matrices(self, origins: List[str], destinations: List[str]) -> Tuple[List[List[int]], List[List[int]]]:
        dist: List[List[int]] = []
        time_m: List[List[int]] = []
        speed_mps = max(1.0, settings.FALLBACK_SPEED_KMH * 1000.0 / 3600.0)
        for o in origins:
            lat1, lon1 = map(float, o.split(","))
            drow: List[int] = []
            trow: List[int] = []
            for d in destinations:
                lat2, lon2 = map(float, d.split(","))
                dm = self._haversine_m(lat1, lon1, lat2, lon2)
                drow.append(int(dm))
                trow.append(int(dm / speed_mps))
            dist.append(drow)
            time_m.append(trow)
        return dist, time_m

    def get_matrices(
        self, origins: List[str], destinations: List[str]
    ) -> Tuple[List[List[int]], List[List[int]]]:
        """
        Retrieve both distance and time matrices for given origins and destinations.

        Args:
            origins (List[str]): Origin addresses/coordinates.
            destinations (List[str]): Destination addresses/coordinates.

        Returns:
            Tuple[List[List[int]], List[List[int]]]:
                - distance_matrix: Distances in meters.
                - time_matrix: Durations in seconds.
        """
        # Try cache first
        key = self._cache_key(origins, destinations)
        cached = self._get_from_cache(key)
        if cached is not None:
            return cached

        try:
            if not self._api_key:
                raise ValueError("No API key; using fallback")
            data = self._fetch_raw_data(origins, destinations)
            distance_matrix: List[List[int]] = []
            time_matrix: List[List[int]] = []

            # Parse each row of the response
            for row in data.get("rows", []):
                dist_row: List[int] = []
                time_row: List[int] = []
                for elem in row.get("elements", []):
                    if elem.get("status") == "OK":
                        dist_row.append(elem["distance"]["value"])  # meters
                        time_row.append(elem["duration"]["value"])   # seconds
                    else:
                        dist_row.append(0)
                        time_row.append(0)
                distance_matrix.append(dist_row)
                time_matrix.append(time_row)

            self._put_in_cache(key, (distance_matrix, time_matrix))
            return distance_matrix, time_matrix
        except Exception:
            if settings.DISTANCE_FALLBACK_ENABLED:
                approx = self._approximate_matrices(origins, destinations)
                self._put_in_cache(key, approx)
                return approx
            raise
