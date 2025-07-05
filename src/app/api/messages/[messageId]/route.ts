import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/messages/[messageId] - メッセージを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const body = await request.json()
    const { content, isTyping } = body

    const message = await prisma.message.update({
      where: { id: params.messageId },
      data: { 
        content: content !== undefined ? content : undefined,
        isTyping: isTyping !== undefined ? isTyping : undefined
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to update message:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

// DELETE /api/messages/[messageId] - メッセージを削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const message = await prisma.message.update({
      where: { id: params.messageId },
      data: { isDeleted: true }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to delete message:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}