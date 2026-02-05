import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  SmartToy as SmartToyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FiberManualRecord as FiberManualRecordIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { useProfile } from '../lib/hooks/useProfile';
import { ProfileService } from '../lib/services/profileService';
import { triggerFileInput, readFileAsText } from '../lib/utils/fileUtils';
import type { AgentConfig } from '../types';

export function AgentsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { profile, refresh } = useProfile();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    enabled: true,
    supportsStreaming: false,
    conversational: true,
    restPath: '',
    a2aPath: '',
    backendUrl: '',
    presetQuestions: [] as string[],
  });
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    if (profile) {
      setAgents(profile.agents || []);
    } else {
      setAgents([]);
    }
  }, [profile]);

  const handleOpenDialog = (agent?: AgentConfig) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        id: agent.id,
        name: agent.name,
        description: agent.description || '',
        enabled: agent.enabled,
        supportsStreaming: agent.supportsStreaming,
        conversational: agent.conversational ?? true,
        restPath: agent.restPath,
        a2aPath: agent.a2aPath,
        backendUrl: agent.backendUrl || profile?.backendUrl || 'http://localhost:5017',
        presetQuestions: agent.presetQuestions || [],
      });
    } else {
      setEditingAgent(null);
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setFormData({
        id: agentId,
        name: '',
        description: '',
        enabled: true,
        supportsStreaming: false,
        conversational: true,
        restPath: '',
        a2aPath: '',
        backendUrl: profile?.backendUrl || 'http://localhost:5017',
        presetQuestions: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAgent(null);
    setNewQuestion('');
  };

  const handleSaveAgent = () => {
    if (!profile) {
      setMessage({ type: 'error', text: 'No profile selected. Please select a profile first.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Agent name is required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!formData.restPath.trim()) {
      setMessage({ type: 'error', text: 'REST path is required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!formData.a2aPath.trim()) {
      setMessage({ type: 'error', text: 'A2A path is required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const agent: AgentConfig = {
      id: formData.id,
      name: formData.name.trim(),
      description: formData.description.trim() || '',
      enabled: formData.enabled,
      supportsStreaming: formData.supportsStreaming,
      conversational: formData.conversational,
      restPath: formData.restPath.trim(),
      a2aPath: formData.a2aPath.trim(),
      backendUrl: formData.backendUrl.trim() || undefined,
      presetQuestions: formData.presetQuestions.length > 0 ? formData.presetQuestions : undefined,
    };

    if (editingAgent) {
      if (ProfileService.updateAgentInProfile(profile.id, agent.id, agent)) {
        refresh();
        setMessage({ type: 'success', text: `Agent "${agent.name}" updated successfully` });
        setTimeout(() => setMessage(null), 3000);
        handleCloseDialog();
      } else {
        setMessage({ type: 'error', text: 'Failed to update agent' });
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      if (ProfileService.addAgentToProfile(profile.id, agent)) {
        refresh();
        setMessage({ type: 'success', text: `Agent "${agent.name}" added successfully` });
        setTimeout(() => setMessage(null), 3000);
        handleCloseDialog();
      } else {
        setMessage({ type: 'error', text: 'Agent with this ID already exists' });
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    if (!profile) return;

    if (ProfileService.removeAgentFromProfile(profile.id, agentId)) {
      refresh();
      setMessage({ type: 'success', text: 'Agent deleted successfully' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to delete agent' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleToggleEnabled = (agentId: string, enabled: boolean) => {
    if (!profile) return;

    if (ProfileService.updateAgentInProfile(profile.id, agentId, { enabled })) {
      refresh();
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData({
        ...formData,
        presetQuestions: [...formData.presetQuestions, newQuestion.trim()],
      });
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData({
      ...formData,
      presetQuestions: formData.presetQuestions.filter((_, i) => i !== index),
    });
  };

  const generatePaths = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    return {
      restPath: `/api/agents/${normalizedName}`,
      a2aPath: `/a2a/${name.replace(/\s+/g, '')}`,
    };
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      ...(formData.restPath === '' || formData.restPath.startsWith('/api/agents/') ? generatePaths(name) : {}),
    });
  };

  const handleImportAgents = () => {
    if (!profile) return;

    triggerFileInput('.json', async (file) => {
      try {
        const content = await readFileAsText(file);
        const data = JSON.parse(content);

        // Support multiple formats:
        // 1. Array of agents: [{ id, name, ... }, ...]
        // 2. Object with agents array: { agents: [...] }
        // 3. Profile format: { profile: { agents: [...] } }
        let agentsToImport: AgentConfig[] = [];

        if (Array.isArray(data)) {
          // Format 1: Direct array of agents
          agentsToImport = data;
        } else if (data.agents && Array.isArray(data.agents)) {
          // Format 2: Object with agents array
          agentsToImport = data.agents;
        } else if (data.profile?.agents && Array.isArray(data.profile.agents)) {
          // Format 3: Profile format
          agentsToImport = data.profile.agents;
        } else {
          setMessage({ type: 'error', text: 'Invalid file format. Expected an array of agents or an object with an "agents" field.' });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        if (agentsToImport.length === 0) {
          setMessage({ type: 'error', text: 'No agents found in the file.' });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        // Validate and import each agent
        let importedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const agentData of agentsToImport) {
          // Validate required fields
          if (!agentData.id || !agentData.name || !agentData.restPath || !agentData.a2aPath) {
            errors.push(`Agent "${agentData.name || 'Unknown'}" is missing required fields (id, name, restPath, or a2aPath)`);
            skippedCount++;
            continue;
          }

          // Check if agent already exists
          const existingAgent = profile.agents?.find((a) => a.id === agentData.id);
          if (existingAgent) {
            skippedCount++;
            continue; // Skip existing agents
          }

          // Create agent config with defaults
          const agent: AgentConfig = {
            id: agentData.id,
            name: agentData.name,
            description: agentData.description || '',
            enabled: agentData.enabled !== undefined ? agentData.enabled : true,
            supportsStreaming: agentData.supportsStreaming !== undefined ? agentData.supportsStreaming : false,
            conversational: agentData.conversational !== undefined ? agentData.conversational : true,
            restPath: agentData.restPath,
            a2aPath: agentData.a2aPath,
            backendUrl: agentData.backendUrl || profile.backendUrl || undefined,
            presetQuestions: agentData.presetQuestions || undefined,
          };

          if (ProfileService.addAgentToProfile(profile.id, agent)) {
            importedCount++;
          } else {
            skippedCount++;
          }
        }

        refresh();

        // Show success/error message
        if (importedCount > 0) {
          const message = `Successfully imported ${importedCount} agent${importedCount !== 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`;
          setMessage({ type: 'success', text: message });
        } else {
          setMessage({ type: 'error', text: `No agents imported. ${skippedCount > 0 ? 'All agents already exist or have invalid data.' : ''}` });
        }

        if (errors.length > 0) {
          console.error('Import errors:', errors);
        }

        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Failed to import agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        setTimeout(() => setMessage(null), 5000);
      }
    });
  };

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            p: 6,
            textAlign: 'center',
          }}
        >
          <SettingsIcon
            sx={{
              fontSize: 48,
              color: isDark ? '#bd93f9' : 'text.secondary',
              mb: 2,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: 500,
              color: isDark ? '#f8f8f2' : 'text.primary',
            }}
          >
            No Profile Selected
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#bd93f9' : 'text.secondary',
            }}
          >
            Please select or create a profile first to manage agents.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              color: isDark ? '#f8f8f2' : 'text.primary',
            }}
          >
            Agent Management
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#bd93f9' : 'text.secondary',
            }}
          >
            {profile.name} • {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={handleImportAgents}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 0,
              borderColor: isDark ? 'rgba(189, 147, 249, 0.3)' : theme.palette.divider,
              color: isDark ? '#bd93f9' : 'text.primary',
              '&:hover': {
                borderColor: isDark ? '#bd93f9' : undefined,
                bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Import Agents
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 0,
              boxShadow: 'none',
              bgcolor: isDark ? '#bd93f9' : undefined,
              color: isDark ? '#282a36' : undefined,
              '&:hover': {
                boxShadow: 'none',
                bgcolor: isDark ? '#d1b3ff' : undefined,
              },
            }}
          >
            Add Agent
          </Button>
        </Box>
      </Box>

      {/* Agents Table */}
      {agents.length === 0 ? (
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            p: 8,
            textAlign: 'center',
          }}
        >
          <SmartToyIcon
            sx={{
              fontSize: 48,
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
            No agents configured yet
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: isDark ? '#bd93f9' : 'text.secondary',
            }}
          >
            Add your first agent to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 0,
              boxShadow: 'none',
              bgcolor: isDark ? '#bd93f9' : undefined,
              color: isDark ? '#282a36' : undefined,
              '&:hover': {
                boxShadow: 'none',
                bgcolor: isDark ? '#d1b3ff' : undefined,
              },
            }}
          >
            Add Agent
          </Button>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            boxShadow: 'none',
            bgcolor: 'background.paper',
          }}
        >
          <Table>
            <TableHead>
            <TableRow
              sx={{
                bgcolor: isDark ? 'rgba(189, 147, 249, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Agent
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Streaming
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                REST Path
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                A2A Path
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  py: 2,
                  borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Actions
              </TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent, index) => (
                <TableRow
                  key={agent.id}
                  sx={{
                    borderBottom: `1px solid ${isDark ? 'rgba(98, 114, 164, 0.2)' : theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(189, 147, 249, 0.05)' : 'rgba(0, 0, 0, 0.01)',
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: agent.enabled
                            ? isDark
                              ? '#50fa7b'
                              : '#34c759'
                            : isDark
                              ? '#ff5555'
                              : '#86868b',
                          boxShadow: agent.enabled
                            ? isDark
                              ? '0 0 8px rgba(80, 250, 123, 0.5)'
                              : '0 0 4px rgba(52, 199, 89, 0.3)'
                            : 'none',
                        }}
                      />
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            mb: 0.25,
                            color: isDark ? '#f8f8f2' : 'text.primary',
                          }}
                        >
                          {agent.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isDark ? '#bd93f9' : 'text.secondary',
                          }}
                        >
                          {agent.description || 'No description'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={agent.enabled ? 'Enabled' : 'Disabled'}
                      size="small"
                      sx={{
                        bgcolor: agent.enabled
                          ? isDark
                            ? 'rgba(80, 250, 123, 0.2)'
                            : 'rgba(52, 199, 89, 0.1)'
                          : isDark
                            ? 'rgba(255, 85, 85, 0.15)'
                            : 'transparent',
                        color: agent.enabled
                          ? isDark
                            ? '#50fa7b'
                            : '#34c759'
                          : isDark
                            ? '#ff5555'
                            : '#86868b',
                        border: `1px solid ${
                          agent.enabled
                            ? isDark
                              ? 'rgba(80, 250, 123, 0.5)'
                              : 'rgba(52, 199, 89, 0.3)'
                            : isDark
                              ? 'rgba(255, 85, 85, 0.4)'
                              : theme.palette.divider
                        }`,
                        borderRadius: 0,
                        fontWeight: 600,
                        height: 26,
                        fontSize: '12px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={agent.supportsStreaming ? 'Yes' : 'No'}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderRadius: 0,
                        height: 26,
                        fontSize: '12px',
                        borderColor: isDark ? 'rgba(189, 147, 249, 0.4)' : theme.palette.divider,
                        color: isDark
                          ? agent.supportsStreaming
                            ? '#bd93f9'
                            : '#8be9fd'
                          : '#86868b',
                        fontWeight: agent.supportsStreaming ? 600 : 400,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: isDark ? '#8be9fd' : '#86868b',
                        fontWeight: 500,
                      }}
                    >
                      {agent.restPath}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: isDark ? '#8be9fd' : '#86868b',
                        fontWeight: 500,
                      }}
                    >
                      {agent.a2aPath}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                      <Tooltip title={agent.enabled ? 'Disable' : 'Enable'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEnabled(agent.id, !agent.enabled)}
                          sx={{
                            borderRadius: 0,
                        color: agent.enabled
                          ? isDark
                            ? '#50fa7b'
                            : '#34c759'
                          : isDark
                            ? '#ff5555'
                            : '#86868b',
                            '&:hover': {
                              bgcolor: agent.enabled
                                ? isDark
                                  ? 'rgba(80, 250, 123, 0.1)'
                                  : 'rgba(52, 199, 89, 0.1)'
                                : isDark
                                  ? 'rgba(255, 85, 85, 0.1)'
                                  : 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          {agent.enabled ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(agent)}
                          sx={{
                            borderRadius: 0,
                            color: isDark ? '#bd93f9' : 'text.secondary',
                            '&:hover': {
                              color: isDark ? '#d1b3ff' : '#0071e3',
                              bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAgent(agent.id)}
                          sx={{
                            borderRadius: 0,
                            color: isDark ? '#ff5555' : '#86868b',
                            '&:hover': {
                              color: isDark ? '#ff6e6e' : 'error.main',
                              bgcolor: isDark ? 'rgba(255, 85, 85, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Agent Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            pb: 2,
            borderBottom: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
            color: isDark ? '#f8f8f2' : 'text.primary',
          }}
        >
          {editingAgent ? 'Edit Agent' : 'Add New Agent'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Agent ID"
              value={formData.id}
              disabled
              size="small"
              helperText="Auto-generated unique identifier"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? '#bd93f9' : undefined,
                },
                '& .MuiFormHelperText-root': {
                  color: isDark ? '#8be9fd' : undefined,
                },
              }}
            />

            <TextField
              label="Agent Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Policy Agent"
              helperText="This will be used to generate REST and A2A paths if left empty"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? '#bd93f9' : undefined,
                  '&.Mui-focused': {
                    color: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: isDark ? '#8be9fd' : undefined,
                },
              }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this agent does..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? '#bd93f9' : undefined,
                  '&.Mui-focused': {
                    color: isDark ? '#bd93f9' : undefined,
                  },
                },
              }}
            />

            <TextField
              label="Backend URL"
              fullWidth
              value={formData.backendUrl}
              onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
              placeholder="http://localhost:5017"
              helperText="Base URL of the backend API. If empty, will use the profile's backend URL."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? '#bd93f9' : undefined,
                  '&.Mui-focused': {
                    color: isDark ? '#bd93f9' : undefined,
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: isDark ? '#8be9fd' : undefined,
                },
              }}
            />

            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 1.5,
                  fontWeight: 500,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Paths
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="REST Path"
                    required
                    fullWidth
                    size="small"
                    value={formData.restPath}
                    onChange={(e) => setFormData({ ...formData, restPath: e.target.value })}
                    placeholder="/api/agents/policy"
                    helperText="HTTP endpoint path"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        '&.Mui-focused fieldset': {
                          borderColor: isDark ? '#bd93f9' : undefined,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDark ? '#bd93f9' : undefined,
                        '&.Mui-focused': {
                          color: isDark ? '#bd93f9' : undefined,
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: isDark ? '#8be9fd' : undefined,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="A2A Path"
                    required
                    fullWidth
                    size="small"
                    value={formData.a2aPath}
                    onChange={(e) => setFormData({ ...formData, a2aPath: e.target.value })}
                    placeholder="/a2a/PolicyAgent"
                    helperText="Agent-to-Agent protocol path"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        '&.Mui-focused fieldset': {
                          borderColor: isDark ? '#bd93f9' : undefined,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDark ? '#bd93f9' : undefined,
                        '&.Mui-focused': {
                          color: isDark ? '#bd93f9' : undefined,
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: isDark ? '#8be9fd' : undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Settings
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                  }
                  label="Enabled"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.conversational}
                      onChange={(e) => setFormData({ ...formData, conversational: e.target.checked })}
                    />
                  }
                  label="Conversational"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.supportsStreaming}
                      onChange={(e) => setFormData({ ...formData, supportsStreaming: e.target.checked })}
                    />
                  }
                  label="Supports Streaming (SSE)"
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: isDark ? '#bd93f9' : 'text.primary',
                }}
              >
                Preset Questions (Optional)
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a preset question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddQuestion();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      '&.Mui-focused fieldset': {
                        borderColor: isDark ? '#bd93f9' : undefined,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: isDark ? '#bd93f9' : undefined,
                      '&.Mui-focused': {
                        color: isDark ? '#bd93f9' : undefined,
                      },
                    },
                    '& input::placeholder': {
                      color: isDark ? '#8be9fd' : undefined,
                      opacity: isDark ? 0.6 : undefined,
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddQuestion}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    borderColor: isDark ? 'rgba(189, 147, 249, 0.4)' : theme.palette.divider,
                    color: isDark ? '#bd93f9' : undefined,
                    '&:hover': {
                      boxShadow: 'none',
                      borderColor: isDark ? '#bd93f9' : theme.palette.divider,
                      bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : undefined,
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              {formData.presetQuestions.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.presetQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      onDelete={() => handleRemoveQuestion(index)}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.4)' : theme.palette.divider}`,
                        color: isDark ? '#bd93f9' : undefined,
                        '& .MuiChip-deleteIcon': {
                          color: isDark ? '#bd93f9' : undefined,
                          '&:hover': {
                            color: isDark ? '#ff5555' : undefined,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            borderTop: `1px solid ${isDark ? 'rgba(189, 147, 249, 0.2)' : theme.palette.divider}`,
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: 'none',
              borderRadius: 0,
              color: isDark ? '#bd93f9' : 'text.secondary',
              '&:hover': {
                bgcolor: isDark ? 'rgba(189, 147, 249, 0.1)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAgent}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              bgcolor: isDark ? '#bd93f9' : undefined,
              color: isDark ? '#282a36' : undefined,
              '&:hover': {
                boxShadow: 'none',
                bgcolor: isDark ? '#d1b3ff' : undefined,
              },
            }}
          >
            {editingAgent ? 'Save Changes' : 'Add Agent'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={message?.type === 'success' ? 3000 : 5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={message?.type}
          onClose={() => setMessage(null)}
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Container>
  );
}
