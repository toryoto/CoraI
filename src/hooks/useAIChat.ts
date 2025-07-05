import { useState, useCallback } from 'react'
import { ChatAPI, type ChatMessage } from '@/lib/api'
import { type Message } from '@/components/chat/message'

export interface UseAIChatOptions {
  onMessageAdd: (message: Message) => Promise<string | null>
  onMessageUpdate: (messageId: string, updates: Partial<Message>) => void
  onMessageRemove: (messageId: string) => void
  getCurrentMessages: () => Message[]
  generateId: () => string
}

export function useAIChat({
  onMessageAdd,
  onMessageUpdate,
  onMessageRemove,
  getCurrentMessages,
  generateId
}: UseAIChatOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date()
    }
    
    // Add user message
    await onMessageAdd(userMessage)
    
    // Start generating AI response
    setIsGenerating(true)
    
    // Create temporary typing message
    const typingMessage: Message = {
      id: generateId(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isTyping: true
    }
    
    const typingMessageId = await onMessageAdd(typingMessage)
    if (!typingMessageId) {
      setIsGenerating(false)
      return
    }
    
    try {
      // Create abort controller for this request
      const controller = new AbortController()
      setAbortController(controller)
      
      // Convert messages to API format
      const currentMessages = getCurrentMessages()
      const apiMessages: ChatMessage[] = [
        ...currentMessages
          .filter(msg => !msg.isTyping) // Exclude typing messages
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        // Add the new user message since state might not be updated yet
        {
          role: "user" as const,
          content
        }
      ]
      
      let accumulatedContent = ""
      
      await ChatAPI.sendMessage(apiMessages, {
        stream: true,
        signal: controller.signal,
        onStream: (streamContent: string) => {
          accumulatedContent += streamContent
          
          // Update the typing message with accumulated content
          onMessageUpdate(typingMessageId, {
            content: accumulatedContent,
            isTyping: false
          })
        },
        onComplete: (fullContent: string) => {
          // Final update to ensure we have the complete message
          onMessageUpdate(typingMessageId, {
            content: fullContent,
            isTyping: false
          })
          setIsGenerating(false)
          setAbortController(null)
        },
        onError: (error: string) => {
          console.error('Chat API error:', error)
          
          // Don't show error if it was aborted
          if (controller.signal.aborted) {
            // Remove typing message
            onMessageRemove(typingMessageId)
          } else {
            // Replace typing message with error message
            onMessageUpdate(typingMessageId, {
              content: `エラーが発生しました: ${error}`,
              isTyping: false
            })
          }
          setIsGenerating(false)
          setAbortController(null)
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Remove typing message and show error
      onMessageRemove(typingMessageId)
      
      const errorMessage: Message = {
        id: generateId(),
        content: "申し訳ございませんが、メッセージの送信に失敗しました。しばらく待ってから再度お試しください。",
        role: "assistant",
        timestamp: new Date()
      }
      
      onMessageAdd(errorMessage)
      setIsGenerating(false)
    }
  }, [
    onMessageAdd,
    onMessageUpdate,
    onMessageRemove,
    getCurrentMessages,
    generateId
  ])

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
  }, [abortController])

  const handleBranch = useCallback((messageId: string) => {
    // TODO: Implement branching functionality
    console.log('Branch from message:', messageId)
  }, [])

  return {
    isGenerating,
    sendMessage,
    stopGeneration,
    handleBranch
  }
}