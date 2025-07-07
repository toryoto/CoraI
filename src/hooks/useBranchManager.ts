import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Branch,
  BranchMessage,
  BranchCreationConfig,
  BranchState,
  DEFAULT_BRANCH_CONFIG,
  DEFAULT_BRANCH_COLORS,
} from '@/types/branch'
import { ChatAPI, type ChatMessage } from '@/lib/chat-client'

// Extend Window interface for streaming timeout
declare global {
  interface Window {
    streamingUpdateTimeout?: NodeJS.Timeout | null
  }
}

interface BranchManagerProps {
  chatId: string
  initialBranches?: Branch[]
  initialMessages?: Record<string, BranchMessage[]>
  onBranchCreated?: (branches: Branch[]) => void
}

interface BranchManagerState {
  branches: Branch[]
  currentBranchId: string | null
  messages: Record<string, BranchMessage[]>
  isCreatingBranch: boolean
  branchCreationModal: BranchState['branchCreationModal']
}

interface BranchManagerActions {
  createBranches: (config: BranchCreationConfig, parentMessageId: string) => Promise<void>
  switchBranch: (branchId: string) => void
  deleteBranch: (branchId: string) => Promise<void>
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>
  openBranchCreationModal: (parentMessageId: string) => void
  closeBranchCreationModal: () => void
  updateBranchCreationConfig: (config: Partial<BranchCreationConfig>) => void
  addMessageToBranch: (branchId: string, message: Omit<BranchMessage, 'id' | 'timestamp'>) => void
  getMessagesForBranch: (branchId: string) => BranchMessage[]
  setMessages: (messages: Record<string, BranchMessage[]>) => void
  generateBranchConfig: (branchCount: number) => BranchCreationConfig
  setBranches?: (branches: Branch[]) => void // Optional for internal use
}

type UseBranchManagerReturn = BranchManagerState & BranchManagerActions

