'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { BranchTreeView } from '@/components/branch/branch-tree-view'
import { useChatDB } from '@/hooks/useChatDB'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function BranchPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string

  const {
    chats,
    activeChat,
    sidebarCollapsed,
    selectChat,
    deleteChat,
    renameChat,
    setSidebarCollapsed,
  } = useChatDB()

  // Initialize branch manager for this chat
  const branchManager = useBranchManager({
    chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // Fetch branches from API
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`/api/chats/${chatId}/branches`)
        if (response.ok) {
          const branches = await response.json()
          // Convert API branches to branch manager format
          const formattedBranches = branches.map((branch: any) => ({
            id: branch.id,
            chatId: branch.chatId,
            parentBranchId: branch.parentBranchId,
            name: branch.name,
            color: branch.color || '#3b82f6', // Default color
            isActive: false,
            createdAt: new Date(branch.createdAt),
            updatedAt: new Date(branch.updatedAt),
            metadata: branch.metadata || {},
          }))
          branchManager.setBranches?.(formattedBranches)

          // Also set messages for each branch
          const messagesData: Record<string, any[]> = {}
          branches.forEach((branch: any) => {
            messagesData[branch.id] = branch.messages.map((msg: any) => ({
              id: msg.id,
              branchId: msg.branchId,
              parentMessageId: msg.parentMessageId,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt),
              metadata: msg.metadata || {},
            }))
          })
          branchManager.setMessages(messagesData)
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error)
      }
    }

    if (chatId) {
      fetchBranches()
    }
  }, [chatId]) // Remove branchManager from dependencies

  // Select the chat if not already selected
  React.useEffect(() => {
    if (chatId && activeChat !== chatId) {
      selectChat(chatId)
    }
  }, [chatId, activeChat, selectChat])

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={() => {
          router.push('/chat/new')
        }}
        onSelectChat={newChatId => {
          selectChat(newChatId)
          router.push(`/chat/${newChatId}`)
        }}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col">
        <BranchTreeView
          chatId={chatId}
          branches={branchManager.branches}
          messages={branchManager.messages}
          currentBranchId={branchManager.currentBranchId}
          onBranchSelect={branchManager.switchBranch}
          onBranchDelete={branchManager.deleteBranch}
        />
      </div>
    </div>
  )
}
