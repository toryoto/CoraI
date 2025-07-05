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
- Collapsible sidebar with search functionality
- Message components with action buttons (copy, branch, like/dislike)
- Responsive design with dark mode support
- Auto-saving chat history to localStorage
- Demo mode with simulated AI responses
- TODO: Real AI API integration not yet implemented

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind configuration with custom theme
- `tsconfig.json` - TypeScript configuration with path aliases

## Development Notes

When adding new UI components, use the shadcn/ui CLI or follow the existing patterns in `src/components/ui/`. The project uses the "new-york" style variant with CSS variables for theming.

The chat page currently has placeholder logic for AI integration - the `handleSend` function in `src/app/chat/page.tsx` needs to be connected to an AI API service.