"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Sidebar, type Chat } from "@/components/ui/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { type Message } from "@/components/chat/message"

// Mock data for development
const initialChats: Chat[] = [
  {
    id: "1",
    title: "ビジネス戦略の検討",
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    preview: "市場分析について教えて"
  },
  {
    id: "2",
    title: "技術的な質問",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    preview: "Next.jsの最新機能について"
  },
  {
    id: "3",
    title: "プロジェクト管理",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    preview: "効率的なワークフローの構築"
  }
]

const initialMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "msg-1",
      content: "市場分析について教えてください。特に競合分析の手法を知りたいです。",
      role: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: "msg-2",
      content: "市場分析と競合分析について説明します。\n\n**競合分析の主な手法:**\n\n1. **直接競合分析**\n   - 同じ市場セグメントで類似商品を提供する企業の分析\n   - 価格、機能、マーケティング戦略の比較\n\n2. **間接競合分析**\n   - 異なるアプローチで同じ顧客ニーズを満たす企業の分析\n   - 代替ソリューションの影響度評価\n\n3. **SWOT分析**\n   - 競合の強み（Strengths）、弱み（Weaknesses）、機会（Opportunities）、脅威（Threats）を評価\n\n4. **ポジショニングマップ**\n   - 価格と品質などの軸で競合他社をマッピング\n   - 市場での自社の立ち位置を可視化\n\nどの手法について詳しく知りたいですか？",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 28)
    }
  ],
  "2": [
    {
      id: "msg-3",
      content: "Next.js 14の新機能について教えてください。",
      role: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: "msg-4",
      content: "Next.js 14の主な新機能をご紹介します：\n\n**1. Server Actions (安定版)**\n- フォーム送信やサーバーサイド処理を簡単に実装\n- TypeScriptとの統合が改善\n\n**2. Turbopack (Alpha)**\n- 高速なバンドラーの改善\n- 開発時のビルド速度が大幅に向上\n\n**3. App Router の機能強化**\n- 並列ルーティング\n- インターセプティングルート\n- 部分的な先読み\n\n**4. 画像最適化の改善**\n- `next/image`の性能向上\n- 新しい画像形式への対応\n\n**5. メタデータAPIの拡張**\n- SEO対応の強化\n- 動的メタデータ生成の改善\n\n特に気になる機能はありますか？",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 2)
    }
  ]
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [activeChat, setActiveChat] = useState<string | undefined>()
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate unique IDs (simple implementation)
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Load from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('corai-chats')
    const savedMessages = localStorage.getItem('corai-messages')
    const savedActiveChat = localStorage.getItem('corai-active-chat')
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats)
        setChats(parsedChats.map((chat: Chat) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt)
        })))
      } catch (e) {
        console.error('Failed to parse saved chats:', e)
      }
    }
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        const processedMessages: Record<string, Message[]> = {}
        
        Object.entries(parsedMessages).forEach(([chatId, msgs]) => {
          processedMessages[chatId] = (msgs as Message[]).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })
        
        setMessages(processedMessages)
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
      }
    }
    
    if (savedActiveChat) {
      setActiveChat(savedActiveChat)
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('corai-chats', JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem('corai-messages', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('corai-active-chat', activeChat)
    }
  }, [activeChat])

  const handleNewChat = () => {
    const newChatId = generateId()
    const newChat: Chat = {
      id: newChatId,
      title: "新しいチャット",
      updatedAt: new Date(),
      preview: undefined
    }
    
    setChats(prev => [newChat, ...prev])
    setMessages(prev => ({ ...prev, [newChatId]: [] }))
    setActiveChat(newChatId)
  }

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId)
  }

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    setMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[chatId]
      return newMessages
    })
    
    if (activeChat === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId)
      setActiveChat(remainingChats.length > 0 ? remainingChats[0].id : undefined)
    }
  }

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date() }
        : chat
    ))
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return
    
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date()
    }
    
    // Add user message
    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), userMessage]
    }))
    
    // Update chat preview and timestamp
    setChats(prev => prev.map(chat => 
      chat.id === activeChat
        ? { 
            ...chat, 
            preview: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            updatedAt: new Date()
          }
        : chat
    ))
    
    // Simulate AI response
    setIsGenerating(true)
    
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        content: "申し訳ございませんが、現在はデモモードで動作しています。実際のAI機能は今後実装予定です。\n\nご質問: " + content,
        role: "assistant",
        timestamp: new Date()
      }
      
      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), aiMessage]
      }))
      
      setIsGenerating(false)
    }, 1000 + Math.random() * 2000)
  }

  const handleBranch = (messageId: string) => {
    // TODO: Implement branching functionality
    console.log('Branch from message:', messageId)
  }

  const currentMessages = activeChat ? messages[activeChat] || [] : []

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatInterface
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onBranch={handleBranch}
        />
      </div>
    </div>
  )
}
