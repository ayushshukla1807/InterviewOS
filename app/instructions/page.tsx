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

function InterviewOSLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-[11px] font-black text-white uppercase tracking-widest leading-none">InterviewOS</div>
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pledged, setPledged] = useState(false);

  const nameParam = searchParams.get('name') || 'Ayush Shukla';
  const trackParam = searchParams.get('track') || 'JS';
  const mockParam = searchParams.get('mock') === 'true';
  
  const trackConfig: Record<string, { title: string; time: string; questions: number | string; invigilator: string }> = {
    JS: { title: 'InterviewOS JavaScript Engineering Interview', time: '60 mins', questions: 4, invigilator: 'Syed' },
    DSA: { title: 'InterviewOS Algorithms & Data Structures', time: '60 mins', questions: 4, invigilator: 'Syed' },
    ADA: { title: 'InterviewOS Advanced Systems Analysis', time: '90 mins', questions: 3, invigilator: 'Sathvik' },
    DYNAMIC: { title: 'InterviewOS Custom Role Assessment', time: '60 mins', questions: 'Adaptive', invigilator: 'Syed' },
  };

  const config = trackConfig[trackParam] || trackConfig.DYNAMIC;

  const [isMounted, setIsMounted] = useState(false);
  const [interviewer, setInterviewer] = useState<any>(null);
  const [invigilator, setInvigilator] = useState<any>(null);
  const { INVIGILATORS, INTERVIEWERS } = require('../../lib/ai/interviewers');

  useEffect(() => {
    setIsMounted(true);
    
    const savedInterviewer = localStorage.getItem('interviewos_active_interviewer');
    if (savedInterviewer) {
      setInterviewer(JSON.parse(savedInterviewer));
    } else {
      const randomInt = INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];
      setInterviewer(randomInt);
      localStorage.setItem('interviewos_active_interviewer', JSON.stringify(randomInt));
    }

    const savedInvigilator = localStorage.getItem('interviewos_active_invigilator');
    if (savedInvigilator) {
      setInvigilator(JSON.parse(savedInvigilator));
    } else {
      const randomInv = INVIGILATORS[Math.floor(Math.random() * INVIGILATORS.length)];
      setInvigilator(randomInv);
      localStorage.setItem('interviewos_active_invigilator', JSON.stringify(randomInv));
    }
  }, []);

  if (!isMounted || !interviewer || !invigilator) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 transition-colors" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b backdrop-blur-md sticky top-0 z-50 transition-colors" style={{ backgroundColor: 'color-mix(in srgb, var(--card-bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
        <InterviewOSLogo />
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Powered by</span>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
             <span className="text-[11px] font-black text-white tracking-tight italic">elevate</span>
           </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full p-6 lg:p-12 flex flex-col lg:flex-row gap-8 items-start relative z-10">
        
        {/* Left Column: Team & Details */}
        <div className="w-full lg:w-[420px] space-y-6">
          <div className="glass-card border p-6 rounded-3xl space-y-8 shadow-2xl transition-colors" style={{ backgroundColor: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', borderColor: 'var(--border-color)' }}>
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest px-2" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Interview Team</h3>
              <div className="space-y-4">
                {/* Invigilator */}
                <div className="p-4 rounded-2xl border flex items-center gap-4 group transition-all" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
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
                <div className="p-4 rounded-2xl border flex items-center gap-4 group transition-all" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0" style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}>
                    <img src={interviewer.avatar} alt="Interviewer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>AI Interviewer</p>
                    <p className="text-xs font-black tracking-tight" style={{ color: 'var(--text)' }}>{interviewer.name}</p>
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>{interviewer.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-6" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-[10px] font-black uppercase tracking-widest px-2" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Interview Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
                  <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }} />
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Duration</p>
                  <p className="text-xs font-black tracking-tight" style={{ color: 'var(--text)' }}>{config.time}</p>
                </div>
                <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
                  <BrainCircuit className="w-4 h-4 mx-auto mb-1" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }} />
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Questions</p>
                  <p className="text-xs font-black tracking-tight" style={{ color: 'var(--text)' }}>Adaptive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-10 px-4">
            <section className="space-y-4">
              <h3 className="text-base font-black tracking-tight uppercase" style={{ color: 'var(--text)' }}>Instructions</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-black" style={{ color: 'color-mix(in srgb, var(--text) 90%, transparent)' }}>Before You Begin</h4>
                  <ul className="space-y-2">
                    {[
                      'Ensure a quiet environment. Use headphones if possible.',
                      'Check your camera & mic. Your camera must stay on throughout.',
                      'Use a laptop/desktop. Mobile devices are not supported.',
                      'Stable Internet Required. Poor connection may affect experience.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 group" style={{ color: 'color-mix(in srgb, var(--text) 70%, transparent)' }}>
                        <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--primary)' }} />
                        <span className="text-[13px] font-medium leading-relaxed transition-colors group-hover:opacity-100 opacity-80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black" style={{ color: 'color-mix(in srgb, var(--text) 90%, transparent)' }}>During the Interview</h4>
                  <ul className="space-y-2">
                    {[
                      'Stay in Full Screen Mode. Do not exit or minimize.',
                      'Do not switch tabs or windows. This will flag the session.',
                      'Your responses are recorded. Both code and speech are assessed.',
                      'Avoid external help. Violations lead to disqualification.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 group" style={{ color: 'color-mix(in srgb, var(--text) 70%, transparent)' }}>
                        <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--primary)' }} />
                        <span className="text-[13px] font-medium leading-relaxed transition-colors group-hover:opacity-100 opacity-80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t space-y-6" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
                <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center`} style={{ backgroundColor: agreed ? 'var(--primary)' : 'var(--border-color)', borderColor: agreed ? 'var(--primary)' : 'var(--border-color)' }}>
                   {agreed && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <p className="text-[11px] font-bold" style={{ color: 'color-mix(in srgb, var(--text) 80%, transparent)' }}>I agree to <span className="underline underline-offset-4 hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }} style={{ color: 'var(--primary)' }}>Privacy Policy</span> and consent to the interview process</p>
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
      <footer className="p-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--text) 60%, transparent)' }}>
          This interview is conducted on a secure platform. Final results are verified by the hiring team.
        </p>
        <div className="flex gap-8">
          <button onClick={() => setShowPrivacyModal(true)} className="text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>View Privacy Policy</button>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPrivacyModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Data & Privacy Policy</h3>
                </div>
                
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4" style={{ color: 'color-mix(in srgb, var(--text) 80%, transparent)' }}>
                  <p className="text-sm font-medium leading-relaxed">
                    By proceeding with this interview, you acknowledge and agree that this session will be recorded and analyzed by our AI models.
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    <strong>1. Audio & Video Recording:</strong> Your camera and microphone data are captured solely for the purpose of this assessment. 
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    <strong>2. Code & Speech Analysis:</strong> Your spoken responses and code submissions are processed in real-time to generate a comprehensive evaluation report for the hiring team.
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    <strong>3. Data Retention:</strong> All recordings and transcriptions are stored securely and automatically deleted in accordance with our data retention policy (typically 90 days after the interview).
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    <strong>4. Proctored Environment:</strong> The platform will monitor tab switches and window focus to ensure technical integrity.
                  </p>
                </div>

                <div className="pt-6 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
                  <button 
                    onClick={() => setShowPrivacyModal(false)}
                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-tight">From InterviewOS Ecosystem</p>
                    </div>
                    <InterviewOSLogo />
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
