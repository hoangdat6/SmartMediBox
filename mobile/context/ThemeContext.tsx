import React, { createContext, useState, useContext } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: {
    background: string;
    text: string;
    card: string;
    cardText: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

// Create theme colors
const lightColors = {
  background: '#F5F6FA',
  text: '#333333',
  card: '#FFFFFF',
  cardText: '#333333',
  primary: '#4CAF50',
  secondary: '#03A9F4',
  accent: '#FF5722',
  border: '#E0E0E0',
};

const darkColors = {
  background: '#121212',
  text: '#E0E0E0',
  card: '#1E1E1E',
  cardText: '#E0E0E0',
  primary: '#81C784',
  secondary: '#4FC3F7',
  accent: '#FF8A65',
  border: '#333333',
};

// Default context value
const defaultTheme: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors
};

// Create context with default value
const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme();
  const [theme, setTheme] = useState<ThemeType>(deviceTheme as ThemeType || 'light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'light' ? lightColors : darkColors;
  const contextValue = { theme, toggleTheme, colors };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  // Ensure we never return undefined - fallback to default if context is somehow missing
  if (!context) {
    console.warn('useTheme must be used within a ThemeProvider');
    return defaultTheme;
  }
  return context;
};

// Note: To add persistence, install AsyncStorage with the following command:
// npm install @react-native-async-storage/async-storage
// or
// yarn add @react-native-async-storage/async-storage
