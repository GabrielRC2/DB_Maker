import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MoreVertical, Key, Fingerprint, Type, Hash, Calendar, ToggleLeft } from 'lucide-react';
import clsx from 'clsx';
import { Table } from '../lib/schemaState';

// Map types to icons
const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('serial')) return <Hash size={12} className="text-blue-500" />;
    if (t.includes('char') || t.includes('text')) return <Type size={12} className="text-green-500" />;
    if (t.includes('date') || t.includes('time')) return <Calendar size={12} className="text-orange-500" />;
    if (t.includes('bool')) return <ToggleLeft size={12} className="text-purple-500" />;
    return <Type size={12} className="text-gray-400" />;
};

export type TableNodeType = Node<Table, 'table'>;

const TableNode = ({ data, selected }: NodeProps<TableNodeType>) => {
    const { name, color = 'blue', columns = [] } = data;

    const headerColors: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600 border-blue-600',
        pink: 'from-pink-500 to-pink-600 border-pink-600',
        green: 'from-emerald-500 to-emerald-600 border-emerald-600',
        orange: 'from-orange-500 to-orange-600 border-orange-600',
        purple: 'from-purple-500 to-purple-600 border-purple-600',
    };

    const headerColorClass = headerColors[color] || headerColors.blue;

    return (
        <div className={clsx(
            "w-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-200 overflow-hidden",
            selected ? "border-blue-500 ring-2 ring-blue-200 scale-[1.02]" : "border-gray-200 hover:border-gray-300"
        )}>
            {/* Header */}
            <div className={clsx(
                "px-4 py-3 bg-gradient-to-r flex items-center justify-between text-white shadow-sm",
                headerColorClass
            )}>
                <div className="flex items-center gap-2 font-semibold tracking-wide">
                    <span>{name}</span>
                </div>
                <button className="text-white/80 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                </button>
            </div>

            {/* Columns */}
            <div className="divide-y divide-gray-100/50">
                {columns.map((col, index) => (
                    <div
                        key={index}
                        className={clsx(
                            "px-4 py-2.5 flex items-center justify-between group relative transition-colors",
                            selected && col.isPrimaryKey ? "bg-yellow-50/80" : "hover:bg-gray-50",
                            col.isPrimaryKey && "font-medium text-gray-900"
                        )}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-4 flex justify-center shrink-0">
                                {col.isPrimaryKey ? (
                                    <Key size={14} className={clsx("text-yellow-500 transition-transform", selected && "scale-110")} />
                                ) : col.isForeignKey ? (
                                    <Fingerprint size={14} className="text-blue-400" />
                                ) : (
                                    <div className="opacity-50">{getTypeIcon(col.type)}</div>
                                )}
                            </div>
                            <span className={clsx(
                                "truncate text-sm",
                                col.isPrimaryKey ? "text-gray-900" : "text-gray-700"
                            )}>{col.name}</span>
                        </div>

                        <span className="text-xs text-gray-400 font-mono ml-2 shrink-0">{col.type}</span>

                        {/* Connection Handles - Only visible on hover or selection */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`target-${col.name}`}
                            className={clsx(
                                "!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white transition-opacity",
                                selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            style={{ left: -6 }}
                        />
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`source-${col.name}`}
                            className={clsx(
                                "!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white transition-opacity",
                                selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            style={{ right: -6 }}
                        />
                    </div>
                ))}
                {columns.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400 italic text-xs">
                        No columns defined
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(TableNode);
