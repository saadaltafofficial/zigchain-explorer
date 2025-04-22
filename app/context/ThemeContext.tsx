'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark theme
  const [theme, setTheme] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Effect to set dark mode after mount
  useEffect(() => {
    setMounted(true);
    // Force dark theme in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', 'dark');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  // Effect to apply dark theme
  useEffect(() => {
    if (!mounted) return;

    // Always save dark theme to localStorage
    localStorage.setItem('theme', 'dark');

    // Apply dark theme
    const applyTheme = () => {
      const newTheme = 'dark';
      
      // Apply theme to document
      const root = window.document.documentElement;
      
      // Remove any light theme class
      root.classList.remove('light');
      
      // Add dark theme class
      root.classList.add('dark');
      
      // Also set a data attribute for additional styling options
      root.setAttribute('data-theme', 'dark');
      
      console.log(`Applied theme: ${newTheme}`);
      
      setResolvedTheme(newTheme);
    };

    applyTheme();
    // No need to listen for system preference changes since we're always using dark mode
  }, [theme, mounted]);

  // Provide the actual value only after mounting to avoid hydration mismatch
  const value = {
    theme,
    setTheme,
    resolvedTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
