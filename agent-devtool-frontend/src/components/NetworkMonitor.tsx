import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Collapse,
  Tooltip,
  Badge,
  Fab,
} from '@mui/material';
import {
  NetworkCheck as NetworkCheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import type { NetworkRequest } from './NetworkPanel';

interface NetworkMonitorProps {
  requests: NetworkRequest[];
  onClear: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NetworkMonitor({ requests, onClear, open: controlledOpen, onOpenChange }: NetworkMonitorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [internalOpen, setInternalOpen] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Auto-expand the latest request when it arrives (if panel is open)
  useEffect(() => {
    if (open && requests.length > 0) {
      const latest = requests[0];
      // Auto-expand the latest request only if no request is currently expanded
      if (expandedRequest === null || (expandedRequest !== latest.id && !requests.find(r => r.id === expandedRequest))) {
        setExpandedRequest(latest.id);
      }
    }
  }, [open, requests, expandedRequest]);

  const getStatusColor = (status?: number) => {
    if (!status) return isDark ? '#ff5555' : 'error.main';
    if (status >= 200 && status < 300) return isDark ? '#50fa7b' : 'success.main';
    if (status >= 400 && status < 500) return isDark ? '#ffb86c' : 'warning.main';
    return isDark ? '#ff5555' : 'error.main';
  };

  const getStatusIcon = (status?: number, error?: string) => {
    if (error) return <ErrorIcon sx={{ fontSize: 14, color: isDark ? '#ff5555' : 'error.main' }} />;
    if (status && status >= 200 && status < 300) return <CheckCircleIcon sx={{ fontSize: 14, color: isDark ? '#50fa7b' : 'success.main' }} />;
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

  const toggleRequest = (requestId: string) => {
    setExpandedRequest((prev) => (prev === requestId ? null : requestId));
  };

  return (
    <>
      {/* Elegant Floating Action Button */}
      {!open && requests.length > 0 && (
        <Fab
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            bgcolor: isDark ? '#1e3a8a' : '#1e40af',
            color: '#fff',
            '&:hover': {
              bgcolor: isDark ? '#1e40af' : '#1e3a8a',
              transform: 'scale(1.05)',
            },
            zIndex: 1000,
            boxShadow: isDark 
              ? '0 4px 16px rgba(30, 58, 138, 0.4)' 
              : '0 4px 16px rgba(30, 64, 175, 0.3)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Badge 
            badgeContent={requests.length} 
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                minWidth: '20px',
                height: '20px',
              },
            }}
            max={99}
          >
            <NetworkCheckIcon />
          </Badge>
        </Fab>
      )}

      {/* Elegant Network Monitor Panel */}
      {open && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 500, md: 600 },
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '16px',
            zIndex: 1001,
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes slideIn': {
              from: {
                transform: 'translateY(20px)',
                opacity: 0,
              },
              to: {
                transform: 'translateY(0)',
                opacity: 1,
              },
            },
          }}
        >
          {/* Elegant Header */}
          <Box
            sx={{
              p: 2.5,
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              bgcolor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: isDark ? '#fff' : '#1d1d1f', 
                    fontSize: '17px',
                    letterSpacing: '-0.022em',
                  }}
                >
                  Network
                </Typography>
                <Chip
                  label={requests.length}
                  size="small"
                  sx={{
                    height: '24px',
                    fontSize: '13px',
                    fontWeight: 400,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#fff' : '#1d1d1f',
                    border: 'none',
                    '& .MuiChip-label': {
                      px: 1.5,
                    },
                  }}
                />
              </Box>
              <Box display="flex" gap={1}>
                {requests.length > 0 && (
                  <Tooltip title="Clear all">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                      }}
                      sx={{
                        color: isDark ? '#ef4444' : '#dc2626',
                        '&:hover': { 
                          bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' 
                        },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  sx={{ 
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Requests List */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: isDark ? 'rgba(28, 28, 30, 0.5)' : 'rgba(0, 0, 0, 0.01)',
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
            {requests.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 6,
                  textAlign: 'center',
                }}
              >
                <NetworkCheckIcon
                  sx={{
                    fontSize: 48,
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    mb: 2,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    fontSize: '15px',
                    fontWeight: 400,
                  }}
                >
                  No network requests yet
                </Typography>
              </Box>
            ) : (
              requests.map((request, index) => {
                const isExpanded = expandedRequest === request.id;
                const isLatest = index === 0;
                
                return (
                  <Box
                    key={request.id}
                    sx={{
                      mb: 1.5,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f5f5f7',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ebebed',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    {/* Elegant Request Summary */}
                    <Box
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleRequest(request.id);
                      }}
                    >
                      {getStatusIcon(request.responseStatus, request.error)}
                      <Chip
                        label={`#${requests.length - index}`}
                        size="small"
                        sx={{
                          height: '22px',
                          minWidth: '32px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          bgcolor: isDark ? 'rgba(255, 184, 108, 0.2)' : 'rgba(255, 184, 108, 0.1)',
                          color: isDark ? '#ffb86c' : '#f59e0b',
                          border: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                      <Chip
                        label={request.method}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          height: '22px',
                          minWidth: '50px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          bgcolor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                          color: isDark ? '#a5b4fc' : '#667eea',
                          border: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                      <Chip
                        label={request.protocol.toUpperCase()}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          height: '22px',
                          fontSize: '11px',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                      {request.streaming && (
                        <Chip
                          label="SSE"
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            height: '22px',
                            fontSize: '11px',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                            color: isDark ? '#10b981' : '#059669',
                            border: 'none',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {request.responseStatus && (
                        <Chip
                          label={request.responseStatus}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            height: '22px',
                            fontSize: '11px',
                            fontWeight: 600,
                            bgcolor: getStatusColor(request.responseStatus),
                            color: isDark && request.responseStatus >= 200 && request.responseStatus < 300 ? '#282a36' : '#fff',
                            border: 'none',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0, ml: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                            fontSize: '13px',
                            color: isDark ? '#fff' : '#1d1d1f',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 400,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {request.url.replace(/^https?:\/\/[^/]+/, '')}
                        </Typography>
                        {request.duration && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                              fontWeight: 400,
                            }}
                          >
                            {request.duration}ms
                          </Typography>
                        )}
                      </Box>
                      <IconButton 
                        size="small" 
                        sx={{ 
                          p: 0.5,
                          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRequest(request.id);
                        }}
                      >
                        {isExpanded ? (
                          <ExpandLessIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <ExpandMoreIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </Box>

                    {/* Elegant Expanded Details */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box 
                        sx={{ 
                          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, 
                          p: 2.5, 
                          bgcolor: isDark ? 'rgba(28, 28, 30, 0.5)' : '#f9fafb',
                        }}
                      >
                        {/* Request */}
                        <Box sx={{ mb: 3 }}>
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
                            Request
                          </Typography>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fff',
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                              borderRadius: '10px',
                              maxHeight: 200,
                              overflow: 'auto',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                fontSize: '13px',
                                color: isDark ? '#fff' : '#1d1d1f',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.47059,
                                fontWeight: 400,
                              }}
                            >
                              {formatJson(request.requestBody)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Response */}
                        {request.responseStatus || request.error ? (
                          <Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 400,
                                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                  fontSize: '13px',
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                Response {request.responseStatus && `(${request.responseStatus})`}
                              </Typography>
                              {request.responseBody && (
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(formatJson(request.responseBody))}
                                  sx={{ 
                                    p: 0.5, 
                                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                    '&:hover': {
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                    },
                                  }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            {request.error ? (
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                  border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                                  borderRadius: '10px',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                    fontSize: '13px',
                                    color: isDark ? '#fca5a5' : '#dc2626',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.47059,
                                    fontWeight: 400,
                                  }}
                                >
                                  {request.error}
                                </Typography>
                              </Box>
                            ) : request.responseBody ? (
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fff',
                                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                  borderRadius: '10px',
                                  maxHeight: 300,
                                  overflow: 'auto',
                                }}
                              >
                                {request.streaming ? (
                                  <Box>
                                    {request.responseBody && typeof request.responseBody === 'object' && 'streamedContent' in request.responseBody ? (
                                      <>
                                        <Box
                                          sx={{
                                            mb: 2,
                                            p: 2,
                                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
                                            borderRadius: '10px',
                                            maxHeight: 200,
                                            overflow: 'auto',
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                              fontSize: '13px',
                                              color: isDark ? '#10b981' : '#059669',
                                              whiteSpace: 'pre-wrap',
                                              wordBreak: 'break-word',
                                              lineHeight: 1.47059,
                                              fontWeight: 400,
                                            }}
                                          >
                                            {request.responseBody.streamedContent || '(Waiting for stream...)'}
                                          </Typography>
                                        </Box>
                                        {request.responseBody.totalTokens && (
                                          <Chip
                                            label={`${request.responseBody.totalTokens} tokens`}
                                            size="small"
                                            sx={{
                                              height: '22px',
                                              fontSize: '11px',
                                              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                              color: isDark ? '#10b981' : '#059669',
                                              border: 'none',
                                            }}
                                          />
                                        )}
                                      </>
                                    ) : (
                                      <Box display="flex" alignItems="center" gap={1.5} py={2}>
                                        <Box
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: isDark ? '#10b981' : '#059669',
                                            animation: 'pulse 1.5s ease-in-out infinite',
                                            '@keyframes pulse': {
                                              '0%, 100%': { opacity: 1 },
                                              '50%': { opacity: 0.5 },
                                            },
                                          }}
                                        />
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: isDark ? '#10b981' : '#059669', 
                                            fontStyle: 'italic', 
                                            fontSize: '13px',
                                            fontWeight: 400,
                                          }}
                                        >
                                          Streaming in progress...
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                      fontSize: '13px',
                                      color: isDark ? '#fff' : '#1d1d1f',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      lineHeight: 1.47059,
                                      fontWeight: 400,
                                    }}
                                  >
                                    {formatJson(request.responseBody)}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 
                                  fontStyle: 'italic', 
                                  fontSize: '13px',
                                  fontWeight: 400,
                                }}
                              >
                                No response yet...
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1.5} py={2}>
                            <SendIcon sx={{ fontSize: 16, color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 
                                fontStyle: 'italic', 
                                fontSize: '13px',
                                fontWeight: 400,
                              }}
                            >
                              Waiting for response...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      )}
    </>
  );
}

