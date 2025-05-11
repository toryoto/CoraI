'use client'

import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { ThreadList } from '@/components/assistant-ui/thread-list'
import { Thread } from '@/components/assistant-ui/thread'

export default function Chat() {
  const runtime = useChatRuntime({
    api: '/api/chat',
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="grid h-[calc(100vh-64px)] grid-cols-[240px_1fr] overflow-hidden">
        <ThreadList />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  )
}