export const useBranchManager = ({
  chatId,
  initialBranches = [],
  initialMessages = {},
  onBranchCreated,
}: BranchManagerProps): UseBranchManagerReturn => {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, BranchMessage[]>>(initialMessages)
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const [branchCreationModal, setBranchCreationModal] = useState<
    BranchState['branchCreationModal']
  >({
    isOpen: false,
    parentMessageId: null,
    config: DEFAULT_BRANCH_CONFIG,
  })

  // Initialize main branch if no branches exist
  useEffect(() => {
    if (branches.length === 0) {
      const mainBranch: Branch = {
        id: 'main',
        chatId,
        parentBranchId: null,
        name: 'Main',
        color: DEFAULT_BRANCH_COLORS[0],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          purpose: 'Main conversation thread',
          tags: ['main'],
          priority: 'high',
        },
      }
      setBranches([mainBranch])
      setCurrentBranchId('main')
    }
  }, [chatId, branches.length])

  // Helper functions
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`)
    return response.json()
  }

  const createBranchMessage = (
    data: Partial<BranchMessage>,
    savedData: { id: string; content?: string; createdAt: string }
  ): BranchMessage => ({
    id: savedData.id,
    branchId: data.branchId!,
    parentMessageId: data.parentMessageId || null,
    content: savedData.content || data.content || '',
    role: data.role!,
    timestamp: new Date(savedData.createdAt),
    metadata: data.metadata || {},
  })

  const generateBranchConfig = useCallback(
    (branchCount: number): BranchCreationConfig => ({
      branchCount,
      branches: Array.from({ length: branchCount }, (_, index) => ({
        name: `Branch ${index + 1}`,
        color: DEFAULT_BRANCH_COLORS[index % DEFAULT_BRANCH_COLORS.length],
        question: '',
      })),
      metadata: { purpose: '', tags: [], priority: 'medium' as const },
    }),
    []
  )

  const generateAIResponse = useCallback(async (branchId: string, userQuestion: string) => {
    try {
      // Create empty AI message in DB first
      const savedAiMessage = await apiRequest(`/api/branches/${branchId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: '',
          role: 'assistant',
          modelUsed: 'gpt-4o-mini',
          isTyping: true,
        }),
      })

      const aiMessageId = savedAiMessage.id
      const aiMessage = createBranchMessage(
        { branchId, role: 'assistant', content: '', metadata: { isTyping: true } },
        savedAiMessage
      )

      setMessages(prev => ({
        ...prev,
        [branchId]: [...(prev[branchId] || []), aiMessage],
      }))

      // Prepare messages for API call
      const apiMessages: ChatMessage[] = [
        {
          role: 'user',
          content: userQuestion,
        },
      ]

      let accumulatedContent = ''

      await ChatAPI.sendMessage(apiMessages, {
        stream: true,
        onStream: (streamContent: string) => {
          accumulatedContent += streamContent

          // Update only local state during streaming (no DB updates)
          setMessages(prev => ({
            ...prev,
            [branchId]:
              prev[branchId]?.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: accumulatedContent, metadata: { isTyping: true } }
                  : msg
              ) || [],
          }))

          // Throttle database updates during streaming (every 500ms)
          if (!window.streamingUpdateTimeout) {
            window.streamingUpdateTimeout = setTimeout(() => {
              fetch(`/api/messages/${aiMessageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: accumulatedContent,
                  isTyping: true,
                }),
              }).catch(error => {
                console.error('Failed to update streaming content in DB:', error)
              })
              window.streamingUpdateTimeout = null
            }, 500)
          }
        },
        onComplete: async (fullContent: string) => {
          const finalContent = fullContent || accumulatedContent

          // Clear any pending streaming timeout
          if (window.streamingUpdateTimeout) {
            clearTimeout(window.streamingUpdateTimeout)
            window.streamingUpdateTimeout = null
          }

          if (finalContent) {
            try {
              // Single final update to database
              await fetch(`/api/messages/${aiMessageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: finalContent,
                  isTyping: false,
                }),
              })

              // Final update to local state
              setMessages(prev => ({
                ...prev,
                [branchId]:
                  prev[branchId]?.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: finalContent, metadata: { isTyping: false } }
                      : msg
                  ) || [],
              }))
            } catch (error) {
              console.error('Failed to finalize AI message:', error)
            }
          }
        },
        onError: async (error: string) => {
          console.error('AI response error for branch:', branchId, error)
          const errorContent = `エラーが発生しました: ${error}`

          // Clear any pending streaming timeout
          if (window.streamingUpdateTimeout) {
            clearTimeout(window.streamingUpdateTimeout)
            window.streamingUpdateTimeout = null
          }

          try {
            await fetch(`/api/messages/${aiMessageId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: errorContent,
                isTyping: false,
              }),
            })

            setMessages(prev => ({
              ...prev,
              [branchId]:
                prev[branchId]?.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: errorContent, metadata: { isTyping: false } }
                    : msg
                ) || [],
            }))
          } catch (updateError) {
            console.error('Failed to update error message:', updateError)
          }
        },
      })
    } catch (error) {
      console.error('Failed to generate AI response for branch:', branchId, error)
    }
  }, [])

  const closeBranchCreationModal = useCallback(() => {
    setBranchCreationModal({
      isOpen: false,
      parentMessageId: null,
      config: DEFAULT_BRANCH_CONFIG,
    })
  }, [])

  const createBranches = useCallback(
    async (config: BranchCreationConfig, parentMessageId: string) => {
      setIsCreatingBranch(true)

      try {
        const newBranches: Branch[] = []

        for (let i = 0; i < config.branches.length; i++) {
          const branchConfig = config.branches[i]

          // Create branch in database
          const createdBranch = await apiRequest(`/api/chats/${chatId}/branches`, {
            method: 'POST',
            body: JSON.stringify({
              name: branchConfig.name,
              parentBranchId: currentBranchId || null,
            }),
          })

          const newBranch: Branch = {
            id: createdBranch.id,
            chatId,
            parentBranchId: createdBranch.parentBranchId,
            name: createdBranch.name,
            color: branchConfig.color,
            isActive: i === 0,
            createdAt: new Date(createdBranch.createdAt),
            updatedAt: new Date(createdBranch.updatedAt),
            metadata: config.metadata,
          }

          newBranches.push(newBranch)

          // Add user message and generate AI response if question exists
          if (branchConfig.question.trim()) {
            try {
              const savedUserMessage = await apiRequest(`/api/branches/${newBranch.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                  content: branchConfig.question,
                  role: 'user',
                  isTyping: false,
                }),
              })

              const userMessage = createBranchMessage(
                {
                  branchId: newBranch.id,
                  role: 'user',
                  parentMessageId,
                  content: savedUserMessage.content,
                },
                savedUserMessage
              )

              // Add user message to local state
              setMessages(prev => ({
                ...prev,
                [newBranch.id]: [userMessage],
              }))

              // Generate AI response for this branch (fire and forget)
              generateAIResponse(newBranch.id, branchConfig.question).catch(error => {
                console.error(`Failed to generate AI response for branch ${newBranch.id}:`, error)
              })
            } catch (error) {
              console.error('Error saving user message:', error)
            }
          }
        }

        // Add new branches to state
        setBranches(prev => [...prev, ...newBranches])

        // Switch to the first new branch
        if (newBranches.length > 0) {
          setCurrentBranchId(newBranches[0].id)

          // Navigate to the specific branch page immediately
          // The branch page will handle real-time updates
          router.push(`/chat/${chatId}/branch/${newBranches[0].id}`)
        }

        // Close modal
        closeBranchCreationModal()

        // Notify parent component
        onBranchCreated?.(newBranches)
      } catch (error) {
        throw error
      } finally {
        setIsCreatingBranch(false)
      }
    },
    [chatId, currentBranchId, generateAIResponse, router, onBranchCreated, closeBranchCreationModal]
  )

  const switchBranch = useCallback((branchId: string) => {
    // Update current branch
    setCurrentBranchId(branchId)

    // Update branch active status
    setBranches(prev =>
      prev.map(branch => ({
        ...branch,
        isActive: branch.id === branchId,
      }))
    )
  }, [])

  const deleteBranch = useCallback(
    async (branchId: string) => {
      if (branchId === 'main') {
        throw new Error('Cannot delete main branch')
      }

      try {
        // Remove branch from state
        setBranches(prev => prev.filter(branch => branch.id !== branchId))

        // Remove messages for this branch
        setMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[branchId]
          return newMessages
        })

        // If deleted branch was active, switch to main
        if (currentBranchId === branchId) {
          setCurrentBranchId('main')
        }
      } catch (error) {
        console.error('Failed to delete branch:', error)
        throw error
      }
    },
    [currentBranchId]
  )

  const updateBranch = useCallback(async (branchId: string, updates: Partial<Branch>) => {
    try {
      setBranches(prev =>
        prev.map(branch =>
          branch.id === branchId ? { ...branch, ...updates, updatedAt: new Date() } : branch
        )
      )
    } catch (error) {
      console.error('Failed to update branch:', error)
      throw error
    }
  }, [])

  const openBranchCreationModal = useCallback((parentMessageId: string) => {
    setBranchCreationModal({
      isOpen: true,
      parentMessageId,
      config: DEFAULT_BRANCH_CONFIG,
    })
  }, [])

  const updateBranchCreationConfig = useCallback((configUpdate: Partial<BranchCreationConfig>) => {
    setBranchCreationModal(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdate },
    }))
  }, [])

  const addMessageToBranch = useCallback(
    (branchId: string, message: Omit<BranchMessage, 'id' | 'timestamp'>) => {
      const newMessage: BranchMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }

      setMessages(prev => ({
        ...prev,
        [branchId]: [...(prev[branchId] || []), newMessage],
      }))
    },
    []
  )

  const getMessagesForBranch = useCallback(
    (branchId: string): BranchMessage[] => {
      return messages[branchId] || []
    },
    [messages]
  )

  return {
    // State
    branches,
    currentBranchId,
    messages,
    isCreatingBranch,
    branchCreationModal,

    // Branch management
    createBranches,
    switchBranch,
    deleteBranch,
    updateBranch,
    setBranches,

    // Modal management
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,

    // Messages
    addMessageToBranch,
    getMessagesForBranch,
    setMessages,

    // Utilities
    generateBranchConfig,
  }
}
