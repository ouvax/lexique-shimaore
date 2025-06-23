// ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('themeMode');
      const initialMode = (saved as ThemeMode) || 'system';
      setMode(initialMode);
    };
    load();
  }, []);

  useEffect(() => {
    const resolveTheme = () => {
      if (mode === 'system') {
        const colorScheme = Appearance.getColorScheme();
        setTheme(colorScheme === 'dark' ? 'dark' : 'light');
      } else {
        setTheme(mode);
      }
      AsyncStorage.setItem('themeMode', mode);
    };
    resolveTheme();
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
