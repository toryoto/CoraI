'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatDB } from '@/hooks/useChatDB'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { type Message } from '@/components/chat/message'

export default function BranchChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = params.branchId as string

  const {
    chats,
    activeChat,
    sidebarCollapsed,
    selectChat,
    deleteChat,
    renameChat,
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

  // State for tracking if we're actively polling for AI responses
  const [isPollingForAI, setIsPollingForAI] = React.useState(true) // Start with polling enabled for new branches

  // Fetch branch data and messages when page loads
  React.useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const response = await fetch(`/api/branches/${branchId}/messages`)
        if (response.ok) {
          const messages = await response.json()

          // Set messages for this branch in the branch manager
          const formattedMessages = messages.map(
            (msg: {
              id: string
              branchId: string
              parentMessageId: string | null
              content: string
              role: string
              createdAt: string
              metadata?: Record<string, unknown>
            }) => ({
              id: msg.id,
              branchId: msg.branchId,
              parentMessageId: msg.parentMessageId,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt),
              metadata: msg.metadata || {},
            })
          )

          // Check if we have any typing messages (AI still generating)
          const hasTypingMessages = formattedMessages.some(
            (msg: { role: string; metadata?: { isTyping?: boolean }; content: string }) =>
              msg.role === 'assistant' && (msg.metadata?.isTyping === true || msg.content === '')
          )

          // Also check if we have very recent messages (created in last 2 minutes)
          const hasRecentMessages = formattedMessages.some(
            (msg: { timestamp: Date | string }) => new Date().getTime() - new Date(msg.timestamp).getTime() < 2 * 60 * 1000
          )

          if ((hasTypingMessages || hasRecentMessages) && !isPollingForAI) {
            setIsPollingForAI(true)
          } else if (
            !hasTypingMessages &&
            !hasRecentMessages &&
            isPollingForAI &&
            formattedMessages.length > 0
          ) {
            setIsPollingForAI(false)
          }

          // まず現在のブランチに切り替えてからメッセージを設定
          branchManager.switchBranch(branchId)
          branchManager.setMessages({
            ...branchManager.messages,
            [branchId]: formattedMessages,
          })

        }
      } catch (error) {
        throw error
      }
    }

    if (branchId) {
      fetchBranchData()
    }
  }, [branchId, isPollingForAI]) // Remove branchManager to prevent infinite loop

  // Set up polling for AI responses when needed
  React.useEffect(() => {
    if (!isPollingForAI || !branchId) return

    const pollForAIUpdates = async () => {
      try {
        const response = await fetch(`/api/branches/${branchId}/messages`)
        if (response.ok) {
          const messages = await response.json()
          const formattedMessages = messages.map(
            (msg: {
              id: string
              branchId: string
              parentMessageId: string | null
              content: string
              role: string
              createdAt: string
              metadata?: Record<string, unknown>
            }) => ({
              id: msg.id,
              branchId: msg.branchId,
              parentMessageId: msg.parentMessageId,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt),
              metadata: msg.metadata || {},
            })
          )

          // Check if AI is still typing
          const hasTypingMessages = formattedMessages.some(
            (msg: { role: string; metadata?: { isTyping?: boolean }; content: string }) =>
              msg.role === 'assistant' && (msg.metadata?.isTyping === true || msg.content === '')
          )

          branchManager.setMessages({
            ...branchManager.messages,
            [branchId]: formattedMessages,
          })

          // Stop polling if no more typing messages
          if (!hasTypingMessages) {
            setIsPollingForAI(false)
          }
        }
      } catch (error) {
        console.error('[BranchChatPage] Failed to poll for AI updates:', error)
      }
    }

    const interval = setInterval(pollForAIUpdates, 1000) // Poll every second

    // Auto-stop polling after 60 seconds
    const timeout = setTimeout(() => {
      setIsPollingForAI(false)
    }, 60000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isPollingForAI, branchId, branchManager])

  // Switch to the specified branch
  React.useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId]) // Remove branchManager from dependencies to prevent infinite loop

  const chatDB = {
    addMessage: (chatId: string, message: Message) => {
      // ブランチIDを使ってAPI保存
      return fetch(`/api/branches/${branchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          role: message.role,
          modelUsed: message.role === 'assistant' ? 'gpt-4o-mini' : undefined,
          isTyping: message.isTyping || false,
        }),
      })
        .then(async response => {
          if (!response.ok) throw new Error('Failed to save message to branch')
          const savedMessage = await response.json()
          // UI即時更新
          const newMessage = {
            id: savedMessage.id,
            branchId,
            parentMessageId: null,
            content: savedMessage.content,
            role: savedMessage.role,
            timestamp: new Date(savedMessage.createdAt),
            metadata: savedMessage.isTyping ? { isTyping: savedMessage.isTyping } : {},
          }
          const currentBranchMessages = branchManager.getMessagesForBranch(branchId)
          branchManager.setMessages({
            ...branchManager.messages,
            [branchId]: [...currentBranchMessages, newMessage],
          })
          return savedMessage.id
        })
        .catch(error => {
          console.error(error)
          return null
        })
    },
    updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => {
      // ローカルUI更新
      const currentMessages = branchManager.getMessagesForBranch(branchId)
      const updatedMessages = currentMessages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: updates.content || msg.content,
              metadata: {
                ...msg.metadata,
                isTyping:
                  updates.isTyping !== undefined ? updates.isTyping : msg.metadata?.isTyping,
              },
            }
          : msg
      )
      branchManager.setMessages({
        ...branchManager.messages,
        [branchId]: updatedMessages,
      })
      // DB更新（ストリーミング完了時のみ）
      const isStreaming = (updates as { isStreaming?: boolean }).isStreaming === true
      if (!isStreaming && updates.content) {
        fetch(`/api/messages/${messageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: updates.content,
            isTyping: updates.isTyping || false,
          }),
        }).catch(error => {
          console.error('[BranchChatPage] Failed to update message in DB:', error)
        })
      }
    },
    removeMessage: (chatId: string, messageId: string) => {
      fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (response.ok) {
            const currentMessages = branchManager.getMessagesForBranch(branchId)
            const filteredMessages = currentMessages.filter(msg => msg.id !== messageId)
            branchManager.setMessages({
              ...branchManager.messages,
              [branchId]: filteredMessages,
            })
          }
        })
        .catch(error => {
          console.error('[BranchChatPage] Failed to remove message:', error)
        })
    },
    getCurrentMessages: () => {
      if (branchManager.currentBranchId) {
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
    },
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
  }, [branchManager.currentBranchId, branchManager.branches])

  const handleSendMessage = async (content: string) => {
    sendMessage(content)
  }

  const currentMessages = React.useMemo(() => {
    // Show branch messages
    if (branchManager.currentBranchId) {
      const branchMessages = branchManager.getMessagesForBranch(branchManager.currentBranchId)
      return branchMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: msg.timestamp,
        isTyping: msg.metadata?.isTyping as boolean,
      }))
    }
    return []
  }, [branchManager.currentBranchId, branchManager.messages, branchId])

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
