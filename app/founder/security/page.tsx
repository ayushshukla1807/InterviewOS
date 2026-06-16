'use client';

import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FounderSecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/founder" 
              className="p-2 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl hover:bg-zinc-800/10 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-medium tracking-tight">Security & Settings</h1>
              <p className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mt-1">Manage your identity & account security</p>
            </div>
          </div>
        </div>

        <div className="border border-[var(--border-color)] rounded-3xl overflow-hidden bg-[var(--card-bg)] p-4 flex justify-center">
          <UserProfile 
            appearance={{
              variables: {
                colorPrimary: '#0ea5e9',
                colorBackground: 'transparent',
                colorText: 'var(--text)',
                colorTextSecondary: 'color-mix(in srgb, var(--text) 60%, transparent)',
                colorInputBackground: 'transparent',
                colorInputText: 'var(--text)',
                colorBorder: 'var(--border-color)',
              },
              elements: {
                card: 'shadow-none w-full max-w-full',
                navbar: 'border-r border-[var(--border-color)]',
                scrollBox: 'bg-transparent',
                profileSectionTitleText: 'text-zinc-500 text-xs font-semibold uppercase tracking-wider',
                headerTitle: 'text-lg font-medium text-[var(--text)] tracking-tight',
                headerSubtitle: 'text-xs text-zinc-500',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
