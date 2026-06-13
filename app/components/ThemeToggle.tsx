'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center bg-slate-200/50 dark:bg-white/10 p-1 rounded-full backdrop-blur-md border border-slate-300/50 dark:border-white/10 shadow-lg">
      <button
        onClick={() => setTheme('light')}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
          theme === 'light' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-400 hover:text-white'
        }`}
      >
        LIGHT
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
          theme === 'dark' 
            ? 'bg-sky-500 text-white shadow-sm' 
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        DARK
      </button>
    </div>
  );
}
