"""
app/services/optimization_solver.py

Core solver logic for the Trip Optimizer service.
Builds data structures from vehicles and requests, queries the distance matrix,
applies pickup/delivery constraints, and uses OR-Tools to compute optimal routes.
"""

# Standard library imports
from typing import List, Dict, Tuple

# Third-party imports
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

# Local application imports
from app.clients.distance_matrix_client import DistanceMatrixClient
from app.core.config import settings
from datetime import datetime, timedelta, timezone


# -----------------------------------------------------------------------------
# Optimization Solver
# -----------------------------------------------------------------------------
class OptimizationSolver:
    """
    Wraps OR-Tools routing solver to assign booking requests to vehicles.

    Workflow:
        - Prepare data (locations, depots, demands, pickup/drop pairs).
        - Build distance and time matrices via Google Maps API.
        - Configure constraints (capacity, time windows, pickup/delivery).
        - Run solver and translate solution into structured output.
    """

    def __init__(self, vehicles: List[Dict], requests: List[Dict], depot_location: Dict[str, float] | None = None):
        """
        Initialize solver with raw vehicle and request dictionaries.

        Args:
            vehicles (list[dict]): Vehicle input data.
            requests (list[dict]): Booking request input data.
        """
        self.vehicles = vehicles
        self.requests = requests
        self.locations: List[Dict[str, float]] = []
        self.pickup_drop_pairs: List[tuple] = []
        self.demands: List[int] = []
        self.depot_index: int = 0
        self._depot_location = depot_location or {
            "latitude": settings.DEPOT_LATITUDE,
            "longitude": settings.DEPOT_LONGITUDE,
        }

        # Timeline anchor allowing cross-midnight handling (up to ~48h horizon)
        self.anchor_dt_utc: datetime | None = None
        self._dropoff_deadlines_abs: List[int] = []

        # Prepare internal data structures
        self._prepare_data()

        # Distance matrix client
        self.distance_client = DistanceMatrixClient()

    # -------------------------------------------------------------------------
    # Data preparation
    # -------------------------------------------------------------------------
    def _prepare_data(self) -> None:
        """Prepare location list, single depot index, demands, and pickup/drop pairs."""
        self.locations = []
        # Single depot at index 0
        self.depot_index = 0
        self.locations.append({
            "latitude": self._depot_location["latitude"],
            "longitude": self._depot_location["longitude"],
        })

        # Determine a timeline anchor in UTC from request dropoff datetimes
        dropoff_dts_utc: List[datetime] = []
        for req in self.requests:
            dt = datetime.fromisoformat(req["dropoff_time"].replace("Z", "+00:00"))
            # Normalize to UTC if no tzinfo
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            dropoff_dts_utc.append(dt)

        if dropoff_dts_utc:
            earliest_drop = min(dropoff_dts_utc)
            # Anchor 12 hours before earliest drop to allow evening → next morning
            self.anchor_dt_utc = earliest_drop - timedelta(hours=12)
        else:
            self.anchor_dt_utc = datetime.now(timezone.utc)

        # Process pickup and dropoff pairs
        for idx, req in enumerate(self.requests):
            p = req["pickup_location"]
            d = req["dropoff_location"]

            p_idx = len(self.locations)
            self.locations.append({"latitude": p["latitude"], "longitude": p["longitude"]})

            # Ensure pickup and dropoff are distinct in coordinate list
            if p["latitude"] == d["latitude"] and p["longitude"] == d["longitude"]:
                # Create a slightly offset dropoff to avoid identical coordinates
                shadow = {"latitude": d["latitude"], "longitude": d["longitude"] + 0.000001}
                d_idx = len(self.locations)
                self.locations.append(shadow)
            else:
                d_idx = len(self.locations)
                self.locations.append({"latitude": d["latitude"], "longitude": d["longitude"]})

            self.pickup_drop_pairs.append((p_idx, d_idx))
            demand = req["capacity_demand"]
            self.demands.extend([demand, -demand])

            # Absolute deadline seconds relative to anchor
            drop_dt = dropoff_dts_utc[idx]
            self._dropoff_deadlines_abs.append(int((drop_dt - self.anchor_dt_utc).total_seconds()))

        # Prepend depot demand (0)
        self.demands = [0] + self.demands

    # -------------------------------------------------------------------------
    # Solver execution
    # -------------------------------------------------------------------------
    def solve(self) -> Dict[str, any]:
        """
        Run the optimization solver and return results.

        Returns:
            dict: {
                "assigned": [ { vehicle_id, start_time, end_time, requests, route_nodes, total_distance_m, total_time_s } ],
                "unassigned_requests": [request_ids]
            }
        """
        # Build distance and time matrices
        origin_strs = [f"{loc['latitude']},{loc['longitude']}" for loc in self.locations]
        dist_matrix, time_matrix = self.distance_client.get_matrices(origin_strs, origin_strs)

        num_vehicles = len(self.vehicles)

        # Create routing manager and model
        # All vehicles start and end at the same depot
        starts = [self.depot_index] * num_vehicles
        ends = [self.depot_index] * num_vehicles
        manager = pywrapcp.RoutingIndexManager(
            len(self.locations),
            num_vehicles,
            starts,
            ends,
        )
        routing = pywrapcp.RoutingModel(manager)

        # -----------------------------
        # Distance cost
        # -----------------------------
        n = len(self.locations)

        def distance_callback(from_index, to_index):
            try:
                f = manager.IndexToNode(from_index)
                t = manager.IndexToNode(to_index)
                if f < 0 or f >= n or t < 0 or t >= n:
                    return 0
                return dist_matrix[f][t]
            except Exception:
                return 0
        dist_cb_idx = routing.RegisterTransitCallback(distance_callback)

        # Prefer time-aware objective (requested): set time as arc cost
        def time_callback(from_index, to_index):
            try:
                f = manager.IndexToNode(from_index)
                t = manager.IndexToNode(to_index)
                if f < 0 or f >= n or t < 0 or t >= n:
                    return 0
                return time_matrix[f][t]
            except Exception:
                return 0
        time_cb_idx = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(time_cb_idx)

        # -----------------------------
        # Capacity constraint
        # -----------------------------
        def demand_callback(from_index):
            return self.demands[manager.IndexToNode(from_index)]
        demand_cb_idx = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_cb_idx,
            0,
            [v["capacity"] for v in self.vehicles],
            True,
            "Capacity"
        )

        # -----------------------------
        # Time constraint
        # -----------------------------
        # Time dimension horizon: support up to 48 hours or max deadline + buffer
        max_deadline = max(self._dropoff_deadlines_abs) if self._dropoff_deadlines_abs else 86400
        horizon = max(172800, max_deadline + 36000)  # 48h or deadline + 10h buffer
        routing.AddDimension(
            time_cb_idx,
            0,      # no slack
            horizon,
            True,   # fix start cumul to zero for stability
            "Time",
        )
        time_dimension = routing.GetDimensionOrDie("Time")

        # -----------------------------
        # Pickup and delivery constraints
        # -----------------------------
        for ridx, (p, d) in enumerate(self.pickup_drop_pairs):
            pickup_index = manager.NodeToIndex(p)
            delivery_index = manager.NodeToIndex(d)
            routing.AddPickupAndDelivery(pickup_index, delivery_index)
            routing.solver().Add(routing.VehicleVar(pickup_index) == routing.VehicleVar(delivery_index))
            routing.solver().Add(routing.ActiveVar(pickup_index) == routing.ActiveVar(delivery_index))

            # Allow skipping with penalty
            penalty = settings.SOLVER_UNASSIGNED_PENALTY
            routing.AddDisjunction([pickup_index], penalty)
            routing.AddDisjunction([delivery_index], penalty)

            # Apply dropoff deadline (pickup unrestricted); absolute seconds since anchor
            dropoff_deadline = self._dropoff_deadlines_abs[ridx]
            time_dimension.CumulVar(delivery_index).SetRange(0, dropoff_deadline)

        # Per-vehicle max route duration: 10 hours (config minutes respected if changed)
        max_secs = int(settings.SOLVER_MAX_VEHICLE_TIME_MINUTES * 60)
        for v in range(num_vehicles):
            time_dimension.CumulVar(routing.End(v)).SetMax(max_secs)

        # -----------------------------
        # Search parameters
        # -----------------------------
        search_params = pywrapcp.DefaultRoutingSearchParameters()
        search_params.first_solution_strategy = getattr(
            routing_enums_pb2.FirstSolutionStrategy,
            settings.SOLVER_SOLUTION_STRATEGY
        )
        search_params.local_search_metaheuristic = getattr(
            routing_enums_pb2.LocalSearchMetaheuristic,
            settings.SOLVER_LOCAL_SEARCH_METAHEURISTIC
        )
        search_params.time_limit.seconds = settings.SOLVER_TIME_LIMIT_SECONDS
        search_params.solution_limit = settings.SOLVER_SOLUTION_LIMIT

        # Solve
        solution = routing.SolveWithParameters(search_params)
        results: Dict[str, any] = {"assigned": [], "unassigned_requests": []}

        # -----------------------------
        # Parse solution
        # -----------------------------
        if solution:
            assigned_pickups = set()

            for v_id in range(num_vehicles):
                index = routing.Start(v_id)
                if routing.IsEnd(solution.Value(routing.NextVar(index))):
                    # Vehicle unused
                    continue

                route_nodes = []
                route_time = 0
                route_distance = 0
                route_reqs: List[str] = []

                # Traverse path for this vehicle
                while not routing.IsEnd(index):
                    node = manager.IndexToNode(index)
                    route_nodes.append(node)
                    prev_index = index
                    index = solution.Value(routing.NextVar(index))
                    from_n = manager.IndexToNode(prev_index)
                    to_n = manager.IndexToNode(index)
                    if 0 <= from_n < n and 0 <= to_n < n:
                        route_time += time_matrix[from_n][to_n]
                        route_distance += dist_matrix[from_n][to_n]
                    else:
                        # Defensive: break on invalid index mapping
                        break

                # Determine which requests were serviced
                for ridx, (p, d) in enumerate(self.pickup_drop_pairs):
                    if p in route_nodes or d in route_nodes:
                        route_reqs.append(self.requests[ridx]["id"])
                        assigned_pickups.add(ridx)

                # Compute time window (absolute times based on anchor)
                if route_reqs:
                    # Map request id -> absolute deadline
                    id_to_deadline: Dict[str, int] = {
                        self.requests[i]["id"]: self._dropoff_deadlines_abs[i]
                        for i in range(len(self.requests))
                    }
                    latest_dropoff = max(id_to_deadline[rid] for rid in route_reqs)
                    latest_start_sec = max(0, latest_dropoff - route_time)
                    start_dt = self.anchor_dt_utc + timedelta(seconds=latest_start_sec)
                    end_dt = start_dt + timedelta(seconds=route_time)
                    # ISO with 'Z'
                    latest_start_time = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                    end_time_iso = end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                else:
                    latest_start_time = None
                    end_time_iso = None

                if route_reqs:
                    results["assigned"].append({
                        "vehicle_id": self.vehicles[v_id]["id"],
                        "start_time": latest_start_time,
                        "end_time": end_time_iso,
                        "requests": route_reqs,
                        "route_nodes": route_nodes,
                        "total_distance_m": route_distance,
                        "total_time_s": route_time,
                    })

            # Unassigned requests
            for i, _ in enumerate(self.requests):
                if i not in assigned_pickups:
                    results["unassigned_requests"].append(self.requests[i]["id"])
        else:
            # Solver failed: mark all requests as unassigned
            results["unassigned_requests"] = [r["id"] for r in self.requests]

        return results
