'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, TrendingUp, AlertCircle, CheckCircle, BarChart3, 
  Clock, User, Download, Share2, Copy, ArrowLeft, Sparkles,
  Target, Activity, Users
} from 'lucide-react';
import Link from 'next/link';

// ─── SVG RADAR CHART ────────────────────────────────────────────────────────
function RadarChart({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores);
  const n = entries.length;
  const cx = 120, cy = 120, r = 90;
  const toXY = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const d = (val / 100) * r;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  };
  const labelXY = (idx: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return { x: cx + (r + 24) * Math.cos(angle), y: cy + (r + 24) * Math.sin(angle) };
  };
  const polyPts = entries.map(([, v], i) => toXY(i, v));
  const poly = polyPts.map(p => `${p.x},${p.y}`).join(' ');
  const gridLines = [25, 50, 75, 100].map(pct => {
    const pts = entries.map((_, i) => toXY(i, pct));
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  });
  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {/* Grid */}
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Spokes */}
      {entries.map((_, i) => {
        const end = toXY(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={poly} fill="rgba(99,102,241,0.25)" stroke="rgb(99,102,241)" strokeWidth="2" />
      {/* Data points */}
      {polyPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(99,102,241)" />
      ))}
      {/* Labels */}
      {entries.map(([k, v], i) => {
        const lp = labelXY(i);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="rgb(148,163,184)" fontWeight="700" fontFamily="sans-serif">
            {k.toUpperCase()} {v}%
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG BAR CHART ──────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const W = 320, H = 120, pad = 24, barW = (W - pad * 2) / data.length - 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Gridlines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = pad + ((100 - v) / 100) * (H - pad * 2);
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={pad - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize="6" fill="rgba(148,163,184,0.5)">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad + i * (barW + 6);
        const barH = ((d.value) / 100) * (H - pad * 2);
        const y = pad + (H - pad * 2) - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={d.color} opacity="0.8" />
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.7)" fontWeight="700">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="7" fill="white" fontWeight="900">{d.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── HISTORICAL BENCHMARK MINI-CHART ────────────────────────────────────────
function HistoricalChart({ history }: { history: { date: string; score: number }[] }) {
  const W = 280, H = 80, pad = 16;
  const xs = history.map((_, i) => pad + (i / (history.length - 1)) * (W - pad * 2));
  const ys = history.map(h => pad + ((100 - h.score) / 100) * (H - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${xs[xs.length-1]} ${H - pad} L ${xs[0]} ${H - pad} Z`} fill="url(#hg)" />
      <path d={path} fill="none" stroke="rgb(99,102,241)" strokeWidth="2" strokeLinecap="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="3" fill="rgb(99,102,241)" />
          <text x={x} y={H - 2} textAnchor="middle" fontSize="6" fill="rgba(148,163,184,0.5)">{history[i].date}</text>
        </g>
      ))}
    </svg>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const candidateName = searchParams.get('name') || 'Ayush Shukla';
  const role = searchParams.get('role') || 'Senior Full Stack Developer';
  const track = searchParams.get('track') || 'FSD';
  const overallScore = parseInt(searchParams.get('score') || '88');

  const summary = {
    candidate: candidateName,
    role,
    track,
    overallScore,
    breakdown: { Clarity: 92, Depth: 85, Integrity: 98, Confidence: 84, Speed: 78 },
    strengths: [
      'High conceptual clarity on distributed systems',
      'Admits technical gaps with professional integrity',
      'Strong debugging methodology and structured thinking',
    ],
    risks: [
      'Slight hesitation when discussing Redis cluster failover specifics',
      'Overconfident on MERN stack security benchmarks',
    ],
    recommendation: overallScore >= 80 ? 'STRONG HIRE' : overallScore >= 60 ? 'HIRE' : 'PASS',
  };

  // Historical same-role data (simulated benchmark from past JDs)
  const historicalBenchmark = [
    { date: 'Mar', score: 74 },
    { date: 'Apr', score: 79 },
    { date: 'May\'25', score: 82 },
    { date: 'Jun', score: 76 },
    { date: 'Oct', score: 85 },
    { date: 'Now', score: overallScore },
  ];

  const previousCandidates = [
    { name: 'Rohan S.', score: 82, month: 'Oct 2025', rec: 'HIRED' },
    { name: 'Priya M.', score: 74, month: 'Sep 2025', rec: 'PASS' },
    { name: 'Arjun K.', score: 91, month: 'Aug 2025', rec: 'HIRED' },
  ];

  const barData = Object.entries(summary.breakdown).map(([k, v]) => ({
    label: k, value: v,
    color: v >= 90 ? 'rgb(16,185,129)' : v >= 75 ? 'rgb(99,102,241)' : 'rgb(245,158,11)',
  }));

  const handleShare = () => {
    const url = `${window.location.origin}/report?name=${encodeURIComponent(candidateName)}&role=${encodeURIComponent(role)}&track=${track}&score=${overallScore}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 print:bg-white print:text-black" id="report-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #report-root { background: white; color: black; }
          .glass-card { border: 1px solid #e5e7eb !important; background: #f9fafb !important; }
        }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none no-print">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto p-8 lg:p-14 space-y-14 relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5">
            <Link href="/recruiter" className="no-print inline-flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${summary.recommendation === 'STRONG HIRE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : summary.recommendation === 'HIRE' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {summary.recommendation}
              </span>
              <div className="h-4 w-px bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Verified Assessment
              </span>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-white">{summary.candidate}</h1>
              <p className="text-slate-400 mt-1 text-sm font-semibold">{summary.role} · {summary.track} Track</p>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
              {copied ? <><CheckCircle className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Share Link</>}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-2xl text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_8px_25px_rgba(99,102,241,0.3)]">
              <Download className="w-4 h-4" /> Download PDF
            </motion.button>
          </div>
        </div>

        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Overall Score', value: `${summary.overallScore}%`, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/10' },
            { label: 'Hiring Signal', value: summary.recommendation, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
            { label: 'Integrity Index', value: `${summary.breakdown.Integrity}%`, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/5 border-cyan-500/10' },
            { label: 'Technical Depth', value: 'Senior', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/10' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`${s.bg} border p-6 rounded-3xl space-y-3`}>
              <div className="flex justify-between items-center">
                <s.icon className={`${s.color} w-4 h-4`} />
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{s.label}</span>
              </div>
              <p className={`text-2xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Radar Chart */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-6 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] self-start">Neural Radar</h3>
            <RadarChart scores={summary.breakdown} />
          </div>

          {/* Bar Chart */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Score Breakdown</h3>
            <BarChart data={barData} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              {barData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{d.label}: {d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths + Risks */}
          <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] space-y-4">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Verified Strengths</h3>
              {summary.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[32px] space-y-4">
              <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Risk Indicators</h3>
              {summary.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertCircle className="text-amber-500 w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Benchmark (Same Role, Previous JDs) */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Benchmark: {summary.role} — Historical Performance
              </h3>
            </div>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
              Same Role · Previous JDs
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Trend Line */}
            <div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4">Score Trend (6 hiring rounds)</p>
              <HistoricalChart history={historicalBenchmark} />
            </div>
            {/* Previous Candidates Table */}
            <div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4">Top Candidates — Same Role</p>
              <div className="space-y-3">
                {previousCandidates.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.name}&backgroundColor=4f46e5`} alt={c.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-[11px] font-black text-white">{c.name}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{c.month}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-black ${c.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{c.score}%</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${c.rec === 'HIRED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                        {c.rec}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-300">Current Candidate</span>
                  </div>
                  <p className={`text-sm font-black ${overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{overallScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5 no-print">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
            © 2026 Hyrte Intelligence · Sentient Assessment Engine v4.0
          </p>
          <div className="flex gap-4">
            <Link href="/recruiter" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">
              Back to Dashboard
            </Link>
            <motion.button whileHover={{ scale: 1.03 }} onClick={handleDownload}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[9px] font-black text-white uppercase tracking-widest transition-all shadow-[0_5px_20px_rgba(99,102,241,0.3)] flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Save PDF
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>}>
      <ReportContent />
    </Suspense>
  );
}
