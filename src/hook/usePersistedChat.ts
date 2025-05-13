'use client'

import { useState } from 'react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'

export function usePersistedChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const runtime = useChatRuntime({
    api: '/api/chat',
    body: {
      conversationId,
    },
    onResponse: (response) => {
      console.log(response)
      const id = response.headers.get('X-Conversation-Id')
      if (id) {
        setConversationId(id)
      }
    },
  })

  return { runtime, conversationId }
}