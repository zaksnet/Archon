export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export interface ThemeToggleProps {
  accentColor?: 'purple' | 'green' | 'pink' | 'blue';
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
}

export interface ThemeColors {
  purple: ThemeConfig;
  green: ThemeConfig;
  pink: ThemeConfig;
  blue: ThemeConfig;
}
