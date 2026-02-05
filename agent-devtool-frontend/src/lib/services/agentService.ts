import type { AgentConfig, RestChatResponse, A2AResponse, Protocol } from '../../types';
import type { NetworkRequest } from '../../components/NetworkPanel';

/**
 * Agent Service - Handles communication with agents via REST and A2A protocols
 */

export interface SendMessageOptions {
  agent: AgentConfig;
  message: string;
  contextId?: string;
  protocol: Protocol;
  streaming: boolean;
}

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onComplete: (contextId: string) => void;
  onError: (error: string) => void;
}

// Global network request tracker
let networkRequestCallback: ((request: NetworkRequest) => void) | null = null;

export function setNetworkRequestCallback(callback: (request: NetworkRequest) => void | null) {
  networkRequestCallback = callback;
}

function createNetworkRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  requestBody: unknown,
  protocol: Protocol,
  streaming: boolean
): NetworkRequest {
  return {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    method,
    url,
    headers,
    requestBody,
    protocol,
    streaming,
  };
}

function notifyNetworkRequest(request: NetworkRequest) {
  if (networkRequestCallback) {
    networkRequestCallback(request);
  }
}

/**
 * Get the base URL for the agent
 */
function getAgentBaseUrl(agent: AgentConfig, profileBackendUrl?: string): string {
  const baseUrl = agent.backendUrl || profileBackendUrl || 'http://localhost:5017';
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '');
}

/**
 * Normalize path to ensure it starts with /
 */
function normalizePath(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Generate a context ID signature using HMAC-SHA256 (matching backend implementation)
 * 
 * NOTE: In production, this secret key should NOT be exposed in the frontend.
 * Consider using a proxy endpoint that signs requests server-side.
 */
async function signContextId(contextId: string): Promise<string> {
  // Secret key from backend appsettings.json
  // For production, this should be stored in an environment variable or use a proxy
  const secretKey = import.meta.env.VITE_CONTEXT_ID_SIGNING_KEY || 
    'Demo-Secret-Key-2026-For-AI-Agents-Project-Min-32-Chars-Required!';
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const contextIdData = encoder.encode(contextId);
  
  // Import the key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the contextId
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, contextIdData);
  
  // Convert to Base64 (matching backend Convert.ToBase64String)
  const signatureArray = Array.from(new Uint8Array(signature));
  const base64String = btoa(String.fromCharCode(...signatureArray));
  
  return base64String;
}

/**
 * Send a message using REST API (non-streaming)
 */
export async function sendRestMessage(
  agent: AgentConfig,
  message: string,
  contextId: string | undefined,
  profileBackendUrl?: string
): Promise<{ response: RestChatResponse; contextId: string }> {
  if (!agent.restPath) {
    throw new Error(`Agent "${agent.name}" does not have a REST path configured. Please set the REST Path in the agent configuration.`);
  }
  
  const baseUrl = getAgentBaseUrl(agent, profileBackendUrl);
  const restPath = normalizePath(agent.restPath);
  const url = `${baseUrl}${restPath}/chat`;
  
  console.log('[REST] Sending message to:', url);

  let signature: string | undefined;
  if (contextId) {
    try {
      signature = await signContextId(contextId);
    } catch (error) {
      console.error('[REST] Failed to sign contextId:', error);
    }
  }

  const requestBody = { message, contextId, signature };
  const startTime = Date.now();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const networkRequest = createNetworkRequest('POST', url, headers, requestBody, 'rest', false);
  // Don't notify immediately - wait for response to avoid duplicate entries

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!response.ok) {
      const errorText = await response.text();
      networkRequest.responseStatus = response.status;
      networkRequest.responseHeaders = responseHeaders;
      networkRequest.responseBody = { error: errorText };
      networkRequest.duration = duration;
      networkRequest.error = `HTTP error! status: ${response.status}, message: ${errorText}`;
      notifyNetworkRequest(networkRequest);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: RestChatResponse = await response.json();
    networkRequest.responseStatus = response.status;
    networkRequest.responseHeaders = responseHeaders;
    networkRequest.responseBody = data;
    networkRequest.duration = duration;
    notifyNetworkRequest(networkRequest);
    
    return {
      response: data,
      contextId: data.contextId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    networkRequest.duration = duration;
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      networkRequest.error = `Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`;
      notifyNetworkRequest(networkRequest);
      throw new Error(`Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`);
    }
    networkRequest.error = error instanceof Error ? error.message : 'Unknown error';
    notifyNetworkRequest(networkRequest);
    throw error;
  }
}

