"use client"

export const dynamic = 'force-dynamic'

import React from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useChatDB } from "@/hooks/useChatDB"
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
    setSidebarCollapsed,
    getCurrentMessages,
    generateId
  } = useChatDB()



  const {
    isGenerating,
    sendMessage,
    stopGeneration,
    handleBranch
  } = useAIChat({
    onMessageAdd: async (message) => {
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
    onMessageRemove: (messageId) => {
      if (activeChat) {
        removeMessage(activeChat, messageId)
      }
    },
    getCurrentMessages,
    generateId
  })

  const handleSendMessage = async (content: string) => {
    if (!activeChat) {
      // アクティブなチャットがない場合は新しいチャットを作成
      const newChatId = await createNewChat()
      if (newChatId) {
        // 新しいチャットが作成されたら、そのチャットでメッセージを送信
        sendMessage(content)
      }
      return
    }
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
