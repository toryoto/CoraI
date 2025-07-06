'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { BranchTreeView } from '@/components/branch/branch-tree-view'
import { useChatDB } from '@/hooks/useChatDB'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function BranchPage() {
  const params = useParams()
  const chatId = params.chatId as string

  const {
    chats,
    activeChat,
    sidebarCollapsed,
    createNewChat,
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
        onNewChat={createNewChat}
        onSelectChat={selectChat}
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