/**
 * Send a message using REST API with SSE streaming
 */
export async function sendRestStreamingMessage(
  agent: AgentConfig,
  message: string,
  contextId: string | undefined,
  callbacks: StreamingCallbacks,
  profileBackendUrl?: string
): Promise<void> {
  if (!agent.restPath) {
    callbacks.onError(`Agent "${agent.name}" does not have a REST path configured. Please set the REST Path in the agent configuration.`);
    return;
  }
  
  const baseUrl = getAgentBaseUrl(agent, profileBackendUrl);
  const restPath = normalizePath(agent.restPath);
  const url = `${baseUrl}${restPath}/stream`;
  
  console.log('[REST Streaming] Sending message to:', url);

  let signature: string | undefined;
  if (contextId) {
    try {
      signature = await signContextId(contextId);
    } catch (error) {
      console.error('[REST Streaming] Failed to sign contextId:', error);
    }
  }

  const requestBody = { message, contextId, signature };
  const startTime = Date.now();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const networkRequest = createNetworkRequest('POST', url, headers, requestBody, 'rest', true);
  notifyNetworkRequest(networkRequest);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    networkRequest.responseStatus = response.status;
    networkRequest.responseHeaders = responseHeaders;

    if (!response.ok) {
      const errorText = await response.text();
      networkRequest.responseBody = { error: errorText };
      networkRequest.duration = Date.now() - startTime;
      networkRequest.error = `HTTP error! status: ${response.status}, message: ${errorText}`;
      notifyNetworkRequest(networkRequest);
      callbacks.onError(`HTTP error! status: ${response.status}, message: ${errorText}`);
      return;
    }
  } catch (error) {
    networkRequest.duration = Date.now() - startTime;
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      networkRequest.error = `Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`;
      notifyNetworkRequest(networkRequest);
      callbacks.onError(`Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`);
      return;
    }
    networkRequest.error = error instanceof Error ? error.message : 'Unknown error';
    notifyNetworkRequest(networkRequest);
    callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
    return;
  }

  try {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      callbacks.onError('No response body');
      return;
    }

    let buffer = '';
    let finalContextId = contextId || '';
    let currentEvent = '';
    const streamedTokens: string[] = [];
    const streamedEvents: Array<{ event: string; data: unknown }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            streamedEvents.push({ event: currentEvent, data: parsed });
            
            if (currentEvent === 'token' && parsed.text) {
              streamedTokens.push(parsed.text);
              callbacks.onToken(parsed.text);
            } else if (currentEvent === 'start' && parsed.contextId) {
              finalContextId = parsed.contextId;
            } else if (currentEvent === 'end' && parsed.contextId) {
              finalContextId = parsed.contextId;
              networkRequest.duration = Date.now() - startTime;
              networkRequest.responseBody = {
                contextId: finalContextId,
                streamedContent: streamedTokens.join(''),
                events: streamedEvents,
                totalTokens: streamedTokens.length,
              };
              notifyNetworkRequest(networkRequest);
              callbacks.onComplete(finalContextId);
              return;
            } else if (currentEvent === 'error') {
              networkRequest.duration = Date.now() - startTime;
              networkRequest.error = parsed.message || 'Unknown error';
              networkRequest.responseBody = {
                error: parsed.message || 'Unknown error',
                events: streamedEvents,
              };
              notifyNetworkRequest(networkRequest);
              callbacks.onError(parsed.message || 'Unknown error');
              return;
            }
          } catch (e) {
            // Ignore parse errors for incomplete data
          }
        }
      }
    }

    networkRequest.duration = Date.now() - startTime;
    networkRequest.responseBody = {
      contextId: finalContextId,
      streamedContent: streamedTokens.join(''),
      events: streamedEvents,
      totalTokens: streamedTokens.length,
      note: 'Stream completed',
    };
    notifyNetworkRequest(networkRequest);
    
    callbacks.onComplete(finalContextId);
  } catch (error) {
    networkRequest.duration = Date.now() - startTime;
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      networkRequest.error = `Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`;
      notifyNetworkRequest(networkRequest);
      callbacks.onError(`Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`);
      return;
    }
    networkRequest.error = error instanceof Error ? error.message : 'Unknown error';
    notifyNetworkRequest(networkRequest);
    callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Send a message using A2A protocol (JSON-RPC, non-streaming)
 */
