'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatDB } from '@/hooks/useChatDB'
import { useAIChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
    chatId: activeChat || 'default',
    initialBranches: [],
    initialMessages: {},
  })

  // Switch to the specified branch if provided in URL
  React.useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId, branchManager.currentBranchId, branchManager.switchBranch])

  const { isGenerating, sendMessage, stopGeneration } = useAIChat({
    onMessageAdd: async message => {
      if (activeChat) {
        return await addMessage(activeChat, message)
      }
      return null
    },
    onMessageUpdate: (messageId, updates) => {
      if (activeChat) {
        updateMessage(activeChat, messageId, updates)
      }
    },
    onMessageRemove: messageId => {
      if (activeChat) {
        removeMessage(activeChat, messageId)
      }
    },
    getCurrentMessages,
    generateId,
  })

  const handleBranch = (messageId: string) => {
    branchManager.openBranchCreationModal(messageId)
  }

  const handleViewBranches = () => {
    if (activeChat) {
      window.location.href = `/chat/${activeChat}/branch`
    }
  }

  // Redirect to chatId route if we have an active chat, or to /chat/new if no chats
  React.useEffect(() => {
    if (!activeChat && chats.length === 0) {
      // No chats exist, redirect to new chat page
      router.push('/chat/new')
    } else if (activeChat && !window.location.pathname.includes(activeChat)) {
      // Only redirect if we're not already on the right path
      if (branchId) {
        window.location.href = `/chat/${activeChat}?branch=${branchId}`
      } else {
        window.location.href = `/chat/${activeChat}`
      }
    }
  }, [activeChat, branchId, chats.length, router])

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
    if (!activeChat) {
      // アクティブなチャットがない場合は新しいチャットを作成
      const newChatData = await createNewChat()
      if (newChatData) {
        // 新しいチャットが作成されたら、そのチャットでメッセージを送信
        sendMessage(content)
      }
      return
    }
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
        onNewChat={() => {
          console.log('[ChatPage] New chat button clicked')
          router.push('/chat/new')
        }}
        onSelectChat={chatId => {
          selectChat(chatId)
          router.push(`/chat/${chatId}`)
        }}
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
