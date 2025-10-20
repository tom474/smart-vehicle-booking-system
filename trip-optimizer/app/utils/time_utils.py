"""
app/utils/time_utils.py

Utility functions for converting between time formats:
- ISO 8601 time strings
- Seconds and minutes since midnight
"""

# Standard library imports
from datetime import datetime


# -----------------------------------------------------------------------------
# Conversions from ISO to seconds/minutes
# -----------------------------------------------------------------------------
def to_seconds_since_midnight(iso_str: str) -> int:
    """
    Convert an ISO 8601 time string to seconds since midnight.

    Args:
        iso_str (str): ISO 8601 time string (e.g., "12:34:56Z").

    Returns:
        int: Seconds since midnight.
    """
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    return dt.hour * 3600 + dt.minute * 60 + dt.second


def to_minutes_since_midnight(iso_str: str) -> int:
    """
    Convert an ISO 8601 time string to minutes since midnight.

    Args:
        iso_str (str): ISO 8601 time string (e.g., "12:34:56Z").

    Returns:
        int: Minutes since midnight.
    """
    return to_seconds_since_midnight(iso_str) // 60


# -----------------------------------------------------------------------------
# Conversions from seconds/minutes to ISO
# -----------------------------------------------------------------------------
def seconds_to_iso(t: int) -> str:
    """
    Convert seconds since midnight to an ISO 8601 time string.

    Args:
        t (int): Time in seconds.

    Returns:
        str: ISO 8601 time string (e.g., "HH:MM:SSZ").
    """
    if t < 0:
        t = 0
    h = t // 3600
    m = (t % 3600) // 60
    s = t % 60
    return f"{h:02d}:{m:02d}:{s:02d}Z"


def minutes_to_iso(t: int) -> str:
    """
    Convert minutes since midnight to an ISO 8601 time string.

    Args:
        t (int): Time in minutes.

    Returns:
        str: ISO 8601 time string (e.g., "HH:MM:00Z").
    """
    if t < 0:
        t = 0
    h = t // 60
    m = t % 60
    return f"{h:02d}:{m:02d}:00Z"


# -----------------------------------------------------------------------------
# Simple conversion helper
# -----------------------------------------------------------------------------
def seconds_to_minutes(t: int) -> int:
    """
    Convert seconds to minutes (floor division).

    Args:
        t (int): Time in seconds.

    Returns:
        int: Time in minutes.
    """
    return t // 60 if t >= 0 else 0
