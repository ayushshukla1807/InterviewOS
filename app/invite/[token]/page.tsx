'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ArrowRight } from 'lucide-react';

export default function InviteGateway() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const [data, setData] = useState<{name: string, email: string, role: string} | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(token));
      if (!decoded.name || !decoded.role || !decoded.email) throw new Error('Invalid token format');
      setData(decoded);
    } catch (e) {
      setError(true);
    }
  }, [token]);

  const handleStart = () => {
    if (!data) return;
    
    // Save strict candidate profile
    localStorage.setItem('interviewos_candidate_profile', JSON.stringify({
      candidateName: data.name,
      email: data.email,
      role: data.role,
      invited: true
    }));

    // Setup track
    localStorage.setItem('interviewos_active_track', data.role);
    localStorage.setItem('interviewos_is_role_track', 'true');
    localStorage.setItem('interviewos_blueprint', JSON.stringify({
      sessionId: `inv_${Date.now()}`,
      candidateName: data.name,
      role: data.role,
    }));

    router.push('/session');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-center px-4">
        <div className="glass-card p-12 rounded-[2rem] border border-red-500/20 max-w-lg">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Invalid Invite Link</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">This assessment link is corrupted or has expired. Please contact your recruiter for a new link.</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white">Loading secure gateway...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="mesh-bg" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Secure Gateway</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assessment Portal</p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Candidate</p>
            <p className="text-lg font-black text-white">{data.name}</p>
            <p className="text-xs text-slate-400">{data.email}</p>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Role</p>
            <p className="text-lg font-black text-cyan-400">{data.role}</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-10 flex gap-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest leading-relaxed">
            By proceeding, you agree to our proctoring policies. Camera and microphone access are required. Ensure you are in a quiet environment.
          </p>
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group"
        >
          <Zap className="w-4 h-4 group-hover:text-cyan-500 transition-colors" />
          Start Technical Assessment
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
}
