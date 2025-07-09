import { useState, useCallback, useEffect, useMemo } from 'react'
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
import { apiRequest } from '@/lib/utils'
import { useBranchCreationModal } from '@/hooks/useBranchCreationModal'

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
  openBranchCreationModal: (
    parentMessageId: string,
    parentMessage?: { id: string; content: string; role: string }
  ) => void
  closeBranchCreationModal: () => void
  updateBranchCreationConfig: (config: Partial<BranchCreationConfig>) => void
  addMessageToBranch: (branchId: string, message: Omit<BranchMessage, 'id' | 'timestamp'>) => void
  addMessageToBranchWithDB: (
    branchId: string,
    message: Omit<BranchMessage, 'id' | 'timestamp'>
  ) => Promise<string | null>
  updateBranchMessage: (messageId: string, updates: Partial<BranchMessage>) => Promise<void>
  removeBranchMessage: (messageId: string) => Promise<void>
  fetchBranchMessages: (branchId: string) => Promise<void>
  fetchBranches: () => Promise<void>
  setMessages: (messages: Record<string, BranchMessage[]>) => void
  currentBranch: { id: string; name: string; color: string } | undefined
  generateBranchConfig: (branchCount: number) => BranchCreationConfig
  setBranches?: (branches: Branch[]) => void // Optional for internal use
}

type UseBranchManagerReturn = BranchManagerState & BranchManagerActions

// 型変換用のユーティリティ関数
const transformMessageUpdates = (
  updates: Partial<BranchMessage> & { isTyping?: boolean; isStreaming?: boolean }
): Partial<BranchMessage> => {
  const { isTyping, isStreaming, ...restUpdates } = updates
  
  if (isTyping === undefined && isStreaming === undefined) {
    return restUpdates
  }

  return {
    ...restUpdates,
    metadata: {
      ...(updates.metadata || {}),
      ...(isTyping !== undefined && { isTyping }),
      ...(isStreaming !== undefined && { isStreaming }),
    },
  }
}

// データ変換用のユーティリティ関数
const formatBranchData = (branch: any): Branch => ({
  id: branch.id,
  chatId: branch.chatId,
  parentBranchId: branch.parentBranchId,
  name: branch.name,
  color: branch.color || '#3b82f6',
  isActive: false,
  createdAt: new Date(branch.createdAt),
  updatedAt: new Date(branch.updatedAt),
  metadata: branch.metadata || {},
})

