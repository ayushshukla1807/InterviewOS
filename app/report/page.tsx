'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Outfit } from 'next/font/google';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
} from 'lucide-react';

// ─── FONT ────────────────────────────────────────────────────────────────────
const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface HyrteSkillScore {
  directSkill: {
    score: number;
    weight: 0.15;
    responses: { questionId: string; response: string; score: number; rationale: string }[];
  };
  embeddedSkills: {
    score: number;
    weight: 0.35;
    dimensions: Record<string, { score: number; label: string; observations: string[] }>;
  };
  workplaceIntelligence: {
    score: number;
    weight: 0.50;
    dimensions: {
      communication: number;
      adaptability: number;
      conflictHandling: number;
      stakeholderManagement: number;
      prioritization: number;
      accountability: number;
      pressureResponse: number;
      decisionQuality: number;
    };
    observations: string[];
  };
  total: number;
  hiringInsight: string;
  recoveryScore: number;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return '#34d399';
  if (s >= 55) return '#f59e0b';
  return '#f87171';
}

function scoreBg(s: number) {
  if (s >= 75) return 'rgba(52,211,153,0.08)';
  if (s >= 55) return 'rgba(245,158,11,0.08)';
  return 'rgba(248,113,113,0.08)';
}

function scoreBorder(s: number) {
  if (s >= 75) return 'rgba(52,211,153,0.18)';
  if (s >= 55) return 'rgba(245,158,11,0.18)';
  return 'rgba(248,113,113,0.18)';
}

function recommendation(total: number) {
  if (total >= 80) return { label: 'Strong Hire', color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)' };
  if (total >= 65) return { label: 'Hire', color: '#6366f1', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)' };
  if (total >= 50) return { label: 'Caution', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
  return { label: 'Reject', color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' };
}

function fmtDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── SVG RADAR CHART ─────────────────────────────────────────────────────────
function RadarChart({ dims }: { dims: Record<string, number> }) {
  const entries = Object.entries(dims);
  const n = entries.length;
  const cx = 160, cy = 160, r = 110;

  const toXY = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const d = (val / 100) * r;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  };

  const labelXY = (idx: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return { x: cx + (r + 32) * Math.cos(angle), y: cy + (r + 32) * Math.sin(angle) };
  };

  const polyPts = entries.map(([, v], i) => toXY(i, v));
  const poly = polyPts.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = [20, 40, 60, 80, 100];
  const gridLines = gridLevels.map(pct => {
    const pts = entries.map((_, i) => toXY(i, pct));
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  });

  const dimLabels: Record<string, string> = {
    communication: 'Comm.',
    adaptability: 'Adapt.',
    conflictHandling: 'Conflict',
    stakeholderManagement: 'Stakeholder',
    prioritization: 'Priority',
    accountability: 'Account.',
    pressureResponse: 'Pressure',
    decisionQuality: 'Decision',
  };

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[340px] mx-auto">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* Grid rings */}
      {gridLines.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={i === gridLines.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}
          strokeWidth={i === gridLines.length - 1 ? 1.5 : 1}
        />
      ))}
      {/* Spokes */}
      {entries.map((_, i) => {
        const end = toXY(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Data fill */}
      <polygon points={poly} fill="url(#radarGrad)" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Data dots */}
      {polyPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="#0a0a0c" strokeWidth="2" />
      ))}
      {/* Labels */}
      {entries.map(([k, v], i) => {
        const lp = labelXY(i);
        const c = scoreColor(v);
        return (
          <g key={i}>
            <text
              x={lp.x}
              y={lp.y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="rgba(148,163,184,0.9)"
              fontWeight="700"
              fontFamily="Outfit, sans-serif"
            >
              {dimLabels[k] || k}
            </text>
            <text
              x={lp.x}
              y={lp.y + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill={c}
              fontWeight="900"
              fontFamily="Outfit, sans-serif"
            >
              {v}
            </text>
          </g>
        );
      })}
      {/* Center score label */}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="rgba(148,163,184,0.5)" fontWeight="600" fontFamily="Outfit, sans-serif">
        WI Score
      </text>
    </svg>
  );
}

