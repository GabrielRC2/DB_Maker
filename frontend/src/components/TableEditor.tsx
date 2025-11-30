"use client";
import React, { useState } from 'react';
import { X, Plus, Trash2, Key, Lock, Hash } from 'lucide-react';
import { useSchemaStore, Column } from '../lib/schemaState';
import clsx from 'clsx';

const DATA_TYPES = [
    'bigint', 'integer', 'varchar', 'text', 'boolean', 
    'date', 'timestamp', 'decimal', 'json', 'uuid', 'float', 'double'
];

export default function TableEditor() {
    const { selectedTable, tables, updateTable, removeTable, addColumn, updateColumn, removeColumn, selectTable } = useSchemaStore();
    const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
    const [localTableName, setLocalTableName] = useState('');

    const table = tables.find(t => t.name === selectedTable);

    // Sync local table name with selected table
    React.useEffect(() => {
        if (table) {
            setLocalTableName(table.name);
        }
    }, [table?.name]);

    if (!table) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8 text-center">
                Select a table from the canvas or list to edit its structure
            </div>
        );
    }

    const handleAddColumn = () => {
        const newColumn: Column = {
            name: `column_${table.columns.length + 1}`,
            type: 'varchar',
            isPrimaryKey: false,
            isForeignKey: false,
            nullable: true,
            unique: false,
            autoIncrement: false,
        };
        addColumn(table.name, newColumn);
    };

    const handleTableNameBlur = () => {
        const trimmedName = localTableName.trim();
        // Only update if name is not empty and has changed
        if (trimmedName && trimmedName !== table.name) {
            updateTable(table.name, { name: trimmedName });
        } else if (!trimmedName) {
            // Reset to original name if empty
            setLocalTableName(table.name);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">Table Editor</h3>
                    <button
                        onClick={() => selectTable(null)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Table Name</label>
                    <input
                        type="text"
                        value={localTableName}
                        onChange={(e) => setLocalTableName(e.target.value)}
                        onBlur={handleTableNameBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter table name"
                    />
                </div>
            </div>

            {/* Columns List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Columns ({table.columns.length})</label>
                        <button
                            onClick={handleAddColumn}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={12} />
                            Add Column
                        </button>
                    </div>

                    {table.columns.map((column, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors"
                        >
                            <div className="space-y-2">
                                {/* Column Name & Type */}
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Name</label>
                                        <input
                                            type="text"
                                            value={column.name}
                                            onChange={(e) => updateColumn(table.name, index, { name: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Type</label>
                                        <select
                                            value={column.type}
                                            onChange={(e) => updateColumn(table.name, index, { type: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        >
                                            {DATA_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Column Attributes */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={column.isPrimaryKey || false}
                                            onChange={(e) => updateColumn(table.name, index, { 
                                                isPrimaryKey: e.target.checked,
                                                nullable: !e.target.checked
                                            })}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <Key size={12} className="text-yellow-500" />
                                        <span className="text-gray-600">Primary Key</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={column.nullable || false}
                                            onChange={(e) => updateColumn(table.name, index, { nullable: e.target.checked })}
                                            disabled={column.isPrimaryKey}
                                            className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                        <span className="text-gray-600">Nullable</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={column.unique || false}
                                            onChange={(e) => updateColumn(table.name, index, { unique: e.target.checked })}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <Lock size={12} className="text-purple-500" />
                                        <span className="text-gray-600">Unique</span>
                                    </label>

                                    {(column.type === 'integer' || column.type === 'bigint') && (
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={column.autoIncrement || false}
                                                onChange={(e) => updateColumn(table.name, index, { autoIncrement: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <Hash size={12} className="text-blue-500" />
                                            <span className="text-gray-600">Auto Increment</span>
                                        </label>
                                    )}
                                </div>

                                {/* Expandable Details */}
                                {editingColumnIndex === index && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Default Value</label>
                                            <input
                                                type="text"
                                                value={column.defaultValue || ''}
                                                onChange={(e) => updateColumn(table.name, index, { defaultValue: e.target.value })}
                                                placeholder="NULL"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Comment</label>
                                            <textarea
                                                value={column.comment || ''}
                                                onChange={(e) => updateColumn(table.name, index, { comment: e.target.value })}
                                                placeholder="Optional description for this column"
                                                rows={2}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        onClick={() => setEditingColumnIndex(editingColumnIndex === index ? null : index)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {editingColumnIndex === index ? 'Show Less' : 'More Options'}
                                    </button>
                                    <button
                                        onClick={() => removeColumn(table.name, index)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={() => {
                        if (confirm(`Delete table "${table.name}"?`)) {
                            removeTable(table.name);
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    <Trash2 size={16} />
                    Delete Table
                </button>
            </div>
        </div>
    );
}
