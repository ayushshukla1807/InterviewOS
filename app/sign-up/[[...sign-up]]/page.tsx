'use client';

import { useState } from 'react';
import { SignUp } from "@clerk/nextjs";
import { User, Briefcase, Shield, Sparkles, ArrowLeft, ArrowRight, Compass, LineChart, Award } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'candidate' | 'recruiter' | 'founder';

export default function SignUpPage() {
  const [role, setRole] = useState<Role | null>(null);

  const selectRole = (selectedRole: Role) => {
    document.cookie = `preferred_role=${selectedRole}; path=/; max-age=3600; SameSite=Lax; Secure`;
    setRole(selectedRole);
  };

  const getRedirectUrl = () => {
    if (role === 'recruiter') return '/recruiter';
    if (role === 'founder') return '/founder';
    return '/candidate';
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex flex-col lg:flex-row relative overflow-hidden font-sans select-none">
      {/* Decorative background grid and ambient lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293706_1px,transparent_1px),linear-gradient(to_bottom,#1f293706_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none" />

      {/* Left Column: Mentor's Quote / Reflection Board */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-950/30 backdrop-blur-3xl relative z-10 overflow-y-auto max-h-screen no-scrollbar">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center">
            <Compass className="w-5 h-5 text-teal-400" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            InterviewOS
          </span>
        </div>

        {/* Mentor's Quote Section */}
        <div className="space-y-8 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono tracking-wider uppercase text-teal-400/80">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-400" /> Reflection & Perspective
          </div>

          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight leading-relaxed italic border-l-2 border-teal-500/40 pl-4">
              "Most people overestimate what they can achieve in a week and underestimate what they can achieve in a year."
            </h2>
            
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-normal">
              Whether you are refining your coding skills, studying system architectures, or preparing for high-stakes technical assessments: progress is rarely a straight line week-to-week. Focus on consistent efforts and long-term mastery.
            </p>
          </div>

          {/* Custom stats dashboard comparing 1 week vs 1 year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-800 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-semibold font-mono tracking-wider text-zinc-500 uppercase">1-Week View</span>
                <span className="text-xs text-rose-400 font-medium">Flat Line</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-rose-500/40" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-2 block font-normal leading-relaxed">
                Apparent stagnation, no immediate breakthrough.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-800 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-semibold font-mono tracking-wider text-zinc-500 uppercase">1-Year Horizon</span>
                <span className="text-xs text-emerald-400 font-medium">Compound Growth</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-teal-500 to-indigo-500" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-2 block font-normal leading-relaxed">
                Persistent skill acquisition builds your profile.
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-6">
            <p className="text-zinc-500 text-xs italic leading-relaxed">
              Every application, test, interview, and project completed is an investment in your future self. 
              Focus on the process, keep building, and stay consistent.
            </p>
          </div>
        </div>

        <div className="mt-12 text-[10px] text-zinc-600 font-mono tracking-wider uppercase">
          InterviewOS Systems • Stable Build 2026
        </div>
      </div>

      {/* Right Column: Portal Cards or Clerk Input */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-lg space-y-8"
            >
              <div className="text-center lg:text-left space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tight">
                  Register on InterviewOS
                </h1>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Choose your respective environment to sign up and configure your workspace.
                </p>
              </div>

              <div className="space-y-4">
                {/* Candidate Portal */}
                <div
                  onClick={() => selectRole('candidate')}
                  className="group p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 hover:border-teal-500/20 backdrop-blur-md cursor-pointer hover:bg-teal-950/5 transition-all duration-300 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <User className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        Candidate Hub
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Practice mock coding interviews, check results, and track analytics.
                    </p>
                    <div className="text-[10px] text-teal-400/80 font-serif italic border-l border-teal-500/20 pl-2 mt-1">
                      "Success is the sum of small efforts, repeated day in and day out."
                    </div>
                  </div>
                </div>

                {/* Recruiter Portal */}
                <div
                  onClick={() => selectRole('recruiter')}
                  className="group p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 hover:border-indigo-500/20 backdrop-blur-md cursor-pointer hover:bg-indigo-950/5 transition-all duration-300 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        Recruiter Workspace
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Build assessments, customize job rubrics, and review submissions.
                    </p>
                    <div className="text-[10px] text-indigo-400/80 font-medium tracking-tight border-l border-indigo-500/20 pl-2 mt-1">
                      Happy Hiring! Thank you for joining the InterviewOS team.
                    </div>
                  </div>
                </div>

                {/* Founder Portal */}
                <div
                  onClick={() => selectRole('founder')}
                  className="group p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 hover:border-rose-500/20 backdrop-blur-md cursor-pointer hover:bg-rose-950/5 transition-all duration-300 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Shield className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        Founder & Admin
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Configure system metrics, database options, and check user logs.
                    </p>
                    <div className="text-[10px] text-rose-400/60 font-mono tracking-tighter">
                      Restricted to founder@interviewos.com credentials.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="clerk-sign-up"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md flex flex-col items-center relative"
            >
              <button
                onClick={() => setRole(null)}
                className="absolute top-[-3.5rem] left-0 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-semibold flex items-center gap-1.5 border-none bg-transparent cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Change Role
              </button>

              <div className="w-full bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                    Authentication Gate
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Portal: {role === 'founder' ? 'Founder Admin' : role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                  </h2>
                </div>

                <div className="flex justify-center border-t border-zinc-800/50 pt-4">
                  <SignUp 
                    fallbackRedirectUrl={getRedirectUrl()}
                    signInUrl="/sign-in"
                    appearance={{
                      variables: {
                        colorPrimary: role === 'candidate' ? '#2dd4bf' : role === 'recruiter' ? '#6366f1' : '#f43f5e',
                        colorBackground: '#090a0f',
                        colorText: '#f4f4f5',
                        colorTextSecondary: '#71717a',
                        colorInputBackground: '#18181b',
                        colorInputText: '#f4f4f5',
                        colorBorder: '#27272a',
                      },
                      elements: {
                        card: 'bg-[#090a0f] border border-[#27272a] shadow-none w-full max-w-full p-0',
                        headerTitle: 'hidden',
                        headerSubtitle: 'hidden',
                        footerAction: 'text-zinc-400',
                        footerActionLink: role === 'candidate' ? 'text-teal-400 hover:text-teal-300' : role === 'recruiter' ? 'text-indigo-400 hover:text-indigo-300' : 'text-rose-400 hover:text-rose-300',
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
