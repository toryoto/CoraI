'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageComponent, type Message } from './message'
import { SendIcon, StopCircleIcon, GitBranch, Network } from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown'

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
  placeholder = 'マークダウンでメッセージを入力してください...',
  disabled = false,
  onBranch,
  currentBranch,
  onViewBranches,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    // You might want to show a toast here
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-coral-gradient">
                CoraI
                {currentBranch && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    • {currentBranch.name}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="w-3 h-3 rounded-full shadow-sm"
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
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
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
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
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
              <h2 className="text-xl font-medium bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-2">
                CoraIへようこそ
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                複数の観点を並行して考えることで、より深い洞察を得ることができます。
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg text-left border border-blue-100 dark:border-blue-800">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    例: ビジネス戦略の検討
                  </div>
                  <div className="text-blue-600 dark:text-blue-300">
                    市場分析、競合分析、リスク評価を同時に進める
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-950 dark:to-green-950 rounded-lg text-left border border-teal-100 dark:border-teal-800">
                  <div className="font-medium text-teal-800 dark:text-teal-200 mb-1">
                    例: 研究調査
                  </div>
                  <div className="text-teal-600 dark:text-teal-300">
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

      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50/50 via-cyan-50/50 to-teal-50/50 border-t border-blue-100 dark:border-blue-800">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-2">
            <div className="flex-1">
              <MarkdownEditor
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isGenerating}
                className="shadow-sm hover:shadow-md transition-shadow"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isGenerating}
              size="icon"
              className="h-12 w-12 rounded-xl bg-coral-gradient hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Enterで送信、Shift+Enterで改行、ツールバーでマークダウン編集
          </div>
        </div>
      </div>
    </div>
  )
}