const formatMessageData = (msg: any): BranchMessage => ({
  id: msg.id,
  branchId: msg.branchId,
  parentMessageId: msg.parentMessageId,
  content: msg.content,
  role: msg.role,
  timestamp: new Date(msg.createdAt),
  metadata: {
    ...(msg.metadata || {}),
    isTyping: msg.metadata?.isTyping ?? false,
  },
})

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

  // useBranchCreationModalでモーダル管理
  const {
    branchCreationModal,
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,
    setBranchCreationModal,
  } = useBranchCreationModal()

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

          setMessages(prev => ({
            ...prev,
            [branchId]:
              prev[branchId]?.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: accumulatedContent, metadata: { isTyping: true } }
                  : msg
              ) || [],
          }))

          if (!window.streamingUpdateTimeout) {
            window.streamingUpdateTimeout = setTimeout(() => {
              apiRequest(`/api/messages/${aiMessageId}`, {
                method: 'PATCH',
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

          if (window.streamingUpdateTimeout) {
            clearTimeout(window.streamingUpdateTimeout)
            window.streamingUpdateTimeout = null
          }

          if (finalContent) {
            try {
              await apiRequest(`/api/messages/${aiMessageId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  content: finalContent,
                  isTyping: false,
                }),
              })

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

          if (window.streamingUpdateTimeout) {
            clearTimeout(window.streamingUpdateTimeout)
            window.streamingUpdateTimeout = null
          }

          try {
            await apiRequest(`/api/messages/${aiMessageId}`, {
              method: 'PATCH',
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
            setMessages(prev => ({
              ...prev,
              [branchId]:
                prev[branchId]?.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: errorContent, metadata: { isTyping: false } }
                    : msg
                ) || [],
            }))
          }
        },
      })
    } catch (error) {
      console.error('Failed to generate AI response for branch:', branchId, error)
      try {
        const existingMessages = messages[branchId] || []
        const typingAI = existingMessages.find(msg => 
          msg.role === 'assistant' && msg.metadata?.isTyping
        )
        
        if (typingAI) {
          await apiRequest(`/api/messages/${typingAI.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              isTyping: false,
            }),
          })
          
          setMessages(prev => ({
            ...prev,
            [branchId]:
              prev[branchId]?.map(msg =>
                msg.id === typingAI.id
                  ? { ...msg, metadata: { ...msg.metadata, isTyping: false } }
                  : msg
              ) || [],
          }))
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup typing state:', cleanupError)
      }
    }
  }, [])

  function getBaseBranch(
    branches: Branch[],
    initialBranches: Branch[],
    currentBranchId: string | null
  ): Branch | undefined {
    const branchList = branches.length > 0 ? branches : initialBranches
    let baseBranchId = currentBranchId
    if (!baseBranchId && branchList.length > 0) {
      baseBranchId = branchList[0].id
    }
    return branchList.find(b => b.id === baseBranchId)
  }

  const createBranches = useCallback(
    async (config: BranchCreationConfig, parentMessageId: string) => {
      setIsCreatingBranch(true)

      try {
        const newBranches: Branch[] = []
        const parentMessage = branchCreationModal.parentMessage

        const currentBranch = getBaseBranch(branches, initialBranches, currentBranchId)
        if (!currentBranch) throw new Error('分岐元ブランチが見つかりません')

        for (let i = 0; i < config.branches.length; i++) {
          const branchConfig = config.branches[i]
          const newBranchParentId = currentBranch.id

          const createdBranch = await apiRequest(`/api/chats/${chatId}/branches`, {
            method: 'POST',
            body: JSON.stringify({
              name: branchConfig.name,
              parentBranchId: newBranchParentId,
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

          if (parentMessage) {
            try {
              const savedParentMessage = await apiRequest(
                `/api/branches/${newBranch.id}/messages`,
                {
                  method: 'POST',
                  body: JSON.stringify({
                    content: parentMessage.content,
                    role: parentMessage.role,
                    isTyping: false,
                  }),
                }
              )

              const copiedMessage = createBranchMessage(
                {
                  branchId: newBranch.id,
                  role: parentMessage.role as 'user' | 'assistant',
                  parentMessageId: null,
                  content: savedParentMessage.content,
                },
                savedParentMessage
              )

              setMessages(prev => ({
                ...prev,
                [newBranch.id]: [copiedMessage],
              }))

              if (branchConfig.question.trim()) {
                const savedUserMessage = await apiRequest(
                  `/api/branches/${newBranch.id}/messages`,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      content: branchConfig.question,
                      role: 'user',
                      isTyping: false,
                    }),
                  }
                )

                const userMessage = createBranchMessage(
                  {
                    branchId: newBranch.id,
                    role: 'user',
                    parentMessageId: savedParentMessage.id,
                    content: savedUserMessage.content,
                  },
                  savedUserMessage
                )

                setMessages(prev => ({
                  ...prev,
                  [newBranch.id]: [...(prev[newBranch.id] || []), userMessage],
                }))

                generateAIResponse(newBranch.id, branchConfig.question).catch(error => {
                  console.error(`Failed to generate AI response for branch ${newBranch.id}:`, error)
                })
              } else if (parentMessage.role === 'user') {
                generateAIResponse(newBranch.id, parentMessage.content).catch(error => {
                  console.error(`Failed to generate AI response for branch ${newBranch.id}:`, error)
                })
              }
            } catch (error) {
              console.error('Error copying parent message:', error)
            }
          } else if (branchConfig.question.trim()) {
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

              setMessages(prev => ({
                ...prev,
                [newBranch.id]: [userMessage],
              }))

              generateAIResponse(newBranch.id, branchConfig.question).catch(error => {
                console.error(`Failed to generate AI response for branch ${newBranch.id}:`, error)
              })
            } catch (error) {
              console.error('Error saving user message:', error)
            }
          }
        }

        setBranches(prev => [...prev, ...newBranches])

        if (newBranches.length > 0) {
          setCurrentBranchId(newBranches[0].id)
          router.push(`/chat/${chatId}/branch/${newBranches[0].id}`)
        }

        closeBranchCreationModal()
        onBranchCreated?.(newBranches)
      } catch (error) {
        console.error('Failed to create branches:', error)
        throw error
      } finally {
        setIsCreatingBranch(false)
      }
    },
    [
      chatId,
      currentBranchId,
      branches,
      generateAIResponse,
      router,
      onBranchCreated,
      closeBranchCreationModal,
      branchCreationModal.parentMessage,
      initialBranches,
    ]
  )

  const switchBranch = useCallback((branchId: string) => {
    setCurrentBranchId(branchId)
    setBranches(prev =>
      prev.map(branch => ({
        ...branch,
        isActive: branch.id === branchId,
      }))
    )
  }, [])

  const deleteBranch = useCallback(
    async (branchId: string) => {
      // main判定はparentBranchIdで行う
      const branch = branches.find(b => b.id === branchId)
      if (branch && branch.parentBranchId === null) {
        throw new Error('Cannot delete main branch')
      }
      try {
        setBranches(prev => prev.filter(branch => branch.id !== branchId))
        setMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[branchId]
          return newMessages
        })
        if (currentBranchId === branchId) {
          // mainブランチ以外のどれかに切り替えるか、nullにする
          const remaining = branches.filter(b => b.id !== branchId)
          setCurrentBranchId(remaining.length > 0 ? remaining[0].id : null)
        }
      } catch (error) {
        console.error('Failed to delete branch:', error)
        throw error
      }
    },
    [currentBranchId, branches]
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

  const fetchBranches = useCallback(async () => {
    try {
      const branchesData = await apiRequest(`/api/chats/${chatId}/branches`)
      
      const formattedBranches: Branch[] = branchesData.map(formatBranchData)
      
      const messagesData: Record<string, BranchMessage[]> = {}
      branchesData.forEach((branch: any) => {
        messagesData[branch.id] = branch.messages.map(formatMessageData)
      })
      
      setBranches(formattedBranches)
      setMessages(messagesData)
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }, [chatId])

  const fetchBranchMessages = useCallback(async (branchId: string) => {
    try {
      const data = await apiRequest(`/api/branches/${branchId}/messages`)
      const formattedMessages = data.map(formatMessageData)

      setMessages(prev => {
        const localMessages = prev[branchId] || []
        const dbMessages = formattedMessages
        
        const mergedMessages = dbMessages.map((dbMsg: BranchMessage) => {
          const localMsg = localMessages.find(local => local.id === dbMsg.id)
          if (localMsg && localMsg.metadata?.isTyping && !dbMsg.metadata?.isTyping) {
            return dbMsg
          }
          return localMsg || dbMsg
        })

        const localOnlyMessages = localMessages.filter(local => 
          local.metadata?.isTyping && !dbMessages.find((db: BranchMessage) => db.id === local.id)
        )

        return {
          ...prev,
          [branchId]: [...mergedMessages, ...localOnlyMessages],
        }
      })
    } catch (error) {
      console.error('Failed to fetch branch messages:', error)
    }
  }, [])

  const addMessageToBranchWithDB = useCallback(
    async (branchId: string, message: Omit<BranchMessage, 'id' | 'timestamp'>) => {
      try {
        const data = await apiRequest(`/api/branches/${branchId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: message.content,
            role: message.role,
            modelUsed: message.role === 'assistant' ? 'gpt-4o-mini' : undefined,
            isTyping: message.metadata?.isTyping || false,
          }),
        })

        const newMessage: BranchMessage = {
          ...message,
          id: data.id,
          timestamp: new Date(data.createdAt),
        }

        setMessages(prev => ({
          ...prev,
          [branchId]: [...(prev[branchId] || []), newMessage],
        }))

        return data.id
      } catch (error) {
        console.error('Failed to add message to branch:', error)
        return null
      }
    },
    []
  )

  const updateBranchMessage = useCallback(
    async (messageId: string, updates: Partial<BranchMessage> & { isTyping?: boolean; isStreaming?: boolean }) => {
      try {
        const transformedUpdates = transformMessageUpdates(updates)

        await apiRequest(`/api/messages/${messageId}`, {
          method: 'PATCH',
          body: JSON.stringify(transformedUpdates),
        })

        setMessages(prev => ({
          ...Object.fromEntries(
            Object.entries(prev).map(([branchId, messages]) => [
              branchId,
              messages.map(msg =>
                msg.id === messageId ? { ...msg, ...transformedUpdates } : msg
              )
            ])
          )
        }))
      } catch (error) {
        console.error('Failed to update branch message:', error)
      }
    },
    []
  )

  const removeBranchMessage = useCallback(async (messageId: string) => {
    try {
      await apiRequest(`/api/messages/${messageId}`, { method: 'DELETE' })

      setMessages(prev => ({
        ...Object.fromEntries(
          Object.entries(prev).map(([branchId, messages]) => [
            branchId,
            messages.filter(msg => msg.id !== messageId)
          ])
        )
      }))
    } catch (error) {
      console.error('Failed to remove branch message:', error)
    }
  }, [])

  const currentBranch = useMemo(() => {
    if (currentBranchId) {
      const branch = branches.find(b => b.id === currentBranchId)
      if (branch) {
        return {
          id: branch.id,
          name: branch.name,
          color: branch.color,
        }
      }
    }
    return undefined
  }, [currentBranchId, branches])

  return {
    branches,
    currentBranchId,
    messages,
    isCreatingBranch,
    branchCreationModal,
    createBranches,
    switchBranch,
    deleteBranch,
    updateBranch,
    setBranches,
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,
    addMessageToBranch,
    addMessageToBranchWithDB,
    updateBranchMessage,
    removeBranchMessage,
    fetchBranchMessages,
    setMessages,
    fetchBranches,
    currentBranch,
    generateBranchConfig,
  }
}
