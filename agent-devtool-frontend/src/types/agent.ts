export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  supportsStreaming: boolean;
  restPath: string;
  a2aPath: string;
  presetQuestions?: string[];
}
