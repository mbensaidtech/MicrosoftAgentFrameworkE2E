using AgentDevToolBackend.Agents.Factory;
using AgentDevToolBackend.Controllers.Base;
using Microsoft.Agents.AI;
using Microsoft.AspNetCore.Mvc;

namespace AgentDevToolBackend.Controllers;

/// <summary>
/// Controller for the Policy Agent.
/// Exposes the Policy Agent via HTTP endpoints with streaming and non-streaming support.
/// Inherits common chat/stream logic from ChatClientAgentControllerBase.
/// </summary>
[ApiController]
[Route("api/agents/policy")]
public class PolicyAgentController : ChatClientAgentControllerBase
{
    private readonly IAgentFactory agentFactory;

    public PolicyAgentController(IAgentFactory agentFactory)
    {
        this.agentFactory = agentFactory;
    }

    protected override string AgentName => "PolicyAgent";

    protected override ChatClientAgent GetAgent()
    {
        return agentFactory.GetPolicyAgent().Agent;
    }
}

