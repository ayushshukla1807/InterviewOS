'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, User, Building } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          organization: role !== 'candidate' ? organization : ''
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto-login: save token and redirect directly to dashboard
      localStorage.setItem('interviewos_token', data.token);
      localStorage.setItem('interviewos_user', JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => {
        if (data.user.role === 'candidate') router.push('/candidate');
        else router.push('/recruiter');
      }, 1200);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070709] relative px-4 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-fuchsia-600/10 rounded-full blur-[140px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }} 
        className="w-full max-w-[460px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Create Account</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Join the InterviewOS Assessment Grid</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/40 border border-white/10 focus:border-indigo-500 text-sm text-white rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/40 border border-white/10 focus:border-indigo-500 text-sm text-white rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/40 border border-white/10 focus:border-indigo-500 text-sm text-white rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join as</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-[#111113] border border-white/10 focus:border-indigo-500 text-sm text-slate-300 rounded-xl px-4 py-3.5 outline-none transition-all"
            >
              <option value="candidate" className="bg-[#111113] text-white">Candidate (Taking assessments)</option>
              <option value="recruiter" className="bg-[#111113] text-white">Recruiter (Managing candidates)</option>
              <option value="founder" className="bg-[#111113] text-white">Founder / Admin Manager (Global overview)</option>
            </select>
          </div>

          {/* Organization Name (Recruiter & Founder only) */}
          {role !== 'candidate' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/40 border border-white/10 focus:border-indigo-500 text-sm text-white rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? 'Creating Account...' : 'Register'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
