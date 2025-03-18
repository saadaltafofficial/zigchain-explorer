'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme change with explicit function
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log(`Setting theme to: ${newTheme}`);
    
    // Check if document has the dark class before change
    const hasDarkClass = document.documentElement.classList.contains('dark');
    console.log(`Before change - Dark class present: ${hasDarkClass}`);
    
    setTheme(newTheme);
    
    // Check again after a short delay
    setTimeout(() => {
      const hasDarkClassAfter = document.documentElement.classList.contains('dark');
      console.log(`After change - Dark class present: ${hasDarkClassAfter}`);
    }, 100);
  };

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <div className="w-[120px] h-[40px]" />;
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-blue-500">
        <button
          onClick={() => handleThemeChange('light')}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === 'light' 
              ? 'bg-white text-yellow-500 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Light mode"
          aria-label="Switch to light mode"
        >
          <Sun size={14} />
        </button>
        
        <button
          onClick={() => handleThemeChange('dark')}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-800 text-blue-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Dark mode"
          aria-label="Switch to dark mode"
        >
          <Moon size={14} />
        </button>
        
        <button
          onClick={() => handleThemeChange('system')}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === 'system' 
              ? (resolvedTheme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-white text-yellow-500') + ' shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="System preference"
          aria-label="Use system theme preference"
        >
          <Monitor size={14} />
        </button>
      </div>
    </div>
  );
}
