'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Crown, Users, Search, ChevronLeft, Sparkles, Star, Award, Shield
} from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  badges: any[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/gamification/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center space-y-4 text-slate-100">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium  tracking-[0.3em] text-[10px]">
          Retrieving Rankings...
        </p>
      </div>
    );
  }

  // Top 3 Podium spots
  const firstPlace = filteredLeaderboard[0];
  const secondPlace = filteredLeaderboard[1];
  const thirdPlace = filteredLeaderboard[2];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link 
              href="/candidate" 
              className="inline-flex items-center gap-2 text-xs font-medium  tracking-tight text-zinc-500 hover:text-white transition-colors group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10 ">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-medium text-amber-500  tracking-[0.3em]">Global Rankings</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tighter  bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Simulation Leaderboard
            </h1>
            <p className="text-zinc-400 text-sm font-medium">The top minds evaluated in the InterviewOS network.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Podium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-10">
          {/* 2nd Place */}
          {secondPlace && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative flex flex-col items-center gap-6 p-8 rounded-[3rem] border bg-white/[0.02] border-zinc-800/50 h-[360px]"
            >
              <div className="absolute -top-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-medium text-xl shadow-xl bg-slate-400/20 border border-slate-400/30">
                #2
              </div>
              <div className="rounded-full p-1 border-2 border-zinc-800 relative">
                <div className="w-24 h-24 rounded-full bg-zinc-950 overflow-hidden relative flex items-center justify-center font-medium text-zinc-400 text-3xl bg-gradient-to-br from-slate-600/10 to-slate-600/20">
                  {secondPlace.name[0].toUpperCase()}
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium tracking-tighter text-xl text-white">{secondPlace.name}</h3>
                <p className="text-[10px] font-medium text-zinc-300  tracking-tight">Level {secondPlace.level || 1}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-[10px] font-medium ">
                  🔥 {secondPlace.streak || 0} Streak
                </div>
              </div>
              <div className="text-center">
                <span className="text-2xl font-medium text-white tracking-tighter">{secondPlace.xp.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-zinc-500  tracking-tight block mt-0.5">Simulation XP</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {firstPlace && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative flex flex-col items-center gap-6 p-8 rounded-[3rem] border bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/20 h-[420px] shadow-2xl shadow-indigo-600/5"
            >
              <div className="absolute -top-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-medium text-xl shadow-xl bg-amber-500 border border-amber-400 shadow-amber-500/20">
                <Crown size={22} />
              </div>
              <div className="rounded-full p-1 border-2 border-indigo-500 relative shadow-2xl shadow-indigo-500/30">
                <div className="w-32 h-32 rounded-full bg-zinc-950 overflow-hidden relative flex items-center justify-center font-medium text-zinc-300 text-5xl bg-gradient-to-br from-indigo-600/10 to-indigo-600/20">
                  {firstPlace.name[0].toUpperCase()}
                </div>
                <div className="absolute -right-2 bottom-0 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium tracking-tighter text-3xl text-white">{firstPlace.name}</h3>
                <p className="text-[10px] font-medium text-zinc-300  tracking-tight">Level {firstPlace.level || 1}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-[10px] font-medium ">
                  🔥 {firstPlace.streak || 0} Streak
                </div>
              </div>
              <div className="text-center">
                <span className="text-3xl font-medium text-white tracking-tighter">{firstPlace.xp.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-zinc-500  tracking-tight block mt-0.5">Simulation XP</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative flex flex-col items-center gap-6 p-8 rounded-[3rem] border bg-white/[0.02] border-zinc-800/50 h-[340px]"
            >
              <div className="absolute -top-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-medium text-xl shadow-xl bg-orange-400/20 border border-orange-400/30">
                #3
              </div>
              <div className="rounded-full p-1 border-2 border-zinc-800 relative">
                <div className="w-20 h-20 rounded-full bg-zinc-950 overflow-hidden relative flex items-center justify-center font-medium text-orange-400 text-2xl bg-gradient-to-br from-orange-600/10 to-orange-600/20">
                  {thirdPlace.name[0].toUpperCase()}
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium tracking-tighter text-xl text-white">{thirdPlace.name}</h3>
                <p className="text-[10px] font-medium text-zinc-300  tracking-tight">Level {thirdPlace.level || 1}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-[10px] font-medium ">
                  🔥 {thirdPlace.streak || 0} Streak
                </div>
              </div>
              <div className="text-center">
                <span className="text-2xl font-medium text-white tracking-tighter">{thirdPlace.xp.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-zinc-500  tracking-tight block mt-0.5">Simulation XP</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Global List */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="glass-card rounded-[2.5rem] border border-zinc-800/50 overflow-hidden"
        >
          <div className="p-8 border-b border-zinc-800/50 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-zinc-300" />
              <span className="text-[10px] font-medium text-zinc-500  tracking-tight">All Evaluated Nodes</span>
            </div>
            <span className="text-[10px] font-medium text-zinc-300  tracking-tight bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {filteredLeaderboard.length} Nodes Active
            </span>
          </div>

          <div className="divide-y divide-white/5 bg-black/10">
            {filteredLeaderboard.slice(3).map((entry, idx) => (
              <motion.div 
                key={entry._id}
                variants={itemVariants}
                className="p-6 hover:bg-white/[0.02] transition-all flex items-center gap-6 group"
              >
                <div className="w-12 text-center">
                  <span className="text-xl font-medium text-slate-650 group-hover:text-zinc-300 transition-colors">#{idx + 4}</span>
                </div>

                <div className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden relative group-hover:scale-105 transition-transform flex items-center justify-center text-zinc-300 font-medium text-lg">
                    {entry.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white font-medium tracking-tight text-sm">{entry.name}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-medium text-zinc-300  tracking-tight bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">Level {entry.level || 1}</span>
                      <div className="w-1 h-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame size={10} />
                        <span className="text-[9px] font-medium  tracking-tight">{entry.streak || 0} Day Streak</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xl font-medium text-white tracking-tighter">{entry.xp.toLocaleString()}</span>
                  <span className="text-[9px] font-bold text-zinc-500  tracking-tight">Simulation XP</span>
                </div>
              </motion.div>
            ))}

            {filteredLeaderboard.length === 0 && (
              <div className="p-16 text-center text-zinc-500 font-bold  tracking-tight text-xs">
                No active records matching search.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
