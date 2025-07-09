'use client'

import React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatList } from '@/hooks/useChatList'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { Branch, BranchMessage } from '@/types/branch'

export default function BranchChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = params.branchId as string

  // branchManagerでブランチとメッセージを統合管理
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // 現在のブランチのメッセージを取得
  const messages = useMemo(() => {
    const branchMessages = branchManager.messages[branchId] || []
    return branchMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: msg.timestamp,
      isTyping: Boolean(msg.metadata?.isTyping),
      branchId: msg.branchId,
    }))
  }, [branchManager.messages, branchId])

  const { activeChat, selectChat, fetchChats } = useChatList()

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

  // 初回マウント時にブランチメッセージを取得
  useEffect(() => {
    if (branchId) {
      branchManager.fetchBranchMessages(branchId)
    }
  }, [branchId, branchManager.fetchBranchMessages])

  // AIチャット機能をbranchManagerと統合
  const { isGenerating, sendMessage, stopGeneration } = useAIChatForExistingChat(branchId, {
    addMessage: async message => {
      return branchManager.addMessageToBranchWithDB(branchId, {
        branchId,
        parentMessageId: null,
        content: message.content,
        role: message.role,
        metadata: { isTyping: message.isTyping },
      })
    },
    updateMessage: (messageId, updates) => {
      branchManager.updateBranchMessage(messageId, updates)
    },
    removeMessage: messageId => {
      branchManager.removeBranchMessage(messageId)
    },
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

  const handleSendMessage = async (content: string) => {
    sendMessage(content)
  }

  return (
    <>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        onStopGeneration={stopGeneration}
        onBranch={handleBranch}
        currentBranch={branchManager.currentBranch}
        onViewBranches={handleViewBranches}
      />

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
    </>
  )
}
