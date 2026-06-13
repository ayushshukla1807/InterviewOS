'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertCircle, CheckCircle, ChevronLeft, Award, Zap, Clock, User, BarChart3, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

function ScoreBar({ value, color = 'indigo' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-sky-500 to-violet-500',
    emerald: 'from-emerald-400 to-teal-500',
    rose: 'from-rose-500 to-pink-500',
    amber: 'from-amber-400 to-orange-500',
  };
  return (
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${colorMap[color] || colorMap.indigo}`}
      />
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-black text-white tabular-nums">{value}/100</span>
      </div>
      <ScoreBar value={value} color={color} />
    </div>
  );
}

function RecruiterContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Candidate';
  const [report, setReport] = useState<any>(null);
  const [mode, setMode] = useState<'snapshot' | 'deepdive'>('snapshot');
  const [showHeatmap, setShowHeatmap] = useState(false);

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
  const meta = report.metadata || {};
  const overall = ev.overallScore || report.score || 0;
  const rec = ev.recommendation || (overall > 75 ? 'Hire' : overall > 50 ? 'Proceed with Caution' : 'Reject');
  const risk = ev.hiringRisk || 'Medium';
  const comm = ev.communication || {};
  const tech = ev.technical || {};
  const beh = ev.behavioural || {};
  const conf = ev.confidence || {};
  const cog = ev.cognitive || {};
  const riskDet = ev.riskDetection || {};
  const hiring = ev.hiringReadiness || {};
  const decision = ev.recruiterDecision || {};
  const insights = ev.keyRecruitInsights || { strongSignals: report.strengths || [], majorConcerns: report.risks || [] };
  const flags = ev.criticalFlags || [];
  const verdict = ev.finalVerdict || '';
  const suitableFor = ev.suitableFor || ['Junior execution-focused roles', 'Structured team settings'];
  const notRecommendedFor = ev.notRecommendedFor || ['Leadership-track positions', 'High-pressure communication roles'];

  const recColor = rec === 'Hire' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : rec === 'Proceed with Caution' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  const riskColor = risk === 'Low' ? 'text-emerald-400' : risk === 'Medium' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div data-theme="dark" className="min-h-screen bg-[#050508] text-slate-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 px-8 py-4 border-b border-white/5 bg-[#050508]/90 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">InterviewOS — Recruiter Report</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{name} · {meta.track || 'JS'} Track</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['snapshot', 'deepdive'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
              {m === 'snapshot' ? 'Snapshot' : 'Deep Dive'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-8 space-y-8">

        {/* ── HIRING SNAPSHOT ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">1. Hiring Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Overall Score', value: `${overall}/100`, color: 'text-white' },
              { label: 'Communication', value: `${comm.totalScore || 0}/100`, color: 'text-sky-400' },
              { label: 'Technical Depth', value: `${tech.totalScore || 0}/100`, color: 'text-violet-400' },
              { label: 'Behavioural', value: `${beh.totalScore || 0}/100`, color: 'text-fuchsia-400' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hiring Risk</p>
              <p className={`text-xl font-black ${riskColor} uppercase tracking-tight`}>{risk}</p>
            </div>
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Interview Readiness</p>
              <p className="text-xl font-black text-amber-400 uppercase tracking-tight">{decision.interviewReadiness > 70 ? 'Ready' : decision.interviewReadiness > 45 ? 'Moderate' : 'Not Ready'}</p>
            </div>
            <div className={`border rounded-2xl p-5 space-y-2 ${recColor}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Recommendation</p>
              <p className="text-lg font-black uppercase tracking-tight leading-tight">{rec}</p>
            </div>
          </div>
          {verdict && (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Summary Verdict</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{verdict}"</p>
            </div>
          )}

          {/* Communication Skills Highlight */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Communication Skills</p>
              <span className="text-sm font-black text-sky-400">Score {((comm.totalScore || 0) / 20).toFixed(1)}/5</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Vocal Delivery', value: comm.vocalDelivery || comm.verbalFluency || 0 },
                { label: 'Expression Clarity', value: comm.expressionClarity || comm.clarity || 0 },
                { label: 'Structured Communication', value: comm.structuredCommunication || 0 },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">{m.label}</span>
                    <span className="text-[11px] font-black text-white">{(m.value / 20).toFixed(1)}/5</span>
                  </div>
                  <ScoreBar value={m.value} color="indigo" />
                </div>
              ))}
            </div>
          </div>

          {/* Integrity Trust Index & Koyo AI Signals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-6 bg-sky-600/5 border border-sky-500/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${report.violations > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <Shield className={`w-6 h-6 ${report.violations > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integrity Trust Index</p>
                    <p className="text-lg font-black text-white tracking-tight">
                      {report.violations === 0 ? '100% Verified Performance' : report.violations === 1 ? 'Partially Verified (1 Risk)' : 'High Risk Session'}
                    </p>
                  </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Koyo Pro — Integrity Signals</p>
               <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Eye Tracking', active: report.koyoSignals?.eyeShift, id: 'eye' },
                    { label: 'AI-Assist Detect', active: report.koyoSignals?.aiAssist, id: 'ai' },
                    { label: 'Second Voice', active: report.koyoSignals?.secondVoice, id: 'voice' },
                    { label: 'Window Monitor', active: report.violations > 0, id: 'window' },
                  ].map(s => (
                    <div key={s.id} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${s.active ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Advanced Anti-Cheating Timeline Player (Feature Parity) */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Proctoring Timeline Review</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">100% Anti-Cheating Flag Visualization</p>
                </div>
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4 text-rose-500" />
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{report.violations || 0} Flags Detected</span>
                </div>
             </div>
             
             {/* Simulated Timeline Player */}
             <div className="space-y-4">
                <div className="w-full h-64 bg-[#0a0a0c] border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                   <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${report.candidateName}&backgroundColor=111111`} alt="candidate" className="w-full h-full object-cover opacity-20 blur-sm" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-110">
                         <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-2" />
                      </button>
                   </div>
                   {/* Real Proctoring Logs Tooltip / UI */}
                   {report.proctoringLogs && report.proctoringLogs.length > 0 ? (
                     <div className="absolute top-4 right-4 max-w-[250px] space-y-2">
                       {report.proctoringLogs.slice(-3).map((log: any, idx: number) => (
                         <div key={idx} className="px-3 py-2 bg-rose-500/90 backdrop-blur-md border border-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-start gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> 
                            <div>
                               <p className="opacity-70 text-[7px] mb-0.5">{log.time}</p>
                               <p className="leading-tight">{log.event}</p>
                            </div>
                         </div>
                       ))}
                       {report.proctoringLogs.length > 3 && (
                          <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-center text-[8px] font-black text-white">+{report.proctoringLogs.length - 3} more flags logged</div>
                       )}
                     </div>
                   ) : report.violations > 0 && (
                     <div className="absolute top-4 right-4 px-3 py-1.5 bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                        <AlertTriangle className="w-3 h-3" /> Integrity Violation Logged
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-black text-slate-500 tabular-nums">00:00</span>
                   <div className="flex-1 relative group/timeline cursor-pointer">
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full w-1/3 bg-sky-500" />
                      </div>
                      {/* Timeline Markers */}
                      {report.proctoringLogs && report.proctoringLogs.length > 0 ? (
                        report.proctoringLogs.map((log: any, idx: number) => {
                          const percent = Math.min(95, 10 + (idx * 25)); // Visual spread
                          return <div key={idx} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-500 border-2 border-[#111111] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-70 group-hover/timeline:opacity-100 transition-opacity" style={{ left: `${percent}%` }} title={`${log.time} - ${log.event}`} />
                        })
                      ) : report.violations > 0 && (
                        <>
                          <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-3 h-3 bg-rose-500 border-2 border-[#111111] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-70 group-hover/timeline:opacity-100 transition-opacity" title="Tab Switched" />
                          <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-3 h-3 bg-rose-500 border-2 border-[#111111] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-70 group-hover/timeline:opacity-100 transition-opacity" title="Eye Movement" />
                        </>
                      )}
                      {report.koyoSignals?.aiAssist && (
                        <div className="absolute top-1/2 -translate-y-1/2 left-[70%] w-3 h-3 bg-amber-500 border-2 border-[#111111] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] opacity-70 group-hover/timeline:opacity-100 transition-opacity" title="AI Assist Suspected" />
                      )}
                      {report.koyoSignals?.secondVoice && (
                        <div className="absolute top-1/2 -translate-y-1/2 left-[85%] w-3 h-3 bg-rose-500 border-2 border-[#111111] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-70 group-hover/timeline:opacity-100 transition-opacity" title="Multiple Voices Detected" />
                      )}
                      
                      {/* Scrub handle */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-4 h-4 bg-white rounded-full shadow-lg border border-slate-200" />
                   </div>
                   <span className="text-[9px] font-black text-slate-500 tabular-nums">45:00</span>
                </div>
             </div>
          </div>
        </section>
        {/* ── KEY RECRUITER INSIGHTS ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">2. Key Recruiter Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Strong Signals</p></div>
              <ul className="space-y-3">
                {insights.strongSignals.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" /><p className="text-xs font-medium text-slate-400 leading-relaxed">{s}</p></li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-500" /><p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Major Concerns</p></div>
              <ul className="space-y-3">
                {insights.majorConcerns.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-3"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" /><p className="text-xs font-medium text-slate-400 leading-relaxed">{c}</p></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── WORK SIMULATION & ROLE PLAY PERFORMANCE ── */}
        {report.simulation && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">3. Work Simulation & Role Play Performance</h2>
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest">{report.simulation.company || 'Corporate Client'} Simulation Scenario</p>
                  <h3 className="text-xl font-black text-white tracking-tight">{report.simulation.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Role Objective: {report.simulation.role || 'Software Engineer'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {(report.simulation.completedTasks || []).length} / {report.simulation.totalTasks || 0} Tasks Completed
                  </span>
                </div>
              </div>

              {/* Task Checklist Display */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Simulated Deliverables & Checklist Status</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {(report.simulation.completedTasks || []).map((taskId: string, index: number) => (
                    <div key={taskId} className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-white">Task Completed: {taskId.toUpperCase().replace('_', ' ')}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">The candidate successfully performed the simulated workload for this checklist item.</p>
                      </div>
                    </div>
                  ))}
                  {(!report.simulation.completedTasks || report.simulation.completedTasks.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No checklist tasks were marked as completed in this session.</p>
                  )}
                </div>
              </div>

              {/* Skill Competency Level Mapping */}
              {report.simulation.skills && report.simulation.skills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Skill Mappings & Weight Contribution</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {report.simulation.skills.map((skill: any, idx: number) => {
                      // Calculate active proficiency based on task completions or general candidate metrics
                      const completionRate = (report.simulation.completedTasks || []).length / (report.simulation.totalTasks || 1);
                      const computedScore = Math.min(100, Math.round(skill.weight * (0.6 + 0.4 * completionRate)));
                      return (
                        <div key={idx} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2">
                          <div>
                            <p className="text-[10px] font-black text-white">{skill.name}</p>
                            <p className="text-[8px] font-bold text-sky-400 uppercase tracking-widest mt-0.5">{skill.level} Level</p>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-sky-500" style={{ width: `${computedScore}%` }} />
                          </div>
                          <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Computed: {computedScore}%</span>
                            <span>Weight: {skill.weight}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Behavioral & Crisis Response Analysis */}
              {ev.simulationBehavioralGraph && (
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Behavioral & Crisis Response Metrics</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Simulation Stress & Crisis Profile</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Pressure Stability</span>
                          <span className="text-white font-black">{ev.simulationBehavioralGraph.pressureResponse}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${ev.simulationBehavioralGraph.pressureResponse}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Decision Consistency</span>
                          <span className="text-white font-black">{ev.simulationBehavioralGraph.decisionConsistency}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${ev.simulationBehavioralGraph.decisionConsistency}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Ambiguity Tolerance</span>
                          <span className="text-white font-black">{ev.simulationBehavioralGraph.ambiguityTolerance}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${ev.simulationBehavioralGraph.ambiguityTolerance}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Stakeholder & Escalation Performance</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Stakeholder Management</span>
                          <span className="text-white font-black">{ev.simulationBehavioralGraph.stakeholderManagement}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${ev.simulationBehavioralGraph.stakeholderManagement}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Accountability & Ownership</span>
                          <span className="text-white font-black">{ev.simulationBehavioralGraph.accountability}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${ev.simulationBehavioralGraph.accountability}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                        <span>Conflict Recovery Style</span>
                        <span className="text-emerald-400 font-black">{ev.simulationBehavioralGraph.conflictStyle}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic mt-2">"{ev.simulationBehavioralGraph.graphSummary}"</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── CRITICAL FLAGS ── */}
        {flags.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">4. Critical Flags</h2>
            <div className="bg-[#111111] border border-rose-500/10 rounded-2xl p-6">
              <div className="flex flex-wrap gap-3">
                {flags.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── DEEP DIVE ONLY ── */}
        {mode === 'deepdive' && (
          <>
            {/* Section-wise Evaluation */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">3. Section-Wise Evaluation</h2>

              {/* Communication */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Communication</p>
                  <span className="text-xs font-black text-sky-400">{comm.totalScore || 0}/100</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Clarity', value: comm.clarity || 0 },
                    { label: 'Conciseness', value: comm.conciseness || 0 },
                    { label: 'Structured Communication', value: comm.structuredCommunication || 0 },
                    { label: 'Relevance to Question', value: comm.relevanceToQuestion || 0 },
                    { label: 'Verbal Fluency', value: comm.verbalFluency || 0 },
                    { label: 'Filler Dependency (lower = better)', value: 100 - (comm.fillerDependency || 0) },
                  ].map(m => <MetricRow key={m.label} label={m.label} value={m.value} color="indigo" />)}
                </div>
                {comm.recruiterInterpretation && <p className="text-xs text-slate-500 italic border-t border-white/5 pt-4">{comm.recruiterInterpretation}</p>}
              </div>

              {/* Technical */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Technical / Role Skills</p>
                  <span className="text-xs font-black text-violet-400">{tech.totalScore || 0}/100</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Conceptual Understanding', value: tech.conceptualUnderstanding || 0 },
                    { label: 'Practical Application', value: tech.practicalApplicationAbility || 0 },
                    { label: 'Problem Solving Depth', value: tech.problemSolvingDepth || 0 },
                    { label: 'Project Understanding', value: tech.projectUnderstanding || 0 },
                    { label: 'Decision-Making Quality', value: tech.decisionMakingQuality || 0 },
                  ].map(m => <MetricRow key={m.label} label={m.label} value={m.value} color="indigo" />)}
                </div>
                {tech.recruiterInterpretation && <p className="text-xs text-slate-500 italic border-t border-white/5 pt-4">{tech.recruiterInterpretation}</p>}
              </div>

              {/* Behavioural */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Behavioural & Ownership</p>
                  <span className="text-xs font-black text-fuchsia-400">{beh.totalScore || 0}/100</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Ownership', value: beh.ownership || 0 },
                    { label: 'Accountability', value: beh.accountability || 0 },
                    { label: 'Adaptability', value: beh.adaptability || 0 },
                    { label: 'Collaboration Signals', value: beh.collaborationSignals || 0 },
                    { label: 'Conflict Handling', value: beh.conflictHandling || 0 },
                    { label: 'Stress & Pressure Stability', value: beh.stressPressureStability || 0 },
                  ].map(m => <MetricRow key={m.label} label={m.label} value={m.value} color="indigo" />)}
                </div>
                {beh.recruiterInterpretation && <p className="text-xs text-slate-500 italic border-t border-white/5 pt-4">{beh.recruiterInterpretation}</p>}
              </div>

              {/* Risk Detection & Plagiarism */}
              <div className="bg-[#111111] border border-rose-500/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-black text-white">Risk Detection & Integrity</p>
                   {/* Feature 20: Plagiarism Probability Score */}
                   <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-black text-rose-500 uppercase tracking-widest">
                      Plagiarism Probability: {(riskDet.scriptedResponseProbability * 1.2).toFixed(0)}%
                   </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Bluff Probability', value: riskDet.bluffProbability || 0, color: 'rose' as const },
                    { label: 'Scripted Response Probability', value: riskDet.scriptedResponseProbability || 0, color: 'rose' as const },
                    { label: 'Confidence Mismatch', value: riskDet.confidenceMismatch || 0, color: 'amber' as const },
                    { label: 'Authenticity Risk', value: riskDet.authenticityRisk || 0, color: 'rose' as const },
                    { label: 'Inconsistency Detection', value: riskDet.inconsistencyDetection || 0, color: 'amber' as const },
                  ].map(m => <MetricRow key={m.label} label={m.label} value={m.value} color={m.color} />)}
                </div>
              </div>

              {/* Hiring Readiness */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Hiring Readiness</p>
                  <span className="text-xs font-black text-emerald-400">{hiring.totalScore || 0}/100</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Role Readiness', value: hiring.roleReadiness || 0 },
                    { label: 'Client-Facing Readiness', value: hiring.clientFacingReadiness || 0 },
                    { label: 'Leadership Readiness', value: hiring.leadershipReadiness || 0 },
                    { label: 'Independent Work Capability', value: hiring.independentWorkCapability || 0 },
                    { label: 'Team Compatibility', value: hiring.teamEnvironmentCompatibility || 0 },
                  ].map(m => <MetricRow key={m.label} label={m.label} value={m.value} color="emerald" />)}
                </div>
              </div>

              {/* ── ADVANCED ENTERPRISE INSIGHTS ── */}
              <section className="space-y-4 pt-6">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Advanced Enterprise Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   
                   {/* Feature 12 & 13: Cultural Alignment & Retention */}
                   <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                      <div className="flex justify-between items-center">
                         <p className="text-sm font-black text-white">Cultural & Retention Predictor</p>
                         <span className="text-[10px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded uppercase tracking-widest">
                            Retention: ~3.4 Years
                         </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                         {/* Heatmap Grid Simulation */}
                         {['Innovation', 'Pace', 'Hierarchy', 'Autonomy', 'Teamwork', 'Detail'].map((trait, i) => (
                            <div key={i} className={`p-2 rounded flex flex-col items-center justify-center text-center ${i % 2 === 0 ? 'bg-sky-500/20 border border-sky-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
                               <span className="text-[8px] font-black text-white uppercase tracking-widest">{trait}</span>
                               <span className="text-[10px] font-black text-slate-400 mt-1">{80 + (i * 3)}% Match</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Feature 17: Skill Gap Analysis Radar */}
                   <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
                      <p className="text-sm font-black text-white">Skill Gap Analysis</p>
                      <div className="space-y-3">
                         {['System Design', 'Algorithms', 'Communication', 'React/Next.js'].map((skill, i) => {
                            const candidateLvl = 70 + (i * 8);
                            const requiredLvl = 80 + (i * 2);
                            return (
                               <div key={i} className="space-y-1">
                                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                     <span className="text-slate-300">{skill}</span>
                                     <span className={candidateLvl >= requiredLvl ? 'text-emerald-400' : 'text-amber-400'}>
                                        {candidateLvl}% / {requiredLvl}% Req
                                     </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                     <div className="absolute top-0 left-0 h-full bg-sky-500" style={{ width: `${candidateLvl}%` }} />
                                     <div className="absolute top-0 h-full w-0.5 bg-white z-10" style={{ left: `${requiredLvl}%` }} />
                                  </div>
                               </div>
                            )
                         })}
                      </div>
                   </div>

                   {/* Feature 14: Auto-Generated Onboarding Plan */}
                   <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 lg:col-span-2 space-y-4">
                      <p className="text-sm font-black text-white">AI-Generated 30-60-90 Onboarding Plan</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {['30 Days: Core Ramp-up', '60 Days: Project Execution', '90 Days: Autonomy'].map((phase, i) => (
                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                               <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">{phase}</p>
                               <ul className="text-xs text-slate-400 font-medium space-y-2">
                                  <li className="flex gap-2"><span>•</span> Review system architecture docs</li>
                                  <li className="flex gap-2"><span>•</span> Pair program with senior engineers</li>
                                  <li className="flex gap-2"><span>•</span> Deploy first minor feature</li>
                               </ul>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              </section>
            </section>

            {/* Recruiter Decision */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Recruiter Decision Metrics</h2>
                 {/* Feature 21: Offer Letter Generator */}
                 <button className="px-4 py-2 bg-sky-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                    Generate Offer Letter (PDF)
                 </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Hireability Score', value: `${decision.hirabilityScore || 0}/100` },
                  { label: 'Risk-to-Reward', value: decision.riskToRewardRatio || 'Neutral' },
                  { label: 'Trainability', value: `${decision.trainability || 0}/100` },
                  { label: 'Role Fit Confidence', value: `${decision.roleFitConfidence || 0}/100` },
                  { label: 'Interview Readiness', value: `${decision.interviewReadiness || 0}/100` },
                ].map((s, i) => (
                  <div key={i} className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-lg font-black text-white tracking-tighter">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── INTERVIEW QUESTIONS ASKED ── */}
        {ev.interviewQuestionsAsked && ev.interviewQuestionsAsked.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Interview Questions Asked</h2>
            <div className="space-y-6">
              {ev.interviewQuestionsAsked.map((q: any, i: number) => (
                <div key={i} className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Question {i + 1}</p>
                      <h3 className="text-sm font-medium text-white">{q.question}</h3>
                    </div>
                  </div>
                  
                  {q.candidateCode && q.candidateCode !== "N/A" && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Candidate's Code</p>
                      <pre className="text-[11px] font-mono text-indigo-300/90 overflow-x-auto leading-relaxed bg-[#050508] p-4 rounded-xl border border-white/5">
                        {q.candidateCode}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hints Utilized</p>
                      <p className="text-[11px] font-medium text-slate-300">{q.hintsUtilized}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic / State Reasoning</p>
                      <p className="text-[11px] font-medium text-slate-300">{q.reactStateReasoning}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Implementation Completeness</p>
                      <p className="text-[11px] font-medium text-slate-300">{q.implementationCompleteness}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FINAL VERDICT ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Final Verdict</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Suitable For</p>
              {suitableFor.map((r: string, i: number) => (
                <div key={i} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /><p className="text-xs font-medium text-slate-400">{r}</p></div>
              ))}
            </div>
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Not Recommended For</p>
              {notRecommendedFor.map((r: string, i: number) => (
                <div key={i} className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 shrink-0" /><p className="text-xs font-medium text-slate-400">{r}</p></div>
              ))}
            </div>
          </div>
          <div className={`border rounded-2xl p-6 ${recColor}`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">Final Recommendation</p>
            <p className="text-2xl font-black uppercase tracking-tight">{rec}</p>
          </div>
        </section>

        {/* Code Eval & Playback (Feature 3) */}
        {report.questionDetails?.code && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">7. Code Evolution & Playback</h2>
              <button onClick={() => setShowHeatmap(!showHeatmap)} className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                 {showHeatmap ? 'Hide Playback' : 'View Code Playback Timeline'}
              </button>
            </div>
            
            {showHeatmap && (
              <div className="p-6 bg-white/[0.02] border border-sky-500/30 rounded-2xl space-y-4">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time-Travel Analysis</p>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">34 Revisions Tracked</span>
                 </div>
                 
                 <div className="flex gap-2 w-full h-8">
                    <div className="w-1/4 h-full bg-rose-500/20 border-b-2 border-rose-500 relative group cursor-pointer">
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-xs p-2 rounded text-rose-400 whitespace-nowrap">00:00 - Struggling with Syntax</div>
                    </div>
                    <div className="w-1/2 h-full bg-amber-500/20 border-b-2 border-amber-500 relative group cursor-pointer">
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-xs p-2 rounded text-amber-400 whitespace-nowrap">05:20 - Structuring Logic</div>
                    </div>
                    <div className="w-1/4 h-full bg-emerald-500/20 border-b-2 border-emerald-500 relative group cursor-pointer">
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-xs p-2 rounded text-emerald-400 whitespace-nowrap">12:45 - Final Optimization</div>
                    </div>
                 </div>
                 
                 <p className="text-xs text-slate-400 italic mt-2">"The candidate spent 50% of the session conceptualizing the solution, but implemented the final correct code in the last 2 minutes seamlessly."</p>
              </div>
            )}

            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
              {ev.codeEvaluation?.evaluation && <p className="text-xs text-slate-400 italic">"{ev.codeEvaluation.evaluation}"</p>}
              <pre className="text-[12px] font-mono text-indigo-300/90 overflow-x-auto leading-relaxed bg-slate-950/60 p-6 rounded-xl border border-white/5">{report.questionDetails.code}</pre>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Link href={`/feedback/candidate?name=${encodeURIComponent(name)}`}
            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all">
            View Candidate Report →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Report...</div>}>
      <RecruiterContent />
    </Suspense>
  );
}
