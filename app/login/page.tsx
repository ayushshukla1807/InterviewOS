'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Cpu, Zap, BarChart3, Brain, Code2, Shield, Key } from 'lucide-react';

const TICKER_ITEMS = [
  { icon: Brain, label: 'Behavioral AI', value: '99.2% accuracy' },
  { icon: Code2, label: 'Live Coding IDE', value: '6 Languages' },
  { icon: BarChart3, label: 'Real-time Analytics', value: 'Per keystroke' },
  { icon: Zap, label: 'AI Interviewers', value: 'Zara + Syed' },
  { icon: Shield, label: 'Trust Score', value: 'Verified' },
  { icon: Cpu, label: 'Neural Engine', value: 'Gemini 2.5' },
];

const CODE_LINES = [
  { text: 'import { NextResponse } from "next/server";', color: '#a5b4fc' },
  { text: 'import { GoogleGenAI } from "@google/genai";', color: '#a5b4fc' },
  { text: '', color: '' },
  { text: 'const session = await InterviewOS.create({', color: '#e2e8f0' },
  { text: '  role: "Senior Full Stack Engineer",', color: '#86efac' },
  { text: '  difficulty: "adaptive",', color: '#86efac' },
  { text: '  interviewers: ["Zara", "Syed"],', color: '#86efac' },
  { text: '  tracking: {', color: '#86efac' },
  { text: '    behavioral: true,', color: '#fda4af' },
  { text: '    codeQuality: true,', color: '#fda4af' },
  { text: '    frustration: true,', color: '#fda4af' },
  { text: '  }', color: '#86efac' },
  { text: '});', color: '#e2e8f0' },
  { text: '', color: '' },
  { text: '// AI interviewer starts...', color: '#64748b' },
  { text: 'await session.begin();', color: '#38bdf8' },
];

