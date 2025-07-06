'use client'

import { GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BranchButtonProps {
  messageId: string
  onBranchClick: (messageId: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function BranchButton({
  messageId,
  onBranchClick,
  className,
  size = 'sm',
  variant = 'ghost',
}: BranchButtonProps) {
  const handleClick = () => {
    onBranchClick(messageId)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
        'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400',
        className
      )}
      title="Create branch from this message"
    >
      <GitBranch className="h-4 w-4" />
      <span className="ml-1 hidden sm:inline">Branch</span>
    </Button>
  )
}
