/**
 * Theme Provider with Dark Mode Support
 * Provides theme context and dark/light mode switching
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightTheme, darkTheme } from '@/theme/paperTheme';
import type { ThemeContextType } from '@/theme/paperTheme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@drouple:theme_preference';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (!isLoading) {
      // Only update if user hasn't set a manual preference
      loadThemePreference();
    }
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const storedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (storedPreference === null) {
        // No stored preference, use system preference
        setIsDark(systemColorScheme === 'dark');
      } else {
        // Use stored preference
        setIsDark(storedPreference === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system preference
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        newIsDark ? 'dark' : 'light'
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const resetToSystemTheme = async () => {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      setIsDark(systemColorScheme === 'dark');
    } catch (error) {
      console.error('Error resetting theme preference:', error);
    }
  };

  const contextValue: ThemeContextType = {
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
    resetToSystemTheme,
    isSystemTheme: false, // TODO: Track if using system theme
    systemColorScheme,
  };

  if (isLoading) {
    // Return a minimal provider while loading
    return (
      <PaperProvider theme={lightTheme}>
        {children}
      </PaperProvider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={contextValue.theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export for convenience
export { ThemeContext };
export default ThemeProvider;