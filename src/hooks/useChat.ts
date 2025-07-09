import { useState, useCallback, useEffect } from 'react'
import { chatService, ChatResponse } from '@/services/chatService'

export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<ChatResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChat = useCallback(async () => {
    if (!chatId) {
      setChat(null)
      return null
    }

    try {
      setLoading(true)
      setError(null)
      const fetchedChat = await chatService.getChat(chatId)
      setChat(fetchedChat)
      return fetchedChat
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chat'
      setError(errorMessage)
      console.error('Failed to fetch chat:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    if (chatId) {
      fetchChat()
    }
  }, [chatId, fetchChat])

  return {
    chat,
    loading,
    error,
    refetch: fetchChat,
  }
}
