import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { FileText } from 'lucide-react'

interface GetAsinDetailsNodeData {
  label: string
}

export const GetAsinDetailsNode: React.FC<NodeProps<GetAsinDetailsNodeData>> = ({
  isConnectable,
}) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-purple-100">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-purple-600">Get ASIN Details</div>
          <div className="text-gray-500">Fetch product details</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  )
}