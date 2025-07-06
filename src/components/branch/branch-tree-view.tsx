'use client'

import React, { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Branch, BranchMessage } from '@/types/branch'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BranchTreeViewProps {
  chatId: string
  branches: Branch[]
  messages: Record<string, BranchMessage[]>
  currentBranchId: string | null
  onBranchSelect: (branchId: string) => void
  onBranchDelete: (branchId: string) => void
}

interface BranchNodeData {
  branch: Branch
  messageCount: number
  latestMessage?: string
  isActive: boolean
  onClick: () => void
}

const BranchNode = ({ data }: { data: BranchNodeData }) => {
  return (
    <div
      onClick={data.onClick}
      className={cn(
        'min-w-[250px] p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
        'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg',
        data.isActive
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
      style={{
        borderLeftColor: data.branch.color,
        borderLeftWidth: '4px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.branch.color }}
        />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {data.branch.name}
        </span>
        <GitBranch className="w-4 h-4 text-gray-500" />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        <MessageSquare className="w-4 h-4 inline mr-1" />
        {data.messageCount} messages
      </div>

      {data.latestMessage && (
        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {data.latestMessage}
        </div>
      )}

      {data.isActive && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
          Current Branch
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  branchNode: BranchNode,
}

export function BranchTreeView({
  chatId,
  branches,
  messages,
  currentBranchId,
  onBranchSelect,
}: BranchTreeViewProps) {
  const router = useRouter()

  // Convert branches to React Flow nodes
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    // Calculate positions - simple tree layout
    const levelWidth = 300
    const levelHeight = 150
    const branchLevels: Record<string, number> = {}
    const branchPositions: Record<string, { x: number; y: number }> = {}

    // Calculate levels (depth from main branch)
    const calculateLevel = (branch: Branch, level = 0): void => {
      branchLevels[branch.id] = level
      const children = branches.filter(b => b.parentBranchId === branch.id)
      children.forEach(child => calculateLevel(child, level + 1))
    }

    // Start with main branch
    const mainBranch = branches.find(b => b.id === 'main' || b.parentBranchId === null)
    if (mainBranch) {
      calculateLevel(mainBranch)
    }

    // Calculate positions
    const levelCounts: Record<number, number> = {}
    branches.forEach(branch => {
      const level = branchLevels[branch.id] || 0
      levelCounts[level] = (levelCounts[level] || 0) + 1
    })

    const levelOffsets: Record<number, number> = {}
    branches.forEach(branch => {
      const level = branchLevels[branch.id] || 0
      const offset = levelOffsets[level] || 0

      branchPositions[branch.id] = {
        x: level * levelWidth,
        y: offset * levelHeight,
      }

      levelOffsets[level] = offset + 1
    })

    // Create nodes
    branches.forEach(branch => {
      const branchMessages = messages[branch.id] || []
      const latestMessage = branchMessages[branchMessages.length - 1]?.content

      flowNodes.push({
        id: branch.id,
        type: 'branchNode',
        position: branchPositions[branch.id] || { x: 0, y: 0 },
        data: {
          branch,
          messageCount: branchMessages.length,
          latestMessage: latestMessage?.slice(0, 100) + (latestMessage && latestMessage.length > 100 ? '...' : ''),
          isActive: branch.id === currentBranchId,
          onClick: () => {
            onBranchSelect(branch.id)
            // Navigate to chat after selecting
            if (branch.id === 'main') {
              router.push(`/chat/${chatId}`)
            } else {
              router.push(`/chat/${chatId}?branch=${branch.id}`)
            }
          },
        } as BranchNodeData,
      })

      // Create edge from parent to this branch
      if (branch.parentBranchId) {
        flowEdges.push({
          id: `${branch.parentBranchId}-${branch.id}`,
          source: branch.parentBranchId,
          target: branch.id,
          type: 'smoothstep',
          style: { stroke: branch.color, strokeWidth: 2 },
          animated: branch.id === currentBranchId,
        })
      }
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [branches, messages, currentBranchId, onBranchSelect, router, chatId])

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  // Update nodes when props change
  React.useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  const handleBackToChat = useCallback(() => {
    if (currentBranchId && currentBranchId !== 'main') {
      router.push(`/chat/${chatId}?branch=${currentBranchId}`)
    } else {
      router.push(`/chat/${chatId}`)
    }
  }, [router, chatId, currentBranchId])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Navigate to chat with selected branch
    if (node.id === 'main') {
      router.push(`/chat/${chatId}`)
    } else {
      router.push(`/chat/${chatId}?branch=${node.id}`)
    }
  }, [router, chatId])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToChat}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Branch Tree View
          </h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {branches.length} branches • Click any branch to open chat
        </div>
      </div>

      {/* React Flow Container */}
      <div className="flex-1">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
        >
          <Controls />
          <MiniMap
            style={{
              height: 120,
            }}
            zoomable
            pannable
            nodeColor={(node) => {
              const branch = (node.data as BranchNodeData).branch
              return branch.color
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}