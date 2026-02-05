# Agent Dev Tool Backend

A .NET backend for the Agent Dev Tool that exposes a single Policy Agent with all the mechanics of agent creation from the AIAgentsBackend project.

## Overview

This backend is a simplified version of AIAgentsBackend that:
- Contains all the agent creation mechanics (factory, builders, configuration)
- Exposes only the **Policy Agent** via A2A protocol
- Uses the same architecture and patterns as AIAgentsBackend
- Supports vector store search for policy documents (return, refund, cancellation policies)

## Features

- ✅ **Policy Agent**: Expert agent for company policies (returns, refunds, cancellations)
- ✅ **Vector Store Integration**: MongoDB-based vector search for policy documents
- ✅ **A2A Protocol Support**: Exposes agent via Agent-to-Agent protocol
- ✅ **Context Management**: Secure context ID handling with HMAC-SHA256 signatures
- ✅ **MongoDB Persistence**: Chat history stored in MongoDB
- ✅ **Azure OpenAI Integration**: Uses Azure OpenAI for chat and embeddings

## Project Structure

```
agent-dev-tool-backend/
├── Agents/
│   ├── Builder/              # Fluent agent builders
│   ├── Configuration/        # Agent configuration classes
│   ├── Factory/              # Agent factory (only creates policy agent)
│   ├── Stores/               # MongoDB chat message store
│   └── Tools/                # Policy tools for the agent
├── Configuration/            # Application configuration classes
├── Controllers/              # HTTP REST API controllers
├── Data/
│   └── VectorStore/          # Policy JSON data files
├── Extensions/               # Service registration extensions
├── HostedServices/           # Vector store initialization
├── Middlewares/              # HTTP middleware for context handling
├── Models/                   # Data models
├── MongoDB/                  # Docker Compose for local MongoDB
│   └── docker-compose.yml    # MongoDB and Mongo Express setup
└── Services/                 # Business logic services
```

## Prerequisites

- .NET 10.0 SDK
- Docker and Docker Compose (for local MongoDB)
- Azure OpenAI resource with:
  - Chat deployment (e.g., gpt-4)
  - Embedding deployment (e.g., text-embedding-3-small)
- MongoDB instance (local via Docker or cloud)

## Configuration

### 1. Azure OpenAI Settings

Edit `appsettings.json`:

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://YOUR-RESOURCE.openai.azure.com/",
    "DefaultChatDeploymentName": "YOUR-DEPLOYMENT-NAME",
    "APIKey": "YOUR-API-KEY",
    "DefaultEmbeddingDeploymentName": "YOUR-EMBEDDING-DEPLOYMENT-NAME"
  }
}
```

### 2. MongoDB Settings

**For Local Docker (Default)**:
```json
{
  "MongoDB": {
    "ConnectionString": "mongodb://localhost:27017/?directConnection=true",
    "DatabaseName": "agent_dev_tool_db",
    "ChatMessageStoreCollectionName": "chat_history"
  }
}
```

**For Cloud MongoDB (MongoDB Atlas)**:
```json
{
  "MongoDB": {
    "ConnectionString": "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority",
    "DatabaseName": "agent_dev_tool_db",
    "ChatMessageStoreCollectionName": "chat_history"
  }
}
```

**Note**: If using local Docker, start MongoDB first:
```bash
cd MongoDB
docker-compose up -d
```

### 3. Vector Store Initialization

To initialize the vector store with policy data on startup, set:

```json
{
  "VectorStore": {
    "InitializeOnStartup": true
  }
}
```

**Note**: Only set this to `true` on first run or when re-indexing. After initialization, set it back to `false`.

## Running the Application

### 1. Start MongoDB (if using local Docker)

```bash
cd MongoDB
docker-compose up -d
```

This starts MongoDB on port `27017` and Mongo Express (web UI) on port `8081`.

**Mongo Express**: http://localhost:8081 (admin/admin)

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Update Configuration

Edit `appsettings.json` with your Azure OpenAI credentials:
- `AzureOpenAI:Endpoint`
- `AzureOpenAI:DefaultChatDeploymentName`
- `AzureOpenAI:APIKey`
- `AzureOpenAI:DefaultEmbeddingDeploymentName`

MongoDB connection is already configured for local Docker:
- Connection String: `mongodb://localhost:27017/?directConnection=true`
- Database Name: `agent_dev_tool_db`

### 4. Initialize Vector Store (Optional)

If this is the first run, you may want to initialize the vector store with policy data:

1. Set `VectorStore:InitializeOnStartup` to `true` in `appsettings.json`
2. Run the application (it will load policy data into MongoDB)
3. Set it back to `false` after initialization

### 5. Run the Application

```bash
dotnet run
```

### 6. Access the Policy Agent

The Policy Agent will be available at:
- **A2A Endpoint**: `http://localhost:5017/a2a/policyAgent`
- **Agent Card**: `http://localhost:5017/a2a/policyAgent/.well-known/agent`
- **HTTP REST (Non-streaming)**: `http://localhost:5017/api/agents/policy/chat`
- **HTTP REST (Streaming)**: `http://localhost:5017/api/agents/policy/stream`

## Agent Configuration

The Policy Agent is configured in `appsettings.json` under `AIAgents:Agents:policy`:

- **Name**: Policy Agent
- **Description**: Expert des politiques de l'entreprise
- **Tools**: 
  - `SearchReturnPolicy`: Searches return policy
  - `SearchRefundPolicy`: Searches refund policy
  - `SearchOrderCancellationPolicy`: Searches cancellation policy
- **Language**: French (ALWAYS RESPOND IN FRENCH)

## API Endpoints

### A2A Protocol

- **POST** `/a2a/policyAgent` - Chat with the policy agent
- **GET** `/a2a/policyAgent/.well-known/agent` - Agent card (A2A discovery)

### OpenAPI

- **GET** `/openapi/v1.json` - OpenAPI specification (Development only)

## Architecture

This backend follows the same architecture as AIAgentsBackend:

1. **Agent Factory Pattern**: `IAgentFactory` creates agents with their A2A cards
2. **Fluent Builders**: `FluentChatClientAgentBuilder` for building agents
3. **Vector Store Services**: MongoDB-based vector search for policy documents
4. **Middleware**: Context extraction and validation
5. **Configuration-Driven**: All agent settings in `appsettings.json`

## Differences from AIAgentsBackend

- **Single Agent**: Only exposes the Policy Agent (not translation, customer support, history, order, message formulator, or orchestrator)
- **Simplified Configuration**: No orchestrator tools configuration
- **Focused Use Case**: Designed specifically for policy-related queries

## Development

### Adding New Agents

To add more agents (while keeping the same structure):

1. Add agent configuration to `appsettings.json` under `AIAgents:Agents`
2. Add method to `IAgentFactory` interface
3. Implement in `AgentFactory` class
4. Expose in `Program.cs` using `app.MapA2A()`

### Modifying Policy Tools

Edit `Agents/Tools/PolicyTools.cs` to add or modify policy search tools.

### Updating Policy Data

Edit JSON files in `Data/VectorStore/`:
- `return-policy.json`
- `refund-policy.json`
- `order-cancellation-policy.json`

Then set `VectorStore:InitializeOnStartup` to `true` and restart the application.

## License

Same license as the parent project.

