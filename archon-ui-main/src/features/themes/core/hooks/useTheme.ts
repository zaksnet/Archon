import { useContext } from 'react';
import { ThemeContextType } from '../types';

// This will be imported from the ThemeProvider component
let ThemeContext: React.Context<ThemeContextType | undefined>;

export const setThemeContext = (context: React.Context<ThemeContextType | undefined>) => {
  ThemeContext = context;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
