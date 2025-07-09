'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatList } from '@/hooks/useChatList'
import { useAIChatForNewChat } from '@/hooks/useAIChat'
import { useSidebar } from '@/hooks/useSidebar'

export default function NewChatPage() {
  const router = useRouter()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const { tempMessages, isGenerating, stopGeneration } = useAIChatForNewChat()

  const { chats, createNewChat, selectChat, deleteChat, renameChat, fetchChats } = useChatList()

  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const handleSendMessage = async (content: string) => {
    if (!isCreatingChat) {
      setIsCreatingChat(true)

      // Create a new chat
      const newChatData = await createNewChat()

      if (newChatData) {
        const { chatId, mainBranchId } = newChatData
        router.push(
          `/chat/${chatId}?mainBranchId=${mainBranchId}&firstMessage=${encodeURIComponent(content)}`
        )
      }

      setIsCreatingChat(false)
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        chats={chats}
        activeChat={undefined}
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
