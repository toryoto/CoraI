import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { initializeChat, saveMessage } from '@/lib/chat'

export const maxDuration = 30

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, conversationId: existingConversationId } = await req.json()
  
  // スレッドとコンバセーションのIDがない場合は新しく作成
  let conversationId = existingConversationId
  console.log('id', conversationId)
  if (!conversationId) {
    const { conversationId: newConversationId } = await initializeChat()
    conversationId = newConversationId
  }
  
  // ユーザーメッセージを保存
  const userMessage = messages[messages.length - 1]
  if (userMessage.role === 'user') {
    await saveMessage(conversationId, 'user', userMessage.content)
  }
  
  // AIの応答を生成
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    onFinish: async (response) => {
      await saveMessage(conversationId, 'assistant', response.text)
    },
  })
  
  // レスポンスヘッダーにconversationIdを含める（この会話のIDをクライアントに伝えて会話を続けられるようにする）
  const headers = new Headers()
  headers.append('X-Conversation-Id', conversationId)
  headers.append('Access-Control-Expose-Headers', 'X-Conversation-Id')
  
  // ストリーミングレスポンスを返す
  return result.toDataStreamResponse({ headers })
}