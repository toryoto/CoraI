'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from './markdown-components'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link,
  Image as ImageIcon,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  EyeOff,
} from 'lucide-react'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'マークダウンでメッセージを入力してください...',
  disabled = false,
  className,
  onKeyDown,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const toolbarButtons = [
    {
      icon: Bold,
      label: '太字',
      action: () => insertText('**', '**'),
    },
    {
      icon: Italic,
      label: '斜体',
      action: () => insertText('*', '*'),
    },
    {
      icon: Heading1,
      label: '見出し1',
      action: () => insertText('# '),
    },
    {
      icon: Heading2,
      label: '見出し2',
      action: () => insertText('## '),
    },
    {
      icon: Heading3,
      label: '見出し3',
      action: () => insertText('### '),
    },
    {
      icon: List,
      label: '箇条書き',
      action: () => insertText('- '),
    },
    {
      icon: ListOrdered,
      label: '番号付きリスト',
      action: () => insertText('1. '),
    },
    {
      icon: Code,
      label: 'コード',
      action: () => insertText('`', '`'),
    },
    {
      icon: Quote,
      label: '引用',
      action: () => insertText('> '),
    },
    {
      icon: Link,
      label: 'リンク',
      action: () => insertText('[', '](url)'),
    },
    {
      icon: ImageIcon,
      label: '画像',
      action: () => insertText('![alt](', ')'),
    },
  ]

  return (
    <div
      className={cn(
        'border border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-blue-100 dark:border-blue-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              disabled={disabled}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title={button.label}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
        >
          {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showPreview ? '編集' : 'プレビュー'}
        </Button>
      </div>

      {/* Editor/Preview */}
      <div className="flex">
        {/* Editor */}
        <div
          className={cn(
            'flex-1',
            showPreview ? 'w-1/2 border-r border-blue-100 dark:border-blue-800' : 'w-full'
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 border-0 outline-none resize-none',
              'bg-transparent text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[120px] max-h-[200px]',
              'font-mono text-sm'
            )}
            rows={1}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 p-4 bg-gray-50 dark:bg-gray-800">
            <div className="prose dark:prose-invert max-w-none text-sm">
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {value}
                </ReactMarkdown>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  プレビューがここに表示されます
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
