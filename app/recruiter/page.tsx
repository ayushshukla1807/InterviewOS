'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Users, Search, Filter, Layers, BarChart as BarChartIcon, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

// Mock active sessions reading from localStorage for demo purposes
interface ActiveSession {
  sessionId: string;
  name: string;
  role: string;
  phase: string;
  score: number | null;
  trust: number;
}

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'candidates' | 'users' | 'templates'>('live');
  const [liveSessions, setLiveSessions] = useState<ActiveSession[]>([]);
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Role Guard
  useEffect(() => {
    const savedUser = localStorage.getItem('interviewos_user');
    if (!savedUser) {
      window.location.href = '/login';
      return;
    }
    try {
      const user = JSON.parse(savedUser);
      if (user.role !== 'recruiter' && user.role !== 'founder') {
        localStorage.removeItem('interviewos_token');
        localStorage.removeItem('interviewos_user');
        window.location.href = '/login';
      }
    } catch {
      localStorage.removeItem('interviewos_token');
      localStorage.removeItem('interviewos_user');
      window.location.href = '/login';
    }
  }, []);

  // Fetch from MongoDB
  useEffect(() => {
    if (activeTab === 'candidates' || activeTab === 'users') {
      setIsLoadingDb(true);
      fetch('/api/recruiter/data')
        .then(res => res.json())
        .then(data => {
          if (data.reports) {
            // Sort reports by score descending for Leaderboard effect
            setDbReports(data.reports.sort((a: any, b: any) => b.score - a.score));
          }
          if (data.users) setDbUsers(data.users);
        })
        .finally(() => setIsLoadingDb(false));
    }
  }, [activeTab]);

  const exportToCSV = () => {
    if (!dbReports.length) return;
    const headers = ['Candidate Name', 'Role', 'Company', 'Score', 'Direct Skill', 'Embedded Skills', 'Workplace Intelligence', 'Date Completed', 'Session ID'];
    const rows = dbReports.map(r => [
      `"${r.candidateName}"`, `"${r.role}"`, `"${r.company}"`, r.score,
      r.fullReportData?.directSkill?.score || 0,
      r.fullReportData?.embeddedSkills?.score || 0,
      r.fullReportData?.workplaceIntelligence?.score || 0,
      new Date(r.createdAt).toISOString().split('T')[0], 
      r.sessionId
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\\n' 
      + rows.map(e => e.join(',')).join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "interviewos_hiring_leaderboard.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const avgScore = dbReports.length ? Math.round(dbReports.reduce((sum, r) => sum + r.score, 0) / dbReports.length) : 0;
  const topRoleEntry = dbReports.length ? Object.entries(dbReports.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] || 0) + 1; return acc;
  }, {} as Record<string, number>)).sort((a: any, b: any) => b[1] - a[1])[0] : null;
  const topRole = topRoleEntry ? topRoleEntry[0] : '--';

  // Bar Chart Data Preparation
  const getScoreDistribution = () => {
    const bins = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    dbReports.forEach(r => {
      if (r.score <= 40) bins['0-40']++;
      else if (r.score <= 60) bins['41-60']++;
      else if (r.score <= 80) bins['61-80']++;
      else bins['81-100']++;
    });
    return Object.keys(bins).map(key => ({ range: key, candidates: bins[key as keyof typeof bins] }));
  };

  useEffect(() => {
    if (activeTab !== 'live') return;

    const fetchLive = () => {
      const sessions: ActiveSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('simulation_') && !key.startsWith('simulation_summary')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.candidateActions) {
              const stakeholders = Object.values(data.stakeholderStates || {}) as any[];
              const avgTrust = stakeholders.length ? Math.round(stakeholders.reduce((sum, s) => sum + s.trust, 0) / stakeholders.length) : 100;
              sessions.push({
                sessionId: data.blueprint?.sessionId || key.replace('simulation_', ''),
                name: data.blueprint?.candidateName || 'Candidate',
                role: data.blueprint?.role || 'Role',
                phase: data.phase,
                score: data.liveHyrteScore?.total || null,
                trust: avgTrust,
              });
            }
          } catch (e) {}
        }
      }
      setLiveSessions(sessions);
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-violet-500/30 transition-colors duration-500">
      
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-color)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform">
              OS
            </div>
            <span className="font-bold text-sm tracking-widest uppercase">InterviewOS</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 p-1 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-sm">
            {[
              { id: 'live', label: 'Live Monitor', icon: Activity },
              { id: 'candidates', label: 'Hiring Reports', icon: FileText },
              { id: 'users', label: 'Directory', icon: Users },
              { id: 'templates', label: 'Blueprints', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-violet-600 text-white font-semibold shadow-md' 
                    : 'text-slate-500 hover:text-violet-500 hover:bg-violet-500/10'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Log out
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-80 transition-colors rounded-lg text-sm font-semibold active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          
          {/* ── LIVE MONITOR ──────────────────────────────────────────────── */}
          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">Live Monitor</h1>
                  <p className="text-slate-500 text-sm">Watch candidates navigate simulations in real-time.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Live Polling Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.length === 0 ? (
                  <div className="col-span-full py-20 text-center border border-[var(--border-color)] rounded-3xl bg-[var(--card-bg)] shadow-sm">
                    <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)] shadow-inner">
                      <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No Active Simulations</h3>
                    <p className="text-slate-500 text-sm">Candidates taking a test right now will appear here instantly.</p>
                  </div>
                ) : (
                  liveSessions.map(session => (
                    <div key={session.sessionId} className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                      
                      {/* Live Phase Gradient Line */}
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${
                        session.phase === 'chaos' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        session.phase === 'recovery' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`} />

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold">{session.name}</h3>
                          <p className="text-xs text-slate-500">{session.role}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          session.phase === 'chaos' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          session.phase === 'recovery' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {session.phase === 'pre_skill' ? 'Skill Test' : session.phase}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[var(--bg)] rounded-2xl p-4 border border-[var(--border-color)]">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Trust</div>
                          <div className={`text-2xl font-black ${session.trust < 40 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {session.trust}%
                          </div>
                        </div>
                        <div className="bg-[var(--bg)] rounded-2xl p-4 border border-[var(--border-color)]">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proj. Score</div>
                          <div className="text-2xl font-black text-violet-500">
                            {session.score || '--'}
                          </div>
                        </div>
                      </div>

                      <Link href={`/report?sessionId=${session.sessionId}&name=${encodeURIComponent(session.name)}&role=${encodeURIComponent(session.role)}&company=InterviewOS`} className="mt-auto">
                        <button className="w-full py-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95">
                          <Zap className="w-4 h-4" /> Live Spectate
                        </button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── HIRING REPORTS ────────────────────────────────────────────── */}
          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">Platform Leaderboard</h1>
                  <p className="text-slate-500 text-sm">Visual analytics and comprehensive hiring reports.</p>
                </div>
                <button 
                  onClick={exportToCSV}
                  disabled={dbReports.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] disabled:opacity-50 transition-colors rounded-xl text-xs font-bold uppercase tracking-widest border border-[var(--border-color)] shadow-sm active:scale-95"
                >
                  <BarChartIcon className="w-4 h-4" /> Export CSV
                </button>
              </div>

              {/* Data Visualization Grid */}
              {!isLoadingDb && dbReports.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* KPI Cards */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-2xl p-6 flex items-center gap-4 hover:border-violet-500/50 transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                        <Users className="w-7 h-7 text-violet-500" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Processed</div>
                        <div className="text-3xl font-black">{dbReports.length}</div>
                      </div>
                    </div>
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-2xl p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Target className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Avg Quality Score</div>
                        <div className="text-3xl font-black text-emerald-500">{avgScore}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Bar Chart */}
                  <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-2xl p-6 h-64">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Score Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getScoreDistribution()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text)' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text)' }} />
                        <Tooltip 
                          cursor={{ fill: 'var(--bg)' }}
                          contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '12px' }} 
                        />
                        <Bar dataKey="candidates" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {isLoadingDb ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : dbReports.length === 0 ? (
                <div className="border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm rounded-3xl p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">No Reports Yet</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Candidate merit reports will appear here automatically once a simulation is completed.</p>
                  <button 
                    onClick={() => setActiveTab('templates')}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white transition-colors rounded-xl text-xs font-bold uppercase tracking-widest shadow-md active:scale-95 inline-flex items-center gap-2"
                  >
                    Send Role Invites
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dbReports.map((report: any) => (
                    <div key={report._id} className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-3xl p-6 flex flex-col hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black tracking-tight">{report.candidateName}</h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{report.role} · {report.company}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg font-black text-lg ${report.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : report.score >= 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                          {report.score}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-[var(--border-color)] pb-4">
                        Completed: {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <Link href={`/report?sessionId=${report.sessionId}&name=${encodeURIComponent(report.candidateName)}&role=${encodeURIComponent(report.role)}&company=${encodeURIComponent(report.company)}`} className="mt-auto">
                        <button className="w-full py-3 rounded-xl bg-[var(--bg)] hover:bg-violet-600/10 text-[var(--text)] group-hover:text-violet-600 transition-colors border border-[var(--border-color)] group-hover:border-violet-500/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95">
                          <FileText className="w-4 h-4" /> Full Merit Report
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── USER DIRECTORY ────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">User Directory</h1>
                  <p className="text-slate-500 text-sm">Manage registered candidate and recruiter accounts.</p>
                </div>
              </div>

              {isLoadingDb ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : dbUsers.length === 0 ? (
                <div className="border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm rounded-3xl p-12 text-center">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">No Users Found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--border-color)] shadow-sm rounded-2xl bg-[var(--card-bg)]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg)] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {dbUsers.map((user: any) => (
                        <tr key={user._id} className="hover:bg-[var(--hover-bg)] transition-colors">
                          <td className="px-6 py-4 font-bold">{user.name}</td>
                          <td className="px-6 py-4 text-slate-500">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              user.role === 'recruiter' 
                                ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' 
                                : user.role === 'founder'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                            }`}>
                              {user.role || 'candidate'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEMPLATES ─────────────────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">Role Blueprints</h1>
                  <p className="text-slate-500 text-sm">Launch simulations using pre-configured AI evaluators.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { role: 'Product Manager', type: 'Tech & Strategy', focus: 'Prioritization & Stakeholders', color: 'from-violet-500 to-indigo-600', trackId: 'it_pm' },
                  { role: 'Software Engineer', type: 'Engineering', focus: 'Technical Judgment & Pressure', color: 'from-emerald-500 to-teal-600', trackId: 'fullstack' },
                  { role: 'Account Executive', type: 'Sales', focus: 'Pipeline & Communication', color: 'from-orange-500 to-red-600', trackId: 'backend' },
                  { role: 'HR Business Partner', type: 'Operations', focus: 'Conflict & Compliance', color: 'from-fuchsia-500 to-pink-600', trackId: 'qa_engineer' },
                ].map(b => (
                  <div key={b.role} className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${b.color} opacity-10 blur-2xl -mr-8 -mt-8 group-hover:opacity-20 transition-opacity`} />
                    <div className="inline-block px-3 py-1 bg-[var(--bg)] border border-[var(--border-color)] rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 mb-6 shadow-sm">
                      {b.type}
                    </div>
                    <h3 className="text-xl font-black tracking-tight mb-2">{b.role}</h3>
                    <p className="text-xs font-semibold text-slate-500 mb-8 h-8">Evaluates: <span className="text-[var(--text)]">{b.focus}</span></p>
                    
                    <Link href={`/instructions?name=Test%20Candidate&track=${b.trackId}`}>
                      <button className="w-full py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                        <PlayCircle className="w-4 h-4" /> Start Simulation
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
