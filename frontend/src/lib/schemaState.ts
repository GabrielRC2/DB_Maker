import { create } from 'zustand';
import { Edge, Node } from '@xyflow/react';

export type Column = {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    nullable?: boolean;
    unique?: boolean;
    autoIncrement?: boolean;
    defaultValue?: string;
    comment?: string;
    references?: {
        table: string;
        column: string;
    };
};

export type Table = {
    id?: string; // Unique identifier for React keys
    name: string;
    columns: Column[];
    position: { x: number; y: number };
    color?: string;
};

export type Relationship = {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    type: '1:1' | '1:N' | 'N:N';
};

interface SchemaState {
    tables: Table[];
    relationships: Relationship[];
    sql: string;
    
    // UI state
    selectedTable: string | null;
    
    // Backend integration
    currentSchemaId: string | null;
    currentSchemaName: string;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    availableSchemas: Array<{ id: string; name: string; updated_at: string }>;

    // Actions
    addTable: (table: Table) => void;
    updateTable: (name: string, updates: Partial<Table>) => void;
    removeTable: (name: string) => void;
    updateTablePosition: (name: string, position: { x: number; y: number }) => void;
    selectTable: (name: string | null) => void;
    
    // Column actions
    addColumn: (tableName: string, column: Column) => void;
    updateColumn: (tableName: string, columnIndex: number, updates: Partial<Column>) => void;
    removeColumn: (tableName: string, columnIndex: number) => void;

    addRelationship: (rel: Relationship) => void;
    removeRelationship: (id: string) => void;

    setSQL: (sql: string) => void;
    syncFromSQL: (sql: string) => void;
    
    // Backend actions
    saveSchema: () => Promise<void>;
    loadSchema: (schemaId: string) => Promise<void>;
    loadSchemas: () => Promise<void>;
    newSchema: (name?: string) => void;
    setSchemaName: (name: string) => void;
}

// Helper to generate SQL from tables
const generateSQL = (tables: Table[], relationships: Relationship[]): string => {
    let sql = '';

    tables.forEach(table => {
        sql += `CREATE TABLE ${table.name} (\n`;
        const lines: string[] = [];

        table.columns.forEach(col => {
            let line = `  ${col.name} ${col.type}`;
            if (col.isPrimaryKey) line += ' PRIMARY KEY';
            lines.push(line);
        });

        // Add foreign keys defined in columns
        table.columns.forEach(col => {
            if (col.isForeignKey && col.references) {
                lines.push(`  FOREIGN KEY (${col.name}) REFERENCES ${col.references.table}(${col.references.column})`);
            }
        });

        sql += lines.join(',\n');
        sql += '\n);\n\n';
    });

    // Add explicit relationships (if not already in FKs - though usually they are)
    // For this simple version, we assume relationships are reflected in FKs or just visual if N:N

    return sql;
};

// Simple parser (Regex based for MVP)
const parseSQL = (sql: string): { tables: Table[], relationships: Relationship[] } => {
    const tables: Table[] = [];
    const relationships: Relationship[] = [];

    const tableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;

    let x = 0;
    let y = 0;

    while ((match = tableRegex.exec(sql)) !== null) {
        const tableName = match[1];
        const body = match[2];
        const columns: Column[] = [];

        const lines = body.split(',').map(l => l.trim()).filter(l => l);

        lines.forEach(line => {
            if (line.startsWith('FOREIGN KEY')) return; // Skip explicit FK lines for now, handle in column parsing or separate pass

            const parts = line.split(/\s+/);
            const name = parts[0];
            const type = parts[1];
            const isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');

            // Basic FK detection in line
            let isForeignKey = false;
            let references = undefined;

            if (line.toUpperCase().includes('REFERENCES')) {
                isForeignKey = true;
                const refMatch = line.match(/REFERENCES\s+(\w+)\((\w+)\)/i);
                if (refMatch) {
                    references = { table: refMatch[1], column: refMatch[2] };
                }
            }

            columns.push({ name, type, isPrimaryKey, isForeignKey, references });
        });

        tables.push({
            name: tableName,
            columns,
            position: { x: x += 300, y: 100 }, // Simple auto-layout
            color: 'blue'
        });
    }

    return { tables, relationships };
};

