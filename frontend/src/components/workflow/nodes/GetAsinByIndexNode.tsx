import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { ListOrdered } from 'lucide-react'

interface GetAsinByIndexNodeData {
  label: string
  index?: number
}

export const GetAsinByIndexNode: React.FC<NodeProps<GetAsinByIndexNodeData>> = ({
  data,
  isConnectable,
}) => {
  const [index, setIndex] = useState(data.index || 0)

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-green-100">
          <ListOrdered className="w-6 h-6 text-green-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-green-600">Get ASIN by Index</div>
          <div className="text-gray-500">Select item from list</div>
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Index
        </label>
        <input
          type="number"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          min="0"
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-green-500"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  )
}