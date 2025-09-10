import React from 'react'
import { Handle, Position, NodeProps, useNodes, useEdges } from 'reactflow'
import { GitMerge } from 'lucide-react'
import { getNodeDataFlow } from '@/utils/workflowUtils'

export const MergeNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => {
    const isPaired = !!data.loopId;
    const borderStyle = isPaired ? 'border-dashed' : 'border-solid';
    const nodes = useNodes()
    const edges = useEdges()
    const dataFlow = getNodeDataFlow(id, 'merge', edges, nodes)

    return (
        <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500 relative ${borderStyle} transition-all`}>
            <div className="flex items-center">
                <div className="rounded-full w-12 h-12 flex justify-center items-center bg-green-100">
                    <GitMerge className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-2">
                    <div className="text-lg font-bold text-green-600">{data.label || 'Merge'}</div>
                    <div className="text-gray-500">Collects items into an array</div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                    {dataFlow.hasInput ? (
                        <div>
                            <span className="font-medium text-green-600">Input:</span> {dataFlow.inputDescription}
                        </div>
                    ) : (
                        <div className="text-orange-600">
                            <span className="font-medium">⚠️ Input:</span> Connect from "Get ASIN Details"
                        </div>
                    )}
                    <div>
                        <span className="font-medium">Output:</span> {dataFlow.outputDescription}
                    </div>
                    {isPaired && (
                        <div className="text-blue-700 font-medium">
                            <span>Paired with "{data.loopLabel || data.loopId}"</span>
                        </div>
                    )}
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                id="input"
                isConnectable={isConnectable}
                className="w-3 h-3 !bg-green-500"
            />
        </div>
    )
}