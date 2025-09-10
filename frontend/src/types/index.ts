export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface MyProduct {
  asin: string
  title: string
  description?: string
  bullet_points?: string[]
  sales_amount: number
  created_at: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  flow_data: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  user_id: string
  created_at: string
  updated_at: string
}

export interface WorkflowNode {
  id: string
  type: 'get_bestselling_asins' | 'get_asin_by_index' | 'get_asin_details' | 'loop' | 'merge'
  position: { x: number; y: number }
  data: {
    label: string
    topCount?: number
    index?: number
    // for merge node
    outputFormat?: 'table'
    // For loop/merge pairing
    mergeId?: string
    loopId?: string
    mergeLabel?: string
    loopLabel?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
}

export interface WorkflowRun {
  id: string
  workflow_id: string
  user_id: string
  status: 'running' | 'completed' | 'failed'
  results?: Record<string, WorkflowResult>
  error_message?: string
  started_at: string
  completed_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export type WorkflowResult =
  | { type: 'asin_list'; value: string[]; count: number }
  | { type: 'single_asin'; value: string }
  | { type: 'product_details'; value: MyProduct }
  | { type: 'loop_items'; items: any[]; loop_id: string }
  | {
      type: 'product_details_table'
      value: MyProduct[]
      count: number
    };