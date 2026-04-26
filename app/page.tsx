'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Zap, Bot, UserCheck, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name');
  const track = searchParams.get('track');

  useEffect(() => {
    if (name && track) {
      router.push(`/instructions?name=${encodeURIComponent(name)}&track=${track}`);
    }
  }, [name, track, router]);

  return (
    <div className="min-h-screen bg-[#020204] text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full opacity-50" />
         <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/5 blur-[100px] rounded-full" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Premium Navigation */}
      <nav className="relative z-50 p-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 group cursor-pointer">
          <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500">
            <Shield className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-black uppercase tracking-[0.3em] leading-none">Hyrte</span>
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intelligence</span>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Neural Core: Active</span>
           </div>
           <Link href="/recruiter" className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-all">Portal</Link>
        </div>
      </nav>

      {/* High-Fidelity Hero Section */}
      <main className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="max-w-5xl w-full text-center space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Hiring that feels human, scale that is AI</span>
            </div>
            
            <h1 className="text-7xl md:text-[110px] font-black text-white tracking-tighter leading-[0.85] uppercase">
               Next-Gen <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">AI Interview</span> <br /> Platform.
            </h1>
            
            <p className="text-lg md:text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Experience the world's most advanced technical interview engine. 
              Built for precision. Engineered for empathy. Scaled for elite teams.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
          >
            <Link href="/instructions?mock=true" className="w-full sm:w-auto group px-14 py-6 bg-white text-black rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_60px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 active:scale-95 hover:bg-indigo-600 hover:text-white">
              Start Candidate Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/recruiter" className="w-full sm:w-auto px-14 py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all backdrop-blur-xl flex items-center justify-center gap-3 active:scale-95">
              Recruiter Dashboard
            </Link>
          </motion.div>

          {/* Refined Modular Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto"
          >
            <div className="group flex flex-col items-center gap-6 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-indigo-500/20 transition-all duration-500">
               <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-indigo-400" />
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sentient AI</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Adaptive Probing in 50+ Tech Stacks</p>
               </div>
            </div>
            
            <div className="group flex flex-col items-center gap-6 p-10 bg-[#000000]/10 border border-white/5 rounded-[40px] hover:border-emerald-500/20 transition-all duration-500">
               <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6 text-emerald-400" />
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Absolute Integrity</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Neural Proctoring with zero false positives</p>
               </div>
            </div>

            <div className="group flex flex-col items-center gap-6 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-indigo-500/20 transition-all duration-500">
               <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-indigo-400" />
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Deep Analytics</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Decision-ready 16-point merit reports</p>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Sophisticated Footer */}
      <footer className="p-16 border-t border-white/5 text-center bg-black/40">
        <div className="flex flex-col items-center gap-6">
           <div className="flex items-center gap-3 opacity-20">
              <Cpu className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">System Version 4.0 // Sentient Core</span>
           </div>
           <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">© 2026 Hyrte Intelligence Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020204]" />}>
      <LandingPageContent />
    </Suspense>
  );
}
