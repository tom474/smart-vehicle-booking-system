import os
from re import S
import time
from typing import Dict
import pytest

# You need to import your FastAPI app and TestClient
from fastapi.testclient import TestClient
from app.main import app  # adjust if your entrypoint is elsewhere

client = TestClient(app)

# -----------------------------------
# Common helpers
# -----------------------------------
API_PREFIX = "/optimizer/api/v1"
API_KEY = os.environ.get("API_KEY", "test-api-key")  # fallback for local
HEADERS = {"X-API-Key": API_KEY}


def poll_until_complete(job_id: str, timeout: float = 5.0):
    """Poll the status endpoint until job completes or times out."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        status_resp = client.get(
            f"{API_PREFIX}/optimize/{job_id}/status", headers=HEADERS
        )
        status_resp.raise_for_status()
        status = status_resp.json()["status"]
        if status != "pending":
            return status
        time.sleep(0.1)
    return None


def run_api_with_payload(payload: Dict, expected_trips_at_least=1):
    if not payload:
        return

    # Start optimization
    resp = client.post(f"{API_PREFIX}/optimize", json=payload, headers=HEADERS)
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    assert job_id.startswith("OPT-")

    # Poll status until job is completed
    status = poll_until_complete(job_id)
    assert status == "completed"

    # Fetch and validate result
    result_resp = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    assert result_resp.status_code == 200
    data = result_resp.json()
    assert "scheduled_trips" in data
    assert isinstance(data["scheduled_trips"], list)
    assert len(data["scheduled_trips"]) >= expected_trips_at_least


# -----------------------------------
# Test Data for Optimization API
# -----------------------------------
OPTIMIZATION_PAYLOAD = {
    "vehicles": [
        {"id": "VEH-1", "capacity": 6},
        {"id": "VEH-2", "capacity": 4},
        {"id": "VEH-3", "capacity": 6},
        {"id": "VEH-4", "capacity": 4},
    ],
    "requests": [
        {
            "id": "REQ-1",
            "pickup_location": {
                "id": "LOC-1",
                "latitude": 10.771937,
                "longitude": 106.721063,
            },
            "dropoff_location": {
                "id": "LOC-5",
                "latitude": 10.944313,
                "longitude": 107.140062,
            },
            "dropoff_time": "2025-08-20T09:00:00Z",
            "capacity_demand": 4,
        },
        {
            "id": "REQ-2",
            "pickup_location": {
                "id": "LOC-2",
                "latitude": 10.925438,
                "longitude": 107.135688,
            },
            "dropoff_location": {
                "id": "LOC-1",
                "latitude": 10.771937,
                "longitude": 106.721063,
            },
            "dropoff_time": "2025-08-20T14:00:00Z",
            "capacity_demand": 2,
        },
        {
            "id": "REQ-3",
            "pickup_location": {
                "id": "LOC-1",
                "latitude": 10.771937,
                "longitude": 106.721063,
            },
            "dropoff_location": {
                "id": "LOC-2",
                "latitude": 10.925438,
                "longitude": 107.135688,
            },
            "dropoff_time": "2025-08-20T09:00:00Z",
            "capacity_demand": 2,
        },
        {
            "id": "REQ-4",
            "pickup_location": {
                "id": "LOC-1",
                "latitude": 10.771937,
                "longitude": 106.721063,
            },
            "dropoff_location": {
                "id": "LOC-4",
                "latitude": 10.572437,
                "longitude": 106.416062,
            },
            "dropoff_time": "2025-08-20T12:00:00Z",
            "capacity_demand": 5,
        },
        {
            "id": "REQ-5",
            "pickup_location": {
                "id": "LOC-6",
                "latitude": 10.562938,
                "longitude": 106.418312,
            },
            "dropoff_location": {
                "id": "LOC-1",
                "latitude": 10.771937,
                "longitude": 106.721063,
            },
            "dropoff_time": "2025-08-20T15:00:00Z",
            "capacity_demand": 5,
        },
    ],
}


# -----------------------------------
# Tests
# -----------------------------------
def test_health_check():
    resp = client.get(f"{API_PREFIX}/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.integration
def test_optimization_flow():
    """
    Integration test for the optimization API endpoint.
    This test submits a realistic payload, polls for completion, and verifies the result structure.
    """
    # Start optimization
    resp = client.post(
        f"{API_PREFIX}/optimize", json=OPTIMIZATION_PAYLOAD, headers=HEADERS
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    assert job_id.startswith("OPT-")

    # Poll status until job is completed
    status = poll_until_complete(job_id)
    assert status == "completed"

    # Fetch and validate result
    result_resp = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    assert result_resp.status_code == 200
    data = result_resp.json()
    assert "scheduled_trips" in data
    assert isinstance(data["scheduled_trips"], list)
    assert len(data["scheduled_trips"]) > 0


@pytest.mark.integration
def test_optimization_case_2():
    SAMPLE_PAYLOAD = {
        "vehicles": [
            {"id": "VEH-1", "capacity": 6}
        ],
        "requests": [
            {
                "id": "REQ-1",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_time": "2025-08-20T09:00:00Z",
                "capacity_demand": 4,
            }
        ],
    }

    run_api_with_payload(SAMPLE_PAYLOAD)


@pytest.mark.integration
def test_impossible_case():
    """
    Test when all vehicles are occupied on the trips
    """
    SAMPLE_PAYLOAD = {
        "vehicles": [
            {"id": "VEH-1", "capacity": 4},
            {"id": "VEH-2", "capacity": 3},
        ],
        "requests": [
            {
                "id": "REQ-1",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-2",
                    "latitude": 10.800000,
                    "longitude": 106.750000,
                },
                "dropoff_time": "2025-08-20T09:00:00Z",
                "capacity_demand": 5,
            },
            {
                "id": "REQ-2",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-3",
                    "latitude": 10.775000,
                    "longitude": 106.725000,
                },
                "dropoff_time": "2025-08-20T10:00:00Z",
                "capacity_demand": 2,
            },
        ],
    }

    run_api_with_payload(SAMPLE_PAYLOAD, 0)


@pytest.mark.integration
def test_optimized_vehicle_case():
    """
    Test whether the optimizer pick up correct expected vehicle
    """
    SAMPLE_PAYLOAD = {
        "vehicles": [
            {"id": "VEH-1", "capacity": 4},
            {"id": "VEH-2", "capacity": 12},
        ],
        "requests": [
            {
                "id": "REQ-1",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-2",
                    "latitude": 10.850000,
                    "longitude": 106.800000,
                },
                "dropoff_time": "2025-08-20T10:00:00Z",
                "capacity_demand": 12,
            }
        ],
    }

    # Start optimization
    resp = client.post(f"{API_PREFIX}/optimize", json=SAMPLE_PAYLOAD, headers=HEADERS)
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    assert job_id.startswith("OPT-")

    # Poll status until job is completed
    status = poll_until_complete(job_id)
    assert status == "completed"

    # Fetch and validate result
    result_resp = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    assert result_resp.status_code == 200
    data = result_resp.json()
    assert "scheduled_trips" in data
    assert isinstance(data["scheduled_trips"], list)
    assert len(data["scheduled_trips"]) == 1
    assert data["scheduled_trips"][0]["vehicle_id"] == "VEH-2"


@pytest.mark.integration
def test_optimization_with_conflicting_requests_time_case():
    """
    Test if vehicle can be assigned to requests with conflicting time
    1 Vehicle will be assign to 2 trips with the same starting location but different destination
    """
    SAMPLE_PAYLOAD = {
        "vehicles": [
            {"id": "VEH-1", "capacity": 6}
        ],
        "requests": [
            {
                "id": "REQ-1",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-2",
                    "latitude": 10.900000,
                    "longitude": 106.800000,
                },
                "dropoff_time": "2025-08-20T08:30:00Z",
                "capacity_demand": 2,
            },
            {
                "id": "REQ-2",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.771937,
                    "longitude": 106.721063,
                },
                "dropoff_location": {
                    "id": "LOC-3",
                    "latitude": 10.650000,
                    "longitude": 106.650000,
                },
                "dropoff_time": "2025-08-20T08:45:00Z",
                "capacity_demand": 3,
            },
        ],
    }

    # Start optimization
    resp = client.post(f"{API_PREFIX}/optimize", json=SAMPLE_PAYLOAD, headers=HEADERS)
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    assert job_id.startswith("OPT-")

    # Poll status until job is completed
    status = poll_until_complete(job_id)
    assert status == "completed"

    # Fetch and validate result
    result_resp = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    assert result_resp.status_code == 200
    data = result_resp.json()
    print(data)
    assert "scheduled_trips" in data
    assert isinstance(data["scheduled_trips"], list)
    assert len(data["scheduled_trips"]) >= 1


# -----------------------------------
# New user-specified scenarios
# -----------------------------------

# @pytest.mark.integration
# def test_user_case_batch1_mixed_routes_time_objective():
#     payload = {
#         "requests": [
#             {
#                 "id": "VBR-5",
#                 "pickup_location": {
#                     "id": "LOC-1",
#                     "latitude": 10.772098218589568,
#                     "longitude": 106.72204602572545,
#                 },
#                 "dropoff_location": {
#                     "id": "LOC-33",
#                     "latitude": 10.789565207729902,
#                     "longitude": 106.7184296532982,
#                 },
#                 "dropoff_time": "2025-10-05T02:30:00.000Z",
#                 "capacity_demand": 2,
#             },
#             {
#                 "id": "VBR-7",
#                 "pickup_location": {
#                     "id": "LOC-1",
#                     "latitude": 10.772098218589568,
#                     "longitude": 106.72204602572545,
#                 },
#                 "dropoff_location": {
#                     "id": "LOC-3",
#                     "latitude": 10.174619491704133,
#                     "longitude": 105.93617591174664,
#                 },
#                 "dropoff_time": "2025-10-05T04:45:00.000Z",
#                 "capacity_demand": 1,
#             },
#             {
#                 "id": "VBR-6",
#                 "pickup_location": {
#                     "id": "LOC-2",
#                     "latitude": 10.925649373489637,
#                     "longitude": 107.1356217685675,
#                 },
#                 "dropoff_location": {
#                     "id": "LOC-1",
#                     "latitude": 10.772098218589568,
#                     "longitude": 106.72204602572545,
#                 },
#                 "dropoff_time": "2025-10-05T06:00:00.000Z",
#                 "capacity_demand": 2,
#             },
#             {
#                 "id": "VBR-8",
#                 "pickup_location": {
#                     "id": "LOC-1",
#                     "latitude": 10.772098218589568,
#                     "longitude": 106.72204602572545,
#                 },
#                 "dropoff_location": {
#                     "id": "LOC-3",
#                     "latitude": 10.174619491704133,
#                     "longitude": 105.93617591174664,
#                 },
#                 "dropoff_time": "2025-10-05T09:00:00.000Z",
#                 "capacity_demand": 2,
#             },
#             {
#                 "id": "VBR-9",
#                 "pickup_location": {
#                     "id": "LOC-3",
#                     "latitude": 10.174619491704133,
#                     "longitude": 105.93617591174664,
#                 },
#                 "dropoff_location": {
#                     "id": "LOC-1",
#                     "latitude": 10.772098218589568,
#                     "longitude": 106.72204602572545,
#                 },
#                 "dropoff_time": "2025-10-05T13:00:00.000Z",
#                 "capacity_demand": 2,
#             },
#         ],
#         "vehicles": [
#             {"id": "VEH-2", "capacity": 8},
#             {"id": "VEH-1", "capacity": 7},
#             {"id": "VEH-3", "capacity": 7},
#             {"id": "VEH-5", "capacity": 7},
#             {"id": "VEH-6", "capacity": 4},
#             {"id": "VEH-8", "capacity": 7},
#         ],
#     }

#     # Run and check typical invariants
#     resp = client.post(f"{API_PREFIX}/optimize", json=payload, headers=HEADERS)
#     assert resp.status_code == 202
#     job_id = resp.json()["job_id"]
#     status = poll_until_complete(job_id, timeout=10)
#     assert status == "completed"
#     res = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
#     data = res.json()
#     assert isinstance(data.get("scheduled_trips"), list)
#     assert len(data["scheduled_trips"]) >= 1
#     # Validate 10-hour cap and chronological times
#     for trip in data["scheduled_trips"]:
#         start = trip["trip_start_time"]
#         end = trip["trip_end_time"]
#         assert end >= start
#         assert 0 <= trip["total_duration_minutes"] <= 600


@pytest.mark.integration
def test_user_case_batch2_single_request_next_morning():
    payload = {
        "requests": [
            {
                "id": "VBR-11",
                "pickup_location": {
                    "id": "LOC-2",
                    "latitude": 10.925649373489637,
                    "longitude": 107.1356217685675,
                },
                "dropoff_location": {
                    "id": "LOC-1",
                    "latitude": 10.772098218589568,
                    "longitude": 106.72204602572545,
                },
                "dropoff_time": "2025-10-06T04:00:00.000Z",
                "capacity_demand": 2,
            }
        ],
        "vehicles": [
            {"id": "VEH-1", "capacity": 7},
            {"id": "VEH-2", "capacity": 8},
        ],
    }

    resp = client.post(f"{API_PREFIX}/optimize", json=payload, headers=HEADERS)
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    status = poll_until_complete(job_id, timeout=10)
    assert status == "completed"
    res = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    data = res.json()
    assert len(data.get("scheduled_trips", [])) >= 1
    trip = data["scheduled_trips"][0]
    assert trip["total_duration_minutes"] <= 600
    assert trip["trip_end_time"] >= trip["trip_start_time"]


@pytest.mark.integration
def test_user_case_batch3_multiple_same_direction():
    payload = {
        "requests": [
            {
                "id": "VBR-1",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.772098218589568,
                    "longitude": 106.72204602572545,
                },
                "dropoff_location": {
                    "id": "LOC-2",
                    "latitude": 10.925649373489637,
                    "longitude": 107.1356217685675,
                },
                "dropoff_time": "2025-10-04T03:00:00.000Z",
                "capacity_demand": 1,
            },
            {
                "id": "VBR-2",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.772098218589568,
                    "longitude": 106.72204602572545,
                },
                "dropoff_location": {
                    "id": "LOC-2",
                    "latitude": 10.925649373489637,
                    "longitude": 107.1356217685675,
                },
                "dropoff_time": "2025-10-04T05:30:00.000Z",
                "capacity_demand": 2,
            },
            {
                "id": "VBR-4",
                "pickup_location": {
                    "id": "LOC-1",
                    "latitude": 10.772098218589568,
                    "longitude": 106.72204602572545,
                },
                "dropoff_location": {
                    "id": "LOC-3",
                    "latitude": 10.174619491704133,
                    "longitude": 105.93617591174664,
                },
                "dropoff_time": "2025-10-04T12:15:00.000Z",
                "capacity_demand": 3,
            },
        ],
        "vehicles": [
            {"id": "VEH-1", "capacity": 7},
            {"id": "VEH-8", "capacity": 7},
            {"id": "VEH-5", "capacity": 7},
            {"id": "VEH-3", "capacity": 7},
        ],
    }

    resp = client.post(f"{API_PREFIX}/optimize", json=payload, headers=HEADERS)
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    status = poll_until_complete(job_id, timeout=10)
    assert status == "completed"
    res = client.get(f"{API_PREFIX}/optimize/{job_id}/result", headers=HEADERS)
    data = res.json()
    assert len(data.get("scheduled_trips", [])) >= 1
    for trip in data["scheduled_trips"]:
        assert 0 <= trip["total_duration_minutes"] <= 600
    # Route will include depot and all visited nodes; ensure it's at least 3
    assert len(data["scheduled_trips"][0]["route"]) >= 3
