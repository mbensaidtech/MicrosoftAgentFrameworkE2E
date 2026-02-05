using A2A;
using Microsoft.Agents.AI;

namespace AgentDevToolBackend.Agents.Factory;

/// <summary>
/// Creates AI agents with their A2A cards.
/// </summary>
public interface IAgentFactory
{
    /// <summary>
    /// Creates a policy agent that handles return, refund, and cancellation policies.
    /// </summary>
    (ChatClientAgent Agent, AgentCard Card) GetPolicyAgent();
}

