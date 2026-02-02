import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Fade,
  useTheme,
  ClickAwayListener,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  SmartToy as SmartToyIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useProfile } from '../lib/hooks/useProfile';
import { useTheme as useAppTheme } from '../lib/hooks/useTheme';
import type { Profile, AgentConfig } from '../types';
import { ProfileService } from '../lib/services/profileService';
import { downloadFile, triggerFileInput, readFileAsText } from '../lib/utils/fileUtils';

export function ProfilePage() {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { mode, toggleMode } = useAppTheme();
  const { profile, profiles: profilesFromHook, setCurrentProfile, createProfile, deleteProfile, refresh } = useProfile();
  const profiles = profilesFromHook || [];
  
  // Define profileColors before using it
  const profileColors = [
    '#0071e3', // Blue
    '#34c759', // Green
    '#ff9500', // Orange
    '#ff3b30', // Red
    '#af52de', // Purple
    '#5ac8fa', // Light Blue
    '#ff2d55', // Pink
    '#5856d6', // Indigo
  ];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    description: '',
    color: '#0071e3',
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  const handleOpenCreatePanel = () => {
    setIsCreating(true);
    setEditingProfile(null);
    setProfileFormData({
      name: '',
      description: '',
      color: getProfileColor(profiles.length),
    });
    setShowProfilePanel(true);
  };

  const handleOpenEditPanel = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setIsCreating(false);
      setEditingProfile(profile);
      setProfileFormData({
        name: profile.name,
        description: profile.description || '',
        color: profile.color || getProfileColor(profiles.indexOf(profile)),
      });
      setShowProfilePanel(true);
    }
  };

  const handleSaveProfile = () => {
    if (!profileFormData.name.trim()) {
      setMessage({ type: 'error', text: 'Profile name is required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (isCreating) {
      const newProfile = ProfileService.createProfile(
        profileFormData.name.trim(),
        profileFormData.description.trim() || undefined,
        profileFormData.color
      );
      refresh();
      // After creating, switch to edit mode so user can add agents
      const savedProfile = ProfileService.getProfiles().find(p => p.id === newProfile.id);
      if (savedProfile) {
        setEditingProfile(savedProfile);
        setIsCreating(false);
        setMessage({ type: 'success', text: `Profile "${newProfile.name}" created. You can now add agents.` });
        setTimeout(() => setMessage(null), 3000);
      }
      setSelectedProfileId(newProfile.id);
    } else if (editingProfile) {
      const updated = ProfileService.updateProfile(editingProfile.id, {
        name: profileFormData.name.trim(),
        description: profileFormData.description.trim() || undefined,
        color: profileFormData.color,
      });

      if (updated) {
        refresh();
        const refreshedProfile = ProfileService.getProfiles().find(p => p.id === updated.id);
        if (refreshedProfile) {
          setEditingProfile(refreshedProfile);
        }
        setMessage({ type: 'success', text: `Profile "${updated.name}" updated successfully` });
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    description: '',
    color: profileColors[0],
  });

  const handleAddAgent = () => {
    if (!editingProfile) return;
    
    if (!newAgentForm.name.trim()) {
      setMessage({ type: 'error', text: 'Agent name is required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newAgentForm.name.trim(),
      description: newAgentForm.description.trim(),
      enabled: true,
      supportsStreaming: false,
      restPath: `/api/agents/${newAgentForm.name.toLowerCase().replace(/\s+/g, '-')}`,
      a2aPath: `/a2a/${newAgentForm.name.replace(/\s+/g, '')}`,
    };

    if (ProfileService.addAgentToProfile(editingProfile.id, newAgent)) {
      refresh();
      const updated = ProfileService.getProfiles().find(p => p.id === editingProfile.id);
      if (updated) setEditingProfile(updated);
      setNewAgentForm({ name: '', description: '', color: profileColors[0] });
      setMessage({ type: 'success', text: `Agent "${newAgent.name}" added successfully` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateAgent = (agentId: string, updates: Partial<AgentConfig>) => {
    if (!editingProfile) return;
    
    if (ProfileService.updateAgentInProfile(editingProfile.id, agentId, updates)) {
      refresh();
      const updated = ProfileService.getProfiles().find(p => p.id === editingProfile.id);
      if (updated) setEditingProfile(updated);
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    if (!editingProfile) return;
    
    if (ProfileService.removeAgentFromProfile(editingProfile.id, agentId)) {
      refresh();
      const updated = ProfileService.getProfiles().find(p => p.id === editingProfile.id);
      if (updated) setEditingProfile(updated);
    }
  };

  const handleSelectProfile = (profileId: string) => {
    if (selectedProfileId === profileId) {
      // If clicking the same profile, close it
      setSelectedProfileId(null);
    } else {
      setSelectedProfileId(profileId);
    }
  };


  const handleContinue = (profileId?: string) => {
    const targetProfileId = profileId || selectedProfileId;
    if (targetProfileId) {
      setCurrentProfile(targetProfileId);
      setSelectedProfileId(null);
      setHoveredProfileId(null);
      navigate('/chat');
    }
  };

  const handleCloseIsland = () => {
    setSelectedProfileId(null);
  };

  const handleDeleteClick = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileToDelete(profileId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete);
      if (selectedProfileId === profileToDelete) {
        setSelectedProfileId(null);
      }
      setShowDeleteDialog(false);
      setProfileToDelete(null);
    }
  };

  const handleExportProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const exported = ProfileService.exportProfile(profileId);
    if (exported) {
      const profile = profiles.find(p => p.id === profileId);
      const filename = `${profile?.name || 'profile'}-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(exported, filename);
      setMessage({ type: 'success', text: `Profile "${profile?.name}" exported successfully` });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to export profile' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleExportAll = () => {
    const exported = ProfileService.exportAllProfiles();
    if (exported) {
      const filename = `all-profiles-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(exported, filename);
      setMessage({ type: 'success', text: 'All profiles exported successfully' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'No profiles to export' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = () => {
    triggerFileInput('.json', async (file) => {
      try {
        const content = await readFileAsText(file);
        const result = ProfileService.importProfile(content, {
          overwriteExisting: false,
          renameOnConflict: true,
        });

        if (result.success) {
          refresh();
          setMessage({ type: 'success', text: result.message });
          setTimeout(() => setMessage(null), 5000);
          
          if (result.profile) {
            setSelectedProfileId(result.profile.id);
            setCurrentProfile(result.profile.id);
          }
        } else {
          setMessage({ type: 'error', text: result.message });
          setTimeout(() => setMessage(null), 5000);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Failed to import profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        setTimeout(() => setMessage(null), 5000);
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileColor = (index: number, profile?: Profile) => {
    if (profile?.color) {
      return profile.color;
    }
    const colors = [
      '#0071e3', // Blue
      '#34c759', // Green
      '#ff9500', // Orange
      '#ff3b30', // Red
      '#af52de', // Purple
      '#5ac8fa', // Light Blue
      '#ff2d55', // Pink
      '#5856d6', // Indigo
    ];
    return colors[index % colors.length];
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        pt: 6,
        pb: 8,
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        {/* Header with Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 8,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box textAlign="left">
            <Typography variant="h1" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
              Agent DevTool
            </Typography>
            <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 400 }}>
              Select or create a profile
            </Typography>
          </Box>
          <Box display="flex" gap={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImport}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                py: 1,
              }}
            >
              Import
            </Button>
            {profiles.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportAll}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                }}
              >
                Export All
              </Button>
            )}
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleMode}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {mode === 'dark' ? (
                  <LightModeIcon sx={{ fontSize: 20 }} />
                ) : (
                  <DarkModeIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Profile Circles */}
        <ClickAwayListener onClickAway={() => setSelectedProfileId(null)}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              minHeight: '300px',
              position: 'relative',
            }}
          >
          {/* Existing Profiles */}
          {profiles.map((p, index) => {
            const isSelected = selectedProfileId === p.id;
            const isHovered = hoveredProfileId === p.id;
            const showIsland = isSelected || isHovered;
            const profileColor = getProfileColor(index, p);
            
            // Check if there's any active profile (hovered or selected)
            const hasActiveProfile = selectedProfileId !== null || hoveredProfileId !== null;
            // This profile is not the active one
            const isInactive = hasActiveProfile && !showIsland;
            
            return (
              <Fade in={true} key={p.id} timeout={300 + index * 100}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: showIsland ? 10 : 1,
                    transform: isInactive ? 'scale(0.6)' : 'scale(1)',
                    opacity: isInactive ? 0.4 : 1,
                    transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                  }}
                  onMouseEnter={() => setHoveredProfileId(p.id)}
                  onMouseLeave={() => {
                    // Don't clear hover if this profile is selected
                    if (!isSelected) {
                      setHoveredProfileId(null);
                    }
                  }}
                  onClick={() => handleSelectProfile(p.id)}
                >
                  {/* Dynamic Island - transforms from circle */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: showIsland ? '500px' : '120px',
                      height: showIsland ? '80px' : '120px',
                      borderRadius: showIsland ? '40px' : '50%',
                      bgcolor: profileColor,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: showIsland ? 'space-between' : 'center',
                      px: showIsland ? 2.5 : 0,
                      boxShadow: showIsland
                        ? '0 8px 32px rgba(0, 0, 0, 0.25)'
                        : '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Profile Avatar - stays on left */}
                    <Box
                      sx={{
                        width: showIsland ? '48px' : '100%',
                        height: showIsland ? '48px' : '100%',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          fontSize: showIsland ? '20px' : '36px',
                          userSelect: 'none',
                          transition: 'font-size 0.4s cubic-bezier(0.2, 0, 0, 1)',
                        }}
                      >
                        {getInitials(p.name)}
                      </Typography>
                    </Box>

                    {/* Expanded Content - horizontal layout */}
                    {showIsland && (
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          ml: 1.5,
                          animation: 'fadeIn 0.3s ease-out',
                          '@keyframes fadeIn': {
                            '0%': { opacity: 0, transform: 'translateX(-8px)' },
                            '100%': { opacity: 1, transform: 'translateX(0)' },
                          },
                        }}
                      >
                        {/* Profile Info */}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.25,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '15px',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <SmartToyIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                }}
                              >
                                {p.agents.length}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <ScheduleIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                }}
                              >
                                {new Date(p.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          {/* Edit Button */}
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={(e) => handleOpenEditPanel(p.id, e)}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                                },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Export Button */}
                          <Tooltip title="Export">
                            <IconButton
                              onClick={(e) => handleExportProfile(p.id, e)}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                                },
                              }}
                            >
                              <DownloadIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Delete Button */}
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={(e) => handleDeleteClick(p.id, e)}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 59, 48, 0.3)',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Go Button - Special prominent button, always visible when island is shown */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinue(p.id);
                            }}
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                            sx={{
                              textTransform: 'none',
                              py: 1,
                              px: 2.5,
                              fontSize: '14px',
                              fontWeight: 600,
                              borderRadius: '22px',
                              bgcolor: 'rgba(255, 255, 255, 0.95)',
                              color: profileColor,
                              border: 'none',
                              minWidth: 'auto',
                              ml: 0.75,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                              '&:hover': {
                                bgcolor: 'white',
                                transform: 'scale(1.08)',
                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            Go
                          </Button>
                        </Box>
                      </Box>
                    )}

                  </Box>

                  {/* Profile Name (only when island is not shown) */}
                  {!showIsland && (
                    <>
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 2,
                          fontWeight: 400,
                          color: 'text.primary',
                          textAlign: 'center',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            textAlign: 'center',
                            maxWidth: 120,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.description}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Fade>
            );
          })}

          {/* Add New Profile Circle */}
          <Fade in={true} timeout={300 + profiles.length * 100}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transform: (selectedProfileId !== null || hoveredProfileId !== null) ? 'scale(0.6)' : 'scale(1)',
                opacity: (selectedProfileId !== null || hoveredProfileId !== null) ? 0.4 : 1,
                transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
              }}
              onClick={handleOpenCreatePanel}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: '4px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'background.default',
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <Typography
                variant="body1"
                sx={{
                  mt: 2,
                  fontWeight: 400,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                Add Profile
              </Typography>
            </Box>
          </Fade>
        </Box>
        </ClickAwayListener>


        {/* Empty State */}
        {profiles.length === 0 && !showProfilePanel && (
          <Box textAlign="center" py={8}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '4px dashed',
                borderColor: 'divider',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                mb: 3,
              }}
            >
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
              No profiles yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first profile to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreatePanel}
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Create Profile
            </Button>
          </Box>
        )}
      </Container>

      {/* Profile Editor - Bottom Panel */}
      {showProfilePanel && (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: profileFormData.color || 'primary.main',
                color: 'white',
              }}
            >
              <Typography variant="h4" sx={{ fontSize: '20px', fontWeight: 600 }}>
                {isCreating ? 'New Profile' : 'Edit Profile'}
              </Typography>
              <IconButton
                onClick={() => {
                  setShowProfilePanel(false);
                  setEditingProfile(null);
                  setIsCreating(false);
                }}
                size="small"
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
              {/* Profile Info */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 3, mb: 2 }}>
                  <TextField
                    autoFocus
                    fullWidth
                    label="Profile Name"
                    required
                    size="small"
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    placeholder="e.g., Development"
                  />
                  <Box sx={{ width: 120 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                      Color
                    </Typography>
                    <Grid container spacing={1}>
                      {profileColors.map((color) => (
                        <Grid item key={color} xs={4}>
                          <Box
                            onClick={() => setProfileFormData({ ...profileFormData, color })}
                            sx={{
                              width: '100%',
                              aspectRatio: '1',
                              borderRadius: '50%',
                              bgcolor: color,
                              cursor: 'pointer',
                              border: profileFormData.color === color ? '2px solid' : '2px solid transparent',
                              borderColor: profileFormData.color === color ? 'primary.main' : 'divider',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  size="small"
                  value={profileFormData.description}
                  onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Agents Section */}
              <Box>
                <Typography variant="h4" sx={{ fontSize: '17px', fontWeight: 600, mb: 2 }}>
                  Agents
                </Typography>

                {isCreating ? (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Save profile first to add agents
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Add Agent Form - Simple Creation */}
                    {editingProfile && (
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.default',
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: 'text.secondary' }}>
                          Add New Agent
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, mb: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Agent name"
                            value={newAgentForm.name}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                          />
                          <Box sx={{ width: 100 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                              Color
                            </Typography>
                            <Grid container spacing={0.5}>
                              {profileColors.map((color) => (
                                <Grid item key={color} xs={4}>
                                  <Box
                                    onClick={() => setNewAgentForm({ ...newAgentForm, color })}
                                    sx={{
                                      width: '100%',
                                      aspectRatio: '1',
                                      borderRadius: '50%',
                                      bgcolor: color,
                                      cursor: 'pointer',
                                      border: newAgentForm.color === color ? '2px solid' : '1px solid transparent',
                                      borderColor: newAgentForm.color === color ? 'primary.main' : 'divider',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Description (optional)"
                          multiline
                          rows={2}
                          value={newAgentForm.description}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, description: e.target.value })}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          startIcon={<AddIcon />}
                          onClick={handleAddAgent}
                          variant="contained"
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          Add Agent
                        </Button>
                      </Box>
                    )}

                    {/* Existing Agents List */}
                    {editingProfile && editingProfile.agents.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {editingProfile.agents.map((agent) => (
                          <Box
                            key={agent.id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.default',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 1.5,
                                  bgcolor: profileFormData.color || 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <SmartToyIcon sx={{ fontSize: 18, color: 'white' }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                                  {agent.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {agent.description || 'No description'}
                                </Typography>
                              </Box>
                              <IconButton
                                onClick={() => handleRemoveAgent(agent.id)}
                                size="small"
                                sx={{ 
                                  color: 'text.secondary',
                                  '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                p: 2.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                bgcolor: 'background.default',
              }}
            >
              <Button
                onClick={() => {
                  setShowProfilePanel(false);
                  setEditingProfile(null);
                  setIsCreating(false);
                }}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ textTransform: 'none' }}
              >
                {isCreating ? 'Create' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Container>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setProfileToDelete(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '21px', fontWeight: 600 }}>
          Delete Profile?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to delete this profile? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setShowDeleteDialog(false);
              setProfileToDelete(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete
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
          sx={{ borderRadius: 2 }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
