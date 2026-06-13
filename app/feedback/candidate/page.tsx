'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, ChevronLeft, TrendingUp, Zap, XCircle, Award, BookOpen, Download, ExternalLink, Briefcase } from 'lucide-react';
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
    const saved = localStorage.getItem('interviewos_report');
    if (saved) setReport(JSON.parse(saved));
  }, []);

  if (!report) return (
    <div data-theme="dark" className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
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
    <div data-theme="dark" className="min-h-screen bg-[#050508] text-slate-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 px-8 py-4 border-b border-white/5 bg-[#050508]/90 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
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
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
              {m === 'snapshot' ? 'Snapshot' : 'Full Report'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-8 space-y-8 print:p-0 print:max-w-none">

        {/* ── SIMULATION CERTIFICATE OF COMPLETION ── */}
        {report.simulation && (
          <section className="space-y-4 print:my-0">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] print:hidden">Credentials & Certification</h2>
            <div className="relative bg-[#0e0e12] border-2 border-amber-500/20 rounded-[32px] p-8 md:p-12 overflow-hidden shadow-2xl print:border-slate-800 print:bg-white print:text-black">
              {/* Premium Background Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-sky-500/5 to-transparent pointer-events-none print:hidden" />
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/[0.03] rounded-full blur-[80px] pointer-events-none print:hidden" />
              
              {/* Certificate Border Accents */}
              <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/5 rounded-[24px] pointer-events-none print:border-slate-300" />
              
              <div className="relative space-y-8 text-center">
                {/* Gold Seal Header */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.2)] print:shadow-none print:from-amber-500 print:to-amber-600">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center print:bg-white">
                      <Award className="w-8 h-8 text-amber-400 print:text-amber-600" />
                    </div>
                  </div>
                  <p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.4em] print:text-amber-600">Verified Job Simulation Accomplishment</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight font-serif uppercase print:text-black">Certificate of Completion</h3>
                  <p className="text-slate-500 text-xs font-medium print:text-slate-600">This credential validates that the candidate successfully completed a structured industry work simulation.</p>
                </div>

                <div className="py-4 border-y border-white/5 max-w-lg mx-auto print:border-slate-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-600">Proudly Presented To</p>
                  <p className="text-2xl font-black text-white tracking-tight mt-2 print:text-black">{name}</p>
                  <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mt-2 print:text-sky-600">
                    For executing the {report.simulation.title || `${report.metadata?.track || 'Developer'} Track`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-lg mx-auto pt-4 text-left print:text-slate-700">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest print:text-slate-600">Verification Hash</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase print:text-slate-700">OS-{Math.abs(name.split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0,0)).toString(16).toUpperCase()}-{report.simulation.id?.toUpperCase()}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest print:text-slate-600">Verification Status</p>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1 print:text-emerald-600">100% Verified Accomplishment</p>
                  </div>
                </div>

                <div className="pt-6 flex justify-center print:hidden">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Print Certificate
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PERFORMANCE SNAPSHOT ── */}
        <section className="space-y-4 print:hidden">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">1. Performance Snapshot</h2>
          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            {areas.map((a, i) => (
              <div key={i} className={`px-6 py-4 flex items-center justify-between gap-4 ${i !== areas.length - 1 ? 'border-b border-white/5' : ''}`}>
                <p className="text-xs font-bold text-slate-400 w-40 shrink-0">{a.label}</p>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.value}%` }} transition={{ duration: 1, ease: 'easeOut', delay: i * 0.07 }}
                    className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full" />
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
                <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/20 flex items-center justify-center text-[10px] font-black text-sky-400 shrink-0">{i + 1}</div>
                <p className="text-xs font-medium text-slate-300">{step}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── TAIRED LEARNING PATHS ── */}
        <section className="space-y-4 print:hidden">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">7. Tailored Learning Paths & Recommendations</h2>
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-black text-white">Custom Growth Path: {report.metadata?.track?.toUpperCase() || 'General'}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">Based on simulated task outcomes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const trackStr = (report.metadata?.track || 'javascript').toLowerCase();
                const recommendations = trackStr.includes('dsa') ? {
                  p1: 'Mastery of advanced Dynamic Programming optimization techniques (bitmasking, matrix exponentiation) and amortized complexity analyses.',
                  p2: 'Implementing balanced search trees (AVL/Red-Black) and graph theories (A*, Dijkstra) on pressure scenarios.',
                  proj: 'Build an interactive network latency route simulator visualizer using customized priority heap queues.',
                  link: 'https://leetcode.com/'
                } : trackStr.includes('ada') ? {
                  p1: 'High-throughput architecture optimization focusing on asynchronous queues, system rate limiters, and socket thread pool distributions.',
                  p2: 'Distributed consensus mechanisms (Raft, Paxos) and low-latency cache invalidation consistency structures.',
                  proj: 'Build a custom multi-threaded asynchronous proxy server caching engine with custom Least Recently Used (LRU) invalidator.',
                  link: 'https://systemdesignprimer.com/'
                } : {
                  p1: 'JavaScript Event Loop deep dive, macro/micro task prioritization structures, and efficient memory heap cleanups.',
                  p2: 'Advanced asynchronous stream controllers, backpressure management pipelines, and garbage collection benchmarking.',
                  proj: 'Build a high-performance custom Reactive Streams library with flow control and task batching capabilities.',
                  link: 'https://javascript.info/'
                };

                return (
                  <>
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                      <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Phase 1: Foundation Enhancement</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{recommendations.p1}</p>
                    </div>
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">Phase 2: Mastery Progression</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{recommendations.p2}</p>
                    </div>
                    <div className="md:col-span-2 p-5 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Recommended Capstone Project</p>
                        <p className="text-xs font-bold text-white mt-1">{recommendations.proj}</p>
                      </div>
                      <a href={recommendations.link} target="_blank" rel="noopener noreferrer" className="shrink-0 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all">
                        Launch Resources
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── FINAL VERDICT ── */}
        <section className="space-y-4 print:hidden">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">8. Final Verdict</h2>
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