export async function sendA2AMessage(
  agent: AgentConfig,
  message: string,
  contextId: string | undefined,
  profileBackendUrl?: string
): Promise<{ text: string; contextId: string }> {
  if (!agent.a2aPath) {
    throw new Error(`Agent "${agent.name}" does not have an A2A path configured. Please set the A2A Path in the agent configuration.`);
  }
  
  const baseUrl = getAgentBaseUrl(agent, profileBackendUrl);
  const a2aPath = normalizePath(agent.a2aPath);
  const url = `${baseUrl}${a2aPath}`;
  
  console.log('[A2A] Sending message to:', url);

  let signature: string | undefined;
  if (contextId) {
    try {
      signature = await signContextId(contextId);
    } catch (error) {
      console.error('[A2A] Failed to sign contextId:', error);
    }
  }

  const requestBody = {
    jsonrpc: '2.0',
    method: 'message/send',
    params: {
      message: {
        kind: 'message',
        messageId: `msg-${Date.now()}`,
        role: 'user',
        parts: [
          {
            kind: 'text',
            text: message,
          },
        ],
      },
      contextId,
      signature,
    },
    id: `req-${Date.now()}`,
  };

  const startTime = Date.now();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const networkRequest = createNetworkRequest('POST', url, headers, requestBody, 'a2a', false);
  // Don't notify immediately - wait for response to avoid duplicate entries

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    networkRequest.responseStatus = response.status;
    networkRequest.responseHeaders = responseHeaders;

    if (!response.ok) {
      const errorText = await response.text();
      networkRequest.responseBody = { error: errorText };
      networkRequest.duration = duration;
      networkRequest.error = `HTTP error! status: ${response.status}, message: ${errorText}`;
      notifyNetworkRequest(networkRequest);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: A2AResponse = await response.json();
    networkRequest.responseBody = data;
    networkRequest.duration = duration;

    if (data.error) {
      networkRequest.error = data.error.message || 'A2A protocol error';
      notifyNetworkRequest(networkRequest);
      throw new Error(data.error.message || 'A2A protocol error');
    }

    const text = data.result.parts
      .filter((p) => p.kind === 'text')
      .map((p) => p.text)
      .join('');

    notifyNetworkRequest(networkRequest);

    return {
      text,
      contextId: data.result.contextId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    networkRequest.duration = duration;
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      networkRequest.error = `Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`;
      notifyNetworkRequest(networkRequest);
      throw new Error(`Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`);
    }
    networkRequest.error = error instanceof Error ? error.message : 'Unknown error';
    notifyNetworkRequest(networkRequest);
    throw error;
  }
}

/**
 * Send a message using A2A protocol with SSE streaming
 */
