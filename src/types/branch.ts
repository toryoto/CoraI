export interface Branch {
  id: string
  chatId: string
  parentBranchId: string | null
  name: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  metadata?: {
    purpose?: string
    tags?: string[]
    priority?: 'high' | 'medium' | 'low'
  }
}

export interface BranchMessage {
  id: string
  branchId: string
  parentMessageId: string | null
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface BranchCreationConfig {
  branchCount: number
  branches: Array<{
    name: string
    color: string
    question: string
  }>
  metadata?: {
    purpose?: string
    tags?: string[]
    priority?: 'high' | 'medium' | 'low'
  }
}

export interface BranchState {
  branches: Branch[]
  currentBranchId: string | null
  messages: Record<string, BranchMessage[]> // branchId -> messages
  isCreatingBranch: boolean
  branchCreationModal: {
    isOpen: boolean
    parentMessageId: string | null
    config: BranchCreationConfig
  }
}

export const DEFAULT_BRANCH_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
] as const

export const DEFAULT_BRANCH_CONFIG: BranchCreationConfig = {
  branchCount: 1,
  branches: [
    {
      name: 'Branch 1',
      color: DEFAULT_BRANCH_COLORS[0],
      question: '',
    },
  ],
  metadata: {
    purpose: '',
    tags: [],
    priority: 'medium',
  },
}
