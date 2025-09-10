import { Edge, Node } from 'reactflow'

export interface NodeDataFlow {
  hasInput: boolean
  inputType?: string
  inputDescription?: string
  outputType: string
  outputDescription: string
}

export const getNodeDataFlow = (nodeId: string, nodeType: string, edges: Edge[], nodes: Node[]): NodeDataFlow => {
  // Find incoming edge
  const incomingEdge = edges.find(edge => edge.target === nodeId)
  const sourceNode = incomingEdge ? nodes.find(node => node.id === incomingEdge.source) : null

  // Determine input type based on source node
  let inputType: string | undefined
  let inputDescription: string | undefined
  
  if (sourceNode) {
    switch (sourceNode.type) {
      case 'get_bestselling_asins':
        inputType = 'asin_list'
        inputDescription = 'List of ASINs from best selling products'
        break
      case 'get_asin_by_index':
        inputType = 'single_asin'
        inputDescription = 'Single ASIN selected from list'
        break
      case 'get_asin_details':
        inputType = 'product_details'
        inputDescription = 'Product details with title, description, etc.'
        break
      case 'loop':
        inputType = 'single_asin_from_loop'
        inputDescription = 'A single item from the loop'
        break
      case 'merge':
        inputType = 'product_details_table'
        inputDescription = 'A table of product details'
        break
    }
  }

  // Determine output type and description based on current node type
  let outputType: string
  let outputDescription: string

  switch (nodeType) {
    case 'get_bestselling_asins':
      outputType = 'asin_list'
      outputDescription = 'List of top selling ASINs'
      break
    case 'get_asin_by_index':
      outputType = 'single_asin'
      outputDescription = 'Single ASIN at specified index'
      break
    case 'get_asin_details':
      outputType = 'product_details'
      outputDescription = 'Complete product information'
      break
    case 'loop':
      outputType = 'single_asin_from_loop'
      outputDescription = 'Single item to be processed individually'
      break
    case 'merge':
      outputType = 'product_details_table'
      outputDescription = 'A table of all collected product details'
      break
    default:
      outputType = 'unknown'
      outputDescription = 'Unknown output type'
  }

  return {
    hasInput: !!incomingEdge,
    inputType,
    inputDescription,
    outputType,
    outputDescription
  }
}

export const isValidConnection = (sourceNodeType: string, targetNodeType: string): boolean => {
  const validConnections: Record<string, string[]> = {
    'get_bestselling_asins': ['get_asin_by_index', 'loop', 'get_asin_details'],
    'get_asin_by_index': ['get_asin_details'],
    'get_asin_details': ['merge'], // Can now lead to a merge
    'loop': ['get_asin_details'], // Loop can start processing with a single-item node
    'merge': [], // Merge is a terminal node for now
  }

  const validTargets = validConnections[sourceNodeType]
  return validTargets ? validTargets.includes(targetNodeType) : false
}