const STATS = [
  { value: '0MB', label: 'Server Video Storage' },
  { value: '100%', label: 'Offline Execution' },
  { value: '100%', label: 'Privacy Secured' },
];

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/candidate';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeIndex, setCodeIndex] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Security Suite States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempMfaToken, setTempMfaToken] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const resetToken = searchParams.get('resetToken');
  const resetEmail = searchParams.get('email');

  useEffect(() => {
    // If middleware redirected here (via 'from' param), the httpOnly cookie is missing/expired.
    // We MUST clear localStorage to break the infinite reload loop between client and middleware.
    if (searchParams.get('from')) {
      localStorage.removeItem('interviewos_token');
      localStorage.removeItem('interviewos_user');
      return;
    }

    const token = localStorage.getItem('interviewos_token');
    const user = localStorage.getItem('interviewos_user');
    if (token && user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.role === 'founder') {
          router.push('/founder');
        } else if (parsed.role === 'recruiter') {
          router.push('/recruiter');
        } else if (parsed.role === 'candidate') {
          router.push('/candidate');
        } else {
          // If role is missing or invalid, clear session and stay on login
          localStorage.removeItem('interviewos_token');
          localStorage.removeItem('interviewos_user');
        }
      } catch { 
        localStorage.removeItem('interviewos_token');
        localStorage.removeItem('interviewos_user');
      }
    }
  }, [router, searchParams]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCodeIndex(i => (i < CODE_LINES.length - 1 ? i + 1 : 0));
    }, 180);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTickerIndex(i => (i + 1) % TICKER_ITEMS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const [loginStatus, setLoginStatus] = useState<'idle' | 'authenticating' | 'success'>('idle');

  const executeLogin = async (credentials: any) => {
    setLoginStatus('authenticating');
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');
      
      if (data.mfaRequired) {
        setMfaRequired(true);
        setTempMfaToken(data.tempToken);
        setLoginStatus('idle');
        return;
      }
      
      localStorage.setItem('interviewos_token', data.token);
      localStorage.setItem('interviewos_user', JSON.stringify(data.user));
      
      setLoginStatus('success');
      
      // Delay to show the success state animation
      setTimeout(() => {
        if (data.user.role === 'founder') {
          router.push('/founder');
        } else {
          router.push(data.user.role === 'candidate' ? '/candidate' : '/recruiter');
        }
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoginStatus('idle');
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) return;
    setLoginStatus('authenticating');
    setError('');
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-login',
          code: mfaCode,
          tempToken: tempMfaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid code');

      localStorage.setItem('interviewos_token', data.token);
      localStorage.setItem('interviewos_user', JSON.stringify(data.user));

      setLoginStatus('success');

      setTimeout(() => {
        if (data.user.role === 'founder') {
          router.push('/founder');
        } else {
          router.push(data.user.role === 'candidate' ? '/candidate' : '/recruiter');
        }
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoginStatus('idle');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsLoading(true);
    setError('');
    setForgotSuccess('');
    setDevResetLink('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          email: forgotEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      
      setForgotSuccess(data.message);
      if (data.developmentLink) {
        setDevResetLink(data.developmentLink);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    setResetSuccess('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email: resetEmail,
          token: resetToken,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setResetSuccess(data.message);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset password failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    executeLogin({ email, password });
  };

  const handleDemoLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword(roleEmail === 'founder@interviewos.com' ? 'founder2026' : 'demo1234');
    executeLogin({ email: roleEmail, password: roleEmail === 'founder@interviewos.com' ? 'founder2026' : 'demo1234' });
  };

  return (
    <div className="ios-auth-root">
      {/* Left Panel — Visual */}
      <div className="ios-auth-left">
        <div className="ios-auth-left-bg overflow-hidden relative">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] bg-fuchsia-500/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ios-brand"
        >
          <div className="ios-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="ios-brand-name">InterviewOS</span>
          <div className="ios-brand-badge">AI PLATFORM</div>
        </motion.div>

        {/* Hero Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="ios-hero"
        >
          <div className="ios-hero-tag">Next-Gen Interview Intelligence</div>
          <h1 className="ios-hero-title">
            Hire Smarter.<br />
            <span className="ios-hero-accent">Interview Deeper.</span>
          </h1>
          <p className="ios-hero-desc">
            AI-powered behavioral analysis, adaptive coding challenges, and real-time sentiment tracking — all in one platform.
          </p>
        </motion.div>

        {/* Live Code Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="ios-terminal"
        >
          <div className="ios-terminal-header">
            <div className="ios-terminal-dot" style={{ background: '#475569' }} />
            <div className="ios-terminal-dot" style={{ background: '#475569' }} />
            <div className="ios-terminal-dot" style={{ background: '#475569' }} />
            <span className="ios-terminal-title">session.ts — InterviewOS SDK</span>
          </div>
          <div className="ios-terminal-body">
            {CODE_LINES.slice(0, Math.min(codeIndex + 1, CODE_LINES.length)).map((line, i) => (
              <div key={i} className="ios-terminal-line">
                <span className="ios-terminal-lnum">{(i + 1).toString().padStart(2, '0')}</span>
                <span style={{ color: line.color || 'transparent' }}>{line.text || '\u00A0'}</span>
                {i === Math.min(codeIndex, CODE_LINES.length - 1) && (
                  <span className="ios-cursor" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="ios-stats"
        >
          {STATS.map((s, i) => (
            <div key={i} className="ios-stat">
              <div className="ios-stat-value">{s.value}</div>
              <div className="ios-stat-label">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Live Ticker */}
        <div className="ios-ticker">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="ios-ticker-inner"
            >
              {(() => {
                const Item = TICKER_ITEMS[tickerIndex];
                const Icon = Item.icon;
                return (
                  <>
                    <div className="ios-ticker-dot" />
                    <Icon className="ios-ticker-icon" size={13} />
                    <span className="ios-ticker-label">{Item.label}</span>
                    <span className="ios-ticker-sep">—</span>
                    <span className="ios-ticker-val">{Item.value}</span>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="ios-auth-right">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="ios-form-card"
        >
          {resetToken && resetEmail ? (
            /* RESET PASSWORD VIEW */
            <>
              <div className="ios-form-header">
                <div className="ios-form-logo">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="ios-form-title">Reset password</h2>
                  <p className="ios-form-sub">Configure a new password for {resetEmail}</p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ios-error"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {resetSuccess ? (
                <div className="ios-success-message">
                  <p className="text-zinc-100 font-medium">{resetSuccess}</p>
                  <p className="text-zinc-400 text-[11px] mt-2">Redirecting to login page...</p>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="ios-form">
                  <div className="ios-field">
                    <label className="ios-label">New Password</label>
                    <div className="ios-input-wrap">
                      <Lock size={15} className="ios-input-icon" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="ios-input"
                      />
                    </div>
                  </div>

                  <div className="ios-field">
                    <label className="ios-label">Confirm Password</label>
                    <div className="ios-input-wrap">
                      <Lock size={15} className="ios-input-icon" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="ios-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ios-submit-btn"
                  >
                    {isLoading ? <span className="ios-spinner" /> : 'Update Password'}
                  </button>
                  
                  <button
                    type="button"
                    className="text-xs text-zinc-400 hover:text-white mt-2 block text-center"
                    onClick={() => router.push('/login')}
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </>
          ) : mfaRequired ? (
            /* MFA VERIFICATION VIEW */
            <>
              <div className="ios-form-header">
                <div className="ios-form-logo">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="ios-form-title">Verification Code</h2>
                  <p className="ios-form-sub">Enter the 6-digit code from your authenticator app</p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ios-error"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleMfaSubmit} className="ios-form">
                <div className="ios-field">
                  <label className="ios-label">6-Digit Code</label>
                  <div className="ios-input-wrap">
                    <Shield size={15} className="ios-input-icon" />
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      className="ios-input font-mono text-center tracking-[0.4em] text-lg pl-0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginStatus !== 'idle'}
                  className={`ios-submit-btn overflow-hidden relative transition-all duration-300 ${
                    loginStatus === 'success' ? 'bg-white hover:bg-zinc-200 !text-white border-emerald-400' : ''
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {loginStatus === 'idle' && (
                      <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        Verify Code
                      </motion.div>
                    )}
                    {loginStatus === 'authenticating' && (
                      <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                        <span className="ios-spinner" /> Verifying Code...
                      </motion.div>
                    )}
                    {loginStatus === 'success' && (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 font-bold tracking-tight">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ACCESS GRANTED
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white mt-2 block text-center"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaCode('');
                    setTempMfaToken('');
                  }}
                >
                  Back to Login
                </button>
              </form>
            </>
          ) : showForgotModal ? (
            /* FORGOT PASSWORD VIEW */
            <>
              <div className="ios-form-header">
                <div className="ios-form-logo">
                  <Key size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="ios-form-title">Reset password</h2>
                  <p className="ios-form-sub">Enter email to receive security recovery link</p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ios-error"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {forgotSuccess ? (
                <div className="space-y-4">
                  <div className="ios-success-message">
                    <p className="text-zinc-100 font-medium">{forgotSuccess}</p>
                  </div>
                  {devResetLink && (
                    <div className="bg-emerald-950/20 border border-zinc-700 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-zinc-100 font-bold  tracking-tight">🛠️ Dev Sandbox Bypass Link</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">No SMTP credentials configured. Click below to reset directly:</p>
                      <Link href={devResetLink} className="block text-center text-xs bg-white hover:bg-zinc-200 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors">
                        Reset Password Now
                      </Link>
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full text-xs text-zinc-400 hover:text-white mt-2 block text-center"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess('');
                      setDevResetLink('');
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="ios-form">
                  <div className="ios-field">
                    <label className="ios-label">Email address</label>
                    <div className="ios-input-wrap">
                      <Mail size={15} className="ios-input-icon" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="ios-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ios-submit-btn"
                  >
                    {isLoading ? <span className="ios-spinner" /> : 'Send Recovery Link'}
                  </button>

                  <button
                    type="button"
                    className="text-xs text-zinc-400 hover:text-white mt-2 block text-center"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </>
          ) : (
            /* STANDARD LOGIN VIEW */
            <>
              <div className="ios-form-header">
                <div className="ios-form-logo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="ios-form-title">Welcome back</h2>
                  <p className="ios-form-sub">Sign in to your InterviewOS account</p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ios-error"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="ios-form">
                <div className="ios-field">
                  <label className="ios-label">Email address</label>
                  <div className="ios-input-wrap">
                    <Mail size={15} className="ios-input-icon" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="ios-input"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="ios-field">
                  <div className="flex justify-between items-center">
                    <label className="ios-label">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-white hover:text-zinc-100 font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="ios-input-wrap">
                    <Lock size={15} className="ios-input-icon" />
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="ios-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="ios-eye-btn"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loginStatus !== 'idle'}
                  className={`ios-submit-btn overflow-hidden relative transition-all duration-300 ${
                    loginStatus === 'success' ? 'bg-white hover:bg-zinc-200 !text-white border-emerald-400' : ''
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {loginStatus === 'idle' && (
                      <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                        Enter Platform <ArrowRight size={16} />
                      </motion.div>
                    )}
                    {loginStatus === 'authenticating' && (
                      <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                        <span className="ios-spinner" /> Authenticating Neural Engine...
                      </motion.div>
                    )}
                    {loginStatus === 'success' && (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 font-bold tracking-tight">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ACCESS GRANTED
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </form>

              {/* Divider */}
              <div className="ios-divider">
                <div className="ios-divider-line" />
                <span className="ios-divider-text">OR CONTINUE WITH</span>
                <div className="ios-divider-line" />
              </div>

              {/* Social Logins */}
              <div className="ios-social-row">
                <button
                  type="button"
                  className="ios-social-btn"
                  onClick={() => window.location.href = '/api/auth/oauth?provider=google'}
                  disabled={loginStatus !== 'idle'}
                >
                  <svg className="w-4 h-4 mr-2 text-rose-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-7.989s3.53-7.99 7.859-7.99c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.502 15.427 1.25 12.24 1.25 6.082 1.25 1.1 6.232 1.1 12.39s4.982 11.14 11.14 11.14c6.43 0 10.7-4.52 10.7-10.89 0-.733-.078-1.293-.174-1.854h-10.53V10.28z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="ios-social-btn"
                  onClick={() => window.location.href = '/api/auth/oauth?provider=github'}
                  disabled={loginStatus !== 'idle'}
                >
                  <svg className="w-4 h-4 mr-2 text-slate-100 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </button>
              </div>

              {/* Demo Quick Access */}
              <div className="ios-demo-row mt-4">
                <button
                  type="button"
                  className="ios-demo-btn group"
                  onClick={() => handleDemoLogin('demo.candidate@interviewos.com')}
                  disabled={loginStatus !== 'idle'}
                >
                  <div className="ios-demo-icon ios-demo-icon-candidate">C</div>
                  <div>
                    <div className="ios-demo-role">Candidate Demo</div>
                    <div className="ios-demo-hint">Practice interviews</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="ios-demo-btn group"
                  onClick={() => handleDemoLogin('demo.recruiter@interviewos.com')}
                  disabled={loginStatus !== 'idle'}
                >
                  <div className="ios-demo-icon ios-demo-icon-recruiter">R</div>
                  <div>
                    <div className="ios-demo-role text-zinc-300 group-hover:text-white transition-colors">Recruiter Demo</div>
                    <div className="ios-demo-hint">Proctor dashboard</div>
                  </div>
                </button>
              </div>

              <p className="ios-switch-text">
                No account?{' '}
                <Link href="/signup" className="ios-switch-link">Create one free</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

        .ios-auth-root {
          min-height: 100vh;
          display: flex;
          background: #050508;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          transition: background 0.3s ease;
        }
        
        .light .ios-auth-root {
          background: #f8fafc;
        }

        .light .ios-auth-root h1 { color: #0f172a; }
        .light .ios-auth-root p { color: #475569; }
        .light .ios-auth-right { background: #ffffff; border-left: 1px solid #e2e8f0; }
        .light .ios-form-container { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); }
        .light .ios-form-container h2 { color: #0f172a; }
        .light .ios-form-container p { color: #64748b; }
        .light .ios-label { color: #475569; }
        .light .ios-input { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; }
        .light .ios-input::placeholder { color: #94a3b8; }
        .light .ios-input-icon { color: #64748b; }
        .light .ios-demo-btn { background: #f8fafc; border: 1px solid #e2e8f0; }
        .light .ios-demo-role { color: #0f172a; }
        .light .ios-demo-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .light .ios-switch-text { color: #64748b; }
        .light .ios-switch-link { color: #2563eb; }
        .light .ios-divider-line { background: #e2e8f0; }
        .light .ios-divider-text { color: #94a3b8; }
        .light .ios-auth-left::after { background: linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(37,99,235,0.05) 50%, rgba(248,250,252,0.95) 100%); }

        /* ── LEFT PANEL ── */
        .ios-auth-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          position: relative;
          overflow: hidden;
          background: #020617;
        }
        @media (min-width: 1024px) { .ios-auth-left { display: flex; flex: 1; } }

        .ios-auth-left-bg {
          position: absolute;
          inset: 0;
          background-image: url('/images/login_bg.png');
          background-size: cover;
          background-position: center left;
          opacity: 0.55;
          z-index: 0;
        }
        .ios-auth-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(5,5,8,0.55) 0%, rgba(37,99,235,0.08) 50%, rgba(5,5,8,0.8) 100%);
          z-index: 1;
          transition: background 0.3s ease;
        }
        .ios-auth-left > * { position: relative; z-index: 2; }

        /* Animated grid */
        .ios-auth-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 1;
        }

        /* Glow orbs */
        .ios-auth-left-bg + * { position: relative; }

        .ios-brand { display: flex; align-items: center; gap: 10px; }
        .ios-brand-icon {
          width: 36px; height: 36px;
          background: #2563eb;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(37,99,235,0.4);
        }
        .ios-brand-name { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
        .ios-brand-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
          color: #2563eb; background: rgba(37,99,235,0.12);
          border: 1px solid rgba(37,99,235,0.25);
          padding: 2px 8px; border-radius: 20px; margin-left: 4px;
        }

        .ios-hero { max-width: 440px; }
        .ios-hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          color: #60a5fa; background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.2);
          padding: 5px 12px; border-radius: 20px; margin-bottom: 20px;
        }
        .ios-hero-tag::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%;
          background: #2563eb; box-shadow: 0 0 6px #2563eb;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .ios-hero-title {
          font-size: 48px; font-weight: 900; line-height: 1.05;
          color: #fff; letter-spacing: -1.5px; margin: 0 0 16px;
        }
        .ios-hero-accent {
          color: #2563eb;
        }
        .ios-hero-desc {
          font-size: 14px; line-height: 1.7; color: #64748b; max-width: 380px;
        }

        /* Terminal */
        .ios-terminal {
          background: rgba(2,4,10,0.75);
          border: 1px solid rgba(37,99,235,0.15);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          max-width: 480px;
        }
        .ios-terminal-header {
          display: flex; align-items: center; gap: 7px;
          padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.02);
        }
        .ios-terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
        .ios-terminal-title { font-size: 11px; color: #475569; margin-left: 8px; font-family: 'JetBrains Mono', monospace; }
        .ios-terminal-body { padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.7; }
        .ios-terminal-line { display: flex; gap: 12px; }
        .ios-terminal-lnum { color: #334155; min-width: 20px; user-select: none; }
        .ios-cursor {
          display: inline-block; width: 7px; height: 14px;
          background: #2563eb; vertical-align: middle; margin-left: 1px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Stats */
        .ios-stats { display: flex; gap: 0; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; max-width: 480px; }
        .ios-stat {
          flex: 1; padding: 16px 20px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        .ios-stat:last-child { border-right: none; }
        .ios-stat-value { font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        .ios-stat-label { font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Ticker */
        .ios-ticker {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 10px 16px; max-width: 480px; overflow: hidden;
        }
        .ios-ticker-inner { display: flex; align-items: center; gap: 8px; }
        .ios-ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .ios-ticker-icon { color: #60a5fa; }
        .ios-ticker-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
        .ios-ticker-sep { color: #334155; font-size: 11px; }
        .ios-ticker-val { font-size: 11px; font-weight: 700; color: #bfdbfe; }

        /* ── RIGHT PANEL ── */
        .ios-auth-right {
          width: 100%; display: flex; align-items: center; justify-content: center;
          padding: 24px 20px; background: #07070a;
          position: relative;
        }
        @media (min-width: 1024px) { .ios-auth-right { width: 480px; flex-shrink: 0; } }

        .ios-auth-right::before {
          content: '';
          position: absolute;
          top: -200px; right: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .ios-form-card {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }

        .ios-form-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ios-form-logo {
          width: 44px; height: 44px; flex-shrink: 0;
          background: #2563eb;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
        }
        .ios-form-title { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.4px; margin: 0 0 2px; }
        .ios-form-sub { font-size: 12px; color: #475569; margin: 0; }

        .ios-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          color: #f87171; font-size: 12px; font-weight: 500;
          padding: 10px 14px; border-radius: 10px; margin-bottom: 20px;
          overflow: hidden;
        }

        .ios-form { display: flex; flex-direction: column; gap: 18px; }

        .ios-field { display: flex; flex-direction: column; gap: 7px; }
        .ios-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }

        .ios-input-wrap { position: relative; }
        .ios-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #334155; pointer-events: none; }
        .ios-input {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 13px 14px 13px 42px;
          color: #f1f5f9; font-size: 14px; font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .ios-input::placeholder { color: #334155; }
        .ios-input:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); }
        .ios-input:focus { border-color: rgba(37,99,235,0.5); background: rgba(37,99,235,0.04); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        .ios-eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: #334155; background: none; border: none; cursor: pointer; padding: 0;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .ios-eye-btn:hover { color: #94a3b8; }

        .ios-submit-btn {
          width: 100%; padding: 14px;
          background: #2563eb;
          border: none; border-radius: 12px; cursor: pointer;
          color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; box-shadow: 0 8px 24px rgba(37,99,235,0.3);
          font-family: 'Inter', sans-serif; margin-top: 4px;
        }
        .ios-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px); box-shadow: 0 12px 32px rgba(99,102,241,0.4);
          filter: brightness(1.08);
        }
        .ios-submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .ios-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ios-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ios-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
        .ios-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .ios-divider-text { font-size: 9px; font-weight: 700; color: #334155; letter-spacing: 1.5px; white-space: nowrap; }

        .ios-social-row { display: flex; gap: 10px; }
        .ios-social-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 10px 12px; cursor: pointer;
          color: #fff; font-size: 12px; font-weight: 600;
          transition: all 0.2s;
        }
        .ios-social-btn:hover { background: rgba(16, 185, 129, 0.06); border-color: rgba(16, 185, 129, 0.2); }
        .ios-success-message {
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
          color: #fff; font-size: 13px; text-align: center;
          padding: 12px 14px; border-radius: 10px; margin-bottom: 20px;
        }

        .ios-demo-row { display: flex; gap: 10px; }
        .ios-demo-btn {
          flex: 1; display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 10px 12px; cursor: pointer;
          transition: all 0.2s; text-align: left;
        }
        .ios-demo-btn:hover { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.2); }
        .ios-demo-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .ios-demo-icon-candidate { background: #6366f1; }
        .ios-demo-icon-recruiter { background: #6366f1; }
        .ios-demo-role { font-size: 11px; font-weight: 700; color: #94a3b8; }
        .ios-demo-hint { font-size: 10px; color: #334155; margin-top: 1px; }

        .ios-switch-text { text-align: center; font-size: 12px; color: #475569; margin-top: 20px; }
        .ios-switch-link { color: #818cf8; font-weight: 700; text-decoration: none; }
        .ios-switch-link:hover { color: #a5b4fc; }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}
