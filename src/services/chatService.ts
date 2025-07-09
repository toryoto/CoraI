// ServiceはAPI通信をするため、フックは状態管理をするため
export interface ChatListItem {
  id: string
  title: string
  updatedAt: Date
  preview: string
}

export interface CreateChatResponse {
  chatId: string
  mainBranchId: string
}

export interface ChatResponse {
  id: string
  title: string
  updatedAt: string
  mainBranchId: string
  branches?: Array<{
    messages?: Array<{
      content: string
    }>
  }>
}

class ChatService {
  private baseUrl = '/api/chats'

  async fetchChats(): Promise<ChatListItem[]> {
    try {
      const response = await fetch(this.baseUrl)

      if (!response.ok) {
        if (response.status === 401) {
          return []
        }
        throw new Error(`Failed to fetch chats: ${response.statusText}`)
      }

      const data: ChatResponse[] = await response.json()

      return data.map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: new Date(chat.updatedAt),
        preview: chat.branches?.[0]?.messages?.[0]?.content?.slice(0, 50) || '',
      }))
    } catch (error) {
      console.error('Error fetching chats:', error)
      throw error
    }
  }

  async createChat(title: string = '新しいチャット'): Promise<CreateChatResponse | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          return null
        }
        throw new Error(`Failed to create chat: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        chatId: data.id,
        mainBranchId: data.mainBranchId,
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${chatId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  async renameChat(chatId: string, newTitle: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) {
        throw new Error(`Failed to rename chat: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error renaming chat:', error)
      throw error
    }
  }

  async getChat(chatId: string): Promise<ChatResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${chatId}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to get chat: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting chat:', error)
      throw error
    }
  }
}

export const chatService = new ChatService()
