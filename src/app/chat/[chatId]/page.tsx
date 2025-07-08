'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatDB } from '@/hooks/useChatDB'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = searchParams.get('branch')
  const firstMessage = searchParams.get('firstMessage')
  const [firstMessageProcessed, setFirstMessageProcessed] = React.useState(false)

  const {
    chats,
    activeChat,
    activeBranch,
    sidebarCollapsed,
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

  // Fetch and set current branch when chat is loaded
  React.useEffect(() => {
    if (chatId && activeBranch && branchManager.currentBranchId !== activeBranch) {
      // Use activeBranch from useChatDB as currentBranchId
      branchManager.switchBranch(activeBranch)
    }
  }, [chatId, activeBranch]) // Remove branchManager from dependencies

  // Switch to the specified branch if provided in URL
  React.useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId]) // Only depend on branchId

  const chatDB = {
    addMessage,
    updateMessage,
    removeMessage,
    getCurrentMessages,
    generateId,
  }
  const { isGenerating, sendMessage, stopGeneration } = useAIChatForExistingChat(
    chatId || '',
    chatDB
  )

  const handleBranch = (messageId: string) => {
    branchManager.openBranchCreationModal(messageId)
  }

  const handleViewBranches = () => {
    if (chatId) {
      router.push(`/chat/${chatId}/branch`)
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
  }, [branchManager.currentBranchId]) // Remove branchManager.branches to prevent infinite loop

  const handleSendMessage = async (content: string) => {
    sendMessage(content)
  }

  // Handle first message from /chat/new
  React.useEffect(() => {
    // Early return if already processed
    if (firstMessageProcessed) return

    if (firstMessage && activeChat === chatId && activeBranch) {
      setFirstMessageProcessed(true)
      // Send message which will create user message and AI response
      sendMessage(firstMessage)
      // Remove the query parameter to prevent re-sending after a short delay
      setTimeout(() => {
        router.replace(`/chat/${chatId}`)
      }, 100)
    }
  }, [firstMessage, activeChat, chatId, activeBranch, firstMessageProcessed, sendMessage, router])

  const currentMessages = React.useMemo(() => {
    // Always use getCurrentMessages from useChatDB for main chat page
    // Branch-specific logic is only for dedicated branch pages
    const messages = getCurrentMessages()
    return messages
  }, [getCurrentMessages]) // Always use main chat messages

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
