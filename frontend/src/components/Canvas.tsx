'use client';

import React, { useCallback, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    BackgroundVariant,
    NodeTypes,
    EdgeTypes,
    Panel,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Download } from 'lucide-react';

import TableNode, { TableNodeType } from './TableNode';
import CustomEdge from './CustomEdge';
import { useSchemaStore } from '../lib/schemaState';

const nodeTypes: NodeTypes = {
    table: TableNode,
};

const edgeTypes: EdgeTypes = {
    custom: CustomEdge,
};

function CanvasContent() {
    const { tables, relationships, updateTablePosition, addRelationship } = useSchemaStore();

    // Convert store state to React Flow nodes/edges
    // We use a local effect to sync, but for better perf we might want to map directly
    // For now, let's just map on render or use the store directly in ReactFlow if possible?
    // ReactFlow controls its own state usually. We need to sync two-way.
    // Strategy: Use ReactFlow as the source of truth for positions, Store for structure.

    const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    // Sync from store to local nodes (initial load or external updates)
    useEffect(() => {
        const flowNodes = tables.map(t => ({
            id: t.id || t.name, // Use unique ID as node ID
            type: 'table' as const,
            position: t.position,
            data: { ...t, label: t.name }, // Pass full table object as data
        }));
        setNodes(flowNodes);
    }, [tables, setNodes]);

    // Sync edges
    useEffect(() => {
        const flowEdges = relationships.map(r => ({
            id: r.id,
            source: r.source,
            target: r.target,
            sourceHandle: r.sourceHandle,
            targetHandle: r.targetHandle,
            type: 'custom',
            data: { sourceCardinality: '1', targetCardinality: 'N' } // Default for now
        }));
        setEdges(flowEdges);
    }, [relationships, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => {
            // Add to store
            const newRel = {
                id: `e${params.source}-${params.target}-${Date.now()}`,
                source: params.source!,
                target: params.target!,
                sourceHandle: params.sourceHandle!,
                targetHandle: params.targetHandle!,
                type: '1:N' as const, // Default
            };
            addRelationship(newRel);
        },
        [addRelationship],
    );

    const onNodeDragStop = useCallback((event: any, node: any) => {
        updateTablePosition(node.id, node.position);
    }, [updateTablePosition]);

    return (
        <div className="w-full h-full bg-gray-50/50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{ type: 'custom' }}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />

                {/* Floating Toolbar */}
                <Panel position="bottom-center" className="mb-8">
                    <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-xl flex items-center gap-1">
                        <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors" title="Zoom Out">
                            <ZoomOut size={20} />
                        </button>
                        <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors" title="Zoom In">
                            <ZoomIn size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button onClick={() => fitView()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors" title="Fit to Screen">
                            <Maximize size={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors" title="Reset Layout">
                            <RotateCcw size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors font-medium flex items-center gap-2 px-3">
                            <Download size={18} />
                            <span className="text-sm">Export</span>
                        </button>
                    </div>
                </Panel>

                <MiniMap
                    className="!bg-white/80 !backdrop-blur !border !border-gray-100 !rounded-xl !shadow-lg !m-4"
                    maskColor="rgba(241, 245, 249, 0.7)"
                    nodeColor={(n) => {
                        // @ts-ignore
                        const color = n.data?.color;
                        if (color === 'blue') return '#3b82f6';
                        if (color === 'pink') return '#ec4899';
                        return '#94a3b8';
                    }}
                />
            </ReactFlow>
        </div>
    );
}

export default function Canvas() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
}
