import type { AgentConfig } from './agent';

export interface Profile {
  id: string;
  name: string;
  description?: string;
  color?: string; // Profile color for UI display
  createdAt: Date;
  updatedAt: Date;
  agents: AgentConfig[];
  backendUrl?: string;
  defaultProtocol?: 'rest' | 'a2a';
}

export interface ProfileStorage {
  profiles: Profile[];
  currentProfileId: string | null;
}
