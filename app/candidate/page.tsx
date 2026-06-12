'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, BrainCircuit, Code2, Briefcase, Award, 
  ArrowRight, ExternalLink, Calendar, CheckCircle2, 
  BookOpen, Sparkles, Star, ClipboardList, Share2, UploadCloud, FileText, BarChart as BarChartIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidateContext, setCandidateContext] = useState<any>(null);
  const [pastInterviews, setPastInterviews] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let candidateName = 'Guest Candidate';
    let candidateEmail = 'no-email@interviewos.ai';

    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('interviewos_token');
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        const user = data.user || data;
        
        if (user.role !== 'candidate') {
          localStorage.removeItem('interviewos_token');
          localStorage.removeItem('interviewos_user');
          router.push('/login');
          return;
        }

        localStorage.setItem('interviewos_user', JSON.stringify(user));
        
        candidateName = user.name;
        candidateEmail = user.email;
        setCandidateContext(user);
        fetchReports(user.id || user._id);
      } catch (err) {
        localStorage.removeItem('interviewos_token');
        localStorage.removeItem('interviewos_user');
        router.push('/login');
      }
    };

    verifyAuth();
    
    const fetchReports = async (userId: string) => {
      try {
        const res = await fetch(`/api/reports/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.reports && data.reports.length > 0) {
            const formatted = data.reports.map((a: any) => ({
              id: a.sessionId.substring(0, 8).toUpperCase(),
              jobTitle: `${a.role} at ${a.company}`,
              date: new Date(a.createdAt).toISOString().split('T')[0],
              score: a.score,
              status: 'Completed',
              feedbackUrl: `/report?sessionId=${a.sessionId}&name=${encodeURIComponent(a.candidateName)}&role=${encodeURIComponent(a.role)}&company=${encodeURIComponent(a.company)}`,
              skills: { 
                Skill: a.fullReportData?.directSkill?.score || 0, 
                Embedded: a.fullReportData?.embeddedSkills?.score || 0, 
                Workplace: a.fullReportData?.workplaceIntelligence?.score || 0 
              }
            }));
            setPastInterviews(formatted);
            return;
          }
        }
        
        const savedApps = localStorage.getItem('interviewos_applications') || '[]';
        loadLocalStorageRecords(JSON.parse(savedApps));
      } catch (err) {
        console.error('Failed to load candidate reports from MongoDB API:', err);
        const savedApps = localStorage.getItem('interviewos_applications') || '[]';
        loadLocalStorageRecords(JSON.parse(savedApps));
      }
    };

    const loadLocalStorageRecords = (parsedApps: any[]) => {
      if (parsedApps.length > 0) {
        const formatted = parsedApps.map((a: any, idx: number) => ({
          id: a.id || `INT-${1000 + idx}`,
          jobTitle: a.jobTitle || 'AI Fullstack & System Engineer',
          date: new Date(a.timestamp || Date.now()).toISOString().split('T')[0],
          score: a.score,
          status: 'Completed',
          feedbackUrl: `/feedback/candidate?name=${encodeURIComponent(a.candidateName || a.name)}&track=${a.track || 'DYNAMIC'}`,
          skills: { JS: 85, DSA: 80, System: 88, Comm: 92 }
        }));
        setPastInterviews(formatted);
      } else {
        setPastInterviews([]);
      }
    };
  }, []);

  const handleResumeUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      router.push('/apply/REQ-101');
    }, 1500);
  };

  const trendData = pastInterviews.map((i, idx) => ({
    name: `Session ${pastInterviews.length - idx}`,
    score: i.score
  })).reverse();

  const calculateRadarData = () => {
    if (!pastInterviews.length) return [];
    
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    pastInterviews.forEach(interview => {
      Object.entries(interview.skills || {}).forEach(([key, val]) => {
        totals[key] = (totals[key] || 0) + (val as number);
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    return Object.keys(totals).map(key => ({
      subject: key,
      A: Math.round(totals[key] / counts[key]),
      fullMark: 100,
    }));
  };

  const radarData = calculateRadarData();

  return (
    <div className="min-h-screen text-[var(--text)] font-sans selection:bg-blue-600/30 transition-colors duration-500 relative">
      <div className="mesh-bg" />
      
      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12 relative z-10">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-white/10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <Link href="/" className="w-14 h-14 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.4)] hover:scale-105 transition-all duration-300">
              <Shield className="w-7 h-7 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-gradient uppercase">Candidate Hub</h1>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Profile Active</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Verified Assessments, Certificates & AI Roadmap</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {}
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-5 py-3 glass-card text-[10px] font-black uppercase tracking-wider hover:text-rose-400 hover:border-rose-500/50 transition-all flex items-center gap-2"
            >
              Log out
            </button>
            <Link 
              href="/simulation"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
              >
                Start New Simulation
              </motion.button>
            </Link>
          </motion.div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Profile & Tryouts */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Candidate Metadata */}
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="glass-card p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Account Profile
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center font-black text-blue-400 uppercase text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    {candidateContext?.name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{candidateContext?.name || 'Guest Candidate'}</h3>
                    <p className="text-xs text-slate-400">{candidateContext?.email || 'no-email@interviewos.ai'}</p>
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const url = `${window.location.origin}/report?sessionId=${pastInterviews[0]?.id || 'demo'}&name=${encodeURIComponent(candidateContext?.name || 'Guest')}&public=true`;
                  navigator.clipboard.writeText(url);
                  alert('Public Profile Link copied to clipboard!');
                }}
                className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <Share2 className="w-4 h-4" /> Share Verified Profile
              </motion.button>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-5 bg-black/40 border border-white/10 rounded-2xl shadow-xl hover:border-fuchsia-500/30 transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                  <p className="text-3xl font-black text-white mt-2">{pastInterviews.length}</p>
                </div>
                <div className="p-5 bg-black/40 border border-white/10 rounded-2xl shadow-xl hover:border-fuchsia-500/30 transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
                  <p className="text-3xl font-black text-emerald-400 mt-2 text-shadow-sm">
                    {pastInterviews.length > 0 
                      ? Math.round(pastInterviews.reduce((acc, curr) => acc + curr.score, 0) / pastInterviews.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Resume Upload (MVP Flow) */}
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-emerald-500/20" />
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Custom Match
                </h2>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider leading-relaxed">Upload Resume for personalized AI coding interview</p>
              </div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResumeUpload}
                className={`w-full p-8 bg-black/20 hover:bg-[#020617]/80 border-2 border-dashed ${isUploading ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-white/20'} hover:border-emerald-500/60 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Parsing Resume...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-black text-white">Upload Resume PDF</p>
                    <p className="text-[10px] text-slate-400 text-center max-w-[200px]">Matches your skills against JD dynamically.</p>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Quick Track Selection */}
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="glass-card p-8 space-y-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" /> Quick Simulator
                </h2>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider leading-relaxed">Launch a standard 4-question interview</p>
              </div>

              <div className="space-y-4">
                <Link href="/instructions?track=JS">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-full p-5 bg-black/20 hover:bg-[#020617]/80 border-none hover:border-blue-500/50 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-sm mb-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Code2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-white">JavaScript & UI</p>
                        <p className="text-[10px] text-slate-400 mt-1">Node, React internals, Optimization</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                  </motion.div>
                </Link>

                <Link href="/instructions?track=DSA">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-full p-5 bg-black/20 hover:bg-[#020617]/80 border-none hover:border-emerald-500/50 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <BrainCircuit className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-white">Data Structures</p>
                        <p className="text-[10px] text-slate-400 mt-1">Big-O, DP, Graphs, Logic Trees</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Panel: Analytics & Past Sessions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Analytics Dashboard */}
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card p-8 space-y-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BarChartIcon className="w-4 h-4 text-cyan-400" /> Performance Analytics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[300px]">
                {/* Radar Chart */}
                {radarData.length > 0 ? (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Skill Radar</span>
                    <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Score" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500">
                    <FileText className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-wider">No skill data available</p>
                  </div>
                )}

                {/* Area Chart (Trends) */}
                {trendData.length > 0 ? (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Score Trend</span>
                    <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500">
                    <FileText className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-wider">No trend data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Past Interview Sessions */}
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="glass-card p-8 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-fuchsia-400" /> Completed Assessments
              </h2>
              
              <div className="space-y-5">
                {pastInterviews.length > 0 ? pastInterviews.map((record, idx) => (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    key={record.id} 
                    className="p-6 bg-black/30 border-none rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-indigo-500/50 transition-all shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-3 pl-2">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-500/30">
                          {record.id}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                          <Calendar className="w-4 h-4" /> {record.date}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight">{record.jobTitle}</h3>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {Object.entries(record.skills).map(([skill, val]: any) => (
                          <span key={skill} className="text-[10px] bg-white/5 border-none px-3 py-1.5 rounded-md text-slate-300 font-bold uppercase tracking-wider">
                            {skill}: <strong className="text-white ml-1">{val}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-8 shrink-0 self-stretch md:self-auto justify-between border-t border-white/10 md:border-t-0 pt-6 md:pt-0">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Merit Score</span>
                        <p className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors drop-shadow-md">{record.score}%</p>
                      </div>

                      <div className="flex gap-3">
                        <Link href={record.feedbackUrl}>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-3 bg-white/5 hover:bg-white/10 border-none rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors text-white"
                          >
                            Feedback <ClipboardList className="w-4 h-4" />
                          </motion.button>
                        </Link>
                        <Link href={record.feedbackUrl}>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all"
                          >
                            Certificate <Award className="w-4 h-4" />
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-10 text-center text-slate-400 text-sm bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center gap-4">
                    <Briefcase className="w-12 h-12 opacity-20" />
                    <p className="font-semibold uppercase tracking-widest">No assessments completed yet.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
