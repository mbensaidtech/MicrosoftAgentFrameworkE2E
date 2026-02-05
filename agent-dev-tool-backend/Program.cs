using AgentDevToolBackend.Agents.Factory;
using AgentDevToolBackend.Configuration;
using AgentDevToolBackend.Extensions;
using A2A.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register all application services (Azure OpenAI, MongoDB, Agents, VectorStore)
builder.Services.AddApplicationServices(builder.Configuration);

var app = builder.Build();

// Display Azure OpenAI settings
var azureSettings = app.Services.GetRequiredService<AzureOpenAISettings>();
Console.WriteLine("========================================");
Console.WriteLine("Azure OpenAI Configuration:");
Console.WriteLine($"  Endpoint:                  {azureSettings.Endpoint}");
Console.WriteLine($"  DefaultChatDeploymentName: {azureSettings.DefaultChatDeploymentName}");
Console.WriteLine($"  APIKey:                    {MaskApiKey(azureSettings.APIKey)}");
Console.WriteLine("========================================");

static string MaskApiKey(string apiKey)
{
    if (string.IsNullOrEmpty(apiKey)) return "(not set)";
    if (apiKey.Length <= 8) return "****";
    return apiKey[..4] + "****" + apiKey[^4..];
}

// Enable CORS
app.UseCors();

// IMPORTANT: Add unified agent context middleware BEFORE MapA2A and routing
// This extracts contextId from ALL agent requests (A2A and Frontend) and stores in HttpContext.Items
app.UseAgentContext();

// Create agent instances with their cards
var agentFactory = app.Services.GetRequiredService<IAgentFactory>();

var (policyAgent, policyAgentCard) = agentFactory.GetPolicyAgent();

// Expose policy agent via A2A protocol
app.MapA2A(policyAgent, 
    path: "/a2a/policyAgent", 
    agentCard: policyAgentCard,
    taskManager => app.MapWellKnownAgentCard(taskManager, "/a2a/policyAgent"));

Console.WriteLine("Exposed Agents:");
Console.WriteLine("  - Policy Agent (A2A):      /a2a/policyAgent");
Console.WriteLine("  - Policy Agent (HTTP):     /api/agents/policy/chat (non-streaming)");
Console.WriteLine("  - Policy Agent (HTTP SSE): /api/agents/policy/stream (streaming)");
Console.WriteLine("========================================");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

await app.RunAsync();