export async function sendA2AStreamingMessage(
  agent: AgentConfig,
  message: string,
  contextId: string | undefined,
  callbacks: StreamingCallbacks,
  profileBackendUrl?: string
): Promise<void> {
  if (!agent.a2aPath) {
    callbacks.onError(`Agent "${agent.name}" does not have an A2A path configured. Please set the A2A Path in the agent configuration.`);
    return;
  }
  
  const baseUrl = getAgentBaseUrl(agent, profileBackendUrl);
  const a2aPath = normalizePath(agent.a2aPath);
  const url = `${baseUrl}${a2aPath}/v1/message:stream`;
  
  console.log('[A2A Streaming] Sending message to:', url);

  let signature: string | undefined;
  if (contextId) {
    try {
      signature = await signContextId(contextId);
    } catch (error) {
      console.error('[A2A Streaming] Failed to sign contextId:', error);
    }
  }

  const requestBody = {
    message: {
      kind: 'message',
      role: 'user',
      parts: [
        {
          kind: 'text',
          text: message,
          metadata: {},
        },
      ],
      messageId: null,
      contextId,
      signature,
    },
  };

  const startTime = Date.now();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  
  const networkRequest = createNetworkRequest('POST', url, headers, requestBody, 'a2a', true);
  notifyNetworkRequest(networkRequest);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    networkRequest.responseStatus = response.status;
    networkRequest.responseHeaders = responseHeaders;

    if (!response.ok) {
      const errorText = await response.text();
      networkRequest.responseBody = { error: errorText };
      networkRequest.duration = Date.now() - startTime;
      networkRequest.error = `HTTP error! status: ${response.status}, message: ${errorText}`;
      notifyNetworkRequest(networkRequest);
      callbacks.onError(`HTTP error! status: ${response.status}, message: ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      callbacks.onError('No response body');
      return;
    }

    let buffer = '';
    let finalContextId = contextId || '';
    let currentEvent = '';
    const streamedTokens: string[] = [];
    const streamedEvents: Array<{ event: string; data: unknown }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            streamedEvents.push({ event: currentEvent, data: parsed });
            
            if (currentEvent === 'token' && parsed.text) {
              streamedTokens.push(parsed.text);
              callbacks.onToken(parsed.text);
            } else if (currentEvent === 'start' && parsed.contextId) {
              finalContextId = parsed.contextId;
            } else if (currentEvent === 'end' && parsed.contextId) {
              finalContextId = parsed.contextId;
              networkRequest.duration = Date.now() - startTime;
              networkRequest.responseBody = {
                contextId: finalContextId,
                streamedContent: streamedTokens.join(''),
                events: streamedEvents,
                totalTokens: streamedTokens.length,
              };
              notifyNetworkRequest(networkRequest);
              callbacks.onComplete(finalContextId);
              return;
            } else if (currentEvent === 'error') {
              networkRequest.duration = Date.now() - startTime;
              networkRequest.error = parsed.message || 'Unknown error';
              networkRequest.responseBody = {
                error: parsed.message || 'Unknown error',
                events: streamedEvents,
              };
              notifyNetworkRequest(networkRequest);
              callbacks.onError(parsed.message || 'Unknown error');
              return;
            }
          } catch (e) {
            // Ignore parse errors for incomplete data
          }
        }
      }
    }

    networkRequest.duration = Date.now() - startTime;
    networkRequest.responseBody = {
      contextId: finalContextId,
      streamedContent: streamedTokens.join(''),
      events: streamedEvents,
      totalTokens: streamedTokens.length,
      note: 'A2A Stream completed',
    };
    notifyNetworkRequest(networkRequest);
    
    callbacks.onComplete(finalContextId);
  } catch (error) {
    networkRequest.duration = Date.now() - startTime;
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      networkRequest.error = `Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`;
      notifyNetworkRequest(networkRequest);
      callbacks.onError(`Network error: Cannot connect to ${url}. Make sure the backend is running and CORS is configured.`);
      return;
    }
    networkRequest.error = error instanceof Error ? error.message : 'Unknown error';
    notifyNetworkRequest(networkRequest);
    callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Send a message to an agent (handles both REST and A2A, with or without streaming)
 */
export async function sendMessage(
  options: SendMessageOptions,
  callbacks?: StreamingCallbacks,
  profileBackendUrl?: string
): Promise<{ text: string; contextId: string } | void> {
  const { agent, message, contextId, protocol, streaming } = options;

  if (streaming && callbacks) {
    if (protocol === 'rest') {
      await sendRestStreamingMessage(agent, message, contextId, callbacks, profileBackendUrl);
      return;
    } else {
      await sendA2AStreamingMessage(agent, message, contextId, callbacks, profileBackendUrl);
      return;
    }
  } else {
    if (protocol === 'rest') {
      const result = await sendRestMessage(agent, message, contextId, profileBackendUrl);
      // Normalize REST response to match A2A format
      return {
        text: result.response.message,
        contextId: result.contextId,
      };
    } else {
      return await sendA2AMessage(agent, message, contextId, profileBackendUrl);
    }
  }
}

