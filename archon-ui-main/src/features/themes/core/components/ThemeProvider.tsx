import React, { useEffect, useState, createContext } from 'react';
import { Theme, ThemeContextType, ThemeProviderProps } from '../types';
import { getStoredTheme, storeTheme, applyThemeToDocument, getDefaultTheme } from '../utils';
import { setThemeContext } from '../hooks/useTheme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Set the context for the useTheme hook
setThemeContext(ThemeContext);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Initialize theme from storage or system preference
    const defaultTheme = getDefaultTheme();
    setThemeState(defaultTheme);
  }, []);

  useEffect(() => {
    // Apply theme to document and save to localStorage
    applyThemeToDocument(theme);
    storeTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
