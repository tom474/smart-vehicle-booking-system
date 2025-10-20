"""
app/services/data_manager.py

Provides a DataManager class to handle database operations for vehicles,
locations, booking requests, optimization results, and trips.
"""

# Standard library imports
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# Third-party imports
from sqlalchemy.orm import Session
from sqlalchemy import delete

# Local application imports
from app.db import models
from app.core.config import settings
from app.models import schemas


# -----------------------------------------------------------------------------
# Data Manager
# -----------------------------------------------------------------------------
class DataManager:
    """
    Utility class for handling database operations in the Trip Optimizer service.

    Responsibilities:
        - Load input payloads (vehicles, requests, locations) into DB tables.
        - Save trips and optimization results.
        - Clear tables between runs.
        - Fetch optimization job details.
    """

    def __init__(self, db_session: Session):
        """
        Initialize a DataManager with an active database session.

        Args:
            db_session (Session): SQLAlchemy session instance.
        """
        self.db = db_session

    # -------------------------------------------------------------------------
    # Load and Save Payload
    # -------------------------------------------------------------------------
    def load_and_save_payload(self, request_data: Dict[str, Any]) -> None:
        """
        Load vehicles, locations, and requests from the request payload
        and save them into their respective database tables.

        Args:
            request_data (dict): Raw request data containing vehicles and requests.
        """
        processed_locations: Dict[str, models.Location] = {}

        # Ensure central depot exists in locations (used as default base)
        depot_loc_id = "DEPOT"
        depot_lat = str(settings.DEPOT_LATITUDE)
        depot_lon = str(settings.DEPOT_LONGITUDE)
        if depot_loc_id not in processed_locations:
            depot = self.db.query(models.Location).filter_by(location_id=depot_loc_id).first()
            if not depot:
                depot = models.Location(location_id=depot_loc_id, latitude=depot_lat, longitude=depot_lon)
                self.db.add(depot)
            processed_locations[depot_loc_id] = depot

        # Save unique base locations for vehicles (if provided)
        for vehicle in request_data.get("vehicles", []):
            loc = vehicle.get("base_location")
            if loc:
                if loc["id"] not in processed_locations:
                    location = models.Location(
                        location_id=loc["id"],
                        latitude=str(loc["latitude"]),
                        longitude=str(loc["longitude"]),
                    )
                    self.db.add(location)
                    processed_locations[loc["id"]] = location

        # Save unique pickup and dropoff locations for requests
        for req in request_data.get("requests", []):
            for loc_key in ["pickup_location", "dropoff_location"]:
                loc = req[loc_key]
                if loc["id"] not in processed_locations:
                    location = models.Location(
                        location_id=loc["id"],
                        latitude=str(loc["latitude"]),
                        longitude=str(loc["longitude"]),
                    )
                    self.db.add(location)
                    processed_locations[loc["id"]] = location

        # Flush to assign IDs before referencing them in other tables
        self.db.flush()

        # Save vehicles with their unavailability periods
        for vehicle_data in request_data.get("vehicles", []):
            unavailable_dates = []
            for unavail in vehicle_data.get("unavailability", []) or []:
                unavail_date = unavail.get("date")
                if isinstance(unavail_date, (datetime, date)):
                    unavail_date = unavail_date.isoformat()
                unavailable_dates.append({**unavail, "date": unavail_date})

            # Use provided base_location when present; otherwise, default to central depot
            base_loc_id = depot_loc_id
            if vehicle_data.get("base_location"):
                base_loc_id = vehicle_data["base_location"]["id"]

            vehicle = models.Vehicle(
                vehicle_id=vehicle_data["id"],
                capacity=vehicle_data["capacity"],
                base_location_id=base_loc_id,
                unavailable_dates=unavailable_dates,
            )
            self.db.add(vehicle)

        # Save booking requests
        for req_data in request_data.get("requests", []):
            dropoff_raw = req_data["dropoff_time"]
            dropoff_dt = (
                datetime.fromisoformat(dropoff_raw.replace("Z", "+00:00"))
                if isinstance(dropoff_raw, str)
                else dropoff_raw
            )
            request = models.BookingRequest(
                request_id=req_data["id"],
                pickup_location_id=req_data["pickup_location"]["id"],
                dropoff_location_id=req_data["dropoff_location"]["id"],
                dropoff_time=dropoff_dt,
                capacity_demand=req_data["capacity_demand"],
            )
            self.db.add(request)

        self.db.commit()

    # -------------------------------------------------------------------------
    # Save Results and Trips
    # -------------------------------------------------------------------------
    def save_optimization_result(self, job_id: str, result: schemas.OptimizationResult) -> None:
        """
        Save the result of an optimization job.

        Args:
            job_id (str): ID of the job to update.
            result (OptimizationResult): Result to store.
        """
        job = self.db.get(models.OptimizationJob, job_id)
        if job:
            job.status = result.status
            job.result = result.model_dump(mode="json")
            self.db.commit()

    def save_trips(self, scheduled_trips: List[schemas.ScheduledTrip]) -> None:
        """
        Save scheduled trips into the Trip table.

        Each ScheduledTrip may cover multiple requests, resulting in
        one Trip record per request ID.

        Args:
            scheduled_trips (list[ScheduledTrip]): List of scheduled trip results.
        """
        for trip_data in scheduled_trips:
            for request_id in trip_data.combined_request_ids:
                trip = models.Trip(
                    vehicle_id=trip_data.vehicle_id,
                    booking_request_id=request_id,
                    trip_start_time=trip_data.trip_start_time,
                    trip_end_time=trip_data.trip_end_time,
                    total_duration=trip_data.total_duration_minutes,
                    total_distance=trip_data.total_distance_meters,
                    trip_stop_sequence=[
                        stop.model_dump(mode="json") for stop in trip_data.route
                    ],
                )
                self.db.add(trip)

        self.db.commit()

    # -------------------------------------------------------------------------
    # Utility Helpers
    # -------------------------------------------------------------------------
    def clear_table(self, table_name: str) -> None:
        """
        Clear all records from a given table.

        Args:
            table_name (str): Name of the model/table to clear.
        """
        if hasattr(models, table_name):
            model = getattr(models, table_name)
            self.db.execute(delete(model))
            self.db.commit()

    def get_optimization_job(self, job_id: str) -> Optional[models.OptimizationJob]:
        """
        Retrieve an optimization job by its ID.

        Args:
            job_id (str): ID of the optimization job.

        Returns:
            OptimizationJob | None: The job instance or None if not found.
        """
        return self.db.get(models.OptimizationJob, job_id)
