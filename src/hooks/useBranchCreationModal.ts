import { useState, useCallback } from 'react'
import { BranchCreationConfig, BranchState, DEFAULT_BRANCH_CONFIG } from '@/types/branch'

export const useBranchCreationModal = () => {
  const [branchCreationModal, setBranchCreationModal] = useState<
    BranchState['branchCreationModal']
  >({
    isOpen: false,
    parentMessageId: null,
    parentMessage: undefined,
    config: DEFAULT_BRANCH_CONFIG,
  })

  const openBranchCreationModal = useCallback(
    (parentMessageId: string, parentMessage?: { id: string; content: string; role: string }) => {
      setBranchCreationModal({
        isOpen: true,
        parentMessageId,
        parentMessage,
        config: DEFAULT_BRANCH_CONFIG,
      })
    },
    []
  )

  const closeBranchCreationModal = useCallback(() => {
    setBranchCreationModal({
      isOpen: false,
      parentMessageId: null,
      parentMessage: undefined,
      config: DEFAULT_BRANCH_CONFIG,
    })
  }, [])

  const updateBranchCreationConfig = useCallback((configUpdate: Partial<BranchCreationConfig>) => {
    setBranchCreationModal(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdate },
    }))
  }, [])

  return {
    branchCreationModal,
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,
    setBranchCreationModal,
  }
}
