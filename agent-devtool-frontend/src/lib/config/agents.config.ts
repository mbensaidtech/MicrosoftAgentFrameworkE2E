/**
 * Agent Configuration - Profile-Based
 * 
 * Agents are now managed per profile.
 * Use ProfileService to get agents for the current profile.
 */

import type { AgentConfig } from '../../types';

// Re-export for backward compatibility
export type { AgentConfig };

/**
 * Helper functions that work with agent arrays
 * These should be called with agents from the current profile
 */

/**
 * Get agent by id from agent array
 */
export function getAgentById(agents: AgentConfig[], id: string): AgentConfig | undefined {
  return agents.find(agent => agent.id === id);
}

/**
 * Get all enabled agents from agent array
 */
export function getEnabledAgents(agents: AgentConfig[]): AgentConfig[] {
  return agents.filter(agent => agent.enabled);
}

/**
 * Get all agent ids from agent array
 */
export function getAgentIds(agents: AgentConfig[]): string[] {
  return agents.map(agent => agent.id);
}
