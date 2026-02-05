using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using AgentDevToolBackend.Configuration;
using AgentDevToolBackend.Services.VectorStore.Base;
using AgentDevToolBackend.Services.VectorStore.Interfaces;

namespace AgentDevToolBackend.Services.VectorStore;

/// <summary>
/// Searches return policy documents.
/// </summary>
public class ReturnPolicyVectorStoreService : PolicyVectorStoreServiceBase, IReturnPolicyVectorStoreService
{
    private readonly VectorStoreSettings settings;

    protected override string CollectionName => settings.Collections.ReturnPolicy.CollectionName;
    protected override string DataFilePath => Path.Combine(settings.DataDirectory, settings.Collections.ReturnPolicy.DataFileName);
    protected override string ServiceName => "ReturnPolicy";

    public ReturnPolicyVectorStoreService(
        IMongoDatabase database,
        IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator,
        IOptions<VectorStoreSettings> settings,
        ILogger<ReturnPolicyVectorStoreService> logger)
        : base(database, embeddingGenerator, logger)
    {
        this.settings = settings.Value;
    }
}

