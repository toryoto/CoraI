import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// GET /api/chats - 全チャットを取得
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        branches: {
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

// POST /api/chats - 新しいチャットを作成
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title = '新しいチャット' } = body

    const chat = await prisma.chat.create({
      data: {
        userId,
        title,
        branches: {
          create: {
            name: 'メインブランチ',
          },
        },
      },
      include: {
        branches: true,
      },
    })

    // mainBranchIdを取得
    const mainBranch = chat.branches[0]
    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      branches: chat.branches,
      mainBranchId: mainBranch ? mainBranch.id : null,
    })
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
