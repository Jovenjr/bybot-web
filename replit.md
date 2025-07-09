n# AI Trading Assistant with MCP Integration

## Overview

This is a full-stack TypeScript application that provides an AI trading assistant with Model Context Protocol (MCP) integration. The app features a modern React frontend with a Node.js/Express backend, enabling real-time chat interactions with AI and integration with external trading data sources through MCP connections.

## User Preferences

Preferred communication style: Simple, everyday language.
- Wants a simple AI chat interface without complex features
- Prefers a clean, trading-themed design
- Focus on chat functionality with OpenAI integration
- Needs sidebar menu for MCP server management
- Wants visible, well-designed buttons for chat actions
- Requires model selection capability (GPT-4o, GPT-4o Mini, GPT-4 Turbo)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom trading-themed design system
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Real-time Communication**: WebSocket integration for live chat updates
- **AI Integration**: OpenAI SDK with GPT-4o model for conversational AI
- **External Integrations**: MCP (Model Context Protocol) client for connecting to trading data sources

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless connection
- **Schema Management**: Drizzle migrations in `./migrations`
- **In-Memory Fallback**: Memory storage implementation for development

## Key Components

### Database Schema
- **Users**: Basic user authentication with username/password
- **MCP Connections**: Configuration for external data sources (stdio/http types)
- **Chat Messages**: Conversation history with token tracking and MCP correlation

### AI Service Integration
- **OpenAI Service**: GPT-4o integration with streaming support
- **Context Management**: System prompts tailored for trading assistance
- **Token Tracking**: Cost monitoring and usage analytics

### MCP Client System
- **Connection Types**: Support for both stdio and HTTP-based MCP servers
- **Real-time Status**: Live connection monitoring with latency tracking
- **Event-Driven**: WebSocket-based status updates and message handling

### Frontend Components
- **Chat Interface**: Modern chat UI with message bubbles and typing indicators
- **Sidebar**: MCP connection status and management panel
- **Real-time Updates**: WebSocket integration for live data and status updates

## Data Flow

1. **User Message**: User types message in chat interface
2. **WebSocket Transmission**: Message sent via WebSocket to backend
3. **AI Processing**: OpenAI service processes message with trading context
4. **MCP Integration**: Relevant MCP servers queried for market data
5. **Response Generation**: AI generates response with real-time data
6. **Stream Response**: Response streamed back to frontend via WebSocket
7. **UI Updates**: Chat interface updates with new message and typing states

## External Dependencies

### Core Dependencies
- **AI/ML**: OpenAI SDK, Vercel AI SDK for streaming
- **Database**: Drizzle ORM, Neon Database driver
- **UI**: Radix UI primitives, Tailwind CSS, date-fns
- **Communication**: WebSocket, express session management
- **Development**: Vite, TypeScript, ESBuild

### Trading Integration
- **MCP Protocol**: Custom MCP client for external trading data
- **Real-time Data**: WebSocket connections to trading APIs
- **Session Management**: PostgreSQL session store for user persistence

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR for frontend
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Drizzle push for schema synchronization

### Production Build
- **Frontend**: Vite build with static asset optimization
- **Backend**: ESBuild bundling for optimized Node.js deployment
- **Database**: Drizzle migrations for production schema management

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **AI**: `OPENAI_API_KEY` for OpenAI service access
- **Session**: Secure session management with PostgreSQL store

The application is designed as a modern, scalable trading assistant that can integrate with multiple data sources while providing a responsive, real-time user experience through WebSocket communications and AI-powered responses.