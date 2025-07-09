# Chat Service

The chat service provides a centralized way to interact with the chat API endpoints.

## Usage

### Direct Service Usage

```typescript
import { chatService } from '@/services/chatService'

// Fetch all chats
const chats = await chatService.fetchChats()

// Create a new chat
const result = await chatService.createChat('My New Chat')
// result: { chatId: string, mainBranchId: string }

// Delete a chat
await chatService.deleteChat(chatId)

// Rename a chat
await chatService.renameChat(chatId, 'New Title')

// Get a single chat
const chat = await chatService.getChat(chatId)
```

### Using Hooks

For React components, prefer using the provided hooks:

```typescript
import { useChatList } from '@/hooks/useChatList'
import { useChat } from '@/hooks/useChat'

// Use chat list hook
const {
  chats,
  activeChat,
  loading,
  fetchChats,
  createNewChat,
  deleteChat,
  renameChat,
  selectChat,
  updateChatPreview,
} = useChatList()

// Use single chat hook
const { chat, loading, error, refetch } = useChat(chatId)
```

## Benefits

1. **Centralized API logic**: All chat-related API calls are in one place
2. **Type safety**: Strongly typed interfaces for all data structures
3. **Error handling**: Consistent error handling across the application
4. **Reusability**: Service can be used anywhere in the application
5. **Testability**: Easy to mock for unit tests
