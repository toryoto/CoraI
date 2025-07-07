import { useState, useCallback } from 'react'
import { ChatAPI, type ChatMessage } from '@/lib/chat-client'
import { type Message } from '@/components/chat/message'

interface MessageCallbacks {
  onMessageAdd: (message: Message) => Promise<string | null>
  onMessageUpdate: (messageId: string, updates: Partial<Message>) => void
  onMessageRemove: (messageId: string) => void
  getCurrentMessages: () => Message[]
  generateId: () => string
}

export function useAIChat(callbacks: MessageCallbacks) {
  const { onMessageAdd, onMessageUpdate, onMessageRemove, getCurrentMessages, generateId } =
    callbacks
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
      await onMessageAdd(createMessage(content, 'user'))

      // Start generating AI response
      setIsGenerating(true)

      const typingMessageId = await onMessageAdd(createMessage('', 'assistant', true))
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
          ...getCurrentMessages()
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
            onMessageUpdate(typingMessageId, {
              content: accumulatedContent,
              isTyping: false,
              isStreaming: true, // カスタムフラグでストリーミング中であることを示す
            } as any)
          },
          onComplete: (fullContent: string) => {
            // Use accumulated content if fullContent is empty
            const finalContent = fullContent || accumulatedContent

            // Final update to ensure we have the complete message (not streaming)
            onMessageUpdate(typingMessageId, {
              content: finalContent,
              isTyping: false,
              isStreaming: false, // ストリーミング完了
            } as any)
            setIsGenerating(false)
            setAbortController(null)
          },
          onError: (error: string) => {
            console.error('Chat API error:', error)

            if (controller.signal.aborted) {
              onMessageRemove(typingMessageId)
            } else {
              onMessageUpdate(typingMessageId, {
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
        onMessageRemove(typingMessageId)
        await onMessageAdd(
          createMessage(
            '申し訳ございませんが、メッセージの送信に失敗しました。しばらく待ってから再度お試しください。',
            'assistant'
          )
        )
        setIsGenerating(false)
      }
    },
    [onMessageAdd, onMessageUpdate, onMessageRemove, getCurrentMessages, generateId]
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
