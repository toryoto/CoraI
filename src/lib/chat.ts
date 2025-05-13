import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function initializeChat() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('認証されていません')
  }
  
  // ユーザーを取得
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })
  
  if (!user) {
    throw new Error('ユーザーが見つかりません')
  }
  
  // 新しいThreadを作成
  const thread = await prisma.thread.create({
    data: {
      userId: user.id,
      title: '新しいチャット' // 後で最初のメッセージに基づいて更新可能
    }
  })
  
  // デフォルトの会話を作成
  const conversation = await prisma.conversation.create({
    data: {
      threadId: thread.id,
      isDefault: true
    }
  })
  
  return { threadId: thread.id, conversationId: conversation.id }
}

export async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: any) {
  let contentString: string
  
  if (Array.isArray(content)) {
    contentString = content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('')
  } else if (typeof content === 'object' && content !== null) {
    // オブジェクトの場合はJSONに変換
    contentString = JSON.stringify(content)
  } else {
    // 既に文字列の場合はそのまま使用
    contentString = String(content)
  }
  
  // 現在の会話の最新シーケンス番号を取得
  const lastMessage = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { sequence: 'desc' },
  })
  
  const sequence = lastMessage ? lastMessage.sequence + 1 : 1
  
  // メッセージを保存
  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content: contentString,
      sequence
    }
  })
  
  // 最初のメッセージの場合、Threadのタイトルを更新する
  if (sequence === 1 && role === 'user') {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { thread: true }
    })
    
    if (conversation?.isDefault) {
      // 最初のメッセージの内容からタイトルを生成
      const title = contentString.length > 30 ? `${contentString.substring(0, 30)}...` : contentString
      
      await prisma.thread.update({
        where: { id: conversation.threadId },
        data: { title }
      })
    }
  }
  
  return message
}

export async function getThreadsByUser(userId: string) {
  return prisma.thread.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getConversation(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { sequence: 'asc' }
      }
    }
  })
}

export async function getConversationByThread(threadId: string) {
  return prisma.conversation.findFirst({
    where: { threadId, isDefault: true },
    include: {
      messages: {
        orderBy: { sequence: 'asc' }
      }
    }
  })
}