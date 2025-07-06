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

interface UseBranchManagerProps {
  chatId: string
  initialBranches?: Branch[]
  initialMessages?: Record<string, BranchMessage[]>
  onBranchCreated?: (branches: Branch[]) => void
}

interface UseBranchManagerReturn {
  // State
  branches: Branch[]
  currentBranchId: string | null
  messages: Record<string, BranchMessage[]>
  isCreatingBranch: boolean
  branchCreationModal: BranchState['branchCreationModal']

  // Branch management
  createBranches: (config: BranchCreationConfig, parentMessageId: string) => Promise<void>
  switchBranch: (branchId: string) => void
  deleteBranch: (branchId: string) => Promise<void>
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>

  // Modal management
  openBranchCreationModal: (parentMessageId: string) => void
  closeBranchCreationModal: () => void
  updateBranchCreationConfig: (config: Partial<BranchCreationConfig>) => void

  // Messages
  addMessageToBranch: (branchId: string, message: Omit<BranchMessage, 'id' | 'timestamp'>) => void
  getMessagesForBranch: (branchId: string) => BranchMessage[]

  // Utilities
  generateBranchConfig: (branchCount: number) => BranchCreationConfig
}

export const useBranchManager = ({
  chatId,
  initialBranches = [],
  initialMessages = {},
  onBranchCreated,
}: UseBranchManagerProps): UseBranchManagerReturn => {
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

  const generateBranchConfig = useCallback((branchCount: number): BranchCreationConfig => {
    const branches = Array.from({ length: branchCount }, (_, index) => ({
      name: `Branch ${index + 1}`,
      color: DEFAULT_BRANCH_COLORS[index % DEFAULT_BRANCH_COLORS.length],
      question: '',
    }))

    return {
      branchCount,
      branches,
      metadata: {
        purpose: '',
        tags: [],
        priority: 'medium' as const,
      },
    }
  }, [])

  const generateAIResponse = useCallback(async (branchId: string, userQuestion: string) => {
    try {
      // Create typing message
      const typingMessage: BranchMessage = {
        id: `msg_${Date.now()}_typing_${branchId}`,
        branchId,
        parentMessageId: null,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { isTyping: true },
      }

      // Add typing message
      setMessages(prev => ({
        ...prev,
        [branchId]: [...(prev[branchId] || []), typingMessage],
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

          // Update the typing message with accumulated content
          setMessages(prev => ({
            ...prev,
            [branchId]: prev[branchId]?.map(msg =>
              msg.id === typingMessage.id
                ? { ...msg, content: accumulatedContent, metadata: { isTyping: false } }
                : msg
            ) || [],
          }))
        },
        onComplete: (fullContent: string) => {
          // Final update to ensure we have the complete message
          setMessages(prev => ({
            ...prev,
            [branchId]: prev[branchId]?.map(msg =>
              msg.id === typingMessage.id
                ? { ...msg, content: fullContent, metadata: { isTyping: false } }
                : msg
            ) || [],
          }))
        },
        onError: (error: string) => {
          console.error('AI response error for branch:', branchId, error)
          // Replace typing message with error message
          setMessages(prev => ({
            ...prev,
            [branchId]: prev[branchId]?.map(msg =>
              msg.id === typingMessage.id
                ? { ...msg, content: `エラーが発生しました: ${error}`, metadata: { isTyping: false } }
                : msg
            ) || [],
          }))
        },
      })
    } catch (error) {
      console.error('Failed to generate AI response for branch:', branchId, error)
    }
  }, [])

  const createBranches = useCallback(
    async (config: BranchCreationConfig, parentMessageId: string) => {
      setIsCreatingBranch(true)

      try {
        const newBranches: Branch[] = []

        for (let i = 0; i < config.branches.length; i++) {
          const branchConfig = config.branches[i]
          const newBranch: Branch = {
            id: `branch_${Date.now()}_${i}`,
            chatId,
            parentBranchId: currentBranchId,
            name: branchConfig.name,
            color: branchConfig.color,
            isActive: i === 0, // First branch becomes active
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: config.metadata,
          }

          newBranches.push(newBranch)

          // If there's a question, add it as the first message and generate AI response
          if (branchConfig.question.trim()) {
            const userMessage: BranchMessage = {
              id: `msg_${Date.now()}_user_${i}`,
              branchId: newBranch.id,
              parentMessageId: parentMessageId,
              content: branchConfig.question,
              role: 'user',
              timestamp: new Date(),
              metadata: {},
            }

            // Add user message immediately
            setMessages(prev => ({
              ...prev,
              [newBranch.id]: [userMessage],
            }))

            // Generate AI response for this branch (fire and forget)
            generateAIResponse(newBranch.id, branchConfig.question).catch(error => {
              console.error(`Failed to generate AI response for branch ${newBranch.id}:`, error)
            })
          }
        }

        // Add new branches to state
        setBranches(prev => [...prev, ...newBranches])

        // Switch to the first new branch
        if (newBranches.length > 0) {
          setCurrentBranchId(newBranches[0].id)
        }

        // Close modal
        closeBranchCreationModal()

        // Notify parent component
        onBranchCreated?.(newBranches)

        // Navigate to branch view
        router.push(`/chat/${chatId}/branch`)
      } catch (error) {
        console.error('Failed to create branches:', error)
        throw error
      } finally {
        setIsCreatingBranch(false)
      }
    },
    [chatId, currentBranchId]
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

  const closeBranchCreationModal = useCallback(() => {
    setBranchCreationModal({
      isOpen: false,
      parentMessageId: null,
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

    // Modal management
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,

    // Messages
    addMessageToBranch,
    getMessagesForBranch,

    // Utilities
    generateBranchConfig,
  }
}
