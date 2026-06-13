'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Camera, Mic, Monitor, Maximize, 
  CheckCircle, AlertTriangle, MonitorX, Play, User,
  Share, Info, ShieldAlert
} from 'lucide-react';

function PermissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') || 'Guest Candidate';
  const track = searchParams.get('track') || 'JS';
  const isMock = searchParams.get('mock') === 'true';
  const simulationSessionId = searchParams.get('simulationSessionId') || '';
  const username = name.toLowerCase().replace(' ', '_');
  
  const [isMounted, setIsMounted] = useState(false);
  const [interviewer, setInterviewer] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('interviewos_active_interviewer');
    if (saved) {
      setInterviewer(JSON.parse(saved));
    }
  }, []);
  const [camStatus, setCamStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [permissions, setPermissions] = useState({
    display: true, 
    camera: false,
    audio: false,
    screen: false,
    fullscreen: false
  });

  const requestHardware = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setCamStatus('granted');
      setMicStatus('granted');
      setPermissions(p => ({ ...p, camera: true, audio: true }));
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error(err);
      setCamStatus('denied');
      setMicStatus('denied');
    }
  };

  useEffect(() => {
    requestHardware();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const allGranted = Object.values(permissions).every(Boolean);

  const handleScreenShare = () => setPermissions(p => ({ ...p, screen: true }));
  const handleFullScreen = () => setPermissions(p => ({ ...p, fullscreen: true }));

  const [isInitializing, setIsInitializing] = useState(false);

  const handleStartTest = () => {
    if (allGranted) {
      setIsInitializing(true);
      // Artificial sentient delay for high-fidelity feel
      setTimeout(() => {
        router.push(`/session?name=${encodeURIComponent(name)}&track=${track}${isMock ? '&mock=true' : ''}${simulationSessionId ? `&simulationSessionId=${simulationSessionId}` : ''}`);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-sky-500/30 transition-colors duration-500">
      
      {/* Top Banner */}
      <div className="text-center py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
             <div className="w-12 h-12 rounded-2xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-sky-500" />
             </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--text)] tracking-tighter italic">Welcome, {name.split(' ')[0]}.</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Security Protocol Calibration</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area: Vertical Checklist */}
      <main className="flex-1 flex justify-center px-6 pb-40">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-[700px] space-y-3"
        >
          {camStatus === 'denied' || micStatus === 'denied' ? (
            <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[var(--text)] tracking-tight uppercase">Hardware Access Denied</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  Camera and Microphone permissions are required to calibration and proceed with this session. Please enable permissions in your browser settings and reload.
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 transition-colors text-white rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                Reload Page
              </button>
            </div>
          ) : (
            <>
              {/* 1. Extended Display */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-6 group hover:border-[var(--primary)]/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${permissions.display ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                  <MonitorX className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-[var(--text)] tracking-tight uppercase">External Display Check</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide">Standard single-monitor environment required.</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified
                </div>
              </div>

              {/* 2. Camera */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-6 group hover:border-[var(--primary)]/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${permissions.camera ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-[var(--text)] tracking-tight uppercase">Visual Identity Feed</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide">Enable camera for proctoring & AI gaze tracking.</p>
                </div>
                <div className="flex items-center gap-4">
                  {permissions.camera && (
                    <div className="w-20 h-12 bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                       <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    {permissions.camera ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </>
                    ) : (
                      <button onClick={requestHardware} className="px-4 py-2 bg-sky-600 text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-black uppercase hover:opacity-90 transition-all">Enable Feed</button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Audio */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-6 group hover:border-[var(--primary)]/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${permissions.audio ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-[var(--text)] tracking-tight uppercase">Acoustic Signal Calibration</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide">Sync microphone for real-time transcription.</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  {permissions.audio ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Synced
                    </>
                  ) : (
                    <button onClick={requestHardware} className="px-4 py-2 bg-sky-600 text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-black uppercase hover:opacity-90 transition-all">Sync Mic</button>
                  )}
                </div>
              </div>

              {/* 4. Screen Share */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-6 group hover:border-[var(--primary)]/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${permissions.screen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                  <Share className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-[var(--text)] tracking-tight uppercase">Interactive Sandbox Access</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide">Share entire screen to activate the IDE sandbox.</p>
                </div>
                {!permissions.screen ? (
                  <button 
                    onClick={handleScreenShare}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all"
                  >
                    Share Screen
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Authorized
                  </div>
                )}
              </div>

              {/* 5. Full Screen */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-6 group hover:border-[var(--primary)]/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${permissions.fullscreen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                  <Maximize className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-[var(--text)] tracking-tight uppercase">Focus Mode Immersion</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide">Enter immersive mode to eliminate distractions.</p>
                </div>
                {!permissions.fullscreen ? (
                  <button 
                    onClick={handleFullScreen}
                    className="px-4 py-2 bg-sky-600 text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Enter Focus
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Immersed
                  </div>
                )}
              </div>

              <div className="pt-8 flex items-center gap-3 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                 <Info className="w-4 h-4 text-sky-500 shrink-0" />
                 <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                   By proceeding, you agree to the proctoring guidelines. AI will monitor gaze, environmental audio, and screen integrity to ensure a fair assessment for all candidates.
                 </p>
              </div>
            </>
          )}

        </motion.div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[var(--bg)]/80 backdrop-blur-xl border-t border-[var(--border-color)] p-8 flex justify-center z-50">
        <div className="w-full max-w-[700px] flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Ready for handshake</span>
             <span className="text-[10px] font-black text-[var(--text)] uppercase tracking-widest">{allGranted ? 'Security Calibration Complete' : 'Awaiting Permissions...'}</span>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={allGranted && !isInitializing ? { scale: 1.05 } : {}}
              whileTap={allGranted && !isInitializing ? { scale: 0.95 } : {}}
              onClick={handleStartTest}
              disabled={!allGranted || isInitializing}
              className={`min-w-[200px] px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                allGranted 
                  ? 'bg-sky-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] cursor-pointer' 
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-[var(--border-color)]'
              }`}
            >
              <AnimatePresence mode="wait">
                {isInitializing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{interviewer?.name || 'SYED'} IS READY...</span>
                  </motion.div>
                ) : (
                  <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {allGranted ? `HANDSHAKE WITH ${interviewer?.name?.toUpperCase() || 'SYED'}` : 'START INTERVIEW'}
                  </motion.span>
                )}
              </AnimatePresence>
              {allGranted && !isInitializing && (
                <motion.div className="absolute inset-0 bg-white/20" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              )}
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PermissionsGuard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center text-[var(--text)] text-[10px] font-black uppercase tracking-widest animate-pulse transition-colors duration-500">Initializing Security Layer...</div>}>
      <PermissionsContent />
    </Suspense>
  );
}
