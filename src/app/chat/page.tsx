'use client'

import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { ThreadList } from '@/components/assistant-ui/thread-list'
import { Thread } from '@/components/assistant-ui/thread'
import { usePersistedChat } from '@/hook/usePersistedChat'

export default function Chat() {
  const { runtime } = usePersistedChat()

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="grid h-[calc(100vh-64px)] grid-cols-[240px_1fr] overflow-hidden">
        <ThreadList />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  )
}