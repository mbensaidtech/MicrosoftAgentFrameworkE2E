import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  NetworkCheck as NetworkCheckIcon,
  DeleteOutline as DeleteOutlineIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export interface NetworkRequest {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  headers: Record<string, string>;
  requestBody: unknown;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  duration?: number;
  error?: string;
  protocol: 'rest' | 'a2a';
  streaming: boolean;
}

interface NetworkPanelProps {
  open: boolean;
  onClose: () => void;
  requests: NetworkRequest[];
  onClear: () => void;
}

export function NetworkPanel({ open, onClose, requests, onClear }: NetworkPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | false>(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, number>>({});

  const handleRequestClick = (request: NetworkRequest) => {
    setSelectedRequest(request);
    setExpandedRequest(request.id);
  };

  const handleAccordionChange = (requestId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedRequest(isExpanded ? requestId : false);
    if (isExpanded) {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
      }
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return isDark ? '#ff5555' : 'error.main';
    if (status >= 200 && status < 300) return isDark ? '#50fa7b' : 'success.main';
    if (status >= 400 && status < 500) return isDark ? '#ffb86c' : 'warning.main';
    return isDark ? '#ff5555' : 'error.main';
  };

  const getStatusIcon = (status?: number, error?: string) => {
    if (error) return <ErrorIcon sx={{ fontSize: 16, color: isDark ? '#ff5555' : 'error.main' }} />;
    if (status && status >= 200 && status < 300) return <CheckCircleIcon sx={{ fontSize: 16, color: isDark ? '#50fa7b' : 'success.main' }} />;
    return null;
  };

  const formatJson = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 700, md: 800 },
          borderLeft: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDark ? 'rgba(40, 42, 54, 0.8)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark ? 'rgba(189, 147, 249, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider}`,
              }}
            >
              <NetworkCheckIcon sx={{ fontSize: 20, color: isDark ? '#bd93f9' : 'text.secondary' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8f8f2' : 'text.primary', lineHeight: 1.2 }}>
                Network Monitor
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#8be9fd' : 'text.secondary' }}>
                {requests.length} request{requests.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {requests.length > 0 && (
              <Tooltip title="Clear all requests">
                <IconButton
                  size="small"
                  onClick={onClear}
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
            )}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: isDark ? '#f8f8f2' : 'text.primary',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Requests List */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: isDark ? 'rgba(40, 42, 54, 0.3)' : 'rgba(0, 0, 0, 0.01)' }}>
          {requests.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <NetworkCheckIcon
                sx={{
                  fontSize: 64,
                  color: isDark ? '#bd93f9' : 'text.secondary',
                  mb: 2,
                  opacity: 0.3,
                }}
              />
              <Typography variant="body1" sx={{ color: isDark ? '#f8f8f2' : 'text.primary', mb: 1, fontWeight: 500 }}>
                No network requests yet
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#8be9fd' : 'text.secondary' }}>
                Start chatting to see network activity
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 1 }}>
              {requests.map((request) => (
                <Paper
                  key={request.id}
                  sx={{
                    mb: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                  }}
                >
                  <Accordion
                    expanded={expandedRequest === request.id}
                    onChange={handleAccordionChange(request.id)}
                    sx={{
                      borderRadius: 0,
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      bgcolor: 'transparent',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#bd93f9' : 'text.secondary' }} />}
                      sx={{
                        px: 2,
                        py: 1.5,
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          my: 0,
                        },
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(189, 147, 249, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                        {getStatusIcon(request.responseStatus, request.error)}
                        <Chip
                          label={request.method}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            minWidth: 55,
                            height: 22,
                            bgcolor: isDark ? 'rgba(189, 147, 249, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                            color: isDark ? '#bd93f9' : 'text.primary',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 600,
                            border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider}`,
                          }}
                        />
                        <Chip
                          label={request.protocol.toUpperCase()}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            height: 22,
                            bgcolor: isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                            color: isDark ? '#8be9fd' : 'text.secondary',
                            fontSize: '10px',
                            border: `1px solid ${isDark ? 'rgba(139, 233, 253, 0.3)' : theme.palette.divider}`,
                          }}
                        />
                        {request.streaming && (
                          <Chip
                            label="SSE"
                            size="small"
                            sx={{
                              borderRadius: 0,
                              height: 22,
                              bgcolor: isDark ? 'rgba(80, 250, 123, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                              color: isDark ? '#50fa7b' : 'success.main',
                              fontSize: '10px',
                              border: `1px solid ${isDark ? 'rgba(80, 250, 123, 0.3)' : theme.palette.divider}`,
                            }}
                          />
                        )}
                        {request.responseStatus && (
                          <Chip
                            label={request.responseStatus}
                            size="small"
                            sx={{
                              borderRadius: 0,
                              height: 22,
                              bgcolor: getStatusColor(request.responseStatus),
                              color: isDark && request.responseStatus >= 200 && request.responseStatus < 300 ? '#282a36' : '#f8f8f2',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          />
                        )}
                        {request.error && (
                          <Chip
                            label="Error"
                            size="small"
                            sx={{
                              borderRadius: 0,
                              height: 22,
                              bgcolor: isDark ? 'rgba(255, 85, 85, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                              color: isDark ? '#ff5555' : 'error.main',
                              fontSize: '10px',
                              border: `1px solid ${isDark ? 'rgba(255, 85, 85, 0.3)' : theme.palette.divider}`,
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0, ml: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: isDark ? '#f8f8f2' : 'text.primary',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                            }}
                          >
                            {request.url.replace(/^https?:\/\/[^/]+/, '')}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? '#8be9fd' : 'text.secondary',
                                fontSize: '10px',
                              }}
                            >
                              {new Date(request.timestamp).toLocaleTimeString()}
                            </Typography>
                            {request.duration && (
                              <>
                                <Typography variant="caption" sx={{ color: isDark ? '#8be9fd' : 'text.secondary', fontSize: '10px' }}>
                                  •
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: isDark ? '#8be9fd' : 'text.secondary',
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {request.duration}ms
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Divider />
                      <Box>
                        <Tabs
                          value={activeTabs[request.id] || 0}
                          onChange={(e, newValue) => setActiveTabs({ ...activeTabs, [request.id]: newValue })}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            minHeight: 40,
                            '& .MuiTab-root': {
                              minHeight: 40,
                              textTransform: 'none',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: isDark ? '#8be9fd' : 'text.secondary',
                              '&.Mui-selected': {
                                color: isDark ? '#bd93f9' : 'text.primary',
                              },
                            },
                            '& .MuiTabs-indicator': {
                              bgcolor: isDark ? '#bd93f9' : 'primary.main',
                            },
                          }}
                        >
                          <Tab label="Request" />
                          <Tab label="Response" />
                        </Tabs>

                        {/* Request Tab */}
                        {(activeTabs[request.id] || 0) === 0 && (
                          <Box sx={{ p: 2.5 }}>
                            <Box sx={{ mb: 2.5 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mb: 1,
                                  fontWeight: 600,
                                  color: isDark ? '#bd93f9' : 'text.primary',
                                  textTransform: 'uppercase',
                                  fontSize: '10px',
                                  letterSpacing: 0.5,
                                }}
                              >
                                URL
                              </Typography>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  bgcolor: isDark ? 'rgba(68, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 0,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: isDark ? '#f8f8f2' : 'text.primary',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {request.method} {request.url}
                                </Typography>
                              </Paper>
                            </Box>

                            <Box sx={{ mb: 2.5 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: isDark ? '#bd93f9' : 'text.primary',
                                    textTransform: 'uppercase',
                                    fontSize: '10px',
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  Headers
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(formatJson(request.headers))}
                                  sx={{ p: 0.5, color: isDark ? '#8be9fd' : 'text.secondary' }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  bgcolor: isDark ? 'rgba(68, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 0,
                                  maxHeight: 150,
                                  overflow: 'auto',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: isDark ? '#f8f8f2' : 'text.primary',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {formatJson(request.headers)}
                                </Typography>
                              </Paper>
                            </Box>

                            <Box>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: isDark ? '#bd93f9' : 'text.primary',
                                    textTransform: 'uppercase',
                                    fontSize: '10px',
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  Body
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(formatJson(request.requestBody))}
                                  sx={{ p: 0.5, color: isDark ? '#8be9fd' : 'text.secondary' }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  bgcolor: isDark ? 'rgba(68, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 0,
                                  maxHeight: 300,
                                  overflow: 'auto',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: isDark ? '#f8f8f2' : 'text.primary',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {formatJson(request.requestBody)}
                                </Typography>
                              </Paper>
                            </Box>
                          </Box>
                        )}

                        {/* Response Tab */}
                        {(activeTabs[request.id] || 0) === 1 && (
                          <Box sx={{ p: 2.5 }}>
                            {request.error ? (
                              <Paper
                                sx={{
                                  p: 2,
                                  bgcolor: isDark ? 'rgba(255, 85, 85, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                                  border: `1px solid ${isDark ? 'rgba(255, 85, 85, 0.3)' : 'error.main'}`,
                                  borderRadius: 0,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    color: isDark ? '#ff5555' : 'error.main',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {request.error}
                                </Typography>
                              </Paper>
                            ) : request.responseStatus ? (
                              <>
                                <Box sx={{ mb: 2.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      mb: 1,
                                      fontWeight: 600,
                                      color: isDark ? '#bd93f9' : 'text.primary',
                                      textTransform: 'uppercase',
                                      fontSize: '10px',
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Status: {request.responseStatus}
                                  </Typography>
                                  {request.responseHeaders && Object.keys(request.responseHeaders).length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: 600,
                                            color: isDark ? '#bd93f9' : 'text.primary',
                                            textTransform: 'uppercase',
                                            fontSize: '10px',
                                            letterSpacing: 0.5,
                                          }}
                                        >
                                          Response Headers
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => copyToClipboard(formatJson(request.responseHeaders))}
                                          sx={{ p: 0.5, color: isDark ? '#8be9fd' : 'text.secondary' }}
                                        >
                                          <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                      <Paper
                                        sx={{
                                          p: 1.5,
                                          bgcolor: isDark ? 'rgba(68, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                                          border: `1px solid ${theme.palette.divider}`,
                                          borderRadius: 0,
                                          maxHeight: 150,
                                          overflow: 'auto',
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            color: isDark ? '#f8f8f2' : 'text.primary',
                                            whiteSpace: 'pre-wrap',
                                          }}
                                        >
                                          {formatJson(request.responseHeaders)}
                                        </Typography>
                                      </Paper>
                                    </Box>
                                  )}
                                </Box>
                                {request.responseBody && (
                                  <Box>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 600,
                                          color: isDark ? '#bd93f9' : 'text.primary',
                                          textTransform: 'uppercase',
                                          fontSize: '10px',
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Response Body
                                        {request.streaming && request.responseBody && typeof request.responseBody === 'object' && 'totalTokens' in request.responseBody && (
                                          <Chip
                                            label={`${request.responseBody.totalTokens} tokens`}
                                            size="small"
                                            sx={{
                                              ml: 1,
                                              borderRadius: 0,
                                              height: 18,
                                              fontSize: '9px',
                                              bgcolor: isDark ? 'rgba(80, 250, 123, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                                              color: isDark ? '#50fa7b' : 'success.main',
                                            }}
                                          />
                                        )}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() => copyToClipboard(formatJson(request.responseBody))}
                                        sx={{ p: 0.5, color: isDark ? '#8be9fd' : 'text.secondary' }}
                                      >
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                    <Paper
                                      sx={{
                                        p: 1.5,
                                        bgcolor: isDark ? 'rgba(68, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 0,
                                        maxHeight: 400,
                                        overflow: 'auto',
                                      }}
                                    >
                                      {request.streaming && request.responseBody && typeof request.responseBody === 'object' && 'streamedContent' in request.responseBody ? (
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontFamily: 'monospace',
                                              fontSize: '11px',
                                              color: isDark ? '#f8f8f2' : 'text.primary',
                                              whiteSpace: 'pre-wrap',
                                              wordBreak: 'break-word',
                                              display: 'block',
                                              mb: 2,
                                              p: 1.5,
                                              bgcolor: isDark ? 'rgba(80, 250, 123, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                                              border: `1px solid ${isDark ? 'rgba(80, 250, 123, 0.2)' : theme.palette.divider}`,
                                            }}
                                          >
                                            {request.responseBody.streamedContent || '(No content)'}
                                          </Typography>
                                          <Divider sx={{ my: 2 }} />
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontFamily: 'monospace',
                                              fontSize: '11px',
                                              color: isDark ? '#8be9fd' : 'text.secondary',
                                              whiteSpace: 'pre-wrap',
                                            }}
                                          >
                                            {formatJson(request.responseBody)}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            color: isDark ? '#f8f8f2' : 'text.primary',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {formatJson(request.responseBody)}
                                        </Typography>
                                      )}
                                    </Paper>
                                  </Box>
                                )}
                                {!request.responseBody && !request.error && (
                                  <Typography variant="body2" sx={{ color: isDark ? '#8be9fd' : 'text.secondary', fontStyle: 'italic' }}>
                                    No response body
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="body2" sx={{ color: isDark ? '#8be9fd' : 'text.secondary', fontStyle: 'italic' }}>
                                No response yet
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
