'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatDB } from '@/hooks/useChatDB'
import { useAIChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const branchId = searchParams.get('branch')

  const {
    chats,
    activeChat,
    sidebarCollapsed,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    addMessage,
    updateMessage,
    removeMessage,
    setSidebarCollapsed,
    getCurrentMessages,
    generateId,
  } = useChatDB()

  // Branch management
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // Select the chat if not already selected
  React.useEffect(() => {
    if (chatId && activeChat !== chatId) {
      selectChat(chatId)
    }
  }, [chatId, activeChat, selectChat])

  // Switch to the specified branch if provided in URL
  React.useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId, branchManager.currentBranchId, branchManager.switchBranch])

  const { isGenerating, sendMessage, stopGeneration } = useAIChat({
    onMessageAdd: async message => {
      if (chatId) {
        return await addMessage(chatId, message)
      }
      return null
    },
    onMessageUpdate: (messageId, updates) => {
      if (chatId) {
        updateMessage(chatId, messageId, updates)
      }
    },
    onMessageRemove: messageId => {
      if (chatId) {
        removeMessage(chatId, messageId)
      }
    },
    getCurrentMessages,
    generateId,
  })

  const handleBranch = (messageId: string) => {
    branchManager.openBranchCreationModal(messageId)
  }

  const handleViewBranches = () => {
    if (chatId) {
      window.location.href = `/chat/${chatId}/branch`
    }
  }

  const currentBranch = React.useMemo(() => {
    if (branchManager.currentBranchId) {
      const branch = branchManager.branches.find(b => b.id === branchManager.currentBranchId)
      if (branch) {
        return {
          id: branch.id,
          name: branch.name,
          color: branch.color,
        }
      }
    }
    return undefined
  }, [branchManager.currentBranchId, branchManager.branches])

  const handleSendMessage = async (content: string) => {
    sendMessage(content)
  }

  const currentMessages = React.useMemo(() => {
    // If we're in a branch, show branch messages instead of chat messages
    if (branchManager.currentBranchId && branchManager.currentBranchId !== 'main') {
      const branchMessages = branchManager.getMessagesForBranch(branchManager.currentBranchId)
      return branchMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: msg.timestamp,
        isTyping: msg.metadata?.isTyping as boolean,
      }))
    }
    return getCurrentMessages()
  }, [getCurrentMessages, branchManager.currentBranchId, branchManager.getMessagesForBranch])

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
        <ChatInterface
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={stopGeneration}
          onBranch={handleBranch}
          currentBranch={currentBranch}
          onViewBranches={handleViewBranches}
        />
      </div>

      {/* Branch Creation Modal */}
      <BranchCreationModal
        isOpen={branchManager.branchCreationModal.isOpen}
        onClose={branchManager.closeBranchCreationModal}
        config={branchManager.branchCreationModal.config}
        onConfigChange={branchManager.updateBranchCreationConfig}
        onCreateBranches={async config => {
          if (branchManager.branchCreationModal.parentMessageId) {
            await branchManager.createBranches(
              config,
              branchManager.branchCreationModal.parentMessageId
            )
          }
        }}
        isCreating={branchManager.isCreatingBranch}
      />
    </div>
  )
}
