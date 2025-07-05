export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
}

export interface StreamingChatResponse {
  content: string
}

export class ChatAPI {
  static async sendMessage(
    messages: ChatMessage[],
    options: {
      stream?: boolean
      model?: string
      temperature?: number
      signal?: AbortSignal
      onStream?: (content: string) => void
      onComplete?: (fullContent: string) => void
      onError?: (error: string) => void
    } = {}
  ): Promise<string> {
    const {
      stream = true,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      signal,
      onStream,
      onComplete,
      onError
    } = options

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          stream
        }),
        signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        onError?.(errorMessage)
        throw new Error(errorMessage)
      }

      if (stream && response.body) {
        // Handle streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                
                if (data === '[DONE]') {
                  onComplete?.(fullContent)
                  return fullContent
                }

                try {
                  const parsed: StreamingChatResponse = JSON.parse(data)
                  if (parsed.content) {
                    fullContent += parsed.content
                    onStream?.(parsed.content)
                  }
                } catch {
                  // Skip invalid JSON lines
                  console.warn('Failed to parse streaming data:', data)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }

        onComplete?.(fullContent)
        return fullContent
      } else {
        // Handle non-streaming response
        const data: ChatResponse = await response.json()
        onComplete?.(data.content)
        return data.content
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onError?.(errorMessage)
      throw error
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
          max_tokens: 10
        })
      })

      return response.ok
    } catch {
      return false
    }
  }
}