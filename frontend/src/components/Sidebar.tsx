"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Table as TableIcon, Settings, Database, Code, LayoutGrid } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useSchemaStore } from '../lib/schemaState';
import clsx from 'clsx';

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState<'tables' | 'sql'>('tables');
    const { tables, sql, setSQL, syncFromSQL, addTable } = useSchemaStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Debounced sync from SQL to Store
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'sql') {
                syncFromSQL(sql);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [sql, syncFromSQL, activeTab]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setSQL(value);
        }
    };

    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAddTable = () => {
        addTable({
            name: `table_${tables.length + 1}`,
            position: { x: 100 + tables.length * 20, y: 100 + tables.length * 20 },
            columns: [
                { name: 'id', type: 'bigint', isPrimaryKey: true, isForeignKey: false }
            ],
            color: 'blue'
        });
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
                        <span>Schema</span>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'tables' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid size={14} />
                        Tables
                    </button>
                    <button
                        onClick={() => setActiveTab('sql')}
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
                                <button key={table.name} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all group border border-transparent hover:border-blue-100">
                                    <TableIcon size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="font-medium">{table.name}</span>
                                    <span className="ml-auto text-xs text-gray-300 group-hover:text-blue-300">{table.columns.length} cols</span>
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
