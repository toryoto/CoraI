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
        'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl',
        data.isActive
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-blue-200/50'
          : 'border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-blue-100/50'
      )}
      style={{
        borderLeftColor: data.branch.color,
        borderLeftWidth: '4px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full shadow-sm"
          style={{ backgroundColor: data.branch.color }}
        />
        <span className="font-medium text-blue-800 dark:text-blue-200">{data.branch.name}</span>
        <GitBranch className="w-4 h-4 text-blue-500" />
      </div>

      <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
        <MessageSquare className="w-4 h-4 inline mr-1" />
        {data.messageCount} messages
      </div>

      {data.latestMessage && (
        <div className="text-xs text-blue-500 dark:text-blue-400 line-clamp-2">
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
          latestMessage:
            latestMessage?.slice(0, 100) +
            (latestMessage && latestMessage.length > 100 ? '...' : ''),
          isActive: branch.id === currentBranchId,
          onClick: () => {
            onBranchSelect(branch.id)
            // Navigate to chat after selecting
            if (branch.parentBranchId === null || branch.name === 'メインブランチ') {
              // This is the main branch
              router.push(`/chat/${chatId}`)
            } else {
              router.push(`/chat/${chatId}/branch/${branch.id}`)
            }
          },
        } as Record<string, unknown>,
      })

      // Create edge from parent to this branch
      if (branch.parentBranchId) {
        flowEdges.push({
          id: `${branch.parentBranchId}-${branch.id}`,
          source: branch.parentBranchId,
          target: branch.id,
          type: 'smoothstep',
          style: {
            stroke: branch.color,
            strokeWidth: branch.id === currentBranchId ? 3 : 2,
          },
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
    if (currentBranchId) {
      const currentBranch = branches.find(b => b.id === currentBranchId)
      if (
        currentBranch &&
        (currentBranch.parentBranchId === null || currentBranch.name === 'メインブランチ')
      ) {
        // This is the main branch
        router.push(`/chat/${chatId}`)
      } else {
        router.push(`/chat/${chatId}/branch/${currentBranchId}`)
      }
    } else {
      router.push(`/chat/${chatId}`)
    }
  }, [router, chatId, currentBranchId, branches])

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Find the branch to check if it's main
      const branch = branches.find(b => b.id === node.id)
      if (branch && (branch.parentBranchId === null || branch.name === 'メインブランチ')) {
        // This is the main branch
        router.push(`/chat/${chatId}`)
      } else {
        router.push(`/chat/${chatId}/branch/${node.id}`)
      }
    },
    [router, chatId, branches]
  )

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-teal-50/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100 dark:border-blue-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToChat}
            className="flex items-center gap-2 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <h1 className="text-lg font-semibold text-coral-gradient">Branch Tree View</h1>
        </div>
        <div className="text-sm text-blue-600 dark:text-blue-400">
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
          <Controls className="bg-white/80 border-blue-200" />
          <MiniMap
            style={{
              height: 120,
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgb(191, 219, 254)',
            }}
            zoomable
            pannable
            nodeColor={node => {
              const branch = (node.data as unknown as BranchNodeData).branch
              return branch.color
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#93c5fd" />
        </ReactFlow>
      </div>
    </div>
  )
}
