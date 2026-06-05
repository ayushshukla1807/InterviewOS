'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, User, Building2, CheckCircle2, Briefcase, UserCheck } from 'lucide-react';

const ROLES = [
  {
    value: 'candidate',
    icon: UserCheck,
    label: 'Candidate',
    desc: 'Practice & ace interviews',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    value: 'recruiter',
    icon: Briefcase,
    label: 'Recruiter',
    desc: 'Screen & evaluate talent',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    value: 'founder',
    icon: Building2,
    label: 'Founder / Admin',
    desc: 'Global hiring overview',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    glow: 'rgba(245,158,11,0.3)',
  },
];

const PERKS = [
  'Adaptive AI behavioral tracking',
  'Live coding IDE with AI review',
  'Real-time frustration analytics',
  'Zara & Syed AI interviewers',
  'Multi-theme simulation modes',
  'Instant performance reports',
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('candidate');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [perkIndex, setPerkIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPerkIndex(i => (i + 1) % PERKS.length), 2000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, organization: role !== 'candidate' ? organization : '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('interviewos_token', data.token);
      localStorage.setItem('interviewos_user', JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => router.push(data.user.role === 'candidate' ? '/candidate' : '/recruiter'), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role)!;

  return (
    <div className="su-root">
      {/* Left Panel */}
      <div className="su-left">
        <div className="su-left-bg" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="su-brand">
          <div className="su-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="su-brand-name">InterviewOS</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="su-hero">
          <div className="su-hero-eyebrow">Join 50,000+ professionals</div>
          <h1 className="su-hero-title">
            Your Career,<br />
            <span className="su-hero-accent">Supercharged by AI.</span>
          </h1>
          <p className="su-hero-desc">
            The most advanced interview simulation platform. Behavioral AI, adaptive coding challenges, and real-time analytics — all in one place.
          </p>
        </motion.div>

        {/* Perks List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="su-perks">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk}
              className={`su-perk${i === perkIndex ? ' su-perk-active' : ''}`}
              animate={{ opacity: i === perkIndex ? 1 : 0.45 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`su-perk-check${i === perkIndex ? ' su-perk-check-active' : ''}`}>
                <CheckCircle2 size={14} />
              </div>
              <span>{perk}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Preview Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="su-preview">
          <div className="su-preview-header">
            <div className="su-preview-avatar">ZR</div>
            <div>
              <div className="su-preview-name">Zara — AI Interviewer</div>
              <div className="su-preview-status">
                <span className="su-live-dot" />
                Live Session Active
              </div>
            </div>
            <div className="su-preview-score">
              <div className="su-preview-score-val">87</div>
              <div className="su-preview-score-label">Trust</div>
            </div>
          </div>
          <div className="su-preview-quote">
            "Tell me about a time you had to debug a critical production issue under pressure. Walk me through your thought process."
          </div>
          <div className="su-preview-bars">
            {[
              { label: 'Clarity', w: '78%', color: '#6366f1' },
              { label: 'Confidence', w: '63%', color: '#8b5cf6' },
              { label: 'Depth', w: '91%', color: '#38bdf8' },
            ].map(b => (
              <div key={b.label} className="su-preview-bar-row">
                <span className="su-preview-bar-label">{b.label}</span>
                <div className="su-preview-bar-track">
                  <motion.div
                    className="su-preview-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: b.w }}
                    transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    style={{ background: b.color }}
                  />
                </div>
                <span className="su-preview-bar-val">{b.w}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="su-right">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="su-card"
        >
          <div className="su-card-header">
            <div className="su-card-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="su-card-title">Create your account</h2>
              <p className="su-card-sub">Free forever — no credit card needed</p>
            </div>
          </div>

          {/* Role Selector */}
          <div className="su-role-group">
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`su-role-btn${role === r.value ? ' su-role-btn-active' : ''}`}
                  style={role === r.value ? { borderColor: 'rgba(99,102,241,0.4)', boxShadow: `0 0 0 3px rgba(99,102,241,0.1)` } : {}}
                >
                  <div className="su-role-icon" style={{ background: role === r.value ? r.gradient : undefined }}>
                    <Icon size={14} />
                  </div>
                  <div className="su-role-text">
                    <div className="su-role-label">{r.label}</div>
                    <div className="su-role-desc">{r.desc}</div>
                  </div>
                  {role === r.value && <div className="su-role-check"><CheckCircle2 size={14} /></div>}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="su-error"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="su-success"
              >
                <CheckCircle2 size={14} />
                Account created! Redirecting to your dashboard...
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="su-form">
            <div className="su-row">
              <div className="su-field">
                <label className="su-label">Full Name</label>
                <div className="su-input-wrap">
                  <User size={14} className="su-input-icon" />
                  <input id="signup-name" type="text" required placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} className="su-input" autoComplete="name" />
                </div>
              </div>
              <div className="su-field">
                <label className="su-label">Email</label>
                <div className="su-input-wrap">
                  <Mail size={14} className="su-input-icon" />
                  <input id="signup-email" type="email" required placeholder="alex@company.com" value={email} onChange={e => setEmail(e.target.value)} className="su-input" autoComplete="email" />
                </div>
              </div>
            </div>

            <div className="su-field">
              <label className="su-label">Password</label>
              <div className="su-input-wrap">
                <Lock size={14} className="su-input-icon" />
                <input id="signup-password" type={showPass ? 'text' : 'password'} required placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="su-input" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="su-eye-btn" tabIndex={-1}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {role !== 'candidate' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="su-field"
                >
                  <label className="su-label">Organization Name</label>
                  <div className="su-input-wrap">
                    <Building2 size={14} className="su-input-icon" />
                    <input id="signup-org" type="text" required placeholder="e.g. Acme Corp" value={organization} onChange={e => setOrganization(e.target.value)} className="su-input" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button id="signup-submit" type="submit" disabled={isLoading || success} className="su-submit" style={{ background: selectedRole.gradient, boxShadow: `0 8px 24px ${selectedRole.glow}` }}>
              {isLoading ? (
                <span className="su-spinner" />
              ) : (
                <>
                  Create {selectedRole.label} Account <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="su-switch">
            Already have an account?{' '}
            <Link href="/login" className="su-switch-link">Sign in</Link>
          </p>

          <p className="su-terms">
            By creating an account you agree to our{' '}
            <span style={{ color: '#475569', cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#475569', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .su-root {
          min-height: 100vh; display: flex;
          background: #050508; font-family: 'Inter', sans-serif; overflow: hidden;
        }

        /* ── LEFT ── */
        .su-left {
          display: none; flex: 1; flex-direction: column;
          justify-content: space-between; padding: 40px 48px;
          position: relative; overflow: hidden;
        }
        @media (min-width: 1024px) { .su-left { display: flex; } }

        .su-left-bg {
          position: absolute; inset: 0;
          background-image: url('/auth-bg.png');
          background-size: cover; background-position: center left;
          opacity: 0.3; z-index: 0;
        }
        .su-left::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px; z-index: 1;
        }
        .su-left::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(5,5,8,0.6) 0%, rgba(99,102,241,0.06) 50%, rgba(5,5,8,0.75) 100%);
          z-index: 1;
        }
        .su-left > * { position: relative; z-index: 2; }

        .su-brand { display: flex; align-items: center; gap: 10px; }
        .su-brand-icon { width: 34px; height: 34px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .su-brand-name { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }

        .su-hero { max-width: 420px; }
        .su-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          color: #22c55e; background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2); padding: 5px 12px;
          border-radius: 20px; margin-bottom: 18px;
        }
        .su-hero-eyebrow::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e; animation: su-pulse 2s ease-in-out infinite; }
        @keyframes su-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .su-hero-title { font-size: 44px; font-weight: 900; line-height: 1.05; color: #fff; letter-spacing: -1.5px; margin: 0 0 14px; }
        .su-hero-accent { background: linear-gradient(135deg, #818cf8 0%, #38bdf8 60%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .su-hero-desc { font-size: 14px; line-height: 1.65; color: #64748b; }

        .su-perks { display: flex; flex-direction: column; gap: 10px; max-width: 380px; }
        .su-perk { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #94a3b8; transition: color 0.3s; }
        .su-perk-active { color: #e2e8f0; }
        .su-perk-check { color: #334155; transition: color 0.3s; }
        .su-perk-check-active { color: #6366f1; }

        .su-preview {
          background: rgba(2,4,10,0.7); border: 1px solid rgba(99,102,241,0.15);
          border-radius: 16px; padding: 20px; max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5); backdrop-filter: blur(10px);
        }
        .su-preview-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .su-preview-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .su-preview-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .su-preview-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748b; margin-top: 2px; }
        .su-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e; animation: su-pulse 1.5s ease-in-out infinite; }
        .su-preview-score { margin-left: auto; text-align: center; }
        .su-preview-score-val { font-size: 22px; font-weight: 900; color: #6366f1; line-height: 1; }
        .su-preview-score-label { font-size: 9px; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .su-preview-quote { font-size: 12px; line-height: 1.6; color: #64748b; margin-bottom: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border-left: 2px solid rgba(99,102,241,0.3); }
        .su-preview-bars { display: flex; flex-direction: column; gap: 8px; }
        .su-preview-bar-row { display: flex; align-items: center; gap: 10px; }
        .su-preview-bar-label { font-size: 10px; color: #475569; width: 65px; font-weight: 600; }
        .su-preview-bar-track { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .su-preview-bar-fill { height: 100%; border-radius: 2px; }
        .su-preview-bar-val { font-size: 10px; color: #64748b; width: 28px; text-align: right; }

        /* ── RIGHT ── */
        .su-right {
          width: 100%; display: flex; align-items: center; justify-content: center;
          padding: 24px 20px; background: #07070a; position: relative; overflow-y: auto;
        }
        @media (min-width: 1024px) { .su-right { width: 500px; flex-shrink: 0; } }

        .su-right::before {
          content: ''; position: absolute; top: -150px; right: -150px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .su-card {
          width: 100%; max-width: 440px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 32px 28px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }

        .su-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .su-card-logo { width: 42px; height: 42px; flex-shrink: 0; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(99,102,241,0.3); }
        .su-card-title { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -0.4px; margin: 0 0 2px; }
        .su-card-sub { font-size: 12px; color: #475569; margin: 0; }

        /* Role selector */
        .su-role-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .su-role-btn {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 11px 14px; cursor: pointer;
          transition: all 0.2s; text-align: left;
        }
        .su-role-btn:hover { background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.2); }
        .su-role-btn-active { background: rgba(99,102,241,0.06) !important; }
        .su-role-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          color: #64748b; flex-shrink: 0; transition: all 0.2s;
        }
        .su-role-btn-active .su-role-icon { color: #fff; }
        .su-role-text { flex: 1; }
        .su-role-label { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .su-role-desc { font-size: 11px; color: #475569; margin-top: 1px; }
        .su-role-check { color: #6366f1; margin-left: auto; }

        .su-error { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; font-size: 12px; font-weight: 500; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; overflow: hidden; }
        .su-success { display: flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; font-size: 12px; font-weight: 500; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; }

        .su-form { display: flex; flex-direction: column; gap: 14px; }
        .su-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .su-row { grid-template-columns: 1fr; } }

        .su-field { display: flex; flex-direction: column; gap: 6px; }
        .su-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }

        .su-input-wrap { position: relative; }
        .su-input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #334155; pointer-events: none; }
        .su-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px; padding: 11px 13px 11px 38px;
          color: #f1f5f9; font-size: 13px; font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .su-input::placeholder { color: #334155; }
        .su-input:hover { border-color: rgba(255,255,255,0.14); }
        .su-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.04); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

        .su-eye-btn { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: #334155; background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; }
        .su-eye-btn:hover { color: #94a3b8; }

        .su-submit {
          width: 100%; padding: 13px; border: none; border-radius: 12px; cursor: pointer;
          color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; font-family: 'Inter', sans-serif; margin-top: 4px;
        }
        .su-submit:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
        .su-submit:active:not(:disabled) { transform: scale(0.99); }
        .su-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .su-spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: su-spin 0.7s linear infinite; }
        @keyframes su-spin { to { transform: rotate(360deg); } }

        .su-switch { text-align: center; font-size: 12px; color: #475569; margin-top: 20px; }
        .su-switch-link { color: #818cf8; font-weight: 700; text-decoration: none; }
        .su-switch-link:hover { color: #a5b4fc; }

        .su-terms { text-align: center; font-size: 10px; color: #334155; margin-top: 10px; line-height: 1.5; }
      `}</style>
    </div>
  );
}
