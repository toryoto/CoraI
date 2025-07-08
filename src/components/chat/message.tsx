'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  MoreHorizontalIcon,
  GitBranchIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isTyping?: boolean
  isStreaming?: boolean
}

export interface MessageProps {
  message: Message
  onCopy?: (content: string) => void
  onBranch?: (messageId: string) => void
  onLike?: (messageId: string) => void
  onDislike?: (messageId: string) => void
  showActions?: boolean
}

export function MessageComponent({
  message,
  onCopy,
  onBranch,
  onLike,
  onDislike,
  showActions = true,
}: MessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content)
    } else {
      navigator.clipboard.writeText(message.content)
    }
  }

  return (
    <div
      className={cn(
        'group flex w-full py-4 px-6 transition-colors',
        isUser ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-900/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex w-full max-w-4xl mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-4">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              isUser ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
            )}
          >
            {isUser ? 'You' : 'AI'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isUser ? 'You' : 'CoraI'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {message.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {message.isTyping ? (
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">入力中...</span>
              </div>
            ) : (
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && !message.isTyping && (
            <div
              className={cn(
                'flex items-center space-x-2 mt-3 transition-opacity',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
                <CopyIcon className="h-3 w-3 mr-1" />
                コピー
              </Button>

              {!isUser && onBranch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBranch(message.id)}
                  className="h-8 px-2"
                >
                  <GitBranchIcon className="h-3 w-3 mr-1" />
                  分岐
                </Button>
              )}

              {!isUser && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLike?.(message.id)}
                    className="h-8 px-2"
                  >
                    <ThumbsUpIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDislike?.(message.id)}
                    className="h-8 px-2"
                  >
                    <ThumbsDownIcon className="h-3 w-3" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontalIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
