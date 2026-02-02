import { createTheme } from '@mui/material/styles';

const createAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  console.log('createAppTheme called with mode:', mode, 'isDark:', isDark);

  const theme = createTheme({
    palette: {
      mode: mode as 'light' | 'dark',
      primary: {
        main: isDark ? '#bd93f9' : '#0071e3', // Dracula purple for dark, blue for light
        light: isDark ? '#d1b3ff' : '#0077ed',
        dark: isDark ? '#9d7ae8' : '#0066cc',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#282a36' : '#f5f5f7', // Dracula background
        paper: isDark ? '#44475a' : '#ffffff', // Dracula selection/paper
      },
      text: {
        primary: isDark ? '#f8f8f2' : '#1d1d1f', // Dracula foreground
        secondary: isDark ? '#6272a4' : '#86868b', // Dracula comment
      },
      divider: isDark ? '#6272a4' : '#d2d2d7', // Dracula comment color
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      h1: {
        fontSize: '56px',
        fontWeight: 600,
        lineHeight: 1.07143,
        letterSpacing: '-0.005em',
      },
      h2: {
        fontSize: '32px',
        fontWeight: 600,
        lineHeight: 1.125,
        letterSpacing: '-0.003em',
      },
      h3: {
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: 1.14286,
        letterSpacing: '-0.003em',
      },
      h4: {
        fontSize: '21px',
        fontWeight: 400,
        lineHeight: 1.2381,
        letterSpacing: '-0.022em',
      },
      body1: {
        fontSize: '17px',
        fontWeight: 400,
        lineHeight: 1.47059,
        letterSpacing: '-0.022em',
      },
      body2: {
        fontSize: '15px',
        fontWeight: 400,
        lineHeight: 1.47059,
        letterSpacing: '-0.022em',
      },
      button: {
        fontSize: '17px',
        fontWeight: 400,
        textTransform: 'none',
        letterSpacing: '-0.022em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 20px',
            fontWeight: 400,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            '&:active': {
              backgroundColor: '#0066cc',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? '0 4px 16px rgba(0, 0, 0, 0.5)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: isDark ? '1px solid #6272a4' : '1px solid #d2d2d7',
            backgroundColor: isDark ? '#44475a' : '#ffffff',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? '#44475a' : '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(68, 71, 90, 0.9)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? '#6272a4' : '#d2d2d7',
          },
        },
      },
    },
  });
  
  console.log('Theme created, actual palette mode:', theme.palette.mode);
  return theme;
};

export const getTheme = (mode: 'light' | 'dark') => createAppTheme(mode);
