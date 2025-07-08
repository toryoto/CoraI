import { useState, useCallback } from 'react'
import { BranchCreationConfig, BranchState, DEFAULT_BRANCH_CONFIG } from '@/types/branch'

export const useBranchCreationModal = () => {
  const [branchCreationModal, setBranchCreationModal] = useState<BranchState['branchCreationModal']>({
    isOpen: false,
    parentMessageId: null,
    config: DEFAULT_BRANCH_CONFIG,
  })

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

  return {
    branchCreationModal,
    openBranchCreationModal,
    closeBranchCreationModal,
    updateBranchCreationConfig,
    setBranchCreationModal,
  }
}