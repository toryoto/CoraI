'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { useChatList } from '@/hooks/useChatList'
import { useSidebar } from '@/hooks/useSidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { chats, activeChat, selectChat, deleteChat, renameChat, fetchChats } = useChatList()
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

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

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}
