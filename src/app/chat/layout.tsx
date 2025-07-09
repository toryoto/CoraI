'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, SidebarOverlay } from '@/components/ui/sidebar'
import { useChatList } from '@/hooks/useChatList'
import { useSidebar } from '@/hooks/useSidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { chats, activeChat, selectChat, deleteChat, renameChat, fetchChats } = useChatList()
  const { 
    sidebarCollapsed, 
    sidebarWidth, 
    isResizing,
    toggleSidebar, 
    startResize, 
    stopResize, 
    updateWidth 
  } = useSidebar()

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
        onToggleCollapsed={toggleSidebar}
        width={sidebarWidth}
        onWidthChange={updateWidth}
        isResizing={isResizing}
        onResizeStart={startResize}
        onResizeStop={stopResize}
      />

      <div className="flex-1 flex flex-col relative">
        {/* サイドバーが閉じている時にオーバーレイボタンを表示 */}
        <SidebarOverlay 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapsed={toggleSidebar} 
        />
        {children}
      </div>
    </div>
  )
}
