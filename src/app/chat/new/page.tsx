'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatList } from '@/hooks/useChatList'
import { useAIChatForNewChat } from '@/hooks/useAIChat'

export default function NewChatPage() {
  const router = useRouter()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const { tempMessages, isGenerating, stopGeneration } = useAIChatForNewChat()

  const { createNewChat } = useChatList()

  const handleSendMessage = async (content: string) => {
    if (!isCreatingChat) {
      setIsCreatingChat(true)

      // Create a new chat
      const newChatData = await createNewChat()

      if (newChatData) {
        const { chatId, mainBranchId } = newChatData
        router.push(
          `/chat/${chatId}?mainBranchId=${mainBranchId}&firstMessage=${encodeURIComponent(content)}`
        )
      }

      setIsCreatingChat(false)
    }
  }

  return (
    <ChatInterface
      messages={tempMessages}
      onSendMessage={handleSendMessage}
      isGenerating={isGenerating || isCreatingChat}
      onStopGeneration={stopGeneration}
      placeholder="新しい会話を始めましょう..."
    />
  )
}
