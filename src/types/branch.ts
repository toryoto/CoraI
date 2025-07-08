type Priority = 'high' | 'medium' | 'low'
type MessageRole = 'user' | 'assistant' | 'system'

interface BaseMetadata {
  purpose?: string
  tags?: string[]
  priority?: Priority
}

export interface Branch {
  id: string
  chatId: string
  parentBranchId: string | null
  name: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  metadata?: BaseMetadata
}

export interface BranchMessage {
  id: string
  branchId: string
  parentMessageId: string | null
  content: string
  role: MessageRole
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface BranchConfig {
  name: string
  color: string
  question: string
}

export interface BranchCreationConfig {
  branchCount: number
  branches: BranchConfig[]
  metadata?: BaseMetadata
}

interface BranchCreationModal {
  isOpen: boolean
  parentMessageId: string | null
  parentMessage?: { id: string; content: string; role: string }
  config: BranchCreationConfig
}

export interface BranchState {
  branches: Branch[]
  currentBranchId: string | null
  messages: Record<string, BranchMessage[]>
  isCreatingBranch: boolean
  branchCreationModal: BranchCreationModal
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
