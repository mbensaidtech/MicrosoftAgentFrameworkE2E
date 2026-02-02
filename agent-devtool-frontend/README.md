# Agent DevTool Frontend

A standalone React + TypeScript + Vite frontend for connecting and testing AI agents. This frontend is completely independent and can be used with any backend implementation.

## Features

- ✅ **Standalone & Reusable**: Use with any backend (Node.js, .NET, Python, etc.)
- ✅ **Profile-Based Configuration**: Create multiple profiles, each with its own agent configurations
- ✅ **Import/Export Profiles**: Export profiles (with all agents) to JSON and import them back
- ✅ **Easy Agent Configuration**: Add, enable, and disable agents via config file or UI
- ✅ **Multiple Protocols**: Supports REST and A2A protocols
- ✅ **Streaming Support**: Real-time streaming with Server-Sent Events (SSE)
- ✅ **Browser Storage**: Profiles stored in browser localStorage
- ✅ **Modern Stack**: React 19, TypeScript, Vite, Tailwind CSS
- ✅ **Type-Safe**: Full TypeScript support

## Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. Clone or copy this frontend folder
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your backend URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5016
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Configuration

### Environment Variables

Create a `.env.local` file (see `.env.example`):

- `VITE_API_BASE_URL`: Your backend API URL (required)
- `VITE_ENABLE_DEBUG`: Enable debug panel (optional, default: false)
- `VITE_DEFAULT_PROTOCOL`: Default protocol - 'rest' or 'a2a' (optional, default: 'rest')
- `VITE_USE_PROXY`: Use CORS proxy (optional, default: false)

### Profile Management

Profiles are stored in browser localStorage. Each profile contains:
- Profile name and description
- List of agents with their configurations
- Backend URL and default protocol settings

**Import/Export:**
- **Export Profile**: Click the export icon on any profile card to download it as JSON
- **Export All**: Export all profiles at once
- **Import Profile**: Click "Import Profile" button to import a profile from JSON file
- Profiles can be shared between developers or used as backups

### Agent Configuration

Agents are managed per profile. You can:
1. **Via UI**: Add agents through the Agents page - they're automatically saved to the current profile
2. **Via Import**: Import a profile that already contains agents
3. **Programmatically**: Use ProfileService to add agents to a profile

Each profile has its own set of agents, allowing you to:
- Switch between different agent configurations
- Share profiles with other developers
- Backup your configurations

**Example Profile Export Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "name": "Development",
    "description": "Development environment",
    "agents": [
      {
        "id": "my-agent",
        "name": "My Custom Agent",
        "description": "My agent description",
        "enabled": true,
        "supportsStreaming": true,
        "restPath": "/api/agents/my-agent",
        "a2aPath": "/a2a/myAgent",
        "presetQuestions": ["What can you do?"]
      }
    ],
    "backendUrl": "http://localhost:5016",
    "defaultProtocol": "rest"
  }
}
```

## Project Structure

```
src/
├── components/      # React components
│   ├── chat/       # Chat interface components
│   ├── agents/     # Agent management components
│   ├── settings/   # Settings components
│   ├── debug/      # Debug panel components
│   ├── layout/     # Layout components
│   └── ui/         # Reusable UI components
├── lib/            # Core libraries
│   ├── api/        # API client functions
│   ├── config/     # Configuration files
│   ├── hooks/      # React hooks
│   ├── utils/      # Utility functions
│   └── store/      # State management
├── pages/          # Page components
├── types/          # TypeScript types
└── styles/        # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

## Backend API Contract

Your backend must implement these endpoints:

### REST API
- `POST /api/agents/{agentId}/chat` - Send message
- `POST /api/agents/{agentId}/stream` - Stream response (SSE)
- `GET /api/threads/{threadId}/messages` - Get thread messages

### A2A Protocol
- `POST /a2a/{agentId}Agent` - JSON-RPC 2.0 endpoint
- `POST /a2a/{agentId}Agent/v1/message:stream` - A2A streaming (SSE)

See the documentation for detailed API specifications.

## Development

This project uses:
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## License

MIT

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.
