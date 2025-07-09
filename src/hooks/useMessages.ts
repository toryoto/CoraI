import { useState, useCallback } from 'react'
import { type Message } from '@/components/chat/message'

export function useMessages(chatId: string, updateChatPreview?: (chatId: string, content: string) => void, initialMainBranchId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [mainBranchId, setMainBranchId] = useState<string | undefined>(initialMainBranchId)

  // メッセージ一覧を取得
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      const data = await response.json()
      const mainBranch = data.branches[0]
      if (mainBranch) {
        setMainBranchId(mainBranch.id)
        const formattedMessages = mainBranch.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.createdAt),
          isTyping: msg.isTyping,
          branchId: mainBranch.id,
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }, [chatId])

  // メッセージを追加
  const addMessage = useCallback(async (message: Message, branchId?: string) => {
    try {
      const targetBranchId = branchId || mainBranchId || ''
      const response = await fetch(`/api/branches/${targetBranchId}/messages`, {
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
      // ユーザーのメッセージまたはisTyping=trueのメッセージのみ即時追加
      if (message.role === 'user' || message.isTyping) {
        setMessages(prev => {
          // 同じIDのメッセージが既に存在するかチェック
          const existingMessage = prev.find(msg => msg.id === data.id)
          if (existingMessage) {
            return prev // 既に存在する場合は追加しない
          }
          return [...prev, {
            ...message,
            id: data.id,
            timestamp: new Date(data.createdAt),
            branchId: targetBranchId,
          }]
        })
      }
      if (message.role === 'user' && updateChatPreview) {
        updateChatPreview(chatId, message.content)
      }
      return data.id
    } catch (error) {
      console.error('Failed to add message:', error)
      return null
    }
  }, [chatId, updateChatPreview, mainBranchId])

  // メッセージを更新
  const updateMessage = useCallback(async (messageId: string, updates: Partial<Message>) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg)))
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }, [])

  // メッセージを削除
  const removeMessage = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Failed to remove message:', error)
    }
  }, [])

  return {
    messages,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setMessages,
    mainBranchId,
  }
}

 