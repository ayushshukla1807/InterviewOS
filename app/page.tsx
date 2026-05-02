'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowRight, Zap, Bot, UserCheck, 
  ShieldAlert, Cpu, Sparkles, FileText, 
  BrainCircuit, Users, Award, ExternalLink, GraduationCap 
} from 'lucide-react';
import Link from 'next/link';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nameParam = searchParams.get('name');
  const trackParam = searchParams.get('track');

  // Redirection intercept for recruiter invite links
  useEffect(() => {
    if (nameParam && trackParam) {
      router.push(`/instructions?name=${encodeURIComponent(nameParam)}&track=${trackParam}`);
    }
  }, [nameParam, trackParam, router]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'tryout' | 'candidate' | 'recruiter' | 'mvp'>('tryout');

  // Tryout State
  const [candidateName, setCandidateName] = useState('Guest Candidate');
  const [selectedTrack, setSelectedTrack] = useState<'JS' | 'DSA' | 'ADA'>('JS');

  // MVP State
  const [selectedJob, setSelectedJob] = useState('REQ-101');

  const tracksInfo = {
    JS: { title: 'JavaScript & Frontend', desc: 'React, Next.js, V8 Engine, DOM rendering.' },
    DSA: { title: 'Data Structures & Algorithms', desc: 'Complexity analysis, DP, Graphs, Optimization.' },
    ADA: { title: 'Distributed Systems', desc: 'System design, load balancing, sticky sessions, scale.' }
  };

  const handleLaunchTryout = () => {
    router.push(`/instructions?name=${encodeURIComponent(candidateName)}&track=${selectedTrack}`);
  };

  const handleLaunchMVP = () => {
    router.push(`/apply/${selectedJob}`);
  };

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

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative z-10 space-y-16">
        <div className="max-w-5xl w-full text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Hiring that feels human, scale that is AI</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase">
               Next-Gen <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">AI Interview</span> <br /> Platform.
            </h1>
            
            <p className="text-sm md:text-base font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
              Experience technical interviews redefined. Fully automated coding simulations, real-time proctor audit shields, and dynamic hiring reports.
            </p>
          </motion.div>
        </div>

        {/* ── INTERACTIVE SANDBOX CONTROL CENTER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-4xl w-full bg-[#111113]/80 border border-white/5 rounded-[40px] shadow-3xl backdrop-blur-2xl p-8 lg:p-12 space-y-10"
        >
          {/* Custom Tabs */}
          <div className="flex bg-[#070709] border border-white/5 p-1.5 rounded-2xl flex-wrap">
            <button 
              onClick={() => setActiveTab('tryout')}
              className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'tryout' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <BrainCircuit className="w-4 h-4" /> Tryout Interview
            </button>
            <button 
              onClick={() => setActiveTab('candidate')}
              className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'candidate' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <GraduationCap className="w-4 h-4" /> Candidate Workspace
            </button>
            <button 
              onClick={() => setActiveTab('recruiter')}
              className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'recruiter' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Recruiter Portal
            </button>
            <button 
              onClick={() => setActiveTab('mvp')}
              className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'mvp' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> JD & Resume (MVP)
            </button>
          </div>

          {/* Dynamic Content Panel */}
          <div className="min-h-[220px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeTab === 'tryout' && (
                <motion.div 
                  key="tryout-tab" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-white">General Candidate Tryout (Clean Technical Assessment)</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Jump directly into a standard AI coding interview on your target stack (No Simulation Tab)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidate Name</label>
                      <input 
                        value={candidateName}
                        onChange={e => setCandidateName(e.target.value)}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Technology Track</label>
                      <div className="flex gap-2">
                        {(['JS', 'DSA', 'ADA'] as const).map(t => (
                          <button 
                            key={t}
                            onClick={() => setSelectedTrack(t)}
                            className={`flex-1 py-3 text-[10px] font-black rounded-lg border transition-all ${selectedTrack === t ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      💡 <strong>{tracksInfo[selectedTrack].title} Track:</strong> {tracksInfo[selectedTrack].desc}
                    </p>
                  </div>

                  <button 
                    onClick={handleLaunchTryout}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
                  >
                    Start Tryout Interview <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {activeTab === 'candidate' && (
                <motion.div 
                  key="candidate-tab" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-white">Candidate Portfolio Workspace</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review verified certificates, review merit reports, and execute adaptive training tasks</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#141417] border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Training Paths</span>
                      <p className="text-xs font-black text-white">Customized Roadmap Matrix</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Direct checklist recommendations based on previous interview outcomes.</p>
                    </div>
                    <div className="p-4 bg-[#141417] border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Shareable Badge</span>
                      <p className="text-xs font-black text-white">Verified Certificates</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Download glassmorphic credentials matching unique verification hashes.</p>
                    </div>
                  </div>

                  <Link 
                    href="/candidate"
                    className="w-full py-4 bg-white text-black hover:bg-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                  >
                    Open Candidate Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}

              {activeTab === 'recruiter' && (
                <motion.div 
                  key="recruiter-tab" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-white">Recruiter Control Dashboard</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage open positions, review proctor logs, and evaluate competency data</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#141417] border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Visual Proctoring</span>
                      <p className="text-xs font-black text-white">Neural Integrity Log</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Gaze analysis, visual warning tracking, and screen-sharing audits.</p>
                    </div>
                    <div className="p-4 bg-[#141417] border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Analytics</span>
                      <p className="text-xs font-black text-white">Competency Radars</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Radar grids checking candidate core engineering strengths dynamically.</p>
                    </div>
                  </div>

                  <Link 
                    href="/recruiter"
                    className="w-full py-4 bg-white text-black hover:bg-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                  >
                    Open Recruiter Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}

              {activeTab === 'mvp' && (
                <motion.div 
                  key="mvp-tab" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-left"
                >
                  <div>
                    <h3 className="text-lg font-black text-white">Dynamic JD + Resume Pipeline (MVP Simulator)</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Simulate custom interview generation matching candidate resumes against active JDs</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Seeded Job Description</label>
                      <select 
                        value={selectedJob} 
                        onChange={e => setSelectedJob(e.target.value)}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                      >
                        <option value="REQ-101">REQ-101: Senior Staff Engineer (React & AI Integration)</option>
                        <option value="REQ-102">REQ-102: Lead Fullstack & Distributed Systems Architect</option>
                        <option value="REQ-103">REQ-103: Algorithms & Competitive Programmer Intern</option>
                      </select>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        📝 In this MVP flow, you will land on the job application page, fill in details, and upload a **PDF Resume**. The AI will parse the file, match details against the JD, and dynamically generate a customized 4-question technical assessment.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleLaunchMVP}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
                  >
                    Go to Job Application Portal <ExternalLink className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Refined Modular Info */}
        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto w-full">
          <div className="group flex flex-col items-center gap-6 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-indigo-500/20 transition-all duration-500">
             <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-indigo-400" />
             </div>
             <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sentient AI</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Adaptive Probing in 50+ Tech Stacks</p>
             </div>
          </div>
          
          <div className="group flex flex-col items-center gap-6 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-emerald-500/20 transition-all duration-500">
             <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6 text-emerald-400" />
             </div>
             <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Absolute Integrity</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Neural Proctoring with zero false positives</p>
             </div>
          </div>

          <div className="group flex flex-col items-center gap-6 p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-indigo-500/20 transition-all duration-500">
             <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-indigo-400" />
             </div>
             <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Deep Analytics</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Decision-ready 16-point merit reports</p>
             </div>
          </div>
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
