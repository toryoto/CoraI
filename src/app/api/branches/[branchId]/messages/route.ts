import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/branches/[branchId]/messages - ブランチのメッセージを取得
export async function GET(request: NextRequest, { params }: { params: { branchId: string } }) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        branchId: params.branchId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
    })

    // isTypingをmetadataに含めて返す
    const messagesWithMetadata = messages.map(msg => ({
      ...msg,
      metadata: {
        ...(typeof msg.metadata === 'object' && msg.metadata !== null ? msg.metadata : {}),
        isTyping: msg.isTyping,
      },
    }))

    return NextResponse.json(messagesWithMetadata)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/branches/[branchId]/messages - 新しいメッセージを作成
export async function POST(request: NextRequest, { params }: { params: { branchId: string } }) {
  try {
    const body = await request.json()
    const { content, role, modelUsed, tokenCount, isTyping } = body

    const message = await prisma.message.create({
      data: {
        branchId: params.branchId,
        content,
        role,
        modelUsed,
        tokenCount,
        isTyping: isTyping || false,
      },
    })

    // ブランチとチャットの更新日時を更新
    await prisma.branch
      .update({
        where: { id: params.branchId },
        data: { updatedAt: new Date() },
        include: {
          chat: true,
        },
      })
      .then(branch => {
        return prisma.chat.update({
          where: { id: branch.chatId },
          data: { updatedAt: new Date() },
        })
      })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
