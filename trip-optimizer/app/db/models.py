"""
app/db/models.py

SQLAlchemy ORM models for database tables used in the optimization service.
"""

# Third-party imports
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func

# Local application imports
from .session import Base


# -----------------------------------------------------------------------------
# Vehicle Model
# -----------------------------------------------------------------------------
class Vehicle(Base):
    """
    Represents a vehicle used for optimization.

    Attributes:
        vehicle_id (str): Business identifier (e.g., "VEH-001").
        capacity (int): Capacity of the vehicle.
        base_location_id (str): Reference to the base location.
        unavailable_dates (list): Optional list of unavailable date strings.
    """
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String, unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    base_location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    unavailable_dates = Column(JSON, nullable=True)


# -----------------------------------------------------------------------------
# Location Model
# -----------------------------------------------------------------------------
class Location(Base):
    """
    Represents a geographical location with latitude and longitude.

    Attributes:
        location_id (str): Business identifier (e.g., "LOC-001").
        latitude (str): Latitude coordinate.
        longitude (str): Longitude coordinate.
    """
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(String, unique=True, nullable=False, index=True)
    latitude = Column(String, nullable=False)
    longitude = Column(String, nullable=False)


# -----------------------------------------------------------------------------
# BookingRequest Model
# -----------------------------------------------------------------------------
class BookingRequest(Base):
    """
    Represents a booking request for optimization.

    Attributes:
        request_id (str): Business identifier (e.g., "REQ-001").
        pickup_location_id (str): Pickup location reference.
        dropoff_location_id (str): Dropoff location reference.
        dropoff_time (datetime): Time by which dropoff must occur.
        capacity_demand (int): Required capacity for this request.
    """
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String, unique=True, nullable=False, index=True)
    pickup_location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    dropoff_location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    dropoff_time = Column(DateTime(timezone=True), nullable=False)
    capacity_demand = Column(Integer, nullable=False)


# -----------------------------------------------------------------------------
# Trip Model
# -----------------------------------------------------------------------------
class Trip(Base):
    """
    Represents a trip assignment.

    Attributes:
        vehicle_id (str): Assigned vehicle ID.
        booking_request_id (str): Assigned booking request ID.
        trip_start_time (datetime): Trip start timestamp.
        trip_end_time (datetime): Trip end timestamp.
        total_distance (int): Total distance in meters.
        total_duration (int): Total duration in minutes.
        trip_stop_sequence (list): Ordered sequence of stop location IDs.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False, index=True)
    booking_request_id = Column(String, ForeignKey("booking_requests.request_id"), nullable=False, index=True)
    trip_start_time = Column(DateTime(timezone=True), nullable=False)
    trip_end_time = Column(DateTime(timezone=True), nullable=False)
    total_distance = Column(Integer, nullable=False)
    total_duration = Column(Integer, nullable=False)
    trip_stop_sequence = Column(JSON, nullable=False)


# -----------------------------------------------------------------------------
# OptimizationJob Model
# -----------------------------------------------------------------------------
class OptimizationJob(Base):
    """
    Tracks optimization job metadata and results.

    Attributes:
        id (str): Unique job identifier.
        status (str): Current status (e.g., "pending", "completed", "failed").
        result (dict): JSON-serialized optimization result.
        created_at (datetime): Timestamp when job was created.
        updated_at (datetime): Timestamp when job was last updated.
    """
    __tablename__ = "optimization_jobs"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False, default="pending", index=True)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
