import { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'agent-devtool-theme';

export function useTheme() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      console.log('Initial theme from localStorage:', stored);
      if (stored === 'dark' || stored === 'light') {
        return stored as 'light' | 'dark';
      }
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
    }
    // Default to light mode
    console.log('Defaulting to light mode');
    return 'light';
  });

  useEffect(() => {
    console.log('Current mode state:', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      console.log('Toggling theme from', prev, 'to', newMode);
      // localStorage will be updated by useEffect
      return newMode;
    });
  };

  return { mode, toggleMode, setMode };
}
