import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { ShoppingCart } from 'lucide-react'

interface GetBestSellingAsinsNodeData {
  label: string
  topCount?: number
}

export const GetBestSellingAsinsNode: React.FC<NodeProps<GetBestSellingAsinsNodeData>> = ({
  data,
  isConnectable,
}) => {
  const [topCount, setTopCount] = useState(data.topCount || 10)

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-blue-100">
          <ShoppingCart className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-blue-600">Get Best Selling ASINs</div>
          <div className="text-gray-500">Fetch top selling products</div>
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Top Count
        </label>
        <input
          type="number"
          value={topCount}
          onChange={(e) => setTopCount(Number(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          min="1"
          max="100"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  )
}