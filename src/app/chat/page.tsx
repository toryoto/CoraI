"use client"

export const dynamic = 'force-dynamic'

import React from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useChatManager } from "@/hooks/useChatManager"
import { useAIChat } from "@/hooks/useAIChat"


export default function ChatPage() {
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
    updateChatPreview,
    setSidebarCollapsed,
    getCurrentMessages,
    generateId
  } = useChatManager()

  // Create initial chat on first load
  React.useEffect(() => {
    if (chats.length === 0) {
      createNewChat()
    }
  }, [])



  const {
    isGenerating,
    sendMessage,
    stopGeneration,
    handleBranch
  } = useAIChat({
    onMessageAdd: (message) => {
      if (activeChat) {
        addMessage(activeChat, message)
        if (message.role === 'user') {
          updateChatPreview(activeChat, message.content)
        }
      }
    },
    onMessageUpdate: (messageId, updates) => {
      if (activeChat) {
        updateMessage(activeChat, messageId, updates)
      }
    },
    onMessageRemove: (messageId) => {
      if (activeChat) {
        removeMessage(activeChat, messageId)
      }
    },
    getCurrentMessages,
    generateId
  })

  const handleSendMessage = (content: string) => {
    if (!activeChat) return
    sendMessage(content)
  }

  const currentMessages = getCurrentMessages()

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
        />
      </div>
    </div>
  )
}
