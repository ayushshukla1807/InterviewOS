'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ExternalLink, Clock, FileText, 
  User, CheckCircle, AlertTriangle, Play,
  ChevronRight, Info, Lock, BrainCircuit, Bot, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

function HyrteLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Hyrte</div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intelligence</div>
      </div>
    </div>
  );
}

function InstructionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [pledged, setPledged] = useState(false);

  const nameParam = searchParams.get('name') || 'Ayush Shukla';
  const trackParam = searchParams.get('track') || 'JS';
  const mockParam = searchParams.get('mock') === 'true';
  
  const trackConfig: Record<string, { title: string; time: string; questions: number | string; invigilator: string }> = {
    JS: { title: 'Hyrte JavaScript Engineering Interview', time: '60 mins', questions: 4, invigilator: 'Syed' },
    DSA: { title: 'Hyrte Algorithms & Data Structures', time: '60 mins', questions: 4, invigilator: 'Syed' },
    ADA: { title: 'Hyrte Advanced Systems Analysis', time: '90 mins', questions: 3, invigilator: 'Sathvik' },
    DYNAMIC: { title: 'Hyrte Custom Role Assessment', time: '60 mins', questions: 'Adaptive', invigilator: 'Syed' },
  };

  const config = trackConfig[trackParam] || trackConfig.DYNAMIC;

  const [isMounted, setIsMounted] = useState(false);
  const [interviewer, setInterviewer] = useState<any>(null);
  const [invigilator, setInvigilator] = useState<any>(null);
  const { INVIGILATORS, INTERVIEWERS } = require('../../lib/ai/interviewers');

  useEffect(() => {
    setIsMounted(true);
    
    const savedInterviewer = localStorage.getItem('hyrte_active_interviewer');
    if (savedInterviewer) {
      setInterviewer(JSON.parse(savedInterviewer));
    } else {
      const randomInt = INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];
      setInterviewer(randomInt);
      localStorage.setItem('hyrte_active_interviewer', JSON.stringify(randomInt));
    }

    const savedInvigilator = localStorage.getItem('hyrte_active_invigilator');
    if (savedInvigilator) {
      setInvigilator(JSON.parse(savedInvigilator));
    } else {
      const randomInv = INVIGILATORS[Math.floor(Math.random() * INVIGILATORS.length)];
      setInvigilator(randomInv);
      localStorage.setItem('hyrte_active_invigilator', JSON.stringify(randomInv));
    }
  }, []);

  if (!isMounted || !interviewer || !invigilator) return null;

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <HyrteLogo />
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Powered by</span>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
             <span className="text-[11px] font-black text-white tracking-tight italic">elevate</span>
           </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full p-6 lg:p-12 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Team & Details */}
        <div className="w-full lg:w-[420px] space-y-6">
          <div className="glass-card border border-white/5 bg-[#111111]/60 p-6 rounded-3xl space-y-8 shadow-2xl">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Interview Team</h3>
              <div className="space-y-4">
                {/* Invigilator */}
                <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-indigo-500/20 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 overflow-hidden border-2 border-amber-500/30 group-hover:border-amber-500/50 transition-all shrink-0">
                    <img src={invigilator.avatar} alt="Invigilator" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Invigilator</p>
                    <p className="text-xs font-black text-white tracking-tight">{invigilator.name}, {invigilator.org}</p>
                    <p className="text-[9px] font-medium text-slate-500 mt-1 leading-tight">{invigilator.message}</p>
                  </div>
                </div>

                {/* Technical Interviewer */}
                <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-indigo-500/20 transition-all">
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border-2 border-white/10 group-hover:border-indigo-500/40 transition-all shrink-0">
                    <img src={interviewer.avatar} alt="Interviewer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">AI Interviewer</p>
                    <p className="text-xs font-black text-white tracking-tight">{interviewer.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{interviewer.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Interview Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 text-center space-y-1">
                  <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Duration</p>
                  <p className="text-xs font-black text-white tracking-tight">{config.time}</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 text-center space-y-1">
                  <BrainCircuit className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Questions</p>
                  <p className="text-xs font-black text-white tracking-tight">Adaptive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-10 px-4">
            <section className="space-y-4">
              <h3 className="text-base font-black text-white tracking-tight uppercase">Instructions</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white/90">Before You Begin</h4>
                  <ul className="space-y-2">
                    {[
                      'Ensure a quiet environment. Use headphones if possible.',
                      'Check your camera & mic. Your camera must stay on throughout.',
                      'Use a laptop/desktop. Mobile devices are not supported.',
                      'Stable Internet Required. Poor connection may affect experience.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400 group">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span className="text-[13px] font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white/90">During the Interview</h4>
                  <ul className="space-y-2">
                    {[
                      'Stay in Full Screen Mode. Do not exit or minimize.',
                      'Do not switch tabs or windows. This will flag the session.',
                      'Your responses are recorded. Both code and speech are assessed.',
                      'Avoid external help. Violations lead to disqualification.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400 group">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span className="text-[13px] font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
                <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${agreed ? 'bg-indigo-600 border-indigo-600' : 'border-white/20 bg-white/5'}`}>
                   {agreed && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <p className="text-[11px] font-bold text-slate-400">I agree to <span className="text-indigo-400 underline underline-offset-4">Privacy Policy</span> and consent to the interview process</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => agreed && setShowPledgeModal(true)}
                  disabled={!agreed}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl ${
                    agreed 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 active:scale-[0.98]' 
                      : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  Start Interview
                </button>
                <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">You can start your interview now</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/20 backdrop-blur-sm">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          This interview is conducted on a secure platform. Final results are verified by the hiring team.
        </p>
        <div className="flex gap-8">
          <Link href="#" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">View Privacy Policy</Link>
        </div>
      </footer>

      {/* Pledge of Honesty Modal */}
      <AnimatePresence>
        {showPledgeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowPledgeModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              {/* Left Panel: Pledge */}
              <div className="w-full md:w-[45%] bg-[#f8f9fb] p-12 flex flex-col justify-between border-r border-slate-100">
                <div className="space-y-8">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                     <Shield className="w-6 h-6 text-white" />
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">Pledge of Honesty.</h3>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed">
                       I understand that my interview session may be recorded and reviewed. If I am found cheating, I accept full responsibility for the consequences.
                     </p>
                   </div>
                </div>
                <div className="pt-12">
                   <div className="border-b-2 border-slate-200 pb-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature</span>
                   </div>
                </div>
              </div>

              {/* Right Panel: Consequences */}
              <div className="flex-1 p-12 space-y-10">
                <button 
                  onClick={() => setShowPledgeModal(false)}
                  className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 rotate-45" />
                </button>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-full w-fit">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Protocol Warning</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">If cheating is detected, the following actions will be taken:</h4>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-rose-500/20 transition-all">
                    <div>
                      <p className="text-sm font-black text-slate-900">Permanent Ban</p>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-tight">From Hyrte Ecosystem</p>
                    </div>
                    <HyrteLogo />
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-rose-500/20 transition-all">
                    <div>
                      <p className="text-sm font-black text-slate-900">3-Year Blacklist</p>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-tight">Across 800+ Hiring Partners</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Shield className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">800+</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={pledged} 
                      onChange={(e) => setPledged(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I will not cheat and accept the consequences if caught</span>
                  </label>

                  <button 
                    onClick={() => pledged && router.push(`/permissions?name=${encodeURIComponent(nameParam)}&track=${trackParam}${mockParam ? '&mock=true' : ''}`)}
                    disabled={!pledged}
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                      pledged ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Start Interview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[11px] animate-pulse">Syncing...</div>}>
      <InstructionsContent />
    </Suspense>
  );
}
