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
  Collapse,
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
  Person as PersonIcon,
  AutoAwesome as AutoAwesomeIcon,
  Tune as TuneIcon,
  AttachFile as AttachFileIcon,
  HeadsetMic as HeadsetMicIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useProfile } from '../lib/hooks/useProfile';
import { sendMessage, setNetworkRequestCallback } from '../lib/services/agentService';
import { NetworkMonitor } from '../components/NetworkMonitor';
import type { NetworkRequest } from '../components/NetworkPanel';
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
  const [networkMonitorOpen, setNetworkMonitorOpen] = useState(false);
  const [agentConfigExpanded, setAgentConfigExpanded] = useState(false);

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
      setNetworkRequests((prev) => {
        // Check if request with same ID already exists
        const existingIndex = prev.findIndex((r) => r.id === request.id);
        if (existingIndex >= 0) {
          // Update existing request
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...request };
          return updated;
        } else {
          // Add new request at the beginning
          return [request, ...prev];
        }
      });
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


  // Format timestamp for display
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();
    
    const timeStr = messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (isToday) {
      return `Today ${timeStr}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === messageDate.toDateString();
    
    if (isYesterday) {
      return `Yesterday ${timeStr}`;
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    }) + ` ${timeStr}`;
  };

  // Group messages by date for timestamp separators
  const shouldShowTimestamp = (currentMessage: ChatMessage, previousMessage: ChatMessage | null) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    const timeDiff = currentDate.getTime() - previousDate.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff > 5; // Show timestamp if more than 5 minutes apart
  };

  if (!profile) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isDark ? '#1a1b26' : '#f5f7fa',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            p: 6,
            maxWidth: 500,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: isDark
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <SettingsIcon sx={{ fontSize: 56, color: isDark ? '#a5b4fc' : '#667eea' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              color: isDark ? '#fff' : '#1a1b26',
              fontSize: '24px',
            }}
          >
            No Profile Selected
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              lineHeight: 1.6,
            }}
          >
            Please select or create a profile first to chat with agents.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isDark ? '#1a1b26' : '#f5f7fa',
          overflow: 'hidden',
        }}
      >
        {/* Apple-like Collapsible Agent Configuration Panel */}
        <Box
          sx={{
            bgcolor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Container maxWidth="xl">
            {/* Collapsible Header */}
            <Box
              onClick={() => setAgentConfigExpanded(!agentConfigExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2.5,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={2} flex={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: isDark ? '#fff' : '#1d1d1f',
                    fontSize: '17px',
                    letterSpacing: '-0.022em',
                  }}
                >
                  Configuration
                </Typography>
                {selectedAgent && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontSize: '15px',
                        fontWeight: 400,
                        letterSpacing: '-0.022em',
                      }}
                    >
                      {selectedAgent.name}
                    </Typography>
                    <Chip
                      label={protocol.toUpperCase()}
                      size="small"
                      sx={{
                        height: '22px',
                        fontSize: '11px',
                        fontWeight: 400,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                    {streaming && (
                      <Chip
                        label="Streaming"
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '11px',
                          fontWeight: 400,
                          bgcolor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 113, 227, 0.1)',
                          color: isDark ? '#0a84ff' : '#0071e3',
                          border: 'none',
                          '& .MuiChip-label': {
                            px: 1,
                          },
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
              <IconButton
                size="small"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  transform: agentConfigExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>

            {/* Collapsible Content */}
            <Collapse in={agentConfigExpanded}>
              <Box sx={{ px: 3, pb: 4 }}>
                <Divider sx={{ mb: 4, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                
                <Grid container spacing={4}>
                  {/* Agent Selection */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1.5,
                        fontWeight: 400,
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontSize: '13px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Agent
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={selectedAgent?.id || ''}
                        onChange={(e) => {
                          const agent = agents.find((a) => a.id === e.target.value);
                          setSelectedAgent(agent || null);
                          if (agent) {
                            setStreaming(agent.supportsStreaming);
                          }
                        }}
                        displayEmpty
                        sx={{
                          height: '44px',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f7',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          borderRadius: '10px',
                          '& .MuiSelect-select': {
                            py: 1.5,
                            px: 2,
                            color: isDark ? '#fff' : '#1d1d1f',
                            fontWeight: 400,
                            fontSize: '17px',
                            letterSpacing: '-0.022em',
                          },
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ebebed',
                          },
                          '&.Mui-focused': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#fff',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            boxShadow: 'none',
                          },
                          '& fieldset': {
                            border: 'none',
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography sx={{ fontSize: '17px', fontWeight: 400, color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                            Select Agent
                          </Typography>
                        </MenuItem>
                        {agents.map((agent) => (
                          <MenuItem key={agent.id} value={agent.id} sx={{ fontSize: '17px', fontWeight: 400 }}>
                            {agent.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Protocol Selection */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1.5,
                        fontWeight: 400,
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontSize: '13px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Protocol
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value as Protocol)}
                        sx={{
                          height: '44px',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f7',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          borderRadius: '10px',
                          '& .MuiSelect-select': {
                            py: 1.5,
                            px: 2,
                            color: isDark ? '#fff' : '#1d1d1f',
                            fontWeight: 400,
                            fontSize: '17px',
                            letterSpacing: '-0.022em',
                          },
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ebebed',
                          },
                          '&.Mui-focused': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#fff',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            boxShadow: 'none',
                          },
                          '& fieldset': {
                            border: 'none',
                          },
                        }}
                      >
                        <MenuItem value="rest" sx={{ fontSize: '17px', fontWeight: 400 }}>REST</MenuItem>
                        <MenuItem value="a2a" sx={{ fontSize: '17px', fontWeight: 400 }}>A2A</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Streaming Toggle */}
                  <Grid item xs={12} sm={12} md={5}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1.5,
                        fontWeight: 400,
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontSize: '13px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Streaming
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '44px',
                        px: 2,
                        borderRadius: '10px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f7',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={streaming}
                            onChange={(e) => setStreaming(e.target.checked)}
                            disabled={!selectedAgent?.supportsStreaming}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: isDark ? '#0a84ff' : '#0071e3',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: isDark ? '#0a84ff' : '#0071e3',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '17px', 
                              fontWeight: 400, 
                              color: isDark ? '#fff' : '#1d1d1f',
                              letterSpacing: '-0.022em',
                            }}
                          >
                            {streaming ? 'Enabled' : 'Disabled'}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                      {!selectedAgent?.supportsStreaming && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 'auto',
                            fontSize: '13px',
                            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                            fontWeight: 400,
                          }}
                        >
                          Not supported
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Agent Details - Apple-like Design */}
                  {selectedAgent && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: isDark ? '#fff' : '#1d1d1f',
                            fontSize: '17px',
                            letterSpacing: '-0.022em',
                          }}
                        >
                          Details
                        </Typography>
                      </Grid>
                      
                      {/* Description - Full Width Row */}
                      {selectedAgent.description && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                              py: 1.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                minWidth: 100,
                                fontWeight: 400,
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                fontSize: '13px',
                                letterSpacing: '-0.01em',
                                pt: 0.5,
                              }}
                            >
                              Description
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: isDark ? '#fff' : '#1d1d1f', 
                                fontSize: '15px', 
                                lineHeight: 1.47059,
                                letterSpacing: '-0.022em',
                                fontWeight: 400,
                                flex: 1,
                              }}
                            >
                              {selectedAgent.description}
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      {/* URLs - Side by Side Row */}
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                py: 1.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  minWidth: 100,
                                  fontWeight: 400,
                                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                  fontSize: '13px',
                                  letterSpacing: '-0.01em',
                                  pt: 0.5,
                                }}
                              >
                                REST URL
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                  fontSize: '13px',
                                  color: isDark ? '#fff' : '#1d1d1f',
                                  wordBreak: 'break-all',
                                  lineHeight: 1.47059,
                                  fontWeight: 400,
                                  flex: 1,
                                }}
                              >
                                {(() => {
                                  const baseUrl = selectedAgent.backendUrl || profile?.backendUrl || 'http://localhost:5017';
                                  const restPath = selectedAgent.restPath || '';
                                  return `${baseUrl}${restPath}`;
                                })()}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                py: 1.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  minWidth: 100,
                                  fontWeight: 400,
                                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                  fontSize: '13px',
                                  letterSpacing: '-0.01em',
                                  pt: 0.5,
                                }}
                              >
                                A2A URL
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                  fontSize: '13px',
                                  color: isDark ? '#fff' : '#1d1d1f',
                                  wordBreak: 'break-all',
                                  lineHeight: 1.47059,
                                  fontWeight: 400,
                                  flex: 1,
                                }}
                              >
                                {(() => {
                                  const baseUrl = selectedAgent.backendUrl || profile?.backendUrl || 'http://localhost:5017';
                                  const a2aPath = selectedAgent.a2aPath || '';
                                  return `${baseUrl}${a2aPath}`;
                                })()}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxWidth="xl" sx={{ pt: 2 }}>
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                borderRadius: '12px',
                border: 'none',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                color: isDark ? '#fca5a5' : '#dc2626',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </Alert>
          </Container>
        )}

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Chat Header with Clear Button */}
          {messages.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 2,
                borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                bgcolor: isDark ? 'rgba(30, 32, 48, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '13px',
                }}
              >
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </Typography>
              <Tooltip title="Clear chat">
                <IconButton
                  onClick={handleClearChat}
                  size="small"
                  sx={{
                    color: isDark ? '#ef4444' : '#dc2626',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: { xs: 2, sm: 3 },
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                },
              },
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
                  py: 8,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <SmartToyIcon
                    sx={{
                      fontSize: 56,
                      color: isDark ? '#a5b4fc' : '#667eea',
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: isDark ? '#fff' : '#1a1b26',
                    fontSize: '20px',
                  }}
                >
                  {selectedAgent ? `Start chatting with ${selectedAgent.name}` : 'Select an agent to start chatting'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    mb: 4,
                    maxWidth: 500,
                  }}
                >
                  {selectedAgent?.description || 'Choose an AI agent from the dropdown above to begin your conversation.'}
                </Typography>
                {selectedAgent?.presetQuestions && selectedAgent.presetQuestions.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', maxWidth: 700 }}>
                    {selectedAgent.presetQuestions.map((question, index) => (
                      <Chip
                        key={index}
                        label={question}
                        onClick={() => handlePresetQuestion(question)}
                        sx={{
                          borderRadius: '20px',
                          border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                          bgcolor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)',
                          color: isDark ? '#a5b4fc' : '#667eea',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '13px',
                          height: '36px',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <>
                {messages.map((message, index) => {
                  const previousMessage = index > 0 ? messages[index - 1] : null;
                  const showTimestamp = shouldShowTimestamp(message, previousMessage);
                  
                  return (
                    <Box key={message.id}>
                      {/* Timestamp Separator */}
                      {showTimestamp && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            my: 2,
                          }}
                        >
                          <Box
                            sx={{
                              px: 2,
                              py: 0.5,
                              borderRadius: '12px',
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              {formatMessageTime(message.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {/* Message Bubble */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          mb: showTimestamp ? 0 : 1.5,
                        }}
                      >
                        {message.role === 'agent' && (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: `2px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                            }}
                          >
                            <AutoAwesomeIcon sx={{ color: isDark ? '#a5b4fc' : '#667eea', fontSize: 20 }} />
                          </Box>
                        )}
                        <Box
                          sx={{
                            maxWidth: { xs: '80%', sm: '70%', md: '65%' },
                            p: 2,
                            borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            bgcolor:
                              message.role === 'user'
                                ? isDark
                                  ? '#1e40af'
                                  : '#1e3a8a'
                                : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : '#f3f4f6',
                            color: message.role === 'user' ? '#fff' : isDark ? '#fff' : '#1f2937',
                            boxShadow:
                              message.role === 'user'
                                ? isDark
                                  ? '0 2px 8px rgba(30, 64, 175, 0.3)'
                                  : '0 2px 8px rgba(30, 58, 138, 0.2)'
                                : isDark
                                  ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {message.isLoading ? (
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <CircularProgress size={16} sx={{ color: message.role === 'user' ? '#fff' : '#3b82f6' }} />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: message.role === 'user' ? 'rgba(255, 255, 255, 0.9)' : isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                  fontWeight: 500,
                                  fontSize: '14px',
                                }}
                              >
                                Thinking...
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{
                                color: message.role === 'user' ? '#fff' : isDark ? '#fff' : '#1f2937',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                fontSize: '15px',
                                fontWeight: message.role === 'user' ? 400 : 400,
                              }}
                            >
                              {message.content}
                            </Typography>
                          )}
                        </Box>
                        {message.role === 'user' && (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: isDark ? 'rgba(30, 64, 175, 0.3)' : 'rgba(30, 58, 138, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: `2px solid ${isDark ? 'rgba(30, 64, 175, 0.4)' : 'rgba(30, 58, 138, 0.25)'}`,
                            }}
                          >
                            <PersonIcon sx={{ color: isDark ? '#93c5fd' : '#1e3a8a', fontSize: 20 }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
                
                {/* Preset Questions - Always visible when agent is selected and not loading */}
                {selectedAgent?.presetQuestions && 
                 selectedAgent.presetQuestions.length > 0 && 
                 !isLoading && (
                  <Box 
                    sx={{ 
                      mt: 3,
                      pt: 3,
                      borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1.5, 
                      justifyContent: 'center',
                      px: 2,
                    }}
                  >
                    {selectedAgent.presetQuestions.map((question, index) => (
                      <Chip
                        key={index}
                        label={question}
                        onClick={() => handlePresetQuestion(question)}
                        sx={{
                          borderRadius: '20px',
                          border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                          bgcolor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)',
                          color: isDark ? '#a5b4fc' : '#667eea',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '13px',
                          height: '36px',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Elegant Input Area */}
          <Box
            sx={{
              p: 2.5,
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              bgcolor: isDark ? 'rgba(26, 27, 38, 0.95)' : '#fff',
            }}
          >
            <Container maxWidth="xl">
              <Box
                display="flex"
                gap={1.5}
                alignItems="center"
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                  borderRadius: '24px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  p: 1,
                  transition: 'all 0.2s',
                  '&:focus-within': {
                    borderColor: isDark ? '#3b82f6' : '#1e3a8a',
                    boxShadow: isDark
                      ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      : '0 0 0 3px rgba(30, 58, 138, 0.1)',
                  },
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <AttachFileIcon fontSize="small" />
                </IconButton>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={selectedAgent ? 'Write your message here...' : 'Select an agent first'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!selectedAgent || isLoading}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      py: 1.2,
                      px: 1,
                      color: isDark ? '#fff' : '#1f2937',
                      fontSize: '15px',
                      '&::placeholder': {
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!selectedAgent || !inputValue.trim() || isLoading}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: isDark ? '#1e40af' : '#1e3a8a',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: isDark ? '#1e3a8a' : '#1e40af',
                    },
                    '&:disabled': {
                      bgcolor: isDark ? 'rgba(30, 64, 175, 0.3)' : 'rgba(30, 58, 138, 0.3)',
                      color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={18} sx={{ color: '#fff' }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mt: 1,
                  color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  fontSize: '11px',
                }}
              >
                Generative AI - Always verify content before sending.
              </Typography>
            </Container>
          </Box>
        </Box>
      </Box>

      {/* Network Monitor - Floating Panel */}
      <NetworkMonitor
        requests={networkRequests}
        onClear={handleClearNetworkRequests}
        open={networkMonitorOpen}
        onOpenChange={setNetworkMonitorOpen}
      />
    </>
  );
}
