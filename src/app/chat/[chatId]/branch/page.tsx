'use client'

import React from 'react'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { BranchTreeView } from '@/components/branch/branch-tree-view'
import { useChatList } from '@/hooks/useChatList'
import { useBranchManager } from '@/hooks/useBranchManager'
import { useSidebar } from '@/hooks/useSidebar'

export default function BranchPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string

  const { chats, activeChat, selectChat, deleteChat, renameChat, fetchChats } = useChatList()

  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  // Initialize branch manager for this chat
  const branchManager = useBranchManager({
    chatId,
    initialBranches: [],
    initialMessages: {},
  })

  useEffect(() => {
    fetchChats()
  }, [chatId, fetchChats])

  // Fetch branches from API
  useEffect(() => {
    if (chatId) {
      branchManager.fetchBranches()
    }
  }, [chatId, branchManager.fetchBranches])

  // Select the chat if not already selected
  useEffect(() => {
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
