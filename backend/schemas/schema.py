from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class ForeignKeyConstraint(BaseModel):
    """Foreign key constraint definition"""
    table: str
    column: str
    on_delete: Literal["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"] = "CASCADE"
    on_update: Literal["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"] = "CASCADE"


class ColumnSchema(BaseModel):
    """Database column definition"""
    id: str
    name: str
    type: Literal["integer", "varchar", "text", "boolean", "date", "timestamp", "decimal", "json", "uuid", "bigint", "float", "double"]
    length: Optional[int] = None  # For varchar/char
    precision: Optional[int] = None  # For decimal
    scale: Optional[int] = None  # For decimal
    nullable: bool = True
    primary_key: bool = False
    unique: bool = False
    auto_increment: bool = False
    default_value: Optional[str] = None
    foreign_key: Optional[ForeignKeyConstraint] = None
    index: bool = False
    comment: Optional[str] = None


class Position(BaseModel):
    """Position coordinates for canvas rendering"""
    x: float
    y: float


class TableSchema(BaseModel):
    """Database table definition"""
    id: str
    name: str
    position: Position
    color: str = "#3B82F6"
    columns: List[ColumnSchema] = []
    comment: Optional[str] = None


class RelationshipSchema(BaseModel):
    """Relationship between tables"""
    id: str
    type: Literal["one-to-one", "one-to-many", "many-to-many"]
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    label: Optional[str] = None


class IndexSchema(BaseModel):
    """Database index definition"""
    table: str
    columns: List[str]
    type: Literal["index", "unique", "fulltext"] = "index"
    name: str


class SchemaBase(BaseModel):
    """Base schema with common fields"""
    name: str
    description: Optional[str] = None
    tables: List[TableSchema] = []
    relationships: List[RelationshipSchema] = []
    indexes: List[IndexSchema] = []
    is_public: bool = False


class SchemaCreate(SchemaBase):
    """Schema for creating a new database schema"""
    pass


class SchemaUpdate(BaseModel):
    """Schema for updating an existing database schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    tables: Optional[List[TableSchema]] = None
    relationships: Optional[List[RelationshipSchema]] = None
    indexes: Optional[List[IndexSchema]] = None
    is_public: Optional[bool] = None


class SchemaInDB(SchemaBase):
    """Schema as stored in MongoDB"""
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: Optional[str] = None
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class SchemaResponse(SchemaBase):
    """Schema for API responses"""
    id: str
    user_id: Optional[str] = None
    version: int = 1
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
