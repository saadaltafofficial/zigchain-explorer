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
  // Initialize with a default theme to prevent hydration mismatch
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Effect to initialize theme from localStorage after mount
  useEffect(() => {
    setMounted(true);
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
          setTheme(storedTheme as Theme);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  // Effect to apply theme changes
  useEffect(() => {
    if (!mounted) return;

    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);

    // Determine the actual theme based on the selected option
    const applyTheme = () => {
      let newTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        newTheme = theme;
      }
      
      // Apply theme to document
      const root = window.document.documentElement;
      
      // Remove the previous theme class
      root.classList.remove('light', 'dark');
      
      // Add the new theme class
      root.classList.add(newTheme);
      
      // Also set a data attribute for additional styling options
      root.setAttribute('data-theme', newTheme);
      
      console.log(`Applied theme: ${newTheme}`);
      
      setResolvedTheme(newTheme);
    };

    applyTheme();

    // Listen for system preference changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      // Use the correct event listener method based on browser support
      try {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } catch (_) {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
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
