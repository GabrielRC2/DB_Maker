from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from core.database import db
from core.config import settings
from schemas.schema import SchemaCreate, SchemaUpdate, SchemaResponse


class SchemaService:
    """Service layer for database schema operations"""
    
    @staticmethod
    def _get_collection():
        """Get schemas collection"""
        return db.get_collection(settings.SCHEMAS_COLLECTION)
    
    @staticmethod
    def _schema_helper(schema) -> dict:
        """Convert MongoDB document to dict"""
        if schema:
            schema["id"] = str(schema["_id"])
            del schema["_id"]
        return schema
    
    @classmethod
    async def create_schema(cls, schema: SchemaCreate) -> SchemaResponse:
        """Create a new database schema"""
        collection = cls._get_collection()
        
        schema_dict = schema.model_dump()
        schema_dict["created_at"] = datetime.utcnow()
        schema_dict["updated_at"] = datetime.utcnow()
        schema_dict["version"] = 1
        schema_dict["user_id"] = None  # TODO: Add user authentication
        
        result = await collection.insert_one(schema_dict)
        created_schema = await collection.find_one({"_id": result.inserted_id})
        
        return SchemaResponse(**cls._schema_helper(created_schema))
    
    @classmethod
    async def list_schemas(cls) -> List[SchemaResponse]:
        """Get all database schemas"""
        collection = cls._get_collection()
        schemas = []
        
        async for schema in collection.find():
            schemas.append(SchemaResponse(**cls._schema_helper(schema)))
        
        return schemas
    
    @classmethod
    async def get_schema(cls, schema_id: str) -> Optional[SchemaResponse]:
        """Get a specific database schema by ID"""
        collection = cls._get_collection()
        
        if not ObjectId.is_valid(schema_id):
            return None
        
        schema = await collection.find_one({"_id": ObjectId(schema_id)})
        
        if schema:
            return SchemaResponse(**cls._schema_helper(schema))
        return None
    
    @classmethod
    async def update_schema(cls, schema_id: str, schema: SchemaUpdate) -> Optional[SchemaResponse]:
        """Update an existing database schema"""
        collection = cls._get_collection()
        
        if not ObjectId.is_valid(schema_id):
            return None
        
        update_data = {k: v for k, v in schema.model_dump(exclude_unset=True).items()}
        update_data["updated_at"] = datetime.now()
        
        result = await collection.update_one(
            {"_id": ObjectId(schema_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            updated_schema = await collection.find_one({"_id": ObjectId(schema_id)})
            return SchemaResponse(**cls._schema_helper(updated_schema))
        
        return None
    
    @classmethod
    async def delete_schema(cls, schema_id: str) -> bool:
        """Delete a database schema"""
        collection = cls._get_collection()
        
        if not ObjectId.is_valid(schema_id):
            return False
        
        result = await collection.delete_one({"_id": ObjectId(schema_id)})
        return result.deleted_count > 0
