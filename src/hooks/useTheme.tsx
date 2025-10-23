import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode } from '../types/theme';
import { lightTheme, darkTheme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (systemColorScheme === 'dark' || systemColorScheme === 'light') ? systemColorScheme : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    if (systemColorScheme === 'dark' || systemColorScheme === 'light') {
      setThemeMode(systemColorScheme);
    }
  }, [systemColorScheme]);

  const theme = themeMode === 'light' ? lightTheme : darkTheme;
  const isDark = themeMode === 'dark';

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};