'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, BrainCircuit, Code2, Briefcase, Award, 
  ArrowRight, ExternalLink, Calendar, CheckCircle2, 
  BookOpen, Sparkles, Star, ClipboardList, Share2, UploadCloud, FileText 
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
    // Get candidate info from database auth token if exists
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
        const user = await res.json();
        
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
      // Navigate to MVP JD+Resume match flow
      router.push('/apply/REQ-101');
    }, 1500);
  };

  // Prepare chart data
  const trendData = pastInterviews.map((i, idx) => ({
    name: `Session ${pastInterviews.length - idx}`,
    score: i.score
  })).reverse();

  // Average radar data
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-blue-600/30 transition-colors duration-500">
      
      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12 relative z-10">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-105 transition-transform">
              <Shield className="w-7 h-7 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-[var(--text)] tracking-tighter uppercase">Candidate Dashboard</h1>
                <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Profile: Active</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Verified Assessments, Certificates & AI Roadmap</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {
                  // ignore
                }
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-5 py-3 border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider text-[var(--text)] hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all flex items-center gap-2"
            >
              Log out
            </button>
            <Link 
              href="/simulation"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-700/20 hover:shadow-blue-700/40 active:scale-95"
            >
              Start New Simulation
            </Link>
          </div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Profile & Tryouts */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Candidate Metadata */}
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Account Profile</h2>
              
              <div className="flex items-center justify-between p-4 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center justify-center font-bold text-blue-600 uppercase text-lg">
                    {candidateContext?.name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)]">{candidateContext?.name || 'Guest Candidate'}</h3>
                    <p className="text-[10px] text-slate-500">{candidateContext?.email || 'no-email@interviewos.ai'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const url = `${window.location.origin}/report?sessionId=${pastInterviews[0]?.id || 'demo'}&name=${encodeURIComponent(candidateContext?.name || 'Guest')}&public=true`;
                  navigator.clipboard.writeText(url);
                  alert('Public Profile Link copied to clipboard!');
                }}
                className="w-full py-3 bg-blue-700/10 hover:bg-blue-700/20 text-blue-700 dark:text-blue-400 border border-blue-600/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Verified Profile
              </button>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
                  <p className="text-2xl font-black text-[var(--text)] mt-1">{pastInterviews.length}</p>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Avg Score</span>
                  <p className="text-2xl font-black text-emerald-500 mt-1">
                    {pastInterviews.length > 0 
                      ? Math.round(pastInterviews.reduce((acc, curr) => acc + curr.score, 0) / pastInterviews.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Resume Upload (MVP Flow) */}
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Custom Match (MVP)</h2>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Upload Resume for personalized AI coding interview</p>
              </div>

              <div 
                onClick={handleResumeUpload}
                className={`w-full p-6 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border-2 border-dashed ${isUploading ? 'border-emerald-500' : 'border-[var(--border-color)]'} hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Parsing Resume...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-1">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-[var(--text)]">Upload Resume PDF</p>
                    <p className="text-[9px] text-slate-500 text-center max-w-[200px]">Matches your skills against JD dynamically.</p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick Track Selection */}
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Practice Simulator</h2>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Launch a standard 4-question interview</p>
              </div>

              <div className="space-y-3">
                <Link 
                  href="/instructions?track=JS"
                  className="w-full p-4 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-blue-600/50 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[var(--text)]">JavaScript & UI Stacks</p>
                      <p className="text-[9px] text-slate-500">Node, React internals, Optimization</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                </Link>

                <Link 
                  href="/instructions?track=DSA"
                  className="w-full p-4 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[var(--text)]">Data Structures & Algo</p>
                      <p className="text-[9px] text-slate-500">Big-O, DP, Graphs, Logic Trees</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Panel: Analytics & Past Sessions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Analytics Dashboard */}
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Performance Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                {/* Radar Chart */}
                {radarData.length > 0 ? (
                  <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-center relative">
                    <span className="absolute top-4 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Skill Radar</span>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    No skill data available
                  </div>
                )}

                {/* Area Chart (Trends) */}
                {trendData.length > 0 ? (
                  <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl p-4 relative">
                    <span className="absolute top-4 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Score Trend</span>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fill: 'var(--text)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    No trend data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Past Interview Sessions */}
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Completed Assessments</h2>
              
              <div className="space-y-4">
                {pastInterviews.length > 0 ? pastInterviews.map((record, idx) => (
                  <div key={record.id} className="p-6 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-600/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-blue-600/10 text-blue-700 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest rounded border border-blue-600/20">
                          {record.id}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {record.date}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[var(--text)]">{record.jobTitle}</h3>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(record.skills).map(([skill, val]: any) => (
                          <span key={skill} className="text-[9px] bg-[var(--card-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg text-slate-500 font-bold uppercase">
                            {skill}: <strong className="text-[var(--text)]">{val}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 self-stretch md:self-auto justify-between border-t border-[var(--border-color)] md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Merit Score</span>
                        <p className="text-2xl font-black text-[var(--text)] group-hover:text-emerald-500 transition-colors">{record.score}%</p>
                      </div>

                      <div className="flex gap-2">
                        <Link 
                          href={record.feedbackUrl}
                          className="px-4 py-3 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                          Feedback <ClipboardList className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                          href={record.feedbackUrl} 
                          className="px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-700/10 transition-colors active:scale-95"
                        >
                          Certificate <Award className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 text-sm bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl">
                    You haven't completed any interviews yet.
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
