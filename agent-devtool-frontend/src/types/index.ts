export type Protocol = 'rest' | 'a2a';
export type StreamingMode = 'sse' | 'http';

// Re-export AgentConfig
export type { AgentConfig } from './agent';

// Re-export Profile types
export type { Profile, ProfileStorage } from './profile';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isLoading?: boolean;
}

export interface ChatSettings {
  protocol: Protocol;
  streaming: StreamingMode;
  agentId: string;
}

export interface RestChatResponse {
  message: string;
  contextId: string;
  agent: string;
}

export interface A2AResponse {
  jsonrpc: string;
  id: string;
  result: {
    kind: string;
    role: string;
    parts: Array<{ kind: string; text: string }>;
    messageId: string;
    contextId: string;
  };
}

export interface DebugInfo {
  timestamp: Date;
  method: string;
  url: string;
  requestBody: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  error?: string;
  duration?: number;
}
