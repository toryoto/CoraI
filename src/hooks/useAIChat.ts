import { useState, useCallback } from 'react'
import { ChatAPI, type ChatMessage } from '@/lib/chat-client'
import { type Message } from '@/components/chat/message'

// MessageStoreインターフェースを定義
export interface MessageStore {
  addMessage: (message: Message) => Promise<string | null>
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  removeMessage: (messageId: string) => void
  getMessages: () => Message[]
  generateId: () => string
}

export function useAIChat(store: MessageStore) {
  const { addMessage, updateMessage, removeMessage, getMessages, generateId } = store
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const createMessage = (content: string, role: Message['role'], isTyping = false): Message => ({
    id: generateId(),
    content,
    role,
    timestamp: new Date(),
    ...(isTyping && { isTyping }),
  })

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message
      await addMessage(createMessage(content, 'user'))

      // Start generating AI response
      setIsGenerating(true)

      const typingMessageId = await addMessage(createMessage('', 'assistant', true))
      if (!typingMessageId) {
        setIsGenerating(false)
        return
      }

      try {
        // Create abort controller for this request
        const controller = new AbortController()
        setAbortController(controller)

        // Convert messages to API format
        const apiMessages: ChatMessage[] = [
          ...getMessages()
            .filter(msg => !msg.isTyping)
            .map(({ role, content }) => ({ role, content })),
          { role: 'user', content },
        ]

        let accumulatedContent = ''

        await ChatAPI.sendMessage(apiMessages, {
          stream: true,
          signal: controller.signal,
          onStream: (streamContent: string) => {
            accumulatedContent += streamContent

            // Update the typing message with accumulated content (mark as streaming)
            updateMessage(typingMessageId, {
              content: accumulatedContent,
              isTyping: false,
              isStreaming: true, // 型安全に
            })
          },
          onComplete: (fullContent: string) => {
            // Use accumulated content if fullContent is empty
            const finalContent = fullContent || accumulatedContent

            // Final update to ensure we have the complete message (not streaming)
            updateMessage(typingMessageId, {
              content: finalContent,
              isTyping: false,
              isStreaming: false, // ストリーミング完了
            })
            setIsGenerating(false)
            setAbortController(null)
          },
          onError: (error: string) => {
            console.error('Chat API error:', error)

            if (controller.signal.aborted) {
              removeMessage(typingMessageId)
            } else {
              updateMessage(typingMessageId, {
                content: `エラーが発生しました: ${error}`,
                isTyping: false,
              })
            }
            setIsGenerating(false)
            setAbortController(null)
          },
        })
      } catch (error) {
        console.error('Failed to send message:', error)
        removeMessage(typingMessageId)
        await addMessage(
          createMessage(
            '申し訳ございませんが、メッセージの送信に失敗しました。しばらく待ってから再度お試しください。',
            'assistant'
          )
        )
        setIsGenerating(false)
      }
    },
    [addMessage, updateMessage, removeMessage, getMessages, generateId]
  )

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
  }, [abortController])

  return {
    isGenerating,
    sendMessage,
    stopGeneration,
  }
}

// プリセット付きファクトリー関数: 新規チャット用
export function useAIChatForNewChat() {
  const [tempMessages, setTempMessages] = useState<Message[]>([])
  const store: MessageStore = {
    addMessage: async (message) => {
      setTempMessages(prev => [...prev, message])
      return message.id
    },
    updateMessage: (messageId, updates) => {
      setTempMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg))
      )
    },
    removeMessage: (messageId) => {
      setTempMessages(prev => prev.filter(msg => msg.id !== messageId))
    },
    getMessages: () => tempMessages,
    generateId: () => crypto.randomUUID(),
  }
  const aiChat = useAIChat(store)
  return { ...aiChat, tempMessages, setTempMessages }
}

// プリセット付きファクトリー関数: 既存チャット用
export function useAIChatForExistingChat(
  chatId: string,
  functions: {
    addMessage: (message: Message) => Promise<string | null>
    updateMessage: (messageId: string, updates: Partial<Message>) => void
    removeMessage: (messageId: string) => void
    getCurrentMessages: () => Message[]
    generateId: () => string
  }
) {
  const store: MessageStore = {
    addMessage: functions.addMessage,
    updateMessage: functions.updateMessage,
    removeMessage: functions.removeMessage,
    getMessages: functions.getCurrentMessages,
    generateId: functions.generateId,
  }
  return useAIChat(store)
}
