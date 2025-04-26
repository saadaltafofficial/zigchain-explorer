'use client';

import React, { createContext, useContext, useEffect } from 'react';

// Simplified ThemeContext that only supports dark mode
type ThemeContextType = {
  theme: 'dark';
  resolvedTheme: 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component that enforces dark mode throughout the application
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Effect to set dark mode after mount
  useEffect(() => {
    // Force dark theme in localStorage and document
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } catch (e) {
        console.error('Failed to set dark theme:', e);
      }
    }
  }, []);

  // Simplified context value with only dark mode
  const value: ThemeContextType = {
    theme: 'dark',
    resolvedTheme: 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for components to access the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
