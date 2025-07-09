'use client'

import React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatList } from '@/hooks/useChatList'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { useSidebar } from '@/hooks/useSidebar'
import { Branch, BranchMessage } from '@/types/branch'
import { useBranchMessages } from '@/hooks/useMessages'

export default function BranchChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = params.branchId as string

  // 分岐管理（分岐作成・切り替え専用）
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // ブランチ専用メッセージ管理
  const {
    messages,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useBranchMessages(branchId)

  const {
    chats,
    activeChat,
    selectChat,
    deleteChat,
    renameChat,
    fetchChats
  } = useChatList()

  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  // チャット選択
  useEffect(() => {
    if (chatId && activeChat !== chatId) {
      selectChat(chatId)
    }
  }, [chatId, activeChat, selectChat])

  // ブランチ切り替え
  useEffect(() => {
    if (branchId && branchId !== branchManager.currentBranchId) {
      branchManager.switchBranch(branchId)
    }
  }, [branchId, branchManager])

  // 初回マウント時に過去メッセージを取得
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // サイドバーのチャット履歴を取得
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const { isGenerating, sendMessage, stopGeneration } = useAIChatForExistingChat(branchId, {
    addMessage,
    updateMessage,
    removeMessage,
    getCurrentMessages: () => messages,
    generateId: () => crypto.randomUUID(),
  })

  const handleBranch = (messageId: string) => {
    const parentMessage = messages.find(m => m.id === messageId)
    if (parentMessage) {
      branchManager.openBranchCreationModal(messageId, {
        id: parentMessage.id,
        content: parentMessage.content,
        role: parentMessage.role,
      })
    }
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
          messages={messages}
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
        parentMessage={branchManager.branchCreationModal.parentMessage}
      />
    </div>
  )
}
