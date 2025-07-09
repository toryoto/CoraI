import { useState, useCallback } from 'react'

export interface ChatListItem {
  id: string
  title: string
  updatedAt: Date
  preview: string
}

export function useChatList() {
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [activeChat, setActiveChat] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // チャット一覧を取得
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats')
      if (!response.ok) {
        if (response.status === 401) return []
        throw new Error('Failed to fetch chats')
      }
      const data = await response.json()
      const formattedChats = data.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        updatedAt: new Date(chat.updatedAt),
        preview: chat.branches?.[0]?.messages?.[0]?.content?.slice(0, 50) || '',
      }))
      setChats(formattedChats)
      return formattedChats
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      return []
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
        if (response.status === 401) return null
        throw new Error('Failed to create chat')
      }
      const data = await response.json()
      const newChat: ChatListItem = {
        id: data.id,
        title: data.title,
        updatedAt: new Date(data.updatedAt),
        preview: '',
      }
      setChats(prev => [newChat, ...prev])
      setActiveChat(data.id)
      return { chatId: data.id, mainBranchId: data.mainBranchId }
    } catch (error) {
      console.error('Failed to create chat:', error)
      return null
    }
  }, [])

  // チャットを削除
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      setChats(prev => prev.filter(chat => chat.id !== chatId))
      if (activeChat === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId)
        if (remainingChats.length > 0) {
          setActiveChat(remainingChats[0].id)
        } else {
          setActiveChat(undefined)
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }, [activeChat, chats])

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

  // チャットを選択
  const selectChat = useCallback((chatId: string) => {
    setActiveChat(chatId)
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

  return {
    chats,
    activeChat,
    loading,
    fetchChats,
    createNewChat,
    deleteChat,
    renameChat,
    selectChat,
    updateChatPreview,
    setActiveChat,
  }
} 