export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  supportsStreaming: boolean;
  conversational: boolean;
  restPath: string;
  a2aPath: string;
  backendUrl?: string;
  presetQuestions?: string[];
}
