import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/chats - 全チャットを取得
export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        branches: {
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
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
    const body = await request.json()
    const { title = "新しいチャット" } = body

    const chat = await prisma.chat.create({
      data: {
        title,
        branches: {
          create: {
            name: "メインブランチ"
          }
        }
      },
      include: {
        branches: true
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}