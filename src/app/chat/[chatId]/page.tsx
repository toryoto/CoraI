'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatList } from '@/hooks/useChatList'
import { useMessages } from '@/hooks/useMessages'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { Branch } from '@/types/branch'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = searchParams.get('branch')
  const firstMessage = searchParams.get('firstMessage')
  const [firstMessageProcessed, setFirstMessageProcessed] = useState(false)
  const mainBranchIdFromUrl = searchParams.get('mainBranchId')

  const { activeChat, selectChat, updateChatPreview, fetchChats } = useChatList()

  const { messages, fetchMessages, addMessage, updateMessage, removeMessage, mainBranchId } =
    useMessages(chatId, updateChatPreview, mainBranchIdFromUrl || undefined)

  // useBranchManagerは初期値は空でOK。データ取得後にsetBranches/setMessagesで反映
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // ブランチデータ取得は初回のみ
  useEffect(() => {
    if (chatId) {
      branchManager.fetchBranches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

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

  const { isGenerating, sendMessage, stopGeneration } = useAIChatForExistingChat(chatId || '', {
    addMessage,
    updateMessage,
    removeMessage,
    getCurrentMessages: () => messages,
    generateId: () => crypto.randomUUID(),
  })

  const handleBranch = (messageId: string) => {
    const parentMessage = messages.find(m => m.id === messageId)
    if (parentMessage) {
      branchManager.openBranchCreationModal(messageId, parentMessage)
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

  // Handle first message from /chat/new
  useEffect(() => {
    if (firstMessageProcessed) return

    const trySendFirstMessage = async () => {
      if (firstMessage && activeChat === chatId) {
        // mainBranchIdがURLパラメータから取得できない場合は、fetchMessagesで取得
        if (!mainBranchId) {
          await fetchMessages()
        }
        if (mainBranchId) {
          setFirstMessageProcessed(true)
          await sendMessage(firstMessage)
          setTimeout(() => {
            router.replace(`/chat/${chatId}`)
          }, 100)
        } else {
          alert('メッセージ送信に失敗しました（mainBranchIdが取得できません）')
        }
      }
    }
    trySendFirstMessage()
  }, [
    firstMessage,
    activeChat,
    chatId,
    firstMessageProcessed,
    sendMessage,
    router,
    mainBranchId,
    fetchMessages,
  ])



  // chatIdが変わったときにメッセージを取得
  useEffect(() => {
    fetchMessages()
  }, [chatId, fetchMessages])

  const currentMessages = messages

  return (
    <>
      <ChatInterface
        messages={currentMessages}
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