// Helper to generate unique ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useSchemaStore = create<SchemaState>((set, get) => ({
    tables: [],
    relationships: [],
    sql: '',
    selectedTable: null,
    currentSchemaId: null,
    currentSchemaName: 'Untitled Schema',
    saveStatus: 'idle',
    availableSchemas: [],

    addTable: (table) => set((state) => {
        const tableWithId = { ...table, id: table.id || generateId() };
        const newTables = [...state.tables, tableWithId];
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    updateTable: (name, updates) => set((state) => {
        const newTables = state.tables.map(t => t.name === name ? { ...t, ...updates } : t);
        // If table name is being updated and it's the selected table, update selectedTable too
        const newSelectedTable = updates.name && state.selectedTable === name 
            ? updates.name 
            : state.selectedTable;
        return { 
            tables: newTables, 
            sql: generateSQL(newTables, state.relationships),
            selectedTable: newSelectedTable
        };
    }),

    removeTable: (name) => set((state) => {
        const newTables = state.tables.filter(t => t.name !== name);
        return { 
            tables: newTables, 
            sql: generateSQL(newTables, state.relationships),
            selectedTable: state.selectedTable === name ? null : state.selectedTable
        };
    }),

    updateTablePosition: (nameOrId, position) => set((state) => ({
        tables: state.tables.map(t => 
            (t.name === nameOrId || t.id === nameOrId) ? { ...t, position } : t
        )
    })),

    selectTable: (name) => set({ selectedTable: name }),

    addColumn: (tableName, column) => set((state) => {
        const newTables = state.tables.map(t => 
            t.name === tableName 
                ? { ...t, columns: [...t.columns, column] }
                : t
        );
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    updateColumn: (tableName, columnIndex, updates) => set((state) => {
        const newTables = state.tables.map(t =>
            t.name === tableName
                ? {
                    ...t,
                    columns: t.columns.map((col, idx) =>
                        idx === columnIndex ? { ...col, ...updates } : col
                    )
                }
                : t
        );
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    removeColumn: (tableName, columnIndex) => set((state) => {
        const newTables = state.tables.map(t =>
            t.name === tableName
                ? { ...t, columns: t.columns.filter((_, idx) => idx !== columnIndex) }
                : t
        );
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    addRelationship: (rel) => set((state) => {
        // Check for N:N logic here? Or in the component?
        // For now just add
        return { relationships: [...state.relationships, rel] };
    }),

    removeRelationship: (id) => set((state) => ({
        relationships: state.relationships.filter(r => r.id !== id)
    })),

    setSQL: (sql) => set({ sql }),

    syncFromSQL: (sql) => {
        const { tables, relationships } = parseSQL(sql);
        // Preserve positions if table exists
        const currentTables = get().tables;
        const mergedTables = tables.map(t => {
            const existing = currentTables.find(ct => ct.name === t.name);
            if (existing) {
                return { ...t, position: existing.position, color: existing.color };
            }
            return t;
        });

        set({ tables: mergedTables, relationships, sql });
    },

    // Backend integration actions
    saveSchema: async () => {
        const state = get();
        set({ saveStatus: 'saving' });
        
        try {
            const { schemaApi, frontendToBackend } = await import('./api');
            
            const schemaData = frontendToBackend(
                state.tables,
                state.relationships,
                state.currentSchemaName,
                'Created with DB Maker'
            );
            
            console.log('Sending schema data:', JSON.stringify(schemaData, null, 2));

            if (state.currentSchemaId) {
                // Update existing schema
                const updated = await schemaApi.updateSchema(state.currentSchemaId, schemaData);
                set({ 
                    saveStatus: 'saved',
                    currentSchemaId: updated.id,
                    currentSchemaName: updated.name
                });
            } else {
                // Create new schema
                const created = await schemaApi.createSchema(schemaData);
                set({ 
                    saveStatus: 'saved',
                    currentSchemaId: created.id,
                    currentSchemaName: created.name
                });
            }
            
            // Refresh available schemas list
            get().loadSchemas();
            
            // Reset to idle after 2 seconds
            setTimeout(() => {
                if (get().saveStatus === 'saved') {
                    set({ saveStatus: 'idle' });
                }
            }, 2000);
        } catch (error) {
            console.error('Failed to save schema:', error);
            set({ saveStatus: 'error' });
            
            // Reset to idle after 3 seconds
            setTimeout(() => {
                if (get().saveStatus === 'error') {
                    set({ saveStatus: 'idle' });
                }
            }, 3000);
        }
    },

    loadSchema: async (schemaId: string) => {
        try {
            const { schemaApi, backendToFrontend } = await import('./api');
            const schema = await schemaApi.getSchema(schemaId);
            const { tables, relationships, name, id } = backendToFrontend(schema);
            
            // Add unique IDs to tables if they don't have them
            const tablesWithIds = tables.map(t => ({ ...t, id: t.id || generateId() }));
            
            set({
                tables: tablesWithIds,
                relationships,
                currentSchemaId: id,
                currentSchemaName: name,
                sql: generateSQL(tablesWithIds, relationships),
                saveStatus: 'idle'
            });
            
            // Save last opened schema to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('lastOpenedSchemaId', id);
            }
        } catch (error) {
            console.error('Failed to load schema:', error);
            set({ saveStatus: 'error' });
        }
    },

    loadSchemas: async () => {
        try {
            const { schemaApi } = await import('./api');
            const schemas = await schemaApi.listSchemas();
            
            set({
                availableSchemas: schemas.map(s => ({
                    id: s.id,
                    name: s.name,
                    updated_at: s.updated_at
                }))
            });
        } catch (error) {
            console.error('Failed to load schemas:', error);
        }
    },

    newSchema: (name = 'Untitled Schema') => {
        set({
            tables: [],
            relationships: [],
            sql: '',
            currentSchemaId: null,
            currentSchemaName: name,
            saveStatus: 'idle'
        });
    },

    setSchemaName: (name: string) => {
        set({ currentSchemaName: name });
    }
}));
