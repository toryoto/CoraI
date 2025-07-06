import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const {
      messages,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      max_tokens = 2000,
      stream = true,
    } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Add system message if not present
    const systemMessage: ChatMessage = {
      role: 'system',
      content:
        'あなたはCoraI、知的生産性を高める会話アシスタントです。ユーザーの質問に対して、詳細で建設的な回答を提供してください。複数の観点から物事を分析し、MECEに整理された情報を提供することを心がけてください。',
    }

    const processedMessages = [systemMessage, ...messages.filter(msg => msg.role !== 'system')]

    if (stream) {
      // Streaming response
      const response = await openai.chat.completions.create({
        model,
        messages: processedMessages,
        temperature,
        max_tokens,
        stream: true,
      })

      // Create a readable stream
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`
                controller.enqueue(encoder.encode(data))
              }
            }
            // Send end signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            controller.error(error)
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } else {
      // Non-streaming response
      const response = await openai.chat.completions.create({
        model,
        messages: processedMessages,
        temperature,
        max_tokens,
        stream: false,
      })

      const content = response.choices[0]?.message?.content || ''

      return NextResponse.json({
        content,
        usage: response.usage,
        model: response.model,
      })
    }
  } catch (error) {
    console.error('OpenAI API error:', error)

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please check your OpenAI account.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
