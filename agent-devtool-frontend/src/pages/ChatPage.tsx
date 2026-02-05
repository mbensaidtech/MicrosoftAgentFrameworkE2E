import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  DeleteOutline as DeleteOutlineIcon,
  NetworkCheck as NetworkCheckIcon,
} from '@mui/icons-material';
import { useProfile } from '../lib/hooks/useProfile';
import { sendMessage, setNetworkRequestCallback } from '../lib/services/agentService';
import { NetworkPanel, type NetworkRequest } from '../components/NetworkPanel';
import type { AgentConfig, ChatMessage, Protocol } from '../types';

export function ChatPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { profile } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [protocol, setProtocol] = useState<Protocol>('rest');
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextId, setContextId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [networkPanelOpen, setNetworkPanelOpen] = useState(false);

  const agents = profile?.agents?.filter((a) => a.enabled) || [];

  // Store contextId per agent to maintain conversation context
  const agentContextIdsRef = useRef<Map<string, string>>(new Map());

  // Auto-select first agent if available
  useEffect(() => {
    if (!selectedAgent && agents.length > 0) {
      setSelectedAgent(agents[0]);
      setStreaming(agents[0].supportsStreaming);
    }
  }, [agents, selectedAgent]);

  // Track previous agent to detect changes
  const previousAgentIdRef = useRef<string | null>(null);

  // Reset context and messages when agent changes
  useEffect(() => {
    if (selectedAgent) {
      const currentAgentId = selectedAgent.id;
      const previousAgentId = previousAgentIdRef.current;
      
      // If agent changed, start fresh
      if (previousAgentId !== null && previousAgentId !== currentAgentId) {
        // Agent changed - clear messages and start new context
        setMessages([]);
        setContextId(undefined);
        agentContextIdsRef.current.delete(previousAgentId);
      } else {
        // Same agent or first selection - load saved contextId if exists
        const savedContextId = agentContextIdsRef.current.get(currentAgentId);
        if (savedContextId) {
          setContextId(savedContextId);
        } else {
          setContextId(undefined);
        }
      }
      
      previousAgentIdRef.current = currentAgentId;
      
      // Update streaming capability
      if (!selectedAgent.supportsStreaming) {
        setStreaming(false);
      }
    } else {
      // No agent selected, clear everything
      previousAgentIdRef.current = null;
      setContextId(undefined);
      setMessages([]);
    }
  }, [selectedAgent?.id]); // Only depend on agent ID, not the whole object

  // Save contextId when it changes for the current agent
  useEffect(() => {
    if (selectedAgent && contextId) {
      agentContextIdsRef.current.set(selectedAgent.id, contextId);
    }
  }, [selectedAgent?.id, contextId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup network request callback
  useEffect(() => {
    setNetworkRequestCallback((request: NetworkRequest) => {
      setNetworkRequests((prev) => [request, ...prev]);
    });

    return () => {
      setNetworkRequestCallback(null);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!selectedAgent || !inputValue.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessageId = `loading-${Date.now()}`;
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      if (streaming) {
        // Streaming response
        let agentResponse = '';

        await sendMessage(
          {
            agent: selectedAgent,
            message: messageText,
            contextId,
            protocol,
            streaming: true,
          },
          {
            onToken: (token: string) => {
              agentResponse += token;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        content: agentResponse,
                        isStreaming: true,
                        isLoading: false,
                      }
                    : msg
                )
              );
            },
            onComplete: (newContextId: string) => {
              setContextId(newContextId);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        isStreaming: false,
                        isLoading: false,
                      }
                    : msg
                )
              );
              setIsLoading(false);
            },
            onError: (error: string) => {
              setError(error);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        content: `Error: ${error}`,
                        isLoading: false,
                        isStreaming: false,
                      }
                    : msg
                )
              );
              setIsLoading(false);
            },
          },
          profile?.backendUrl
        );
      } else {
        // Non-streaming response
        try {
          const result = await sendMessage(
            {
              agent: selectedAgent,
              message: messageText,
              contextId,
              protocol,
              streaming: false,
            },
            undefined,
            profile?.backendUrl
          );

          if (result) {
            setContextId(result.contextId);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === loadingMessageId
                  ? {
                      ...msg,
                      content: result.text || 'No response received',
                      isLoading: false,
                    }
                  : msg
              )
            );
          } else {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === loadingMessageId
                  ? {
                      ...msg,
                      content: 'Error: No response received from agent',
                      isLoading: false,
                    }
                  : msg
              )
            );
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    content: `Error: ${errorMsg}`,
                    isLoading: false,
                  }
                : msg
            )
          );
        }
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: `Error: ${errorMessage}`,
                isLoading: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePresetQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    if (selectedAgent) {
      // Clear contextId for this agent
      agentContextIdsRef.current.delete(selectedAgent.id);
      setContextId(undefined);
    }
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleClearNetworkRequests = () => {
    setNetworkRequests([]);
  };

  if (!profile) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            p: 6,
            textAlign: 'center',
          }}
        >
          <SettingsIcon sx={{ fontSize: 48, color: isDark ? '#bd93f9' : 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500, color: isDark ? '#f8f8f2' : 'text.primary' }}>
            No Profile Selected
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#bd93f9' : 'text.secondary' }}>
            Please select or create a profile first to chat with agents.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 4, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        {/* Agent Selection Card */}
      <Card
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: isDark ? '#f8f8f2' : 'text.primary',
              }}
            >
              Chat
            </Typography>
            <Tooltip title="Network Monitor">
              <IconButton
                onClick={() => setNetworkPanelOpen(!networkPanelOpen)}
                size="small"
                sx={{
                  color: networkPanelOpen 
                    ? (isDark ? '#bd93f9' : 'primary.main')
                    : (isDark ? '#f8f8f2' : 'text.primary'),
                  bgcolor: networkPanelOpen 
                    ? (isDark ? 'rgba(189, 147, 249, 0.15)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                  border: `1px solid ${networkPanelOpen 
                    ? (isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider)
                    : 'transparent'}`,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <NetworkCheckIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container spacing={3} alignItems="center">
            {/* Agent Selection */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Agent
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = agents.find((a) => a.id === e.target.value);
                    setSelectedAgent(agent || null);
                    if (agent) {
                      setStreaming(agent.supportsStreaming);
                    }
                  }}
                  sx={{
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(189, 147, 249, 0.5)' : theme.palette.divider,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? '#bd93f9' : undefined,
                    },
                    color: isDark ? '#f8f8f2' : 'text.primary',
                  }}
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Protocol Selection */}
            <Grid item xs={12} md={3}>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Protocol
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as Protocol)}
                  sx={{
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(189, 147, 249, 0.5)' : theme.palette.divider,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? '#bd93f9' : undefined,
                    },
                    color: isDark ? '#f8f8f2' : 'text.primary',
                  }}
                >
                  <MenuItem value="rest">REST</MenuItem>
                  <MenuItem value="a2a">A2A</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Streaming Toggle */}
            <Grid item xs={12} md={3}>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Streaming
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={streaming}
                    onChange={(e) => setStreaming(e.target.checked)}
                    disabled={!selectedAgent?.supportsStreaming}
                  />
                }
                label={streaming ? 'Enabled' : 'Disabled'}
                sx={{
                  color: isDark ? '#f8f8f2' : 'text.primary',
                  '& .MuiFormControlLabel-label': {
                    color: isDark ? '#f8f8f2' : 'text.primary',
                  },
                }}
              />
            </Grid>

            {/* Agent Info */}
            {selectedAgent && (
              <Grid item xs={12} md={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                    bgcolor: isDark ? 'rgba(189, 147, 249, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: isDark ? '#50fa7b' : '#34c759',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: isDark ? '#bd93f9' : 'text.secondary' }}>
                    Active
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Agent Details */}
          {selectedAgent && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                    <InfoIcon sx={{ fontSize: 16, color: isDark ? '#8be9fd' : 'text.secondary', mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 0.5,
                          fontWeight: 600,
                          color: isDark ? '#bd93f9' : 'text.primary',
                        }}
                      >
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#f8f8f2' : 'text.primary' }}>
                        {selectedAgent.description || 'No description'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                    <CodeIcon sx={{ fontSize: 16, color: isDark ? '#8be9fd' : 'text.secondary', mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 0.5,
                          fontWeight: 600,
                          color: isDark ? '#bd93f9' : 'text.primary',
                        }}
                      >
                        REST Path
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: isDark ? '#8be9fd' : 'text.secondary',
                        }}
                      >
                        {selectedAgent.restPath}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                    <CodeIcon sx={{ fontSize: 16, color: isDark ? '#8be9fd' : 'text.secondary', mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 0.5,
                          fontWeight: 600,
                          color: isDark ? '#bd93f9' : 'text.primary',
                        }}
                      >
                        A2A Path
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: isDark ? '#8be9fd' : 'text.secondary',
                        }}
                      >
                        {selectedAgent.a2aPath}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: isDark ? '#bd93f9' : 'text.primary',
                      }}
                    >
                      Backend URL:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: isDark ? '#8be9fd' : 'text.secondary',
                      }}
                    >
                      {selectedAgent.backendUrl || profile?.backendUrl || 'http://localhost:5017'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 2,
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'rgba(255, 85, 85, 0.1)' : undefined,
            color: isDark ? '#ff5555' : undefined,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Messages Area */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header with Clear Button and Network Monitor */}
        {messages.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'rgba(68, 71, 90, 0.3)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: isDark ? '#bd93f9' : 'text.secondary',
              }}
            >
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Network Monitor">
                <IconButton
                  onClick={() => setNetworkPanelOpen(!networkPanelOpen)}
                  size="small"
                  sx={{
                    color: networkPanelOpen 
                      ? (isDark ? '#bd93f9' : 'primary.main')
                      : (isDark ? '#f8f8f2' : 'text.primary'),
                    bgcolor: networkPanelOpen 
                      ? (isDark ? 'rgba(189, 147, 249, 0.15)' : 'rgba(0, 0, 0, 0.05)')
                      : 'transparent',
                    border: `1px solid ${networkPanelOpen 
                      ? (isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider)
                      : 'transparent'}`,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <NetworkCheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear chat and start new conversation">
                <IconButton
                  onClick={handleClearChat}
                  size="small"
                  sx={{
                    color: isDark ? '#ff5555' : 'error.main',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 85, 85, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                    },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <SmartToyIcon
                sx={{
                  fontSize: 64,
                  color: isDark ? '#bd93f9' : 'text.secondary',
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: isDark ? '#f8f8f2' : 'text.primary',
                }}
              >
                {selectedAgent ? `Start chatting with ${selectedAgent.name}` : 'Select an agent to start chatting'}
              </Typography>
              {selectedAgent?.presetQuestions && selectedAgent.presetQuestions.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', maxWidth: 600 }}>
                  {selectedAgent.presetQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      onClick={() => handlePresetQuestion(question)}
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider}`,
                        color: isDark ? '#bd93f9' : 'text.primary',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 2,
                      borderRadius: 0,
                      bgcolor:
                        message.role === 'user'
                          ? isDark
                            ? 'rgba(189, 147, 249, 0.2)'
                            : 'rgba(0, 113, 227, 0.1)'
                          : isDark
                            ? 'rgba(68, 71, 90, 0.5)'
                            : 'rgba(0, 0, 0, 0.05)',
                      border: `1px solid ${
                        message.role === 'user'
                          ? isDark
                            ? 'rgba(189, 147, 249, 0.3)'
                            : 'rgba(0, 113, 227, 0.2)'
                          : theme.palette.divider
                      }`,
                    }}
                  >
                    {message.isLoading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" sx={{ color: isDark ? '#8be9fd' : 'text.secondary' }}>
                          Thinking...
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{
                          color: isDark ? '#f8f8f2' : 'text.primary',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {message.content}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
              
              {/* Preset Questions - Always visible when agent is selected and not loading */}
              {selectedAgent?.presetQuestions && 
               selectedAgent.presetQuestions.length > 0 && 
               !isLoading && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 2, 
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1, 
                    justifyContent: 'center' 
                  }}
                >
                  {selectedAgent.presetQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      onClick={() => handlePresetQuestion(question)}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider}`,
                        color: isDark ? '#bd93f9' : 'text.primary',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>

        <Divider />

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'rgba(68, 71, 90, 0.3)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box display="flex" gap={1} alignItems="flex-end">
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={selectedAgent ? 'Type your message...' : 'Select an agent first'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!selectedAgent || isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  bgcolor: 'background.paper',
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& input::placeholder': {
                  color: isDark ? '#8be9fd' : undefined,
                  opacity: isDark ? 0.6 : undefined,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!selectedAgent || !inputValue.trim() || isLoading}
              sx={{
                borderRadius: 0,
                minWidth: 100,
                boxShadow: 'none',
                bgcolor: isDark ? '#bd93f9' : undefined,
                color: isDark ? '#282a36' : undefined,
                '&:hover': {
                  boxShadow: 'none',
                  bgcolor: isDark ? '#d1b3ff' : undefined,
                },
                '&:disabled': {
                  bgcolor: isDark ? 'rgba(189, 147, 249, 0.3)' : undefined,
                },
              }}
              startIcon={isLoading ? <CircularProgress size={16} /> : <SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Paper>
      </Container>

      {/* Network Panel */}
      <NetworkPanel
        open={networkPanelOpen}
        onClose={() => setNetworkPanelOpen(false)}
        requests={networkRequests}
        onClear={handleClearNetworkRequests}
      />
    </>
  );
}
