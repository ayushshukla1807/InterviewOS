'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, ChevronLeft, TrendingUp, Zap, XCircle } from 'lucide-react';
import Link from 'next/link';

function StatusBadge({ value, thresholds = [70, 50] }: { value: number; thresholds?: [number, number] }) {
  const status = value >= thresholds[0] ? { label: 'Strong', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    : value >= thresholds[1] ? { label: 'Moderate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    : { label: 'Needs Work', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  return <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${status.color}`}>{status.label}</span>;
}

function CandidateContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Candidate';
  const [report, setReport] = useState<any>(null);
  const [mode, setMode] = useState<'snapshot' | 'deepdive'>('snapshot');

  useEffect(() => {
    const saved = localStorage.getItem('hyrte_report');
    if (saved) setReport(JSON.parse(saved));
  }, []);

  if (!report) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const ev = report.fullEvaluation || {};
  const overall = ev.overallScore || report.score || 0;
  const comm = ev.communication || {};
  const tech = ev.technical || {};
  const beh = ev.behavioural || {};
  const conf = ev.confidence || {};
  const cf = ev.candidateFeedback || {};
  const rec = ev.recommendation || (overall > 75 ? 'Hire' : overall > 50 ? 'Proceed with Caution' : 'Reject');

  const firstName = name.split(' ')[0];

  const areas = [
    { label: 'Overall Performance', value: overall },
    { label: 'Communication', value: comm.totalScore || 0 },
    { label: 'Technical Skills', value: tech.totalScore || 0 },
    { label: 'Confidence', value: conf.totalScore || 0 },
    { label: 'Behavioural Answers', value: beh.totalScore || 0 },
    { label: 'Interview Readiness', value: ev.recruiterDecision?.interviewReadiness || 0 },
  ];

  const whatHelped = cf.whatHelped || report.strengths || [];
  const whatHurting = cf.whatIsHurting || report.risks || [];
  const whyRejected = cf.whyYouMayBeRejected || [];
  const plan = cf.fastImprovementPlan || ['Learn concise answer structure', 'Practice behavioural storytelling', 'Reduce filler words', 'Stop memorizing answers', 'Practice pressure-based mock interviews'];
  const perception = cf.recruiterLikelyPerception || '';

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 px-8 py-4 border-b border-white/5 bg-[#050508]/90 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Your Interview Report</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['snapshot', 'deepdive'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
              {m === 'snapshot' ? 'Snapshot' : 'Full Report'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-8 space-y-8">

        {/* ── PERFORMANCE SNAPSHOT ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">1. Performance Snapshot</h2>
          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            {areas.map((a, i) => (
              <div key={i} className={`px-6 py-4 flex items-center justify-between gap-4 ${i !== areas.length - 1 ? 'border-b border-white/5' : ''}`}>
                <p className="text-xs font-bold text-slate-400 w-40 shrink-0">{a.label}</p>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.value}%` }} transition={{ duration: 1, ease: 'easeOut', delay: i * 0.07 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                </div>
                <div className="flex items-center gap-3 w-32 justify-end">
                  <span className="text-[11px] font-black text-white tabular-nums">{a.value}/100</span>
                  <StatusBadge value={a.value} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECRUITER PERCEPTION ── */}
        {perception && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">2. Recruiter Likely Perception</h2>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-6 space-y-4">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">What the interviewer probably thinks</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{perception}</p>
            </div>
          </section>
        )}

        {/* ── WHAT HELPED / HURTING ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">3 & 4. Signal Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 space-y-4">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">What Helped You</p>
              <ul className="space-y-3">
                {whatHelped.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /><p className="text-xs font-medium text-slate-400 leading-relaxed">{s}</p></li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6 space-y-4">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">What Is Hurting You</p>
              <ul className="space-y-3">
                {whatHurting.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" /><p className="text-xs font-medium text-slate-400 leading-relaxed">{s}</p></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── WHY REJECTED (Deep Dive only) ── */}
        {mode === 'deepdive' && whyRejected.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">5. Why You May Be Getting Rejected</h2>
            <div className="bg-[#111111] border border-rose-500/10 rounded-2xl p-6 space-y-3">
              {whyRejected.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-3"><XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" /><p className="text-xs font-medium text-slate-400 leading-relaxed">{r}</p></div>
              ))}
            </div>
          </section>
        )}

        {/* ── IMPROVEMENT PLAN ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">6. Fast Improvement Plan</h2>
          <div className="space-y-3">
            {plan.map((step: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[#111111] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 shrink-0">{i + 1}</div>
                <p className="text-xs font-medium text-slate-300">{step}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FINAL VERDICT ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">7. Final Verdict</h2>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
            {ev.finalVerdict && <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{ev.finalVerdict}"</p>}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall</p>
                <p className="text-2xl font-black text-white">{overall}/100</p>
              </div>
              <div className="ml-auto flex flex-col items-end justify-end gap-1">
                <p className={`text-sm font-black uppercase tracking-widest ${rec === 'Hire' ? 'text-emerald-400' : rec === 'Proceed with Caution' ? 'text-amber-400' : 'text-rose-400'}`}>{rec}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recruiter Decision</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link href={`/feedback/recruiter?name=${encodeURIComponent(name)}`}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            View Recruiter Report →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CandidateReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading...</div>}>
      <CandidateContent />
    </Suspense>
  );
}
