'use client'

import React from 'react'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BranchTreeView } from '@/components/branch/branch-tree-view'
import { useChatList } from '@/hooks/useChatList'
import { useBranchManager } from '@/hooks/useBranchManager'

export default function BranchPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string

  const { activeChat, selectChat, fetchChats } = useChatList()

  // Initialize branch manager for this chat
  const branchManager = useBranchManager({
    chatId,
    initialBranches: [],
    initialMessages: {},
  })

  // Fetch branches from API
  useEffect(() => {
    if (chatId) {
      branchManager.fetchBranches()
    }
  }, [chatId, branchManager.fetchBranches])

  // Select the chat if not already selected
  useEffect(() => {
    if (chatId && activeChat !== chatId) {
      selectChat(chatId)
    }
  }, [chatId, activeChat, selectChat])

  return (
    <BranchTreeView
      chatId={chatId}
      branches={branchManager.branches}
      messages={branchManager.messages}
      currentBranchId={branchManager.currentBranchId}
      onBranchSelect={branchManager.switchBranch}
      onBranchDelete={branchManager.deleteBranch}
    />
  )
}
