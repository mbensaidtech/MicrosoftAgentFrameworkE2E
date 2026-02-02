import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useProfile } from '../../lib/hooks/useProfile';
import { useTheme as useAppTheme } from '../../lib/hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { mode, toggleMode } = useAppTheme();
  const { profile, profiles, setCurrentProfile } = useProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileChange = (profileId: string) => {
    setCurrentProfile(profileId);
    handleProfileMenuClose();
    window.location.reload();
  };

  const handleSwitchProfile = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ maxWidth: '1400px', mx: 'auto', width: '100%', px: 3 }}>
          <Box display="flex" alignItems="center" gap={4} flex={1}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: 'primary.main',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon sx={{ fontSize: 16, color: 'white' }} />
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Agent DevTool
              </Typography>
            </Link>
            <Box display="flex" gap={0.5}>
              <Button
                component={Link}
                to="/chat"
                sx={{
                  color: isActive('/chat') ? 'white' : 'text.secondary',
                  bgcolor: isActive('/chat') ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/chat') ? 'primary.light' : 'background.default',
                  },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                }}
              >
                Chat
              </Button>
              <Button
                component={Link}
                to="/agents"
                sx={{
                  color: isActive('/agents') ? 'white' : 'text.secondary',
                  bgcolor: isActive('/agents') ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/agents') ? 'primary.light' : 'background.default',
                  },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                }}
              >
                Agents
              </Button>
              <Button
                component={Link}
                to="/settings"
                sx={{
                  color: isActive('/settings') ? 'white' : 'text.secondary',
                  bgcolor: isActive('/settings') ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/settings') ? 'primary.light' : 'background.default',
                  },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                }}
              >
                Settings
              </Button>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
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
            {profile && (
              <Button
                onClick={handleProfileMenuOpen}
                startIcon={
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                    <PersonIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                }
                sx={{
                  color: 'text.primary',
                  bgcolor: 'background.default',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e8e8ed',
                  },
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                {profile.name}
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  width: 280,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Current Profile
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {profile?.name}
                </Typography>
                {profile?.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {profile.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {profile?.agents.length} agent{profile?.agents.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Switch Profile
                </Typography>
                {profiles
                  .filter((p) => p.id !== profile?.id)
                  .map((p) => (
                    <MenuItem
                      key={p.id}
                      onClick={() => handleProfileChange(p.id)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText primary={p.name} />
                      <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </MenuItem>
                  ))}
              </Box>
              <Divider />
              <MenuItem onClick={handleSwitchProfile} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Manage Profiles..." />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ maxWidth: '1400px', mx: 'auto', py: 4, px: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
