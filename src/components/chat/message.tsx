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
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '@/components/markdown'
import { useCurrentUser } from '@/hooks/useUser'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isTyping?: boolean
  isStreaming?: boolean
  branchId?: string
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
  const { imageUrl, displayName, initials } = useCurrentUser()

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
        isUser
          ? 'bg-transparent'
          : 'bg-gradient-to-r from-blue-50/30 via-cyan-50/30 to-teal-50/30 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex w-full max-w-4xl mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-4">
          {isUser ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-coral-gradient text-white shadow-md overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-md border border-blue-100 dark:border-blue-700">
              <Image
                src="/favicon/corai-icon.png"
                alt="CoraI"
                width={36}
                height={36}
                className="rounded-full"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {isUser ? displayName : 'CoraI'}
            </span>
            <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">
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
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-blue-500 ml-2">入力中...</span>
              </div>
            ) : (
              <div className="text-gray-800 dark:text-gray-200">
                {isUser ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                コピー
              </Button>

              {!isUser && onBranch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBranch(message.id)}
                  className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900"
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
                    className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                  >
                    <ThumbsUpIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDislike?.(message.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    <ThumbsDownIcon className="h-3 w-3" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreHorizontalIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
