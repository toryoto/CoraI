import { useState, useCallback, useEffect } from 'react'
import { type Chat } from '@/components/ui/sidebar'
import { type Message } from '@/components/chat/message'

interface DBChat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  branches: DBBranch[]
}

interface DBBranch {
  id: string
  chatId: string
  name: string | null
  messages?: DBMessage[]
}

interface DBMessage {
  id: string
  content: string
  role: string
  createdAt: string
  isTyping: boolean
}

export function useChatDB() {
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeChat, setActiveChat] = useState<string | undefined>(undefined)
  const [activeBranch, setActiveBranch] = useState<string | undefined>(undefined)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  // チャット一覧を取得
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats')

      if (!response.ok) {
        if (response.status === 401) {
          // 未認証の場合は空配列を返す
          return []
        }
        throw new Error('Failed to fetch chats')
      }

      const data: DBChat[] = await response.json()

      const formattedChats = data.map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: new Date(chat.updatedAt),
        preview: chat.branches[0]?.messages?.[0]?.content?.slice(0, 50) || '',
      }))

      setChats(formattedChats)
      return formattedChats
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      return []
    }
  }, [])

  // 初回ロード時にチャット一覧を取得
  useEffect(() => {
    const loadInitialData = async () => {
      const chats = await fetchChats()
      setLoading(false)
      // チャットが無い場合は何もしない（/chat/newで処理する）
      if (chats.length > 0 && !activeChat) {
        setActiveChat(chats[0].id)
        // 初回ロード時はfetchChatMessagesを直接実行せず、selectChatが後で実行される
      }
    }
    loadInitialData()
  }, []) // 依存配列を空にして初回のみ実行

  // 特定のチャットとメッセージを取得
  const fetchChatMessages = useCallback(async (chatId: string) => {
    try {
      console.log('[useChatDB] fetchChatMessages called for chatId:', chatId)
      const response = await fetch(`/api/chats/${chatId}`)
      const data = await response.json()
      console.log('[useChatDB] fetchChatMessages response:', data)

      // 最初のブランチをアクティブに設定
      const mainBranch = data.branches[0]
      if (mainBranch) {
        console.log('[useChatDB] Main branch found:', mainBranch)
        setActiveBranch(mainBranch.id)

        // メッセージをフォーマット
        const formattedMessages = mainBranch.messages.map((msg: DBMessage) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.createdAt),
          isTyping: msg.isTyping,
        }))
        console.log('[useChatDB] Formatted messages:', formattedMessages)

        setMessages(prev => {
          const newMessages = {
            ...prev,
            [chatId]: formattedMessages,
          }
          console.log('[useChatDB] Setting messages state:', newMessages)
          return newMessages
        })
      } else {
        console.log('[useChatDB] No main branch found')
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error)
    }
  }, [])

  // 新しいチャットを作成
  const createNewChat = useCallback(async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新しいチャット' }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 未認証の場合は何もしない
          return
        }
        throw new Error('Failed to create chat')
      }

      const data = await response.json()

      const newChat: Chat = {
        id: data.id,
        title: data.title,
        updatedAt: new Date(data.updatedAt),
        preview: '',
      }

      setChats(prev => [newChat, ...prev])
      setActiveChat(data.id)
      setActiveBranch(data.branches[0].id)
      setMessages(prev => ({ ...prev, [data.id]: [] }))

      return { chatId: data.id, branchId: data.branches[0].id }
    } catch (error) {
      console.error('Failed to create chat:', error)
      return null
    }
  }, [])

  // activeChatが変更されたときにメッセージを読み込む
  useEffect(() => {
    if (activeChat) {
      console.log('[useChatDB] activeChat changed, fetching messages for:', activeChat)
      fetchChatMessages(activeChat)
    }
  }, [activeChat, fetchChatMessages]) // Always fetch when activeChat changes

  // チャットを選択
  const selectChat = useCallback(
    (chatId: string) => {
      setActiveChat(chatId)
      fetchChatMessages(chatId)
    },
    [fetchChatMessages]
  )

  // チャットを削除
  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })

        setChats(prev => prev.filter(chat => chat.id !== chatId))
        setMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[chatId]
          return newMessages
        })

        if (activeChat === chatId) {
          const remainingChats = chats.filter(chat => chat.id !== chatId)
          if (remainingChats.length > 0) {
            selectChat(remainingChats[0].id)
          } else {
            setActiveChat(undefined)
            setActiveBranch(undefined)
          }
        }
      } catch (error) {
        console.error('Failed to delete chat:', error)
      }
    },
    [activeChat, chats, selectChat]
  )

  // チャットをリネーム
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })

      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId ? { ...chat, title: newTitle, updatedAt: new Date() } : chat
        )
      )
    } catch (error) {
      console.error('Failed to rename chat:', error)
    }
  }, [])

  // メッセージを追加
  const addMessage = useCallback(
    async (chatId: string, message: Message, branchId?: string) => {
      const targetBranch = branchId || activeBranch
      if (!targetBranch) {
        return
      }

      try {
        const response = await fetch(`/api/branches/${targetBranch}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message.content,
            role: message.role,
            modelUsed: message.role === 'assistant' ? 'gpt-4o-mini' : undefined,
            isTyping: message.isTyping || false,
          }),
        })

        const data = await response.json()
        const newMessage: Message = {
          id: data.id,
          content: data.content,
          role: data.role as 'user' | 'assistant',
          timestamp: new Date(data.createdAt),
          isTyping: data.isTyping,
        }

        setMessages(prev => {
          const currentMessages = prev[chatId] || []
          // Check for duplicates
          const isDuplicate = currentMessages.some(msg => msg.id === newMessage.id)
          if (isDuplicate) {
            return prev
          }
          return {
            ...prev,
            [chatId]: [...currentMessages, newMessage],
          }
        })

        // チャットのプレビューを更新
        if (message.role === 'user') {
          updateChatPreview(chatId, message.content)
        }

        return data.id // 作成されたメッセージのIDを返す
      } catch (error) {
        console.error('Failed to add message:', error)
        return null
      }
    },
    [activeBranch]
  )

  // メッセージを更新
  const updateMessage = useCallback(
    async (chatId: string, messageId: string, updates: Partial<Message>) => {
      try {
        await fetch(`/api/messages/${messageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        setMessages(prev => ({
          ...prev,
          [chatId]:
            prev[chatId]?.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg)) || [],
        }))
      } catch (error) {
        console.error('Failed to update message:', error)
      }
    },
    []
  )

  // メッセージを削除
  const removeMessage = useCallback(async (chatId: string, messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })

      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.filter(msg => msg.id !== messageId) || [],
      }))
    } catch (error) {
      console.error('Failed to remove message:', error)
    }
  }, [])

  // チャットプレビューを更新
  const updateChatPreview = useCallback((chatId: string, content: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              preview: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
              updatedAt: new Date(),
            }
          : chat
      )
    )
  }, [])

  // 現在のメッセージを取得
  const getCurrentMessages = useCallback(() => {
    if (!activeChat) return []
    return messages[activeChat] || []
  }, [activeChat, messages])

  // ID生成（クライアント側では使わないが、互換性のため残す）
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9)
  }, [])

  return {
    // State
    chats,
    messages,
    activeChat,
    activeBranch,
    sidebarCollapsed,
    loading,

    // Actions
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    addMessage,
    updateMessage,
    removeMessage,
    updateChatPreview,
    setSidebarCollapsed,
    setActiveChat,
    setActiveBranch,

    // Computed
    getCurrentMessages,
    generateId,
  }
}
