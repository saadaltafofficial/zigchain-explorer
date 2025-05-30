'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon } from 'lucide-react';

export default function ThemeSwitcher() {
  // Simple component that just displays dark mode indicator
  return (
    <div className="relative inline-block">
      <div className="flex items-center bg-gray-700 p-1 rounded-lg border border-gray-600">
        <div
          className="p-2 rounded-md bg-gray-800 text-blue-300 shadow-sm border border-gray-700 flex items-center gap-2"
          title="Dark mode enforced"
          aria-label="Dark mode is always enforced"
        >
          <Moon size={16} />
          <span className="text-xs font-medium">Dark Mode</span>
        </div>
      </div>
    </div>
  );
}
