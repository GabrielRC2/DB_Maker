# DB Maker Backend

Backend API for DB Maker - A visual database schema designer platform built with FastAPI and MongoDB.

## 🏗️ Project Structure

```
backend/
├── api/                    # API route handlers (endpoints)
│   └── v1/                # Version 1 of the API
│       └── schemas.py     # Schema management endpoints
├── core/                  # Core configuration and infrastructure
│   ├── config.py          # Application settings and environment variables
│   └── database.py        # MongoDB connection and utilities
├── schemas/               # Pydantic models for validation
│   └── schema.py          # Schema data models and validation
├── services/              # Business logic layer
│   └── schema_service.py  # Schema CRUD operations
└── tests/                 # Automated test suite
    └── test_schemas.py    # Tests for schema endpoints
```

## 📁 Folder Responsibilities

### `api/`
Contains all HTTP route handlers organized by API version. Routes handle requests/responses and delegate business logic to services.

### `core/`
Core infrastructure including configuration management (`config.py`) and database connections (`database.py`). No business logic.

### `schemas/`
Pydantic models that define data structure, validation rules, and API documentation. Essential for MongoDB to provide type safety.

### `services/`
Business logic layer that separates concerns from API routes. Services contain reusable logic and interact with the database.

### `tests/`
Automated test suite for unit and integration testing.

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- MongoDB Atlas account (free tier)
- pip package manager

### Installation

1. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment**
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   ALLOWED_ORIGINS=["http://localhost:3000"]
   ```

5. **Run the development server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

6. **Access the API documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📦 Dependencies

```txt
fastapi==0.109.0          # Modern web framework
uvicorn[standard]==0.27.0 # ASGI server
motor==3.3.2              # Async MongoDB driver
pymongo==4.6.1            # MongoDB driver
pydantic==2.5.3           # Data validation
pydantic-settings==2.1.0  # Settings management
python-dotenv==1.0.0      # Environment variables
```

## 🔌 API Endpoints

### Schemas
- `POST /api/v1/schemas/` - Create a new schema
- `GET /api/v1/schemas/` - List all schemas
- `GET /api/v1/schemas/{id}` - Get a specific schema
- `PUT /api/v1/schemas/{id}` - Update a schema
- `DELETE /api/v1/schemas/{id}` - Delete a schema

### Health Check
- `GET /` - API info
- `GET /health` - Health status

## 🧪 Testing

Run tests with pytest:
```bash
pytest tests/
```

## 🛠️ Development

### Code Structure Pattern
1. **Request** → API Route (`api/v1/`)
2. **Validation** → Pydantic Schema (`schemas/`)
3. **Business Logic** → Service (`services/`)
4. **Database** → MongoDB (`core/database.py`)
5. **Response** → Pydantic Schema → API Route

### Adding New Features
1. Define Pydantic schemas in `schemas/`
2. Create service methods in `services/`
3. Add API routes in `api/v1/`
4. Write tests in `tests/`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `DATABASE_NAME` | Database name | `db_maker` |
| `SCHEMAS_COLLECTION` | Collection for schemas | `schemas` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:3000"]` |

## 🔐 MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Copy the connection string to your `.env` file
5. Collections are created automatically on first insert

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Motor Documentation](https://motor.readthedocs.io/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
