import { Theme } from '../types';

/**
 * Get the stored theme from localStorage
 */
export const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('theme') as Theme | null;
};

/**
 * Store theme in localStorage
 */
export const storeTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

/**
 * Get system theme preference
 */
export const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Apply theme to document element
 */
export const applyThemeToDocument = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  // Remove both classes first
  root.classList.remove('dark', 'light');
  // Add the current theme class
  root.classList.add(theme);
};

/**
 * Get default theme (system preference or fallback to dark)
 */
export const getDefaultTheme = (): Theme => {
  const stored = getStoredTheme();
  if (stored) return stored;
  
  return getSystemTheme();
};

/**
 * Validate theme value
 */
export const isValidTheme = (theme: string): theme is Theme => {
  return theme === 'dark' || theme === 'light';
};

/**
 * Get theme-aware color classes for different accent colors
 */
export const getAccentColorClasses = (accentColor: 'purple' | 'green' | 'pink' | 'blue') => {
  const colorMap = {
    purple: {
      border: 'border-purple-300 dark:border-purple-500/30',
      hover: 'hover:border-purple-400 dark:hover:border-purple-500/60',
      text: 'text-purple-600 dark:text-purple-500',
      bg: 'from-purple-100/80 to-purple-50/60 dark:from-white/10 dark:to-black/30'
    },
    green: {
      border: 'border-emerald-300 dark:border-emerald-500/30',
      hover: 'hover:border-emerald-400 dark:hover:border-emerald-500/60',
      text: 'text-emerald-600 dark:text-emerald-500',
      bg: 'from-emerald-100/80 to-emerald-50/60 dark:from-white/10 dark:to-black/30'
    },
    pink: {
      border: 'border-pink-300 dark:border-pink-500/30',
      hover: 'hover:border-pink-400 dark:hover:border-pink-500/60',
      text: 'text-pink-600 dark:text-pink-500',
      bg: 'from-pink-100/80 to-pink-50/60 dark:from-white/10 dark:to-black/30'
    },
    blue: {
      border: 'border-blue-300 dark:border-blue-500/30',
      hover: 'hover:border-blue-400 dark:hover:border-blue-500/60',
      text: 'text-blue-600 dark:text-blue-500',
      bg: 'from-blue-100/80 to-blue-50/60 dark:from-white/10 dark:to-black/30'
    }
  };
  
  return colorMap[accentColor];
};
