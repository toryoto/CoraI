'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageComponent, type Message } from './message'
import { SendIcon, StopCircleIcon, GitBranch, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => void | Promise<void>
  onStopGeneration?: () => void
  isGenerating?: boolean
  placeholder?: string
  disabled?: boolean
  onBranch?: (messageId: string) => void
  currentBranch?: {
    id: string
    name: string
    color: string
  }
  onViewBranches?: () => void
}

export function ChatInterface({
  messages,
  onSendMessage,
  onStopGeneration,
  isGenerating = false,
  placeholder = 'メッセージを入力してください...',
  disabled = false,
  onBranch,
  currentBranch,
  onViewBranches,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (input.trim() && !disabled && !isGenerating) {
      await onSendMessage(input.trim())
      setInput('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    // You might want to show a toast here
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                CoraI
                {currentBranch && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    • {currentBranch.name}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentBranch ? (
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    ブランチモード - 独立した会話スレッド
                  </span>
                ) : (
                  '知的生産性を高める会話アシスタント'
                )}
              </p>
            </div>
            {currentBranch && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentBranch.color }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {onViewBranches && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewBranches}
                className="flex items-center gap-2"
              >
                <Network className="h-4 w-4" />
                ツリービュー
              </Button>
            )}
            {isGenerating && onStopGeneration && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStopGeneration}
                className="text-red-600 hover:text-red-700"
              >
                <StopCircleIcon className="h-4 w-4 mr-1" />
                停止
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                CoraIへようこそ
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                複数の観点を並行して考えることで、より深い洞察を得ることができます。
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    例: ビジネス戦略の検討
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    市場分析、競合分析、リスク評価を同時に進める
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    例: 研究調査
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    異なる仮説を同時に検討し、総合的な結論を導く
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map(message => (
              <MessageComponent
                key={message.id}
                message={message}
                onCopy={handleCopy}
                onBranch={onBranch}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={placeholder}
                disabled={disabled || isGenerating}
                className={cn(
                  'w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl',
                  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'resize-none overflow-hidden',
                  'min-h-[48px] max-h-[200px]'
                )}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isGenerating}
              size="icon"
              className="h-12 w-12 rounded-xl"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Enterで送信、Shift+Enterで改行
          </div>
        </div>
      </div>
    </div>
  )
}
