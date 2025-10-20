"""
app/api/routes.py

Public and authenticated API routes for the service.
"""

# Standard library imports
import uuid

# Third-party imports
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Local application imports
from app.core.config import settings
from app.db import models
from app.db.session import SessionLocal
from app.dependencies import get_api_key, get_db
from app.models import schemas
from app.services.data_manager import DataManager
from app.services.optimization_service import OptimizationService
from app.utils.info_utils import InfoUtils


# -----------------------------------------------------------------------------
# Routers
# -----------------------------------------------------------------------------
public_router = APIRouter(tags=["Public"])
optimizer_router = APIRouter(
    tags=["Trip Optimizer"],
    dependencies=[Depends(get_api_key)]
)

info_utils = InfoUtils()


# -----------------------------------------------------------------------------
# Public Routes
# -----------------------------------------------------------------------------
@public_router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint.

    Returns:
        dict: A simple status object to indicate the service is running.
    """
    return {"status": "ok"}


@public_router.get("/info", status_code=status.HTTP_200_OK)
def get_info():
    """
    Retrieve general API information.

    Returns:
        dict: Name, version, description, and contact info.
    """
    return info_utils.get_info()


@public_router.get("/version", status_code=status.HTTP_200_OK)
def get_version():
    """
    Retrieve current API version.

    Returns:
        dict: Current version of the API.
    """
    return {"version": info_utils.get_version()}


# -----------------------------------------------------------------------------
# Authenticated Routes
# -----------------------------------------------------------------------------
@optimizer_router.get("/config", response_model=schemas.AppConfigResponse)
def get_app_config():
    """
    Retrieve optimization configuration parameters.

    Returns:
        schemas.AppConfigResponse: Contains solver settings such as time limits and strategy.
    """
    return {
        "project_name": settings.PROJECT_NAME,
        "solver_time_limit": settings.SOLVER_TIME_LIMIT_SECONDS,
        "solver_strategy": settings.SOLVER_SOLUTION_STRATEGY,
    }


@optimizer_router.post(
    "/optimize",
    response_model=schemas.JobCreationResponse,
    status_code=status.HTTP_202_ACCEPTED
)
def create_optimization_task(
    request: schemas.OptimizationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new optimization job.

    Args:
        request (schemas.OptimizationRequest): Incoming request data with trips and vehicles.
        background_tasks (BackgroundTasks): FastAPI background task manager.
        db (Session): Database session.

    Returns:
        dict: ID of the newly created job.
    """
    # Generate unique job id
    task_id = f"OPT-{uuid.uuid4()}"

    # Insert a new job record with 'pending' status
    new_task = models.OptimizationJob(id=task_id, status="pending")
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Launch background process to run optimization
    background_tasks.add_task(run_optimization_background, request, task_id)

    return {"job_id": task_id}


@optimizer_router.get("/optimize/{task_id}/status", response_model=schemas.JobStatusResponse)
def get_optimization_status(task_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the status of an optimization job.

    Args:
        task_id (str): ID of the optimization job.
        db (Session): Database session.

    Returns:
        dict: Job ID and current status.

    Raises:
        HTTPException: If the job is not found.
    """
    task = db.get(models.OptimizationJob, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return {"job_id": task.id, "status": task.status}


@optimizer_router.get("/optimize/{task_id}/result", response_model=schemas.OptimizationResult)
def get_optimization_result(task_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the result of a completed optimization job.

    Args:
        task_id (str): ID of the optimization job.
        db (Session): Database session.

    Returns:
        schemas.OptimizationResult: Result data for the completed job.

    Raises:
        HTTPException:
            - 404 if the job is not found.
            - 400 if the job is still running or pending.
    """
    task = db.get(models.OptimizationJob, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Only allow result retrieval when job is finished
    if task.status not in ["completed", "failed", "completed_with_no_solution"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is still in '{task.status}' state. Result not available yet."
        )

    # Build and return the response model
    response_data = task.result or {}
    response_data["job_id"] = task.id
    response_data["status"] = task.status
    return schemas.OptimizationResult(**response_data)


# -----------------------------------------------------------------------------
# Background Task
# -----------------------------------------------------------------------------
def run_optimization_background(request: schemas.OptimizationRequest, task_id: str):
    """
    Execute the optimization workflow in a background task.

    Steps:
        1. Clear previous temporary data.
        2. Load incoming request data into the database.
        3. Run the optimization solver.
        4. Save and commit results back to the job record.

    Args:
        request (schemas.OptimizationRequest): Input data for optimization.
        task_id (str): ID of the job being processed.
    """
    db = SessionLocal()
    try:
        task = db.get(models.OptimizationJob, task_id)
        if not task:
            print(f"[{task_id}] Task not found in database.")
            return

        print(f"[{task_id}] Starting background optimization workflow...")

        # Clear any old temp data from previous runs
        dm = DataManager(db)
        dm.clear_table("Trip")
        dm.clear_table("BookingRequest")
        dm.clear_table("Vehicle")
        dm.clear_table("Location")

        # Load new request data into tables
        print(f"[{task_id}] Loading request data into DB...")
        dm.load_and_save_payload(request.model_dump(mode="json"))

        # Run the optimization solver (with graceful fallback)
        print(f"[{task_id}] Running optimization solver...")
        optimizer = OptimizationService(db)
        try:
            result = optimizer.run_optimization(task_id, request)
        except Exception as solver_err:
            # Graceful fallback: mark all as unassigned instead of failing the job
            print(f"[{task_id}] Solver error, returning fallback result: {solver_err}")
            all_req_ids = [r.id for r in request.requests]
            result = schemas.OptimizationResult(
                job_id=task_id,
                status="completed",
                message="Fallback result: all requests unassigned due to solver error.",
                scheduled_trips=[],
                unassigned_requests=all_req_ids,
            )

        # Update task with results
        task.status = result.status
        task.result = result.model_dump(mode="json")
        db.commit()
        print(f"[{task_id}] Optimization completed and committed.")

    except Exception as e:
        # Capture and store any failure details
        print(f"[{task_id}] Optimization failed: {e}")
        task = db.get(models.OptimizationJob, task_id)
        if task:
            task.status = "failed"
            task.result = {"message": str(e)}
            db.commit()
    finally:
        db.close()
