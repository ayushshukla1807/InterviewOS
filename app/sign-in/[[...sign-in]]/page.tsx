'use client';

import { useState } from 'react';
import { SignIn } from "@clerk/nextjs";
import { User, Briefcase, Shield, Sparkles, ArrowRight } from "lucide-react";

type Role = 'candidate' | 'recruiter' | 'founder';

export default function SignInPage() {
  const [role, setRole] = useState<Role | null>(null);

  const selectRole = (selectedRole: Role) => {
    // Set a cookie that expires in 1 hour
    document.cookie = `preferred_role=${selectedRole}; path=/; max-age=3600; SameSite=Lax; Secure`;
    setRole(selectedRole);
  };

  const getRedirectUrl = () => {
    if (role === 'recruiter') return '/recruiter';
    if (role === 'founder') return '/founder';
    return '/candidate';
  };

  if (role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020204] relative p-6">
        <div className="mesh-bg" />
        <div className="noise-overlay" />
        
        <button 
          onClick={() => setRole(null)}
          className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors text-xs font-medium font-mono flex items-center gap-1 cursor-pointer border-none bg-transparent"
        >
          ← Change Role
        </button>

        <div className="z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-white tracking-tighter">
              Login as {role.charAt(0).toUpperCase() + role.slice(1)}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Please authenticate to enter the workspace.
            </p>
          </div>
          <SignIn fallbackRedirectUrl={getRedirectUrl()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020204] text-white p-6 relative overflow-hidden">
      {/* Background elements to match the platform */}
      <div className="mesh-bg" />
      <div className="noise-overlay" />
      
      <div className="w-full max-w-4xl z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-zinc-800 text-zinc-300 text-[10px] font-medium tracking-tight">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Neural Access Gateway
          </div>
          <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent tracking-tighter">
            Welcome to InterviewOS
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto text-xs font-medium tracking-wide">
            Select your access portal below to authenticate and enter your workspace environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Candidate Access */}
          <div 
            onClick={() => selectRole('candidate')}
            className="group relative bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-2xl p-6 rounded-3xl space-y-6 cursor-pointer hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Candidate Hub</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Take AI technical interviews, view comprehensive performance analytics, and manage verified certificates.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Recruiter Access */}
          <div 
            onClick={() => selectRole('recruiter')}
            className="group relative bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-2xl p-6 rounded-3xl space-y-6 cursor-pointer hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Recruiter Platform</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Create custom coding evaluation scenarios, configure rubric parameters, and review live candidate session metrics.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-blue-400 font-medium">
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Founder/Admin Access */}
          <div 
            onClick={() => selectRole('founder')}
            className="group relative bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-2xl p-6 rounded-3xl space-y-6 cursor-pointer hover:bg-white/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Founder & Admin</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Configure global organizational policies, audit logs, and configure security permissions for recruiters.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-purple-400 font-medium">
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
