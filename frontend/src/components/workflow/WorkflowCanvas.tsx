import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { GetBestSellingAsinsNode } from './nodes/GetBestSellingAsinsNode'
import { GetAsinByIndexNode } from './nodes/GetAsinByIndexNode'
import { GetAsinDetailsNode } from './nodes/GetAsinDetailsNode'
import type { WorkflowNode, WorkflowEdge } from '@/types'

interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[]
  initialEdges?: WorkflowEdge[]
  onNodesChange?: (nodes: WorkflowNode[]) => void
  onEdgesChange?: (edges: WorkflowEdge[]) => void
  readonly?: boolean
}

const nodeTypes: NodeTypes = {
  get_bestselling_asins: GetBestSellingAsinsNode,
  get_asin_by_index: GetAsinByIndexNode,
  get_asin_details: GetAsinDetailsNode,
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  readonly = false,
}) => {
  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes as Node[])
  const [edges, setEdges, onEdgesStateChange] = useEdgesState(initialEdges as Edge[])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readonly) {
        const newEdge = addEdge(params, edges)
        setEdges(newEdge)
        onEdgesChange?.(newEdge as WorkflowEdge[])
      }
    },
    [edges, readonly, onEdgesChange, setEdges]
  )

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesStateChange(changes)
      if (!readonly && onNodesChange) {
        setTimeout(() => {
          setNodes((currentNodes) => {
            onNodesChange(currentNodes as WorkflowNode[])
            return currentNodes
          })
        }, 0)
      }
    },
    [onNodesStateChange, readonly, onNodesChange, setNodes]
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesStateChange(changes)
      if (!readonly && onEdgesChange) {
        setTimeout(() => {
          setEdges((currentEdges) => {
            onEdgesChange(currentEdges as WorkflowEdge[])
            return currentEdges
          })
        }, 0)
      }
    },
    [onEdgesStateChange, readonly, onEdgesChange, setEdges]
  )

  const proOptions = useMemo(() => ({ hideAttribution: true }), [])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}