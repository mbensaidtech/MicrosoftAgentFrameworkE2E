import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.tsx'
import { useTheme } from './lib/hooks/useTheme'
import { getTheme } from './theme'

function AppWithTheme() {
  const { mode } = useTheme();
  const theme = useMemo(() => {
    console.log('Creating theme with mode:', mode);
    const newTheme = getTheme(mode);
    console.log('Theme created, mode in theme:', newTheme.palette.mode);
    return newTheme;
  }, [mode]);

  console.log('AppWithTheme render, mode:', mode, 'theme mode:', theme.palette.mode);

  return (
    <ThemeProvider theme={theme} key={mode}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>,
)
