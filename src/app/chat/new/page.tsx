'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatDB } from '@/hooks/useChatDB'
import { useAIChat } from '@/hooks/useAIChat'
import type { Message } from '@/components/chat/message'

export default function NewChatPage() {
  const router = useRouter()
  const [isCreatingChat, setIsCreatingChat] = React.useState(false)
  const [tempMessages, setTempMessages] = React.useState<Message[]>([])
  const [localActiveChat] = React.useState<string | undefined>(undefined)

  const {
    chats,
    sidebarCollapsed,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    addMessage,
    setSidebarCollapsed,
    generateId,
  } = useChatDB()

  const { isGenerating, sendMessage, stopGeneration } = useAIChat({
    onMessageAdd: async message => {
      // Always store in temp messages for new chat
      if (!localActiveChat && !isCreatingChat) {
        setTempMessages(prev => [...prev, message])
        return message.id
      }
      // Otherwise add to the local active chat
      if (localActiveChat) {
        return await addMessage(localActiveChat, message)
      }
      return null
    },
    onMessageUpdate: (messageId, updates) => {
      if (!localActiveChat) {
        setTempMessages(prev =>
          prev.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg))
        )
      } else {
        // Don't update in new chat page after navigation
      }
    },
    onMessageRemove: messageId => {
      if (!localActiveChat) {
        setTempMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    },
    getCurrentMessages: () => {
      // Always return temp messages on new chat page
      return tempMessages
    },
    generateId,
  })

  const handleSendMessage = async (content: string) => {
    // Always create a new chat on first message
    if (!localActiveChat && !isCreatingChat) {
      setIsCreatingChat(true)

      // Create a new chat
      const newChatData = await createNewChat()

      if (newChatData) {
        const { chatId } = newChatData

        // Navigate to the new chat with the first message to send
        window.location.href = `/chat/${chatId}?firstMessage=${encodeURIComponent(content)}`
      }

      setIsCreatingChat(false)
    } else if (localActiveChat) {
      // This shouldn't happen on new chat page, but handle it
      await sendMessage(content)
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        chats={chats}
        activeChat={undefined} // Always show no active chat on new page
        onNewChat={() => {
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
          messages={tempMessages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating || isCreatingChat}
          onStopGeneration={stopGeneration}
          placeholder="新しい会話を始めましょう..."
        />
      </div>
    </div>
  )
}
