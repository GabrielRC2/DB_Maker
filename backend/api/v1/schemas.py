from fastapi import APIRouter, HTTPException, status
from typing import List
from schemas.schema import SchemaCreate, SchemaUpdate, SchemaResponse
from services.schema_service import SchemaService

router = APIRouter(prefix="/schemas", tags=["schemas"])


@router.post("/", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def create_schema(schema: SchemaCreate):
    """
    Create a new database schema.
    
    - **name**: Name of the schema
    - **description**: Optional description
    - **tables**: List of tables with columns
    - **relationships**: List of relationships between tables
    - **indexes**: Optional list of custom indexes
    """
    return await SchemaService.create_schema(schema)


@router.get("/", response_model=List[SchemaResponse])
async def list_schemas():
    """
    Get all database schemas.
    
    Returns a list of all schemas in the database.
    """
    return await SchemaService.list_schemas()


@router.get("/{schema_id}", response_model=SchemaResponse)
async def get_schema(schema_id: str):
    """
    Get a specific database schema by ID.
    
    - **schema_id**: MongoDB ObjectId of the schema
    """
    schema = await SchemaService.get_schema(schema_id)
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema with id '{schema_id}' not found"
        )
    return schema


@router.put("/{schema_id}", response_model=SchemaResponse)
async def update_schema(schema_id: str, schema: SchemaUpdate):
    """
    Update an existing database schema.
    
    - **schema_id**: MongoDB ObjectId of the schema
    - Only provided fields will be updated
    """
    updated_schema = await SchemaService.update_schema(schema_id, schema)
    if not updated_schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema with id '{schema_id}' not found"
        )
    return updated_schema


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(schema_id: str):
    """
    Delete a database schema.
    
    - **schema_id**: MongoDB ObjectId of the schema
    """
    deleted = await SchemaService.delete_schema(schema_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema with id '{schema_id}' not found"
        )
    return None
