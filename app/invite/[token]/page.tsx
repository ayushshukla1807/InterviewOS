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
          <h1 className="text-3xl font-medium mb-4  tracking-tight">Invalid Invite Link</h1>
          <p className="text-zinc-400 text-sm font-bold  tracking-tight">This assessment link is corrupted or has expired. Please contact your recruiter for a new link.</p>
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
        className="glass-card w-full max-w-xl rounded-[2.5rem] border-none shadow-2xl p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
            <Lock className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-white  tracking-tight">Secure Gateway</h1>
            <p className="text-[10px] font-bold text-zinc-400  tracking-tight">AI Assessment Portal</p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="bg-[var(--theme-bg)]/20 rounded-2xl p-6 border border-zinc-800/50">
            <p className="text-[10px] font-bold text-zinc-500  tracking-tight mb-1">Candidate</p>
            <p className="text-lg font-medium text-white">{data.name}</p>
            <p className="text-xs text-zinc-400">{data.email}</p>
          </div>
          
          <div className="bg-[var(--theme-bg)]/20 rounded-2xl p-6 border border-zinc-800/50">
            <p className="text-[10px] font-bold text-zinc-500  tracking-tight mb-1">Target Role</p>
            <p className="text-lg font-medium text-zinc-100">{data.role}</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl mb-10 flex gap-3">
          <Shield className="w-5 h-5 text-zinc-100 shrink-0" />
          <p className="text-[10px] font-bold text-zinc-200  tracking-tight leading-relaxed">
            By proceeding, you agree to our proctoring policies. Camera and microphone access are required. Ensure you are in a quiet environment.
          </p>
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-5 rounded-2xl bg-white text-black font-medium  tracking-tight text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 group"
        >
          <Zap className="w-4 h-4 group-hover:text-white transition-colors" />
          Start Technical Assessment
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
}
