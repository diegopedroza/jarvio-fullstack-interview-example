import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Connection,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    Node,
} from 'reactflow'
import { ArrowLeft, Play, Save, Plus } from 'lucide-react'
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas'
import { WorkflowResults } from '@/components/workflow/WorkflowResults'
import {
    useWorkflow,
    useCreateWorkflow,
    useUpdateWorkflow,
    useRunWorkflow,
    useWorkflowRuns
} from '@/hooks/useWorkflows'
import type { WorkflowNode as WorkflowNodeType, WorkflowEdge } from '@/types'

// Create a more specific node type for use within this component
type AppNode = Node<WorkflowNodeType['data']>;

export const WorkflowEditorPage: React.FC = () => {
    const { workflowId } = useParams()
    const navigate = useNavigate()
    const isNewWorkflow = workflowId === 'new'

    const [workflowName, setWorkflowName] = useState('Untitled Workflow')
    const [workflowDescription, setWorkflowDescription] = useState('')
    const [nodes, setNodes] = useState<AppNode[]>([])
    const [edges, setEdges] = useState<WorkflowEdge[]>([])
    const [showResults, setShowResults] = useState(false)

    const { data: workflow, isLoading } = useWorkflow(workflowId!)
    const { data: runs } = useWorkflowRuns(workflowId!)

    const createWorkflowMutation = useCreateWorkflow()
    const updateWorkflowMutation = useUpdateWorkflow()
    const runWorkflowMutation = useRunWorkflow()

    React.useEffect(() => {
        if (workflow && !isNewWorkflow) {
            setWorkflowName(workflow.name)
            setWorkflowDescription(workflow.description || '')
            setNodes(workflow.flow_data.nodes as AppNode[] || [])
            setEdges(workflow.flow_data.edges as WorkflowEdge[] || [])
        }
    }, [workflow, isNewWorkflow])

    const handleSave = useCallback(async () => {
        const flowData = { nodes, edges }

        try {
            if (isNewWorkflow) {
                const newWorkflow = await createWorkflowMutation.mutateAsync({
                    name: workflowName,
                    description: workflowDescription,
                    flow_data: flowData,
                })
                navigate(`/workflows/${newWorkflow.id}`)
            } else {
                await updateWorkflowMutation.mutateAsync({
                    workflowId: workflowId!,
                    workflow: {
                        name: workflowName,
                        description: workflowDescription,
                        flow_data: flowData,
                    },
                })
            }
        } catch (error) {
            console.error('Error saving workflow:', error)
        }
    }, [
        workflowName,
        workflowDescription,
        nodes,
        edges,
        isNewWorkflow,
        createWorkflowMutation,
        updateWorkflowMutation,
        workflowId,
        navigate,
    ])

    const handleRun = useCallback(async () => {
        if (isNewWorkflow) {
            alert('Please save the workflow first before running it.')
            return
        }

        try {
            await runWorkflowMutation.mutateAsync(workflowId!)
            setShowResults(true)
        } catch (error) {
            console.error('Error running workflow:', error)
        }
    }, [isNewWorkflow, runWorkflowMutation, workflowId])

    const addNode = useCallback((nodeType: string) => {
        const data: WorkflowNodeType['data'] = {
            label: `${nodeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            ...(nodeType === 'get_bestselling_asins' && { topCount: 10 }),
            ...(nodeType === 'get_asin_by_index' && { index: 0 }),
        };

        const newNode: AppNode = {
            id: `${nodeType}-${Date.now()}`,
            type: nodeType as any,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data,
        }
        setNodes(prev => [...prev, newNode])
    }, [setNodes])

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as AppNode[]),
        [setNodes]
    )

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            // --- Logic to un-pair nodes on edge deletion ---
            for (const change of changes) {
                if (change.type === 'remove') {
                    // Find the edge before it's removed from state
                    const edgeToRemove = edges.find(e => e.id === change.id);
                    if (edgeToRemove) {
                        setNodes(nds => {
                            const sourceNode = nds.find(n => n.id === edgeToRemove.source);
                            const targetNode = nds.find(n => n.id === edgeToRemove.target);

                            // If a paired loop or merge node is part of the deleted edge, un-pair them
                            if (sourceNode?.data.mergeId || targetNode?.data.loopId) {
                                const loopId = sourceNode?.data.loopId || targetNode?.data.loopId || sourceNode?.id;
                                const mergeId = sourceNode?.data.mergeId || targetNode?.data.mergeId || targetNode?.id;
                                return nds.map(n => {
                                    if (n.id === loopId || n.id === mergeId) {
                                        // Use a safer method to remove properties to avoid type issues.
                                        const newData: WorkflowNodeType['data'] = { ...n.data };
                                        delete newData.loopId;
                                        delete newData.mergeId;
                                        delete newData.loopLabel;
                                        delete newData.mergeLabel;
                                        return { ...n, data: newData };
                                    }
                                    return n;
                                });
                            }
                            return nds;
                        });
                    }
                }
            }
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [setEdges, setNodes, edges]
    )

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdge = { ...params, type: 'default', animated: true };
            const updatedEdges = addEdge(newEdge, edges);
            setEdges(updatedEdges);

            // --- More robust logic to pair Loop and Merge nodes ---
            setNodes((nds) => {
                // Helper to find the start of a chain (the Loop node) by traversing backwards
                const findLoopAncestor = (startNodeId: string): AppNode | null => {
                    let currentId: string | undefined = startNodeId;
                    while (currentId) {
                        const node = nds.find(n => n.id === currentId);
                        if (node?.type === 'loop') return node;
                        const incomingEdge = updatedEdges.find(e => e.target === currentId);
                        currentId = incomingEdge?.source;
                    }
                    return null;
                };

                // Helper to find the end of a chain (the Merge node) by traversing forwards
                const findMergeDescendant = (startNodeId: string): AppNode | null => {
                    let currentId: string | undefined = startNodeId;
                    while (currentId) {
                        const node = nds.find(n => n.id === currentId);
                        if (node?.type === 'merge') return node;
                        const outgoingEdge = updatedEdges.find(e => e.source === currentId);
                        currentId = outgoingEdge?.target;
                    }
                    return null;
                };

                const loopNode = findLoopAncestor(params.source!);
                const mergeNode = findMergeDescendant(params.target!);

                if (loopNode && mergeNode) {
                    // A full path from a loop to a merge has been established. Pair them.
                    return nds.map(n => {
                        if (n.id === loopNode.id) return { ...n, data: { ...n.data, mergeId: mergeNode.id, mergeLabel: mergeNode.data.label } };
                        if (n.id === mergeNode.id) return { ...n, data: { ...n.data, loopId: loopNode.id, loopLabel: loopNode.data.label } };
                        return n;
                    });
                }
                return nds;
            });
        },
        [setEdges, setNodes, edges]
    )

    if (!isNewWorkflow && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading workflow...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
                                placeholder="Workflow name"
                            />
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowResults(!showResults)}
                                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                {showResults ? 'Hide Results' : 'Show Results'}
                            </button>
                            <button
                                onClick={handleRun}
                                disabled={runWorkflowMutation.isPending || isNewWorkflow}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Run Workflow
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex">
                <div className="flex-1 relative">
                    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-sm border p-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">Add Nodes</div>
                        <div className="space-y-2">
                            <button
                                onClick={() => addNode('get_bestselling_asins')}
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Get Best Selling ASINs
                            </button>
                            <button
                                onClick={() => addNode('get_asin_by_index')}
                                className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
                            >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Get ASIN by Index
                            </button>
                            <button
                                onClick={() => addNode('get_asin_details')}
                                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded"
                            >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Get ASIN Details
                            </button>
                            <button
                                onClick={() => addNode('loop')}
                                className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded"
                            >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Loop
                            </button>
                            <button
                                onClick={() => addNode('merge')}
                                className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
                            >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Merge
                            </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500 space-y-1">
                                <div>
                                    🔗 <strong>Sequential Flow:</strong> Best Selling ASINs → Get by Index → ASIN Details
                                </div>
                                <div>
                                    💡 <strong>Tips:</strong> Connect nodes to pass data between them. Delete with red X or Delete key.
                                </div>
                            </div>
                        </div>
                    </div>

                    <WorkflowCanvas
                        initialNodes={nodes}
                        initialEdges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                    />
                </div>

                {showResults && (
                    <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
                        <WorkflowResults runs={runs || []} />
                    </div>
                )}
            </div>
        </div>
    )
}