// ─── SCORE ARC (mini donut) ───────────────────────────────────────────────────
function ScoreArc({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const R = size * 0.38;
  const circ = 2 * Math.PI * R;
  const dash = (score / 100) * circ;
  const gap = circ - dash;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={circ * 0.25}
        style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fill="white" fontWeight="900" fontFamily="Outfit, sans-serif">
        {score}
      </text>
    </svg>
  );
}

// ─── RECOVERY GAUGE ───────────────────────────────────────────────────────────
function RecoveryGauge({ score }: { score: number }) {
  const W = 220, H = 130;
  const cx = W / 2, cy = H - 20;
  const R = 90;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const progress = (score / 100) * totalArc;

  const arcPath = (from: number, to: number, radius: number) => {
    const x1 = cx + radius * Math.cos(from);
    const y1 = cy + radius * Math.sin(from);
    const x2 = cx + radius * Math.cos(to);
    const y2 = cy + radius * Math.sin(to);
    const large = Math.abs(to - from) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngle = Math.PI - progress;
  const needleX = cx + 65 * Math.cos(needleAngle);
  const needleY = cy + 65 * Math.sin(needleAngle);

  const gaugeColor = scoreColor(score);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[220px] mx-auto">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={arcPath(startAngle, endAngle, R)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
      {/* Progress */}
      <path
        d={arcPath(startAngle, Math.PI - progress, R)}
        fill="none"
        stroke={gaugeColor}
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}88)` }}
      />
      {/* Gradient overlay track label */}
      <text x={cx - R - 8} y={cy + 16} textAnchor="middle" fontSize="8" fill="rgba(248,113,113,0.7)" fontWeight="700" fontFamily="Outfit, sans-serif">0</text>
      <text x={cx + R + 8} y={cy + 16} textAnchor="middle" fontSize="8" fill="rgba(52,211,153,0.7)" fontWeight="700" fontFamily="Outfit, sans-serif">100</text>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <circle cx={cx} cy={cy} r="6" fill="white" opacity="0.9" />
      {/* Score text */}
      <text x={cx} y={cy - 28} textAnchor="middle" fontSize="26" fill="white" fontWeight="900" fontFamily="Outfit, sans-serif">{score}</text>
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.6)" fontWeight="600" fontFamily="Outfit, sans-serif">RECOVERY SCORE</text>
    </svg>
  );
}

// ─── DIMENSION BAR ────────────────────────────────────────────────────────────
function DimBar({ label, score }: { label: string; score: number }) {
  const c = scoreColor(score);
  const bg = scoreBg(score);
  const border = scoreBorder(score);
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.9)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: c }}>{score}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ height: '100%', background: c, borderRadius: 99, boxShadow: `0 0 8px ${c}66` }}
        />
      </div>
    </div>
  );
}

// ─── FADE IN WRAPPER ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: '#111115',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 20 }}>
      {children}
    </p>
  );
}

// ─── MAIN REPORT CONTENT ─────────────────────────────────────────────────────
function ReportContent() {
  const searchParams = useSearchParams();
  const [score, setScore] = useState<HyrteSkillScore | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  const sessionId = searchParams.get('sessionId') || '';
  const candidateName = searchParams.get('name') || 'Candidate';
  const role = searchParams.get('role') || 'Software Engineer';
  const company = searchParams.get('company') || 'Company';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`hyrte_score_${sessionId}`);
      const sum = localStorage.getItem(`simulation_summary_${sessionId}`);
      if (raw) setScore(JSON.parse(raw));
      if (sum) setSummary(sum);
    } catch (e) {
      console.error('Failed to read report data', e);
    }
    setLoaded(true);
  }, [sessionId]);

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!score) {
    return (
      <div className={outfit.className} style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 4 }}>📋</div>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>No Report Data Found</h2>
        <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 13, margin: 0 }}>
          Could not find assessment data for session <code style={{ color: '#6366f1' }}>{sessionId || '(none)'}</code>
        </p>
        <Link
          href="/recruiter"
          style={{
            marginTop: 12,
            padding: '12px 28px',
            background: '#6366f1',
            color: 'white',
            borderRadius: 14,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowLeft size={15} /> Back to Recruiter Dashboard
        </Link>
      </div>
    );
  }

  const rec = recommendation(score.total);
  const dimEntries = Object.entries(score.workplaceIntelligence.dimensions) as [string, number][];
  const dimLabels: Record<string, string> = {
    communication: 'Communication',
    adaptability: 'Adaptability',
    conflictHandling: 'Conflict Handling',
    stakeholderManagement: 'Stakeholder Mgmt.',
    prioritization: 'Prioritization',
    accountability: 'Accountability',
    pressureResponse: 'Pressure Response',
    decisionQuality: 'Decision Quality',
  };

  return (
    <div
      className={outfit.className}
      id="report-root"
      style={{ minHeight: '100vh', background: '#0a0a0c', color: 'white' }}
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #report-root { background: white !important; color: black !important; }
          #report-root * { color: black !important; border-color: #e5e7eb !important; }
          .print-card { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Ambient glows */}
      <div className="no-print" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 700, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 500, height: 400, background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 10 }}>

        {/* ── TOP BADGE STRIP ── */}
        <FadeIn delay={0}>
          <div style={{
            textAlign: 'center',
            marginBottom: 36,
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.4)', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
              HYRTE Assessment Report · Confidential · InterviewOS
            </span>
          </div>
        </FadeIn>

        {/* ── HEADER ── */}
        <FadeIn delay={0.05}>
          <div style={{ marginBottom: 40 }}>
            {/* Back + Print row */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <Link
                href="/recruiter"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)',
                  textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.5)')}
              >
                <ArrowLeft size={13} /> Back to Recruiter
              </Link>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 22px',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.28)',
                }}
              >
                <Download size={13} /> Download PDF
              </motion.button>
            </div>

            {/* Hero header */}
            <div style={{
              background: 'linear-gradient(135deg, #111115 0%, #0d0d14 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 28,
              padding: '40px 44px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle violet blur */}
              <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
                {/* Left: Identity */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span
                      style={{
                        padding: '4px 14px',
                        background: rec.bg,
                        border: `1px solid ${rec.border}`,
                        borderRadius: 99,
                        fontSize: 9,
                        fontWeight: 800,
                        color: rec.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                      }}
                    >
                      {rec.label}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                      · {fmtDate()}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 44, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                    {candidateName}
                  </h1>
                  <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.65)', margin: 0, fontWeight: 500 }}>
                    {role} &nbsp;·&nbsp; {company}
                  </p>
                  {sessionId && (
                    <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.3)', margin: '10px 0 0', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Session · {sessionId}
                    </p>
                  )}
                </div>

                {/* Right: Total score badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: `conic-gradient(${scoreColor(score.total)} ${score.total * 3.6}deg, rgba(255,255,255,0.04) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 40px ${scoreColor(score.total)}33, 0 0 0 6px rgba(255,255,255,0.04)`,
                    position: 'relative',
                  }}>
                    <div style={{
                      width: 96, height: 96,
                      borderRadius: '50%',
                      background: '#0a0a0c',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 34, fontWeight: 900, color: scoreColor(score.total), lineHeight: 1 }}>{score.total}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>HYRTE</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', marginTop: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Total Score
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── 3-CARD ROW ── */}
        <FadeIn delay={0.12}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            {/* Direct Skill */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={15} color="#6366f1" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'white' }}>Direct Skill</p>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(148,163,184,0.45)', fontWeight: 600, letterSpacing: '0.1em' }}>WEIGHT 15%</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ScoreArc score={Math.round(score.directSkill.score)} color={scoreColor(score.directSkill.score)} size={72} />
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: scoreColor(score.directSkill.score), lineHeight: 1 }}>{Math.round(score.directSkill.score)}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 9, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>{score.directSkill.responses.length} responses</p>
                </div>
              </div>
            </Card>

            {/* Embedded Skills */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(52,211,153,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={15} color="#34d399" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'white' }}>Embedded Skills</p>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(148,163,184,0.45)', fontWeight: 600, letterSpacing: '0.1em' }}>WEIGHT 35%</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ScoreArc score={Math.round(score.embeddedSkills.score)} color={scoreColor(score.embeddedSkills.score)} size={72} />
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: scoreColor(score.embeddedSkills.score), lineHeight: 1 }}>{Math.round(score.embeddedSkills.score)}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 9, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>{Object.keys(score.embeddedSkills.dimensions).length} dimensions</p>
                </div>
              </div>
            </Card>

            {/* Workplace Intelligence */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} color="#f59e0b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'white' }}>Workplace Intelligence</p>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(148,163,184,0.45)', fontWeight: 600, letterSpacing: '0.1em' }}>WEIGHT 50%</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ScoreArc score={Math.round(score.workplaceIntelligence.score)} color={scoreColor(score.workplaceIntelligence.score)} size={72} />
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: scoreColor(score.workplaceIntelligence.score), lineHeight: 1 }}>{Math.round(score.workplaceIntelligence.score)}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 9, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>8 dimensions</p>
                </div>
              </div>
            </Card>
          </div>
        </FadeIn>

        {/* ── RADAR + WI DIMENSIONS ── */}
        <FadeIn delay={0.18}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {/* Radar */}
            <Card>
              <SectionTitle>Workplace Intelligence Radar</SectionTitle>
              <RadarChart dims={score.workplaceIntelligence.dimensions} />
            </Card>

            {/* Dimension Bars */}
            <Card>
              <SectionTitle>Dimension Breakdown</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dimEntries.map(([key, val]) => (
                  <DimBar key={key} label={dimLabels[key] || key} score={val} />
                ))}
              </div>
            </Card>
          </div>
        </FadeIn>

        {/* ── RECOVERY SCORE + HIRING INSIGHT ── */}
        <FadeIn delay={0.22}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 28 }}>
            {/* Recovery Gauge */}
            <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <SectionTitle>Recovery Score</SectionTitle>
              <RecoveryGauge score={Math.round(score.recoveryScore)} />
              <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', marginTop: 14, textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>
                Measures how well the candidate recovered from mistakes or curveball questions during simulation.
              </p>
            </Card>

            {/* Hiring Insight */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <SectionTitle>Hiring Insight · CEO Memo</SectionTitle>
              <div style={{
                borderLeft: '3px solid #6366f1',
                paddingLeft: 20,
                marginBottom: 20,
              }}>
                <FileText size={16} color="#6366f1" style={{ marginBottom: 10 }} />
                <p style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'rgba(226,232,240,0.92)',
                  lineHeight: 1.78,
                  margin: 0,
                  letterSpacing: '0.01em',
                  fontStyle: 'italic',
                }}>
                  &ldquo;{score.hiringInsight}&rdquo;
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  padding: '5px 14px',
                  background: rec.bg,
                  border: `1px solid ${rec.border}`,
                  borderRadius: 99,
                  fontSize: 9,
                  fontWeight: 800,
                  color: rec.color,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.2em',
                }}>
                  {rec.label}
                </div>
                <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  · AI-Generated Assessment · InterviewOS HYRTE Engine
                </span>
              </div>
            </Card>
          </div>
        </FadeIn>

        {/* ── OBSERVATIONS ── */}
        {score.workplaceIntelligence.observations.length > 0 && (
          <FadeIn delay={0.26}>
            <Card style={{ marginBottom: 28 }}>
              <SectionTitle>Workplace Intelligence · Observations</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 10 }}>
                {score.workplaceIntelligence.observations.map((obs, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                      flexShrink: 0, marginTop: 7,
                      boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                    }} />
                    <p style={{ fontSize: 12, color: 'rgba(203,213,225,0.8)', lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{obs}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* ── EMBEDDED SKILL DIMENSIONS ── */}
        {Object.keys(score.embeddedSkills.dimensions).length > 0 && (
          <FadeIn delay={0.28}>
            <Card style={{ marginBottom: 28 }}>
              <SectionTitle>Embedded Skill Dimensions</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {Object.entries(score.embeddedSkills.dimensions).map(([key, dim]) => (
                  <div
                    key={key}
                    style={{
                      background: scoreBg(dim.score),
                      border: `1px solid ${scoreBorder(dim.score)}`,
                      borderRadius: 16,
                      padding: '16px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(226,232,240,0.9)' }}>{dim.label || key}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor(dim.score) }}>{dim.score}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                        style={{ height: '100%', background: scoreColor(dim.score), borderRadius: 99 }}
                      />
                    </div>
                    {dim.observations.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dim.observations.slice(0, 2).map((obs, oi) => (
                          <li key={oi} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 8, color: scoreColor(dim.score), marginTop: 4, flexShrink: 0 }}>●</span>
                            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* ── SIMULATION SUMMARY ── */}
        {summary && (
          <FadeIn delay={0.30}>
            <Card style={{ marginBottom: 28 }}>
              <SectionTitle>Simulation Summary</SectionTitle>
              <p style={{ fontSize: 13, color: 'rgba(203,213,225,0.75)', lineHeight: 1.8, margin: 0, fontWeight: 400 }}>
                {summary}
              </p>
            </Card>
          </FadeIn>
        )}

        {/* ── DIRECT SKILL RESPONSES ── */}
        {score.directSkill.responses.length > 0 && (
          <FadeIn delay={0.32}>
            <div style={{ marginBottom: 28 }}>
              <SectionTitle>Direct Skill · Response Cards</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {score.directSkill.responses.map((r, i) => {
                  const sc = r.score;
                  const c = scoreColor(sc);
                  const bg = scoreBg(sc);
                  const border = scoreBorder(sc);
                  return (
                    <Card key={i} style={{ border: `1px solid ${border}`, background: '#111115' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={13} color="#6366f1" />
                          </div>
                          <code style={{
                            fontSize: 9, fontWeight: 800, color: '#6366f1',
                            background: 'rgba(99,102,241,0.08)',
                            padding: '3px 9px', borderRadius: 6,
                            letterSpacing: '0.1em', fontFamily: 'monospace',
                          }}>
                            {r.questionId}
                          </code>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {sc >= 75 ? <CheckCircle2 size={13} color="#34d399" /> : sc >= 55 ? <AlertTriangle size={13} color="#f59e0b" /> : <XCircle size={13} color="#f87171" />}
                          <span style={{ fontSize: 16, fontWeight: 900, color: c }}>{sc}</span>
                        </div>
                      </div>
                      {/* Response */}
                      <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        marginBottom: 12,
                      }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Response</p>
                        <p style={{ fontSize: 12, color: 'rgba(203,213,225,0.85)', lineHeight: 1.7, margin: 0 }}>{r.response}</p>
                      </div>
                      {/* Rationale */}
                      <div style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: `${c}99`, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Rationale</p>
                        <p style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)', lineHeight: 1.7, margin: 0 }}>{r.rationale}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── FOOTER ── */}
        <FadeIn delay={0.36}>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.3)', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0 }}>
              © {new Date().getFullYear()} InterviewOS · HYRTE Engine v2.0 · Confidential
            </p>
            <div className="no-print" style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/recruiter"
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  color: 'rgba(148,163,184,0.7)',
                  textDecoration: 'none',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all 0.2s',
                }}
              >
                <ArrowLeft size={12} /> Dashboard
              </Link>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
                }}
              >
                <Download size={12} /> Save PDF
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
