'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { BranchCreationModal } from '@/components/branch/branch-creation-modal'
import { useChatList } from '@/hooks/useChatList'
import { useMessages } from '@/hooks/useMessages'
import { useAIChatForExistingChat } from '@/hooks/useAIChat'
import { useBranchManager } from '@/hooks/useBranchManager'
import { useSidebar } from '@/hooks/useSidebar'
import { Branch, BranchMessage } from '@/types/branch'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const branchId = searchParams.get('branch')
  const firstMessage = searchParams.get('firstMessage')
  const [firstMessageProcessed, setFirstMessageProcessed] = useState(false)
  const mainBranchIdFromUrl = searchParams.get('mainBranchId')

  // ブランチデータの状態管理
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchMessages, setBranchMessages] = useState<Record<string, BranchMessage[]>>({})
  const [branchesLoaded, setBranchesLoaded] = useState(false)

  const {
    chats,
    activeChat,
    selectChat,
    deleteChat,
    renameChat,
    updateChatPreview,
    fetchChats,
  } = useChatList()

  const {
    messages,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
    mainBranchId,
  } = useMessages(chatId, updateChatPreview, mainBranchIdFromUrl || undefined)

  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  // ブランチデータを取得する関数
  const fetchBranches = async () => {
    if (!chatId) return
    try {
      const response = await fetch(`/api/chats/${chatId}/branches`)
      if (response.ok) {
        const branchesData = await response.json()
        // ブランチデータをフォーマット
        const formattedBranches: Branch[] = branchesData.map((branch: any) => ({
          id: branch.id,
          chatId: branch.chatId,
          parentBranchId: branch.parentBranchId,
          name: branch.name,
          color: branch.color || '#3b82f6',
          isActive: false,
          createdAt: new Date(branch.createdAt),
          updatedAt: new Date(branch.updatedAt),
          metadata: branch.metadata || {},
        }))
        // メッセージデータをフォーマット
        const messagesData: Record<string, BranchMessage[]> = {}
        branchesData.forEach((branch: any) => {
          messagesData[branch.id] = branch.messages.map((msg: any) => ({
            id: msg.id,
            branchId: msg.branchId,
            parentMessageId: msg.parentMessageId,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.createdAt),
            metadata: msg.metadata || {},
          }))
        })
        setBranches(formattedBranches)
        setBranchMessages(messagesData)
        setBranchesLoaded(true)
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  // useBranchManagerは初期値は空でOK。データ取得後にsetBranches/setMessagesで反映
  const branchManager = useBranchManager({
    chatId: chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // ブランチデータ取得は初回のみ
  useEffect(() => {
    fetchBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // ブランチデータ取得後にbranchManagerへ反映
  useEffect(() => {
    if (branchesLoaded) {
      branchManager.setBranches?.(branches)
      branchManager.setMessages(branchMessages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchesLoaded, branches, branchMessages])

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
  }, [branchManager.currentBranchId]) // Remove branchManager.branches to prevent infinite loop

  const handleSendMessage = async (content: string) => {
    sendMessage(content)
  }

  // Handle first message from /chat/new
  useEffect(() => {
    if (firstMessageProcessed) return

    const trySendFirstMessage = async () => {
      if (firstMessage && activeChat === chatId) {
        // mainBranchIdがなければfetchMessagesで取得
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
  }, [firstMessage, activeChat, chatId, firstMessageProcessed, sendMessage, router, mainBranchId, fetchMessages])

  // 初回ロード時にチャット一覧を取得
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // chatIdが変わったときにメッセージを取得
  useEffect(() => {
    fetchMessages()
  }, [chatId, fetchMessages])

  const currentMessages = messages

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
          messages={currentMessages}
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
