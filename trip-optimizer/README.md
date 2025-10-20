## Repository Description

This repository contains the microservice responsible for **route optimization and vehicle assignment** within the Smart Vehicle Booking System. It serves as the decision engine that intelligently schedules trips, consolidates vehicle usage, and reduces operational inefficiencies.

## API URL Scheme

All endpoints are exposed under the versioned prefix `/optimizer/api/v1`.
For example, the health check endpoint is reachable at:

```bash
curl http://localhost:8000/optimizer/api/v1/health
```

## Setup, Build, and Test Instructions

### 1. Install Python dependencies

```bash
cd trip-optimizer
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Set up environment variables (optional for local test)

The following are required for full API and test functionality:

- `API_KEY` (default: `test-api-key`)
- `GOOGLE_MAPS_API_KEY` (for real matrix, required for production)
- `DATABASE_URL` (default: `sqlite:///./test.db`)

You can set them in your shell or a `.env` file.

### 3. Run the API server

```bash
uvicorn app.main:app --reload
```

### 4. Run the tests

Tests are located in `trip-optimizer/tests/` and use realistic matrix calculations (no mocks).

```bash
pytest trip-optimizer/tests/
```

### 5. Notes

- For full integration, ensure your Google Maps API key is valid and set in the environment.
- The test cases use real coordinates and will call the real matrix service unless you re-enable mocking in `conftest.py`.