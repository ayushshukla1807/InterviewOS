'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Copy, CheckCircle, Briefcase, FileText, User, ShieldAlert, ArrowRight, Zap, Target, Search, Filter, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [supportInsights, setSupportInsights] = useState<any[]>([]);

  useEffect(() => {
    const savedJobs = localStorage.getItem('hyrte_jobs');
    if (savedJobs) setJobs(JSON.parse(savedJobs));
    
    const savedApps = localStorage.getItem('hyrte_applications');
    if (savedApps) setApps(JSON.parse(savedApps));

    const savedInsights = localStorage.getItem('hyrte_support_insights');
    if (savedInsights) setSupportInsights(JSON.parse(savedInsights));
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    const newJob = {
      id: `REQ-${Math.floor(Math.random() * 10000)}`,
      title,
      description,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newJob, ...jobs];
    setJobs(updated);
    localStorage.setItem('hyrte_jobs', JSON.stringify(updated));
    setTitle('');
    setDescription('');
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020204] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-white/5">
          <div className="flex items-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              <Shield className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Recruiter Portal</h1>
                <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                   <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Neural Live</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Sentient Recruitment Intelligence · Enterprise Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex gap-8">
               <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Active Pipeline</p>
                  <p className="text-lg font-black text-white">{apps.length} <span className="text-[10px] text-slate-500 font-bold tracking-normal uppercase">Candidates</span></p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="space-y-1 text-right">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Job Slots</p>
                  <p className="text-lg font-black text-indigo-400">{jobs.length} / 10</p>
               </div>
            </div>
            <Link href="/" className="px-6 py-3 bg-white text-black hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              View Landing
            </Link>
          </div>
        </header>

        {/* ─── Short-Term KPI Summary Strip ─── */}
        {(() => {
          const avgScore = apps.length > 0 ? Math.round(apps.reduce((s: number, a: any) => s + (a.score || 0), 0) / apps.length) : 0;
          const topCand = apps.length > 0 ? apps.reduce((a: any, b: any) => (b.score > a.score ? b : a), apps[0]) : null;
          const hireCount = apps.filter((a: any) => a.score >= 75).length;
          const passRate = apps.length > 0 ? Math.round((hireCount / apps.length) * 100) : 0;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Neural Score', value: apps.length > 0 ? `${avgScore}%` : '—', sub: 'This sprint', color: 'text-indigo-400', dot: 'bg-indigo-500' },
                { label: 'Top Candidate', value: topCand ? topCand.candidateName?.split(' ')[0] : '—', sub: topCand ? `${topCand.score}% fit` : 'No data', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { label: 'Hire Signal Rate', value: apps.length > 0 ? `${passRate}%` : '—', sub: `${hireCount} of ${apps.length} assessed`, color: 'text-violet-400', dot: 'bg-violet-500' },
                { label: 'Pipeline Velocity', value: `${jobs.length} JDs`, sub: `${apps.length} candidates active`, color: 'text-amber-400', dot: 'bg-amber-500' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                    <p className={`text-xl font-black ${kpi.color} mt-1 tracking-tight`}>{kpi.value}</p>
                    <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{kpi.sub}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${kpi.dot} opacity-60 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_currentColor]`} />
                </div>
              ))}
            </motion.div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-10">
            {/* Create Job Module */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">New Requisition</h2>
              </div>
              <form onSubmit={handleCreate} className="group bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-8 rounded-[48px] space-y-6 hover:border-indigo-500/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px] rounded-full" />
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Job Title</label>
                  <input 
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Lead Systems Architect"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-700"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Intelligence Protocol (JD)</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Provide detailed responsibilities for AI adaptive evaluation..."
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-300 focus:border-indigo-500/50 outline-none transition-all resize-none placeholder:text-slate-700"
                    required
                  />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" 
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                  <Zap className="w-4 h-4 fill-white" /> Generate Assessment Protocol
                </motion.button>
              </form>
            </div>

            {/* Assessment Links List */}
            <div className="space-y-6">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Assessment Gateways</h2>
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {jobs.map((job) => (
                    <motion.div layout key={job.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                           <FileText className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white leading-none mb-1.5">{job.title}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{job.id}</p>
                        </div>
                      </div>
                      <button onClick={() => copyLink(job.id)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-indigo-600 rounded-xl transition-all text-slate-500 hover:text-white group/btn">
                        {copiedId === job.id ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 group-hover/btn:scale-110" />}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-8 space-y-10">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hiring Intelligence Tracker</h2>
               <div className="flex items-center gap-3">
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                     <input placeholder="Search candidate..." className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-indigo-500/40 w-48 transition-all" />
                  </div>
                  <button className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                     <Filter className="w-3.5 h-3.5 text-slate-400" />
                  </button>
               </div>
            </div>

            {/* Candidate List */}
            <div className="grid gap-6">
              {apps.length === 0 ? (
                <div className="p-24 bg-white/[0.01] border border-white/5 border-dashed rounded-[60px] text-center flex flex-col items-center justify-center">
                   <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center mb-6">
                      <User className="w-8 h-8 text-slate-700" />
                   </div>
                   <p className="text-lg font-black text-slate-400 tracking-tight">Intelligence Feed Empty</p>
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-3">Sync active requisitions with candidates to generate insights</p>
                </div>
              ) : apps.map((app, i) => (
                <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="group relative bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-indigo-500/40 hover:bg-indigo-600/[0.02] transition-all duration-500 shadow-2xl">
                  
                  <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full transition-all duration-500 ${app.score > 75 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : app.score > 50 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`} />

                  <div className="flex items-center gap-6">
                    <div className="relative group/avatar">
                      <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center border-2 transition-all duration-500 overflow-hidden shadow-xl ${app.score > 75 ? 'border-emerald-500/30 group-hover/avatar:border-emerald-500' : app.score > 50 ? 'border-amber-500/30 group-hover/avatar:border-amber-500' : 'border-rose-500/30 group-hover/avatar:border-rose-500'}`}>
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${app.candidateName}&backgroundColor=${app.score > 75 ? '10b981' : app.score > 50 ? 'f59e0b' : 'f43f5e'}`} alt={app.candidateName} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center">
                         <span className="text-[8px] font-black text-white">{app.score > 75 ? 'A+' : app.score > 50 ? 'B' : 'C'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-white tracking-tight">{app.candidateName}</h3>
                        <div className="flex gap-2 flex-wrap">
                          {app.violations > 0 && (
                            <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center gap-1.5">
                               <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
                               <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">{app.violations} Risks</span>
                            </div>
                          )}
                          {app.simulation && (
                            <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md flex items-center gap-1.5">
                               <Briefcase className="w-2.5 h-2.5 text-indigo-400" />
                               <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">
                                 Sim: {(app.simulation.completedTasks || []).length}/{app.simulation.totalTasks || 0} Tasks
                               </span>
                            </div>
                          )}
                          <div className={`px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-widest ${app.score > 75 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                             {app.track} Expert
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-2">
                           <Target className="w-3 h-3 text-slate-700" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">{app.candidateEmail}</p>
                        </div>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <p className="text-[8px] font-black text-indigo-400/80 uppercase tracking-widest">GATEWAY: {app.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="space-y-3 min-w-[140px]">
                      <div className="flex justify-between items-end">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Neural Fit Score</p>
                         <p className={`text-sm font-black ${app.score > 75 ? 'text-emerald-400' : 'text-white'}`}>{app.score}%</p>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${app.score}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full ${app.score > 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : app.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      </div>
                    </div>
                    <Link href={`/feedback/recruiter?name=${encodeURIComponent(app.candidateName)}&track=${app.track}`}
                      className="group/link px-8 py-4 bg-white/[0.03] hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 text-slate-400 hover:text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-xl">
                      Deep Dive Analysis 
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Aura Support Intelligence Feed */}
            <div className="space-y-6 pt-10">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                     <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Aura Platform Insights</h2>
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{supportInsights.length} Interactions Logged</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {supportInsights.length === 0 ? (
                    <div className="md:col-span-2 p-12 bg-white/[0.01] border border-white/5 border-dashed rounded-[40px] text-center">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No support logs available yet</p>
                    </div>
                  ) : supportInsights.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] space-y-4">
                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div>
                             <p className="text-[10px] font-black text-white">{log.candidateName}</p>
                             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{new Date(log.sessionTime).toLocaleTimeString()}</p>
                          </div>
                          <div className="px-2 py-1 bg-indigo-500/10 rounded text-[7px] font-black text-indigo-400 uppercase tracking-widest">Technical Support</div>
                       </div>
                       <div className="space-y-3">
                          {log.interactions.slice(-2).map((msg: any, j: number) => (
                            <div key={j} className={`flex gap-3 ${msg.role === 'aura' ? 'text-indigo-400' : 'text-slate-400'}`}>
                               <span className="text-[8px] font-black uppercase tracking-widest w-12 shrink-0">{msg.role}:</span>
                               <p className="text-[10px] font-medium leading-relaxed italic truncate">"{msg.content}"</p>
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
