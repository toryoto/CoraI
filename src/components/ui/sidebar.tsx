'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { PlusIcon, MessageSquareIcon, PenIcon, TrashIcon, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomUserButton } from '@/components/user-button'

export interface Chat {
  id: string
  title: string
  updatedAt: Date
  preview?: string
}

export interface SidebarProps {
  chats: Chat[]
  activeChat?: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
}

export function Sidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  isCollapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChat, setEditingChat] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const filteredChats = chats.filter(
    chat =>
      chat.title?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      chat.preview?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  )

  const handleRename = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim())
    }
    setEditingChat(null)
    setEditTitle('')
  }

  const startEditing = (chat: Chat) => {
    setEditingChat(chat.id)
    setEditTitle(chat.title)
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="w-8 h-8">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredChats.slice(0, 10).map(chat => (
            <Button
              key={chat.id}
              variant={activeChat === chat.id ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onSelectChat(chat.id)}
              className="w-full h-8"
            >
              <MessageSquareIcon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        {onToggleCollapsed && (
          <div className="p-2">
            <Button variant="ghost" size="icon" onClick={onToggleCollapsed} className="w-8 h-8">
              →
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CoraI</h2>
          {onToggleCollapsed && (
            <Button variant="ghost" size="icon" onClick={onToggleCollapsed} className="h-8 w-8">
              ←
            </Button>
          )}
        </div>
        <Button onClick={onNewChat} className="w-full justify-start" variant="default">
          <PlusIcon className="h-4 w-4 mr-2" />
          新しいチャット
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="チャットを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'チャットが見つかりません' : 'チャット履歴がありません'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map(chat => (
              <Card
                key={chat.id}
                className={cn(
                  'p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                  activeChat === chat.id &&
                    'bg-gray-100 dark:bg-gray-800 border-blue-200 dark:border-blue-800'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingChat === chat.id ? (
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(chat.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleRename(chat.id)
                          }
                          if (e.key === 'Escape') {
                            setEditingChat(null)
                            setEditTitle('')
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        className="h-6 text-sm font-medium"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {chat.title}
                      </h3>
                    )}
                    {chat.preview && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {chat.preview}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {chat.updatedAt.toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation()
                        startEditing(chat)
                      }}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PenIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation()
                        onDeleteChat(chat.id)
                      }}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* User Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <CustomUserButton />
      </div>
    </div>
  )
}
