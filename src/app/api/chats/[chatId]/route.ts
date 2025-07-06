import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// GET /api/chats/[chatId] - 特定のチャットを取得
export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId,
      },
      include: {
        branches: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to fetch chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

// PATCH /api/chats/[chatId] - チャットを更新
export async function PATCH(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    const result = await prisma.chat.updateMany({
      where: {
        id: params.chatId,
        userId,
      },
      data: { title },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update chat:', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

// DELETE /api/chats/[chatId] - チャットを削除
export async function DELETE(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.chat.deleteMany({
      where: {
        id: params.chatId,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
