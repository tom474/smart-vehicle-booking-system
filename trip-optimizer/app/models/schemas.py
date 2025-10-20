"""
app/models/schemas.py

Pydantic models (schemas) for request and response validation in the API.
"""

# Standard library imports
from datetime import datetime, date as date_type
from typing import List, Optional

# Third-party imports
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Core Location Schema
# -----------------------------------------------------------------------------
class Location(BaseModel):
    """Represents a geographical location."""
    id: str = Field(..., json_schema_extra={"example": "LOC-1"})
    latitude: float = Field(..., json_schema_extra={"example": 10.771937})
    longitude: float = Field(..., json_schema_extra={"example": 106.721063})


# -----------------------------------------------------------------------------
# Vehicle Unavailability Schema
# -----------------------------------------------------------------------------
class VehicleUnavailability(BaseModel):
    """Represents a date and time period when a vehicle is unavailable."""
    date: date_type = Field(..., json_schema_extra={"example": "2025-08-21"})
    period: int = Field(
        ...,
        json_schema_extra={
            "example": 0,
            "description": "Period index or shift indicator"
        }
    )


# -----------------------------------------------------------------------------
# Vehicle Schema
# -----------------------------------------------------------------------------
class Vehicle(BaseModel):
    """Represents a vehicle used in optimization.

    base_location and unavailability are optional; when omitted,
    the service will use the configured central depot and treat
    the vehicle as fully available.
    """
    id: str = Field(..., json_schema_extra={"example": "VEH-1"})
    capacity: int = Field(..., json_schema_extra={"example": 6})
    base_location: Optional[Location] = Field(default=None, json_schema_extra={"description": "Optional base location"})
    unavailability: Optional[List[VehicleUnavailability]] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Booking Request Schema
# -----------------------------------------------------------------------------
class BookingRequest(BaseModel):
    """Represents a request that needs to be fulfilled by a vehicle trip."""
    id: str = Field(..., json_schema_extra={"example": "REQ-1"})
    pickup_location: Location
    dropoff_location: Location
    dropoff_time: datetime = Field(..., json_schema_extra={"example": "2025-08-20T09:00:00Z"})
    capacity_demand: int = Field(..., json_schema_extra={"example": 4})


# -----------------------------------------------------------------------------
# Optimization Request Schema
# -----------------------------------------------------------------------------
class OptimizationRequest(BaseModel):
    """Encapsulates all data required to run an optimization."""
    vehicles: List[Vehicle]
    requests: List[BookingRequest]


# -----------------------------------------------------------------------------
# Trip Stop Schema
# -----------------------------------------------------------------------------
class TripStop(BaseModel):
    """Represents a single stop within a scheduled trip."""
    location_id: str = Field(..., json_schema_extra={"example": "LOC-1"})
    latitude: float = Field(..., json_schema_extra={"example": 10.771937})
    longitude: float = Field(..., json_schema_extra={"example": 106.721063})
    estimated_arrival_time: datetime = Field(..., json_schema_extra={"example": "2025-08-20T09:30:00Z"})
    type: str = Field(
        ...,
        json_schema_extra={
            "example": "pickup",
            "description": "start, pickup, dropoff, end"
        }
    )


# -----------------------------------------------------------------------------
# Scheduled Trip Schema
# -----------------------------------------------------------------------------
class ScheduledTrip(BaseModel):
    """Represents a scheduled trip result from the optimization."""
    vehicle_id: str = Field(..., json_schema_extra={"example": "VEH-1"})
    combined_request_ids: List[str] = Field(..., json_schema_extra={"example": ["REQ-1", "REQ-2"]})
    trip_start_time: datetime = Field(..., json_schema_extra={"example": "2025-08-20T08:30:00Z"})
    trip_end_time: datetime = Field(..., json_schema_extra={"example": "2025-08-20T11:00:00Z"})
    total_duration_minutes: int = Field(..., json_schema_extra={"example": 150})
    total_distance_meters: int = Field(..., json_schema_extra={"example": 24500})
    route: List[TripStop]


# -----------------------------------------------------------------------------
# Optimization Result Schema
# -----------------------------------------------------------------------------
class OptimizationResult(BaseModel):
    """Represents the full output from the optimizer."""
    job_id: str
    status: str
    message: Optional[str] = None
    scheduled_trips: List[ScheduledTrip] = Field(default_factory=list)
    unassigned_requests: List[str] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# API Response Schemas
# -----------------------------------------------------------------------------
class JobCreationResponse(BaseModel):
    """Response schema for job creation."""
    job_id: str = Field(..., json_schema_extra={"example": "OPT-1234"})


class JobStatusResponse(BaseModel):
    """Response schema for job status."""
    job_id: str = Field(..., json_schema_extra={"example": "OPT-1234"})
    status: str = Field(..., json_schema_extra={"example": "pending"})


class JobResultResponse(BaseModel):
    """Response schema for fetching a job result."""
    job_id: str = Field(..., json_schema_extra={"example": "OPT-1234"})
    status: str = Field(..., json_schema_extra={"example": "completed"})
    result: Optional[OptimizationResult] = None
    error: Optional[str] = None


class AppConfigResponse(BaseModel):
    """Response schema for exposing solver configuration."""
    project_name: str
    solver_time_limit: int
    solver_strategy: str
