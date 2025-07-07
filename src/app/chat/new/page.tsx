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

  const {
    chats,
    sidebarCollapsed,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    setSidebarCollapsed,
    generateId,
  } = useChatDB()

  const { isGenerating, sendMessage, stopGeneration } = useAIChat({
    onMessageAdd: async message => {
      // Always store in temp messages for new chat
      if (!isCreatingChat) {
        setTempMessages(prev => [...prev, message])
        return message.id
      }
      return null
    },
    onMessageUpdate: (messageId, updates) => {
      setTempMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg))
      )
    },
    onMessageRemove: messageId => {
      setTempMessages(prev => prev.filter(msg => msg.id !== messageId))
    },
    getCurrentMessages: () => {
      // Always return temp messages on new chat page
      return tempMessages
    },
    generateId,
  })

  const handleSendMessage = async (content: string) => {
    // Always create a new chat on first message
    if (!isCreatingChat) {
      setIsCreatingChat(true)

      // Create a new chat
      const newChatData = await createNewChat()

      if (newChatData) {
        const { chatId } = newChatData

        // Navigate to the new chat with the first message to send
        window.location.href = `/chat/${chatId}?firstMessage=${encodeURIComponent(content)}`
      }

      setIsCreatingChat(false)
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