'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Users, Search, Filter, Layers, BarChart, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus, Terminal, Database, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FounderDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports'>('overview');
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Role Guard
  useEffect(() => {
    const savedUser = localStorage.getItem('interviewos_user');
    if (!savedUser) {
      window.location.href = '/login';
      return;
    }
    try {
      const user = JSON.parse(savedUser);
      if (user.role !== 'founder') {
        window.location.href = '/login';
      }
    } catch {
      window.location.href = '/login';
    }
  }, []);

  // Fetch from MongoDB
  useEffect(() => {
    setIsLoadingDb(true);
    fetch('/api/recruiter/data')
      .then(res => res.json())
      .then(data => {
        if (data.reports) setDbReports(data.reports.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        if (data.users) setDbUsers(data.users);
      })
      .finally(() => setIsLoadingDb(false));
  }, []);

  // Global Analytics
  const avgScore = dbReports.length ? Math.round(dbReports.reduce((sum, r) => sum + r.score, 0) / dbReports.length) : 0;
  const totalCandidates = dbUsers.filter(u => u.role === 'candidate').length;
  const totalRecruiters = dbUsers.filter(u => u.role === 'recruiter').length;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-zinc-300 font-sans selection:bg-sky-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-sm">
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 whitespace-nowrap">
              InterviewOS <span className="text-sky-400 font-mono text-xs ml-2 px-2 py-0.5 bg-sky-500/10 rounded-full border border-sky-500/20">FOUNDER</span>
            </span>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Link 
              href="/founder/security"
              className="text-[10px] font-medium  tracking-tight text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-100" /> Security
            </Link>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="text-[10px] font-medium  tracking-tight text-zinc-400 hover:text-rose-400 transition-colors px-2 py-1"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Control</h1>
            <p className="text-zinc-400 text-sm">Global overview of all platform activity, users, and neural sessions.</p>
          </div>
          
          {/* Quick Stats row */}
          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-sm">
              <div className="text-xs text-zinc-500 mb-1 font-medium">Total Users</div>
              <div className="text-2xl font-bold text-white font-mono">{dbUsers.length}</div>
            </div>
            <div className="px-5 py-3 rounded-xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-sm">
              <div className="text-xs text-zinc-500 mb-1 font-medium">Completed Sims</div>
              <div className="text-2xl font-bold text-white font-mono">{dbReports.length}</div>
            </div>
            <div className="px-5 py-3 rounded-xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-sm">
              <div className="text-xs text-sky-400/80 mb-1 font-medium">System Health</div>
              <div className="text-2xl font-bold text-sky-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400 " />
                100%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-zinc-800 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'User Directory & Logs', icon: Users },
            { id: 'reports', label: 'All Database Reports', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  isActive ? 'text-sky-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="founderTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoadingDb ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4"
            >
              <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              <div className="text-xs font-mono tracking-tight ">Querying Database...</div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-md">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      Platform Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-black/20 border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-1">Global Avg Score</div>
                        <div className="text-3xl font-mono text-white">{avgScore}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-1">Total Candidates</div>
                        <div className="text-3xl font-mono text-white">{totalCandidates}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-1">Total Recruiters</div>
                        <div className="text-3xl font-mono text-white">{totalRecruiters}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-1">Database Uptime</div>
                        <div className="text-3xl font-mono text-zinc-100">99.9%</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-md flex flex-col">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3 flex-1">
                      <Link href="/recruiter" className="w-full flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-indigo-300 hover:bg-sky-500/20 transition-colors">
                        <span className="text-sm font-medium">Recruiter View</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link href="/candidate" className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:bg-white/10 transition-colors">
                        <span className="text-sm font-medium">Candidate View</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-400" />
                      User Directory & Logs
                    </h3>
                    <div className="text-xs text-zinc-500">{dbUsers.length} total registered</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400  tracking-tight">
                          <th className="p-4 pl-0 font-medium">Name / Email</th>
                          <th className="p-4 font-medium">Role</th>
                          <th className="p-4 font-medium">Organization</th>
                          <th className="p-4 font-medium">Created At</th>
                          <th className="p-4 pr-0 font-medium text-right">ID</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-white/5">
                        {dbUsers.map((u, i) => (
                          <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 pl-0">
                              <div className="font-medium text-white">{u.name}</div>
                              <div className="text-xs text-zinc-500">{u.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded border text-[10px]  font-bold tracking-tight ${
                                u.role === 'founder' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                                u.role === 'recruiter' ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100' :
                                'bg-slate-500/10 border-slate-500/20 text-zinc-400'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-400">{u.organization || '-'}</td>
                            <td className="p-4 text-zinc-400 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 pr-0 text-right text-xs font-mono text-zinc-600">
                              {u._id.substring(u._id.length - 6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORTS TAB */}
              {activeTab === 'reports' && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-zinc-800/50 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-400" />
                      Global Database Reports
                    </h3>
                    <div className="text-xs text-zinc-500">{dbReports.length} simulations globally</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dbReports.map((report, i) => (
                      <div key={i} className="p-4 rounded-xl bg-black/20 border border-zinc-800/50 hover:border-zinc-800 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-white">{report.candidateName}</div>
                            <div className="text-xs text-zinc-400">{report.role}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            report.score >= 80 ? 'bg-zinc-800/50 text-zinc-100' :
                            report.score >= 60 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {report.score}/100
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 mb-4 truncate">
                          {report.company} • {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                        <Link href={`/report/${report.sessionId}`} className="flex items-center justify-between w-full p-2 rounded bg-zinc-900/50 hover:bg-white/10 text-xs font-medium text-zinc-400 transition-colors">
                          View Deep Report
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
