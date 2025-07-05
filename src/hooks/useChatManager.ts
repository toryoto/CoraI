import { useState, useCallback } from 'react'
import { type Chat } from '@/components/ui/sidebar'
import { type Message } from '@/components/chat/message'

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}


export function useChatManager() {
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeChat, setActiveChat] = useState<string | undefined>(undefined)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)


  const createNewChat = useCallback(() => {
    const newChatId = generateId()
    const newChat: Chat = {
      id: newChatId,
      title: "新しいチャット",
      updatedAt: new Date(),
      preview: undefined
    }
    
    setChats(prev => [newChat, ...prev])
    setMessages(prev => ({ ...prev, [newChatId]: [] }))
    setActiveChat(newChatId)
    
    return newChatId
  }, [])

  const selectChat = useCallback((chatId: string) => {
    setActiveChat(chatId)
  }, [])

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    setMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[chatId]
      return newMessages
    })
    
    if (activeChat === chatId) {
      setChats(currentChats => {
        const remainingChats = currentChats.filter(chat => chat.id !== chatId)
        const newActiveChat = remainingChats.length > 0 ? remainingChats[0].id : undefined
        setActiveChat(newActiveChat)
        return currentChats
      })
    }
  }, [activeChat])

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date() }
        : chat
    ))
  }, [])

  const addMessage = useCallback((chatId: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }))
  }, [])

  const updateMessage = useCallback((chatId: string, messageId: string, updates: Partial<Message>) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      ) || []
    }))
  }, [])

  const removeMessage = useCallback((chatId: string, messageId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.filter(msg => msg.id !== messageId) || []
    }))
  }, [])

  const updateChatPreview = useCallback((chatId: string, content: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId
        ? { 
            ...chat, 
            preview: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            updatedAt: new Date()
          }
        : chat
    ))
  }, [])

  const getCurrentMessages = useCallback(() => {
    if (!activeChat) return []
    return messages[activeChat] || []
  }, [activeChat, messages])

  return {
    // State
    chats,
    messages,
    activeChat,
    sidebarCollapsed,
    
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
    
    // Computed
    getCurrentMessages,
    generateId
  }
}