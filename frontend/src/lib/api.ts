// API client for DB Maker backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_URL}/api/v1`;

// TypeScript types matching backend Pydantic schemas

export type ForeignKeyConstraint = {
  table: string;
  column: string;
  on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  on_update?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
};

export type ColumnSchema = {
  id: string;
  name: string;
  type: 'integer' | 'varchar' | 'text' | 'boolean' | 'date' | 'timestamp' | 'decimal' | 'json' | 'uuid' | 'bigint' | 'float' | 'double';
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  nullable?: boolean;
  primary_key?: boolean;
  unique?: boolean;
  auto_increment?: boolean;
  default_value?: string | null;
  foreign_key?: ForeignKeyConstraint | null;
  index?: boolean;
  comment?: string | null;
};

export type Position = {
  x: number;
  y: number;
};

export type TableSchema = {
  id: string;
  name: string;
  position: Position;
  color?: string;
  columns: ColumnSchema[];
  comment?: string | null;
};

export type RelationshipSchema = {
  id: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  label?: string | null;
};

export type IndexSchema = {
  table: string;
  columns: string[];
  type?: 'index' | 'unique' | 'fulltext';
  name: string;
};

export type SchemaBase = {
  name: string;
  description?: string | null;
  tables?: TableSchema[];
  relationships?: RelationshipSchema[];
  indexes?: IndexSchema[];
  is_public?: boolean;
};

export type SchemaCreate = SchemaBase;

export type SchemaUpdate = Partial<SchemaBase>;

export type SchemaResponse = SchemaBase & {
  id: string;
  user_id?: string | null;
  version?: number;
  created_at: string;
  updated_at: string;
};

// API functions

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    
    // Handle validation errors specially
    if (response.status === 422 && errorData.detail) {
      const errorMsg = Array.isArray(errorData.detail) 
        ? errorData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
        : errorData.detail;
      throw new ApiError(response.status, errorMsg);
    }
    
    throw new ApiError(response.status, errorData.detail || response.statusText);
  }
  
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}

export const schemaApi = {
  /**
   * Create a new schema
   */
  async createSchema(schema: SchemaCreate): Promise<SchemaResponse> {
    const response = await fetch(`${API_V1}/schemas/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    });
    return handleResponse<SchemaResponse>(response);
  },

  /**
   * Get all schemas
   */
  async listSchemas(): Promise<SchemaResponse[]> {
    const response = await fetch(`${API_V1}/schemas/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<SchemaResponse[]>(response);
  },

  /**
   * Get a specific schema by ID
   */
  async getSchema(schemaId: string): Promise<SchemaResponse> {
    const response = await fetch(`${API_V1}/schemas/${schemaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<SchemaResponse>(response);
  },

  /**
   * Update an existing schema
   */
  async updateSchema(schemaId: string, schema: SchemaUpdate): Promise<SchemaResponse> {
    const response = await fetch(`${API_V1}/schemas/${schemaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    });
    return handleResponse<SchemaResponse>(response);
  },

  /**
   * Delete a schema
   */
  async deleteSchema(schemaId: string): Promise<void> {
    const response = await fetch(`${API_V1}/schemas/${schemaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<void>(response);
  },
};

// Helper functions to transform between frontend and backend formats

export function frontendToBackend(
  tables: Array<{ name: string; columns: any[]; position: { x: number; y: number }; color?: string }>,
  relationships: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; type: string }>,
  schemaName: string,
  description?: string
): SchemaCreate {
  const backendTables: TableSchema[] = tables.map((table) => ({
    id: `table_${table.name}`,
    name: table.name,
    position: table.position,
    color: table.color || '#3B82F6',
    columns: table.columns.map((col, idx) => ({
      id: `col_${table.name}_${col.name}_${idx}`,
      name: col.name,
      type: col.type || 'varchar',
      nullable: !col.isPrimaryKey,
      primary_key: col.isPrimaryKey || false,
      unique: col.isPrimaryKey || false,
      auto_increment: col.isPrimaryKey && col.type === 'bigint',
      foreign_key: col.isForeignKey && col.references ? {
        table: col.references.table,
        column: col.references.column,
        on_delete: 'CASCADE',
        on_update: 'CASCADE',
      } : null,
    })),
  }));

  const backendRelationships: RelationshipSchema[] = relationships.map((rel) => ({
    id: rel.id,
    type: rel.type === '1:1' ? 'one-to-one' : rel.type === '1:N' ? 'one-to-many' : 'many-to-many',
    from_table: rel.source,
    from_column: rel.sourceHandle || 'id',
    to_table: rel.target,
    to_column: rel.targetHandle || 'id',
  }));

  return {
    name: schemaName,
    description,
    tables: backendTables,
    relationships: backendRelationships,
    indexes: [],
    is_public: false,
  };
}

export function backendToFrontend(schema: SchemaResponse) {
  const frontendTables = (schema.tables || []).map((table) => ({
    id: table.id, // Include backend ID
    name: table.name,
    position: table.position,
    color: table.color || 'blue',
    columns: table.columns.map((col) => ({
      name: col.name,
      type: col.type,
      isPrimaryKey: col.primary_key || false,
      isForeignKey: !!col.foreign_key,
      nullable: col.nullable,
      unique: col.unique,
      autoIncrement: col.auto_increment,
      defaultValue: col.default_value || undefined,
      comment: col.comment || undefined,
      references: col.foreign_key ? {
        table: col.foreign_key.table,
        column: col.foreign_key.column,
      } : undefined,
    })),
  }));

  const frontendRelationships = (schema.relationships || []).map((rel) => ({
    id: rel.id,
    source: rel.from_table,
    target: rel.to_table,
    sourceHandle: rel.from_column,
    targetHandle: rel.to_column,
    type: rel.type === 'one-to-one' ? '1:1' : rel.type === 'one-to-many' ? '1:N' : 'N:N' as '1:1' | '1:N' | 'N:N',
  }));

  return {
    tables: frontendTables,
    relationships: frontendRelationships,
    name: schema.name,
    description: schema.description,
    id: schema.id,
  };
}
