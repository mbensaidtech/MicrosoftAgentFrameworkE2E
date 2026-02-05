using A2A;
using AgentDevToolBackend.Agents.Builder;
using AgentDevToolBackend.Agents.Configuration;
using AgentDevToolBackend.Agents.Tools;
using AgentDevToolBackend.Configuration;
using Azure.AI.OpenAI;
using Microsoft.Agents.AI;
using Microsoft.Extensions.Options;

namespace AgentDevToolBackend.Agents.Factory;

/// <summary>
/// Creates and configures AI agents with their A2A cards.
/// </summary>
public class AgentFactory : IAgentFactory
{
    private readonly AzureOpenAIClient azureClient;
    private readonly AzureOpenAISettings settings;
    private readonly AgentsConfiguration agentsConfig;
    private readonly IServiceProvider serviceProvider;

    public AgentFactory(
        AzureOpenAIClient azureClient,
        AzureOpenAISettings settings,
        IOptions<AgentsConfiguration> agentsConfig,
        IServiceProvider serviceProvider)
    {
        this.azureClient = azureClient;
        this.settings = settings;
        this.agentsConfig = agentsConfig.Value;
        this.serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Creates a policy agent that handles return, refund, and cancellation policies.
    /// </summary>
    public (ChatClientAgent Agent, AgentCard Card) GetPolicyAgent()
    {
        var config = GetConfig("policy");
        var tools = new PolicyTools(serviceProvider);

        var builder = new FluentChatClientAgentBuilder(azureClient, settings)
            .WithName(config.Name)
            .WithDescription(config.Description)
            .WithInstructions(config.Instructions)
            .WithTemperature(config.Temperature ?? 0.5f)
            .WithMaxOutputTokens(config.MaxOutputTokens ?? 1200)
            .WithToolFromMethod(tools.SearchReturnPolicyAsync, "SearchReturnPolicy")
            .WithToolFromMethod(tools.SearchRefundPolicyAsync, "SearchRefundPolicy")
            .WithToolFromMethod(tools.SearchOrderCancellationPolicyAsync, "SearchOrderCancellationPolicy");

        if (!string.IsNullOrWhiteSpace(config.ChatDeploymentName))
        {
            builder.WithDeployment(config.ChatDeploymentName);
        }

        var agent = builder.Build();
        var card = CreateAgentCard(config);

        return (agent, card);
    }

    private AgentConfiguration GetConfig(string agentId)
    {
        if (!agentsConfig.Agents.TryGetValue(agentId, out var config))
        {
            throw new KeyNotFoundException(
                $"Agent configuration '{agentId}' not found in appsettings.json. " +
                $"Available agents: {string.Join(", ", agentsConfig.Agents.Keys)}");
        }
        return config;
    }

    /// <summary>
    /// Builds an A2A agent card from the configuration.
    /// </summary>
    private static AgentCard CreateAgentCard(AgentConfiguration config)
    {
        var skill = new AgentSkill
        {
            Id = config.SkillId,
            Name = config.SkillName,
            Description = config.SkillDescription,
            Tags = config.Tags,
            Examples = config.Examples
        };

        return new AgentCard
        {
            Name = config.Name.Replace(" ", ""),
            Description = config.Description,
            Version = config.Version,
            DefaultInputModes = ["text"],
            DefaultOutputModes = ["text"],
            Capabilities = new AgentCapabilities
            {
                Streaming = config.Streaming,
                PushNotifications = false
            },
            Skills = [skill],
            Url = config.Url
        };
    }
}

