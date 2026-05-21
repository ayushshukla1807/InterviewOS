'use client';

import React, { useState } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { Sun, Moon, Sparkles, Star, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: Theme; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'multicolor', label: 'Aurora', icon: <Sparkles className="w-4 h-4" />, color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/50 dark:text-fuchsia-400' },
    { id: 'skynight', label: 'Sky Night', icon: <Star className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="p-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl flex flex-col gap-1 w-48"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setIsOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  theme === t.id
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: theme === t.id ? 'var(--border-color)' : 'transparent',
                  color: 'var(--text)'
                }}
              >
                <div className={`p-1.5 rounded-lg ${t.color}`}>
                  {t.icon}
                </div>
                {t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: 'var(--primary)', color: '#ffffff', boxShadow: '0 10px 25px -5px var(--primary)' }}
      >
        <Settings2 className="w-6 h-6" />
      </button>
    </div>
  );
}
