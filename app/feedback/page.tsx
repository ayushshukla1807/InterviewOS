'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, User, BarChart3, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function FeedbackGateway() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Candidate';
  const track = searchParams.get('track') || 'JS';
  const [report, setReport] = useState<any>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('interviewos_report');
    if (saved) setReport(JSON.parse(saved));

    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!report) {
    if (hasTimedOut) {
      return (
        <div data-theme="dark" className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-6 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white tracking-tight uppercase">No Report Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              We couldn't find an assessment report for this session. It might have expired or not been generated yet.
            </p>
          </div>
          <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20">
            Go to Home
          </Link>
        </div>
      );
    }
    return (
      <div data-theme="dark" className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Generating Assessment Report...</p>
      </div>
    );
  }

  const ev = report.fullEvaluation || {};
  const overall = ev.overallScore || report.score || 0;
  const rec = ev.recommendation || (overall > 75 ? 'Hire' : overall > 50 ? 'Proceed with Caution' : 'Reject');
  const risk = ev.hiringRisk || 'Medium';
  const meta = report.metadata || {};

  const recColor = rec === 'Hire' ? 'emerald' : rec === 'Proceed with Caution' ? 'amber' : 'rose';

  return (
    <div data-theme="dark" className="min-h-screen bg-[#050508] text-slate-200 font-sans flex flex-col">
      <header className="px-8 py-5 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl flex items-center gap-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-widest">InterviewOS — Assessment Complete</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{name} · {track} Track · {meta.durationMinutes || 0} minutes</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
        {/* Score Hero */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Overall Assessment Score</p>
          <div className="relative">
            <p className="text-[120px] font-black text-white leading-none tracking-tighter">{overall}</p>
            <p className="text-2xl font-black text-slate-500 -mt-4">/100</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-black uppercase tracking-widest ${
            recColor === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            recColor === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {rec === 'Hire' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {rec}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex gap-6 text-center">
          {[
            { label: 'Communication', value: `${ev.communication?.totalScore || 0}%` },
            { label: 'Technical', value: `${ev.technical?.totalScore || 0}%` },
            { label: 'Behavioural', value: `${ev.behavioural?.totalScore || 0}%` },
            { label: 'Hiring Risk', value: risk },
          ].map((s, i) => (
            <div key={i} className="px-6 py-4 bg-[#111111] border border-white/5 rounded-2xl space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-base font-black text-white tracking-tight">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Choose Report Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full max-w-2xl space-y-4">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Select Your Report View</p>

          <Link href={`/feedback/recruiter?name=${encodeURIComponent(name)}&track=${track}`}
            className="group flex items-center justify-between p-6 bg-[#111111] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-600/20 transition-all">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Recruiter Report</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full 9-metric analysis · Hiring decision ready</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link href={`/feedback/candidate?name=${encodeURIComponent(name)}&track=${track}`}
            className="group flex items-center justify-between p-6 bg-[#111111] border border-white/5 hover:border-white/15 rounded-2xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Candidate Report</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your personal feedback · Improvement plan</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </motion.div>
      </main>

      <footer className="px-8 py-4 border-t border-white/5 text-center">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Powered by InterviewOS · Secure Assessment Platform</p>
      </footer>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing...</div>}>
      <FeedbackGateway />
    </Suspense>
  );
}
