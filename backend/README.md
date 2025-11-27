# Schema Designer Backend

This is the backend for the Schema Designer platform, built with FastAPI.

## Structure

- `app/`: Main application code
    - `api/`: API route handlers (endpoints)
    - `core/`: Core configuration (settings, security, database connection)
    - `models/`: Database models (SQLAlchemy/Tortoise/SQLModel)
    - `schemas/`: Pydantic models for request/response validation
    - `services/`: Business logic layer
- `tests/`: Test suite

## Getting Started

1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate`
3. Install dependencies: `pip install fastapi uvicorn`
4. Run the server: `uvicorn main:app --reload`
