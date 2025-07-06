'use client'

import { useState, useCallback } from 'react'
import { BranchCreationConfig, DEFAULT_BRANCH_COLORS } from '@/types/branch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GitBranch } from 'lucide-react'

interface BranchCreationModalProps {
  isOpen: boolean
  onClose: () => void
  config: BranchCreationConfig
  onConfigChange: (config: Partial<BranchCreationConfig>) => void
  onCreateBranches: (config: BranchCreationConfig) => Promise<void>
  isCreating: boolean
}

export function BranchCreationModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onCreateBranches,
  isCreating,
}: BranchCreationModalProps) {
  const [step, setStep] = useState<'setup' | 'preview'>('setup')

  const handleBranchCountChange = useCallback(
    (value: string) => {
      const newCount = parseInt(value, 10)
      if (newCount >= 1 && newCount <= 5) {
        // Generate new branches array with the new count
        const newBranches = Array.from({ length: newCount }, (_, index) => {
          const existingBranch = config.branches[index]
          return {
            name: existingBranch?.name || `Branch ${index + 1}`,
            color:
              existingBranch?.color || DEFAULT_BRANCH_COLORS[index % DEFAULT_BRANCH_COLORS.length],
            question: existingBranch?.question || '',
          }
        })

        onConfigChange({
          branchCount: newCount,
          branches: newBranches,
        })
      }
    },
    [config.branches, onConfigChange]
  )

  const handleBranchChange = useCallback(
    (index: number, field: string, value: string) => {
      const newBranches = [...config.branches]
      newBranches[index] = {
        ...newBranches[index],
        [field]: value,
      }
      onConfigChange({ branches: newBranches })
    },
    [config.branches, onConfigChange]
  )

  const handleRemoveBranch = useCallback(
    (index: number) => {
      if (config.branches.length > 1) {
        const newBranches = config.branches.filter((_, i) => i !== index)
        onConfigChange({
          branchCount: newBranches.length,
          branches: newBranches,
        })
      }
    },
    [config.branches, onConfigChange]
  )

  const handleAddBranch = useCallback(() => {
    if (config.branches.length < 5) {
      const newBranch = {
        name: `Branch ${config.branches.length + 1}`,
        color: DEFAULT_BRANCH_COLORS[config.branches.length % DEFAULT_BRANCH_COLORS.length],
        question: '',
      }
      onConfigChange({
        branchCount: config.branches.length + 1,
        branches: [...config.branches, newBranch],
      })
    }
  }, [config.branches, onConfigChange])

  const handleCreateBranches = useCallback(async () => {
    try {
      await onCreateBranches(config)
      setStep('setup') // Reset to setup step
    } catch (error) {
      console.error('Failed to create branches:', error)
    }
  }, [config, onCreateBranches])

  const canProceed = config.branches.every(branch => branch.name.trim() && branch.question.trim())

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {step === 'setup' ? 'Create Branches' : 'Preview Branches'}
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6">
            {/* Branch Count Selection */}
            <div className="space-y-2">
              <Label htmlFor="branch-count">Number of branches</Label>
              <Select value={config.branchCount.toString()} onValueChange={handleBranchCountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch count" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1} {i + 1 === 1 ? 'branch' : 'branches'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Configuration */}
            <div className="space-y-4">
              <Label>Branch Configuration</Label>
              {config.branches.map((branch, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: branch.color }}
                      />
                      <span className="font-medium">Branch {index + 1}</span>
                    </div>
                    {config.branches.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBranch(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`branch-name-${index}`}>Name</Label>
                      <Input
                        id={`branch-name-${index}`}
                        value={branch.name}
                        onChange={e => handleBranchChange(index, 'name', e.target.value)}
                        placeholder="Branch name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`branch-color-${index}`}>Color</Label>
                      <div className="flex gap-2">
                        {DEFAULT_BRANCH_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              branch.color === color ? 'border-gray-400' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleBranchChange(index, 'color', color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`branch-question-${index}`}>Question</Label>
                    <Textarea
                      id={`branch-question-${index}`}
                      value={branch.question}
                      onChange={e => handleBranchChange(index, 'question', e.target.value)}
                      placeholder="Enter your question for this branch..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}

              {config.branches.length < 5 && (
                <Button
                  variant="outline"
                  onClick={handleAddBranch}
                  className="w-full border-dashed"
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Branches to create:</h3>
              <div className="space-y-3">
                {config.branches.map((branch, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: branch.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{branch.question}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 'setup' && (
            <Button onClick={() => setStep('preview')} disabled={!canProceed}>
              Next: Preview
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button onClick={handleCreateBranches} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Branches'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
