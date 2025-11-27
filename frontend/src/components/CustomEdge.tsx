import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, Edge } from '@xyflow/react';
import clsx from 'clsx';

type CustomEdgeData = Edge<{ sourceCardinality?: string; targetCardinality?: string }>;

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    data,
}: EdgeProps<CustomEdgeData>) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Determine cardinality labels based on data or default
    const sourceLabel = data?.sourceCardinality || '1';
    const targetLabel = data?.targetCardinality || 'N';

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 2,
                    stroke: selected ? '#3b82f6' : '#9ca3af', // Blue when selected, gray otherwise
                    strokeDasharray: selected ? '5,5' : 'none',
                    animation: selected ? 'dashdraw 0.5s linear infinite' : 'none',
                }}
                className={clsx(selected && "animate-pulse")}
            />
            <EdgeLabelRenderer>
                {/* Source Cardinality */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.1}px,${sourceY + (targetY - sourceY) * 0.1}px)`,
                        pointerEvents: 'none',
                    }}
                    className="bg-white px-1 py-0.5 rounded text-[10px] font-bold text-gray-500 border border-gray-200 shadow-sm"
                >
                    {sourceLabel}
                </div>

                {/* Target Cardinality */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${targetX - (targetX - sourceX) * 0.1}px,${targetY - (targetY - sourceY) * 0.1}px)`,
                        pointerEvents: 'none',
                    }}
                    className="bg-white px-1 py-0.5 rounded text-[10px] font-bold text-gray-500 border border-gray-200 shadow-sm"
                >
                    {targetLabel}
                </div>
            </EdgeLabelRenderer>
            <style jsx global>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
        </>
    );
}
