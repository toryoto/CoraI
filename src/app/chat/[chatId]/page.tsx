'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatList } from '@/hooks/useChatList'
import { useMessages } from '@/hooks/useMessages'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { useSidebar } from '@/hooks/useSidebar'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = searchParams.get('branch')
  const firstMessage = searchParams.get('firstMessage')
  const [firstMessageProcessed, setFirstMessageProcessed] = useState(false)
  const mainBranchIdFromUrl = searchParams.get('mainBranchId')

  const {
    chats,
    activeChat,
    selectChat,
    deleteChat,
    renameChat,
    updateChatPreview,
    fetchChats,
  } = useChatList()

  const {
    messages,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
    mainBranchId,
  } = useMessages(chatId, updateChatPreview, mainBranchIdFromUrl || undefined)

  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  // Branch management
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // Select the chat if not already selected
  useEffect(() => {
    if (chatId && activeChat !== chatId) {
      selectChat(chatId)
    }
  }, [chatId, activeChat, selectChat])

  // Fetch and set current branch when chat is loaded
  useEffect(() => {
    if (chatId && activeChat && branchManager.currentBranchId !== activeChat) {
      // Use activeChat from useChatList as currentBranchId
      branchManager.switchBranch(activeChat)
    }
  }, [chatId, activeChat]) // Remove branchManager from dependencies

  // Switch to the specified branch if provided in URL
  useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId]) // Only depend on branchId

  const chatDB = {
    addMessage: async (chatId: string, message: any) => {
      console.log('メインブランチID', mainBranchId)
      if (mainBranchId) {
        return addMessage(message, mainBranchId)
      } else {
        // mainBranchIdがまだ取得できていない場合はfetchMessages後に再試行
        await fetchMessages()
        if (mainBranchId) {
          return addMessage(message, mainBranchId)
        } else {
          alert('メッセージ送信に失敗しました（mainBranchIdが取得できません）')
          return Promise.reject('mainBranchId not found')
        }
      }
    },
    updateMessage: (chatId: string, messageId: string, updates: any) => updateMessage(messageId, updates),
    removeMessage: (chatId: string, messageId: string) => removeMessage(messageId),
    getCurrentMessages: () => messages,
    generateId: () => crypto.randomUUID(),
  }
  const { isGenerating, sendMessage, stopGeneration } = useAIChatForExistingChat(chatId || '', chatDB)

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
  useEffect(() => {
    if (firstMessageProcessed) return

    const trySendFirstMessage = async () => {
      if (firstMessage && activeChat === chatId) {
        // mainBranchIdがなければfetchMessagesで取得
        if (!mainBranchId) {
          await fetchMessages()
        }
        if (mainBranchId) {
          setFirstMessageProcessed(true)
          await sendMessage(firstMessage)
          setTimeout(() => {
            router.replace(`/chat/${chatId}`)
          }, 100)
        } else {
          alert('メッセージ送信に失敗しました（mainBranchIdが取得できません）')
        }
      }
    }
    trySendFirstMessage()
  }, [firstMessage, activeChat, chatId, firstMessageProcessed, sendMessage, router, mainBranchId, fetchMessages])

  // 初回ロード時にチャット一覧を取得
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // chatIdが変わったときにメッセージを取得
  React.useEffect(() => {
    fetchMessages()
  }, [chatId, fetchMessages])

  const currentMessages = messages

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
