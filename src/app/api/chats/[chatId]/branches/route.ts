import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// POST /api/chats/[chatId]/branches - 新しいブランチを作成
export async function POST(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = params
    const body = await request.json()
    const { name, parentBranchId } = body

    // チャットの存在確認
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // 親ブランチの存在確認（nullでない場合）
    if (parentBranchId) {
      const parentBranch = await prisma.branch.findFirst({
        where: { id: parentBranchId, chatId },
      })

      if (!parentBranch) {
        return NextResponse.json({ error: 'Parent branch not found' }, { status: 404 })
      }
    }

    // ブランチを作成
    const branch = await prisma.branch.create({
      data: {
        chatId,
        name,
        parentBranchId,
      },
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Failed to create branch:', error)
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}

// GET /api/chats/[chatId]/branches - チャットのブランチ一覧を取得
export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = params

    // チャットの存在確認
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // ブランチとメッセージを取得
    const branches = await prisma.branch.findMany({
      where: { chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(branches)
  } catch (error) {
    console.error('Failed to fetch branches:', error)
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}
