'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Key, Lock, ArrowLeft, Smartphone, RefreshCw, 
  Trash2, Check, AlertTriangle, Monitor, Globe, ChevronRight 
} from 'lucide-react';

interface DeviceSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

function parseUserAgent(ua: string) {
  const lowercase = ua.toLowerCase();
  let browser = 'Browser';
  let os = 'Unknown Device';

  if (lowercase.includes('firefox')) browser = 'Firefox';
  else if (lowercase.includes('chrome')) browser = 'Chrome';
  else if (lowercase.includes('safari')) browser = 'Safari';
  else if (lowercase.includes('edge')) browser = 'Edge';
  else if (lowercase.includes('opera')) browser = 'Opera';

  if (lowercase.includes('windows')) os = 'Windows PC';
  else if (lowercase.includes('macintosh') || lowercase.includes('mac os')) os = 'macOS Device';
  else if (lowercase.includes('linux')) os = 'Linux PC';
  else if (lowercase.includes('android')) os = 'Android Phone';
  else if (lowercase.includes('iphone')) os = 'iPhone';
  else if (lowercase.includes('ipad')) os = 'iPad';

  return { browser, os };
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('interviewos_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        const curUser = data.user || data;

        if (curUser.role !== 'candidate') {
          router.push('/login');
          return;
        }

        setUser(curUser);
        setMfaEnabled(!!curUser.mfaEnabled);
        fetchSessions();
      } catch (err) {
        localStorage.clear();
        router.push('/login');
      }
    };

    verifyAuth();
  }, [router]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('interviewos_token');
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('interviewos_token');
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'setup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to setup MFA');
      setMfaSetupData({ secret: data.secret, qrCodeUrl: data.qrCodeUrl });
    } catch (err: any) {
      setError(err.message || 'MFA configuration failed');
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (setupCode.length < 6) return;
    try {
      const token = localStorage.getItem('interviewos_token');
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'verify-setup', code: setupCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      
      setMfaEnabled(true);
      setMfaSetupData(null);
      setSetupCode('');
      setSuccess('Multi-Factor Authentication enabled successfully!');
      
      // Update local storage user
      const savedUser = localStorage.getItem('interviewos_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.mfaEnabled = true;
        localStorage.setItem('interviewos_user', JSON.stringify(parsed));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify TOTP code');
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (disableCode.length < 6) return;
    try {
      const token = localStorage.getItem('interviewos_token');
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'disable', code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disable MFA');

      setMfaEnabled(false);
      setShowDisableForm(false);
      setDisableCode('');
      setSuccess('Multi-Factor Authentication disabled successfully.');
      
      // Update local storage user
      const savedUser = localStorage.getItem('interviewos_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.mfaEnabled = false;
        localStorage.setItem('interviewos_user', JSON.stringify(parsed));
      }
      fetchSessions(); // Session revocation clears other active sessions, so refresh
    } catch (err: any) {
      setError(err.message || 'MFA disable failed');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this active device session?')) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('interviewos_token');
      const res = await fetch(`/api/auth/sessions?id=${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Revocation failed');
      
      setSuccess('Device session terminated successfully.');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      setError(err.message || 'Failed to terminate session');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans relative pb-20 selection:bg-emerald-600/30">
      <div className="mesh-bg" />
      
      <div className="max-w-[1200px] mx-auto p-6 md:p-12 space-y-10 relative z-10">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <Link 
            href="/candidate"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </Link>
          
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Security Suite v2.0</span>
          </div>
        </div>

        {/* Intro */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Security Configurations</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">Configure credential protection, active logins and Multi-Factor security.</p>
        </div>

        {/* Success & Error alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-400 text-sm"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-400 text-sm"
            >
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{success}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Panel A: MFA configuration */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight">Two-Factor Authentication</h2>
                  <p className="text-xs text-slate-400">Secure authorization checks</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400">TOTP Authenticator Status</p>
                  <p className={`text-xs font-black uppercase tracking-wider ${mfaEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {mfaEnabled ? '● Active Enabled' : '○ Deactivated'}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${mfaEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-700'} animate-pulse`} />
                </div>
              </div>

              {!mfaEnabled ? (
                /* Disabled state actions */
                <div className="space-y-6">
                  {!mfaSetupData ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Add an extra layer of security to your credentials. Logging in will require a 6-digit dynamic key generated by mobile authenticator apps.
                      </p>
                      <button
                        onClick={handleStartMfaSetup}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                      >
                        Enable MFA Protection
                      </button>
                    </div>
                  ) : (
                    /* Setup QR view */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 border-t border-white/5 pt-6">
                      <div className="flex justify-center bg-white p-3 rounded-xl max-w-[180px] mx-auto">
                        <img 
                          src={mfaSetupData.qrCodeUrl} 
                          alt="MFA Setup QR Code" 
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-xs font-bold text-slate-300">Scan QR Code</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Scan the image with Google Authenticator. If you can't scan, configure using this raw Base32 key:
                        </p>
                        <code className="block text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-emerald-400 select-all">
                          {mfaSetupData.secret}
                        </code>
                      </div>

                      <form onSubmit={handleVerifySetup} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Verification TOTP Code</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            value={setupCode}
                            onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 text-center tracking-[0.5em] font-mono text-white text-base focus:border-emerald-500/50 outline-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setMfaSetupData(null)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs uppercase tracking-wider transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={setupCode.length < 6}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                          >
                            Enable 2FA
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Enabled state actions */
                <div className="space-y-4">
                  {!showDisableForm ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        MFA is active, protecting authentication tokens. To remove this check, you must provide your dynamic authenticator key.
                      </p>
                      <button
                        onClick={() => setShowDisableForm(true)}
                        className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs uppercase tracking-wider font-bold transition-all active:scale-[0.98]"
                      >
                        Deactivate MFA Protection
                      </button>
                    </div>
                  ) : (
                    /* Disable verification form */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 border-t border-white/5 pt-6">
                      <form onSubmit={handleDisableMfa} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirm TOTP Key</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            value={disableCode}
                            onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 text-center tracking-[0.5em] font-mono text-white text-base focus:border-rose-500/30 outline-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowDisableForm(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs uppercase tracking-wider transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={disableCode.length < 6}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50"
                          >
                            Disable 2FA
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panel B: Active Sessions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-card p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                    <Monitor className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-tight">Active Devices</h2>
                    <p className="text-xs text-slate-400">Current active authorization sessions</p>
                  </div>
                </div>
                
                <button
                  onClick={fetchSessions}
                  disabled={isLoadingSessions}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} className={isLoadingSessions ? 'animate-spin' : ''} />
                </button>
              </div>

              {isLoadingSessions && sessions.length === 0 ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No active session records found.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const { browser, os } = parseUserAgent(session.userAgent);
                    return (
                      <div 
                        key={session.id}
                        className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                          session.isCurrent 
                            ? 'bg-emerald-950/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                            : 'bg-black/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                            session.isCurrent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-400'
                          }`}>
                            <Monitor size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{os}</span>
                              {session.isCurrent && (
                                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1"><Globe size={11} /> {session.ipAddress}</span>
                              <span>•</span>
                              <span>{browser}</span>
                              <span>•</span>
                              <span>Active: {new Date(session.lastActiveAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="p-2 border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-all"
                            title="Terminate session"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        body {
          background: #0A0F0D;
        }
        .mesh-bg {
          position: fixed;
          inset: 0;
          z-index: -2;
          background: 
            radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 40%);
          filter: blur(60px);
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(20, 30, 25, 0.8) 0%, rgba(10, 15, 13, 0.9) 100%);
          backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-top-color: rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
