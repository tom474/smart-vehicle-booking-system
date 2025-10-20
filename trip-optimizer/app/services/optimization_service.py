"""
app/services/optimization_service.py

Service layer for running optimization workflows:
- Groups requests by date
- Filters available vehicles
- Executes the solver
- Persists results to the database
"""

# Standard library imports
from datetime import datetime, timezone
from typing import List, Dict, Any

# Third-party imports
from sqlalchemy.orm import Session

# Local application imports
from app.models import schemas
from app.services.data_manager import DataManager
from app.services.optimization_solver import OptimizationSolver


# -----------------------------------------------------------------------------
# Optimization Service
# -----------------------------------------------------------------------------
class OptimizationService:
    """
    Main entry point for the optimization workflow.

    Responsibilities:
        - Preprocess and group booking requests by date
        - Filter vehicles based on availability
        - Run the optimization solver
        - Save and return scheduled trips
    """

    def __init__(self, db_session: Session):
        """
        Initialize the OptimizationService with a database session.

        Args:
            db_session (Session): Active SQLAlchemy session.
        """
        self.db = db_session
        self.data_manager = DataManager(db_session)

    # -------------------------------------------------------------------------
    # Utility helpers
    # -------------------------------------------------------------------------
    # Legacy helpers removed: grouping/availability handled upstream

    # -------------------------------------------------------------------------
    # Main workflow
    # -------------------------------------------------------------------------
    def run_optimization(
        self,
        job_id: str,
        optimization_request: schemas.OptimizationRequest
    ) -> schemas.OptimizationResult:
        """
        Execute the optimization process and persist results.

        Steps:
            1. Convert Pydantic schemas to dictionaries.
            2. Group requests by date.
            3. Filter vehicles by availability for each date.
            4. Run the solver for each date and collect trips.
            5. Save results and trips to the database.

        Args:
            job_id (str): Unique job identifier.
            optimization_request (OptimizationRequest): Input data for optimization.

        Returns:
            OptimizationResult: Final result containing scheduled trips.
        """
        # Convert input schemas to raw dictionaries
        vehicles = [v.model_dump(mode="json") for v in optimization_request.vehicles]
        requests = [r.model_dump(mode="json") for r in optimization_request.requests]

        all_scheduled_trips: List[schemas.ScheduledTrip] = []
        all_unassigned: List[str] = []

        # Solve once with provided vehicles and booking requests
        solver = OptimizationSolver(vehicles, requests)
        solve_result = solver.solve()

        # Build ScheduledTrip objects from solver output
        for assigned in solve_result.get("assigned", []):
            stops: List[schemas.TripStop] = []

            # Construct stop sequence with basic type inference
            for i, node_idx in enumerate(assigned["route_nodes"]):
                loc = solver.locations[node_idx]
                if node_idx == solver.depot_index and i == 0:
                    stop_type = "start"
                else:
                    stop_type = "pickup"
                    for pair in solver.pickup_drop_pairs:
                        if node_idx == pair[1]:
                            stop_type = "dropoff"
                            break
                stops.append(
                    schemas.TripStop(
                        location_id="",
                        latitude=loc["latitude"],
                        longitude=loc["longitude"],
                        estimated_arrival_time=datetime.now(timezone.utc),  # TODO: refine with cumul times
                        type=stop_type,
                    )
                )

            # Append explicit end depot stop
            dep = solver.locations[solver.depot_index]
            stops.append(
                schemas.TripStop(
                    location_id="",
                    latitude=dep["latitude"],
                    longitude=dep["longitude"],
                    estimated_arrival_time=datetime.now(timezone.utc),
                    type="end",
                )
            )

            # Parse solver-provided absolute datetimes
            start_dt = (
                datetime.fromisoformat(assigned["start_time"].replace("Z", "+00:00"))
                if assigned.get("start_time")
                else datetime.now()
            )
            end_dt = (
                datetime.fromisoformat(assigned["end_time"].replace("Z", "+00:00"))
                if assigned.get("end_time")
                else datetime.now()
            )

            scheduled_trip = schemas.ScheduledTrip(
                vehicle_id=assigned["vehicle_id"],
                combined_request_ids=assigned["requests"],
                trip_start_time=start_dt,
                trip_end_time=end_dt,
                total_duration_minutes=int((assigned.get("total_time_s") or 0) / 60),
                total_distance_meters=assigned.get("total_distance_m", 0),
                route=stops,
            )
            all_scheduled_trips.append(scheduled_trip)

        # Collect unassigned requests
        all_unassigned.extend(solve_result.get("unassigned_requests", []))

        # Compile final result
        result = schemas.OptimizationResult(
            job_id=job_id,
            status="completed",
            scheduled_trips=all_scheduled_trips,
            unassigned_requests=all_unassigned,
        )

        # Persist results
        self.data_manager.save_optimization_result(job_id, result)
        self.data_manager.save_trips(result.scheduled_trips)

        return result
