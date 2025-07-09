import { useState, useCallback } from 'react'
import { chatService, ChatListItem } from '@/services/chatService'

// Re-export for backward compatibility
export type { ChatListItem } from '@/services/chatService'

export function useChatList() {
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [activeChat, setActiveChat] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // チャット一覧を取得
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedChats = await chatService.fetchChats()
      setChats(fetchedChats)
      return fetchedChats
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 新しいチャットを作成
  const createNewChat = useCallback(async () => {
    try {
      const result = await chatService.createChat()
      if (result) {
        const newChat: ChatListItem = {
          id: result.chatId,
          title: '新しいチャット',
          updatedAt: new Date(),
          preview: '',
        }
        setChats(prev => [newChat, ...prev])
        setActiveChat(result.chatId)
        return result
      }
      return null
    } catch (error) {
      console.error('Failed to create chat:', error)
      return null
    }
  }, [])

  // チャットを削除
  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await chatService.deleteChat(chatId)
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
    },
    [activeChat, chats]
  )

  // チャットをリネーム
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      await chatService.renameChat(chatId, newTitle)
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
