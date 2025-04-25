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
  // Always use dark theme regardless of what's set
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

  // Effect to always apply dark theme regardless of system preference or user selection
  useEffect(() => {
    if (!mounted) return;

    // Always save dark theme to localStorage
    localStorage.setItem('theme', 'dark');

    // Apply dark theme
    const applyTheme = () => {
      // Force dark theme regardless of what was selected
      const newTheme = 'dark';
      
      // Apply theme to document
      const root = window.document.documentElement;
      
      // Remove any light theme class
      root.classList.remove('light');
      
      // Add dark theme class
      root.classList.add('dark');
      
      // Also set a data attribute for additional styling options
      root.setAttribute('data-theme', 'dark');
      
      console.log(`Applied forced dark theme`);
      
      // Always set resolved theme to dark
      setResolvedTheme('dark');
    };

    applyTheme();
    
    // Override system preference detection
    // Add a MutationObserver to ensure dark mode stays applied
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const root = document.documentElement;
          if (!root.classList.contains('dark')) {
            root.classList.add('dark');
          }
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, [mounted]);

  // Modified setTheme to always enforce dark theme
  const enforcedSetTheme = (newTheme: Theme) => {
    console.log(`Theme selection attempted: ${newTheme}, enforcing dark theme`);
    // Always set to dark regardless of input
    setTheme('dark');
  };

  // Provide the actual value only after mounting to avoid hydration mismatch
  const value: ThemeContextType = {
    theme: 'dark' as Theme, // Always return dark as the theme with proper type casting
    setTheme: enforcedSetTheme,
    resolvedTheme: 'dark' // Always return dark as the resolved theme
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
