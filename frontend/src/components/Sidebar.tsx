"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Table as TableIcon, Settings, Database, Code, LayoutGrid, Save, FolderOpen, FileText, Check, X, Loader2, Edit2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useSchemaStore } from '../lib/schemaState';
import clsx from 'clsx';
import TableEditor from './TableEditor';

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'edit'>('tables');
    const { 
        tables,
        relationships,
        sql, 
        setSQL, 
        syncFromSQL, 
        addTable,
        saveSchema,
        loadSchema,
        loadSchemas,
        newSchema,
        setSchemaName,
        currentSchemaName,
        currentSchemaId,
        saveStatus,
        availableSchemas,
        selectedTable,
        selectTable
    } = useSchemaStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSchemasDropdown, setShowSchemasDropdown] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(currentSchemaName);
    
    // Load available schemas on mount and load last opened schema
    useEffect(() => {
        const initializeSchemas = async () => {
            await loadSchemas();
            
            // Load last opened schema from localStorage
            if (typeof window !== 'undefined') {
                const lastSchemaId = localStorage.getItem('lastOpenedSchemaId');
                if (lastSchemaId && !currentSchemaId) {
                    try {
                        await loadSchema(lastSchemaId);
                    } catch (error) {
                        console.error('Failed to load last schema:', error);
                    }
                }
            }
        };
        
        initializeSchemas();
    }, []);
    
    // Switch to edit tab when table is selected
    useEffect(() => {
        if (selectedTable) {
            setActiveTab('edit');
        }
    }, [selectedTable]);

    // Debounced sync from SQL to Store
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'sql') {
                syncFromSQL(sql);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [sql, syncFromSQL, activeTab]);
    
    // Auto-save functionality - debounced save when schema changes
    useEffect(() => {
        // Don't auto-save if we just loaded or if there's no schema ID yet
        if (!currentSchemaId || saveStatus === 'saving') return;
        
        const timer = setTimeout(() => {
            // Auto-save after 3 seconds of inactivity
            saveSchema();
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [tables, relationships, currentSchemaName]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setSQL(value);
        }
    };

    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAddTable = () => {
        // Create staggered positions to avoid overlap
        const baseX = 100;
        const baseY = 100;
        const offsetX = 350; // Horizontal spacing between tables
        const offsetY = 50;  // Vertical offset
        
        const index = tables.length;
        const column = Math.floor(index / 3); // 3 tables per column
        const row = index % 3;
        
        addTable({
            name: `table_${tables.length + 1}`,
            position: { 
                x: baseX + (column * offsetX), 
                y: baseY + (row * offsetY) 
            },
            columns: [
                { name: 'id', type: 'bigint', isPrimaryKey: true, isForeignKey: false }
            ],
            color: 'blue'
        });
    };

    const handleSaveSchema = async () => {
        await saveSchema();
    };

    const handleLoadSchema = async (schemaId: string) => {
        await loadSchema(schemaId);
        setShowSchemasDropdown(false);
    };

    const handleNewSchema = () => {
        if (confirm('Create a new schema? Unsaved changes will be lost.')) {
            newSchema();
        }
    };

    const handleNameEdit = () => {
        if (isEditingName) {
            setSchemaName(tempName);
            setIsEditingName(false);
        } else {
            setTempName(currentSchemaName);
            setIsEditingName(true);
        }
    };

    return (
        <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-lg">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-blue-200 shadow-md">
                            <Database size={18} />
                        </div>
                        {isEditingName ? (
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameEdit}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
                            />
                        ) : (
                            <span 
                                onClick={() => setIsEditingName(true)}
                                className="cursor-pointer hover:text-blue-600"
                                title="Click to edit"
                            >
                                {currentSchemaName}
                            </span>
                        )}
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleSaveSchema}
                        disabled={saveStatus === 'saving'}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {saveStatus === 'saving' ? (
                            <><Loader2 size={16} className="animate-spin" /> Saving...</>
                        ) : saveStatus === 'saved' ? (
                            <><Check size={16} /> Saved</>
                        ) : saveStatus === 'error' ? (
                            <><X size={16} /> Error</>
                        ) : (
                            <><Save size={16} /> Save</>
                        )}
                    </button>
                    
                    <div className="relative">
                        <button
                            onClick={() => setShowSchemasDropdown(!showSchemasDropdown)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Load Schema"
                        >
                            <FolderOpen size={16} />
                        </button>
                        
                        {showSchemasDropdown && (
                            <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                                <div className="p-2 border-b border-gray-100 font-semibold text-sm text-gray-700">
                                    Saved Schemas
                                </div>
                                {availableSchemas.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No saved schemas yet
                                    </div>
                                ) : (
                                    availableSchemas.map((schema) => (
                                        <button
                                            key={schema.id}
                                            onClick={() => handleLoadSchema(schema.id)}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0",
                                                schema.id === currentSchemaId && "bg-blue-50 text-blue-700"
                                            )}
                                        >
                                            <div className="font-medium text-sm">{schema.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(schema.updated_at).toLocaleString()}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleNewSchema}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="New Schema"
                    >
                        <FileText size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => { setActiveTab('tables'); selectTable(null); }}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'tables' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid size={14} />
                        Tables
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        disabled={!selectedTable}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'edit' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700",
                            !selectedTable && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Edit2 size={14} />
                        Edit
                    </button>
                    <button
                        onClick={() => { setActiveTab('sql'); selectTable(null); }}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'sql' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Code size={14} />
                        SQL
                    </button>
                </div>
            </div>

            {activeTab === 'tables' ? (
                <>
                    {/* Search */}
                    <div className="p-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search tables..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent focus:border-blue-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all outline-none text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Tables List */}
                    <div className="flex-1 overflow-y-auto px-2 py-1">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">
                            Tables ({filteredTables.length})
                        </div>

                        <div className="space-y-1">
                            {filteredTables.map((table) => (
                                <button 
                                    key={table.id || table.name} 
                                    onClick={() => {
                                        selectTable(table.name);
                                        setActiveTab('edit');
                                    }}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group border",
                                        selectedTable === table.name 
                                            ? "bg-blue-50 text-blue-600 border-blue-200" 
                                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 border-transparent hover:border-blue-100"
                                    )}
                                >
                                    <TableIcon size={16} className={clsx(
                                        "transition-colors",
                                        selectedTable === table.name ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                                    )} />
                                    <span className="font-medium">{table.name}</span>
                                    <span className={clsx(
                                        "ml-auto text-xs",
                                        selectedTable === table.name ? "text-blue-400" : "text-gray-300 group-hover:text-blue-300"
                                    )}>{table.columns.length} cols</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm">
                        <button
                            onClick={handleAddTable}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            New Table
                        </button>
                    </div>
                </>
            ) : activeTab === 'edit' ? (
                <TableEditor />
            ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="sql"
                            value={sql}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
