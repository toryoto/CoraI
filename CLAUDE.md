# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Project Architecture

This is a Next.js 14 application using the App Router with TypeScript and Tailwind CSS. The project follows a modern React architecture with shadcn/ui components.

### Key Structure

- **App Router**: Uses Next.js 14 App Router pattern in `src/app/`
- **Component Library**: Built with shadcn/ui components in `src/components/ui/`
- **Custom Hooks**: Separation of concerns with reusable hooks in `src/hooks/`
- **API Layer**: Clean API abstraction in `src/lib/chat-client.ts`
- **Styling**: Tailwind CSS with CSS variables for theming, supports dark mode
- **TypeScript**: Strict configuration with path aliases (`@/*` maps to `src/*`)

### UI Components

- Uses shadcn/ui component library (New York style)
- Components use Radix UI primitives with class-variance-authority for variants
- Tailwind CSS with custom color system using CSS variables
- Utility function `cn()` in `src/lib/utils.ts` for conditional class merging

### Current Features

- ChatGPT-style UI with sidebar for chat history management
- Full chat interface with message history and local storage persistence
- **OpenAI API integration with streaming responses**
- Collapsible sidebar with search functionality
- Message components with action buttons (copy, branch, like/dislike)
- Responsive design with dark mode support
- Auto-saving chat history to localStorage
- Real-time streaming chat responses from GPT-4o-mini
- Stop generation functionality
- Comprehensive error handling
- **Clerk authentication system**

### Configuration Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind configuration with custom theme
- `tsconfig.json` - TypeScript configuration with path aliases

## Development Notes

When adding new UI components, use the shadcn/ui CLI or follow the existing patterns in `src/components/ui/`. The project uses the "new-york" style variant with CSS variables for theming.

### Architecture Pattern

The application follows a clean architecture with separation of concerns:

- **Custom Hooks**: Business logic is extracted into reusable hooks
  - `useLocalStorage`: Generic localStorage persistence
  - `useChatManager`: Chat and message state management
  - `useAIChat`: AI API integration and streaming logic
- **API Layer**: `src/lib/chat-client.ts` provides clean interface to OpenAI API
- **Components**: Pure presentation components with minimal logic

### API Integration

- OpenAI API integration is implemented in `src/app/api/chat/route.ts`
- Client-side API wrapper in `src/lib/chat-client.ts` handles streaming responses
- Environment variable `OPENAI_API_KEY` must be set in `.env`
- Default model: GPT-4o-mini (configurable)
- Supports both streaming and non-streaming responses

## Branch/Fork Functionality (In Development)

### Overview

The application is implementing an innovative **chat branching system** that allows users to create parallel conversation threads without contaminating the main conversation context. This feature enables:

- **Context preservation**: Main conversation flow remains intact
- **Parallel exploration**: Multiple discussion threads simultaneously
- **Deep dive capability**: Explore specific topics without losing the main thread

### Architecture for Branching

#### Data Model

```typescript
interface Branch {
  id: string
  parentBranchId: string | null
  chatId: string
  name: string
  color: string
  isActive: boolean
  createdAt: Date
  metadata: {
    purpose: string
    tags: string[]
    priority: 'high' | 'medium' | 'low'
  }
}

interface Message {
  id: string
  branchId: string
  parentMessageId: string | null
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  metadata: Json
}
```

#### Branch Creation Flow

1. User hovers over AI message → Branch button (🔀) appears
2. Click branch button → Branch creation modal opens
3. Select branch type:
   - **Single**: One new question
   - **Multiple**: Multiple questions simultaneously
   - **Compare**: Same question with different approaches
   - **Explore**: AI-generated related questions
4. Configure branch settings (name, color, questions)
5. Create and execute branches in parallel
6. Visual feedback in React Flow diagram

#### UI Components

- **Branch Creation Modal**: Comprehensive branch configuration
- **React Flow Integration**: Visual representation of conversation trees
- **Dual View UI**: Chat view ⇄ Flow view toggle
- **Branch Management**: Switch between active branches
- **Parallel Processing**: Real-time progress of multiple branches

#### Technical Implementation

- **Independent Context**: Each branch maintains separate message history
- **Parallel API Calls**: Multiple OpenAI streams simultaneously
- **State Management**: Complex branch state with React hooks
- **Database Design**: PostgreSQL with branch/message relationships

### Development Phases

**Phase 1: Basic Branching (2 weeks)**

- Single branch creation and switching
- Basic UI implementation
- Database schema implementation

**Phase 2: Visualization (2 weeks)**

- React Flow integration
- Dual view UI (chat ⇄ flow)
- Branch color coding and visual feedback

**Phase 3: Advanced Features (2 weeks)**

- Multiple branch creation modal
- Parallel processing capability
- Branch comparison tools

**Phase 4: Optimization (1 week)**

- Performance optimization
- Mobile responsiveness
- Testing and error handling

### Key Files for Branch Implementation

- `src/hooks/useBranchManager.ts` - Branch state management
- `src/components/BranchCreationModal.tsx` - Branch creation UI
- `src/components/BranchVisualizer.tsx` - React Flow integration
- `src/lib/branch-client.ts` - Branch API abstraction
- `src/app/api/branches/` - Branch API endpoints
- `docs/branch-feature-requirements.md` - Complete requirements specification

### Next Steps for Development

1. **Database integration (PostgreSQL + Prisma)** - Required for branch persistence
2. **Branch creation modal implementation** - Core UI for branch management
3. **React Flow integration** - Visual conversation tree representation
4. **Parallel processing system** - Multiple AI conversations simultaneously
