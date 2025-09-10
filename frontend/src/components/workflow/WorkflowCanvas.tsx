import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  NodeTypes,
  ConnectionMode,
  NodeChange,
  EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { GetBestSellingAsinsNode } from './nodes/GetBestSellingAsinsNode'
import { GetAsinByIndexNode } from './nodes/GetAsinByIndexNode'
import { GetAsinDetailsNode } from './nodes/GetAsinDetailsNode'
import { LoopNode } from './nodes/LoopNode'
import { MergeNode } from './nodes/MergeNode'
import { isValidConnection as isValidWorkflowConnection } from '@/utils/workflowUtils'
import type { WorkflowEdge } from '@/types'

interface WorkflowCanvasProps {
  initialNodes?: Node[]
  initialEdges?: WorkflowEdge[]
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  onConnect?: (connection: Connection) => void
}

const nodeTypes: NodeTypes = {
  get_bestselling_asins: GetBestSellingAsinsNode,
  get_asin_by_index: GetAsinByIndexNode,
  get_asin_details: GetAsinDetailsNode,
  loop: LoopNode,
  merge: MergeNode,
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onConnect,
}) => {
  const proOptions = useMemo(() => ({ hideAttribution: true }), [])

  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false
    }

    // Find source and target node types for workflow validation
    const sourceNode = initialNodes.find(n => n.id === connection.source)
    const targetNode = initialNodes.find(n => n.id === connection.target)

    if (!sourceNode || !targetNode || !sourceNode.type || !targetNode.type) {
      return false
    }

    // Use workflow-specific validation
    return isValidWorkflowConnection(sourceNode.type, targetNode.type)
  }, [initialNodes])

  return (
    <div className="h-full w-full" style={{ zIndex: 0 }}>
      <ReactFlow
        nodes={initialNodes as Node[]}
        edges={initialEdges as Edge[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode="Delete"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}