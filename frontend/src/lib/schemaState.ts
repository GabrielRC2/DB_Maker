import { create } from 'zustand';
import { Edge, Node } from '@xyflow/react';

export type Column = {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    references?: {
        table: string;
        column: string;
    };
};

export type Table = {
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

    // Actions
    addTable: (table: Table) => void;
    updateTable: (name: string, updates: Partial<Table>) => void;
    removeTable: (name: string) => void;
    updateTablePosition: (name: string, position: { x: number; y: number }) => void;

    addRelationship: (rel: Relationship) => void;
    removeRelationship: (id: string) => void;

    setSQL: (sql: string) => void;
    syncFromSQL: (sql: string) => void;
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

export const useSchemaStore = create<SchemaState>((set, get) => ({
    tables: [
        {
            name: 'users',
            position: { x: 100, y: 100 },
            color: 'pink',
            columns: [
                { name: 'id', type: 'bigint', isPrimaryKey: true, isForeignKey: false },
                { name: 'email', type: 'varchar', isPrimaryKey: false, isForeignKey: false },
                { name: 'password_hash', type: 'varchar', isPrimaryKey: false, isForeignKey: false },
                { name: 'created_at', type: 'timestamp', isPrimaryKey: false, isForeignKey: false },
            ]
        },
        {
            name: 'posts',
            position: { x: 500, y: 150 },
            color: 'blue',
            columns: [
                { name: 'id', type: 'bigint', isPrimaryKey: true, isForeignKey: false },
                { name: 'user_id', type: 'bigint', isPrimaryKey: false, isForeignKey: true, references: { table: 'users', column: 'id' } },
                { name: 'title', type: 'varchar', isPrimaryKey: false, isForeignKey: false },
                { name: 'content', type: 'text', isPrimaryKey: false, isForeignKey: false },
                { name: 'published', type: 'boolean', isPrimaryKey: false, isForeignKey: false },
            ]
        }
    ],
    relationships: [],
    sql: '',

    addTable: (table) => set((state) => {
        const newTables = [...state.tables, table];
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    updateTable: (name, updates) => set((state) => {
        const newTables = state.tables.map(t => t.name === name ? { ...t, ...updates } : t);
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    removeTable: (name) => set((state) => {
        const newTables = state.tables.filter(t => t.name !== name);
        return { tables: newTables, sql: generateSQL(newTables, state.relationships) };
    }),

    updateTablePosition: (name, position) => set((state) => ({
        tables: state.tables.map(t => t.name === name ? { ...t, position } : t)
    })),

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
    }
}));
