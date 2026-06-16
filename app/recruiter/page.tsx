'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Users, Search, Filter, Layers, BarChart as BarChartIcon, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus, X, Terminal, Cpu, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [bulkLinks, setBulkLinks] = useState<{name: string, email: string, role: string, link: string}[]>([]);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Software Engineer' });
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLiveModal, setShowLiveModal] = useState<ActiveSession | null>(null);
  const [jdInput, setJdInput] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [generatedJd, setGeneratedJd] = useState<{title: string, content: string, rubric: string[]} | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const user = data.user || data;
        if (user.role !== 'recruiter' && user.role !== 'founder') {
          window.location.href = '/candidate';
        } else {
          localStorage.setItem('interviewos_user', JSON.stringify(user));
        }
      } catch {
        localStorage.removeItem('interviewos_token');
        localStorage.removeItem('interviewos_user');
        window.location.href = '/sign-in';
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'candidates' || activeTab === 'users') {
      setIsLoadingDb(true);
      fetch('/api/recruiter/data')
        .then(res => res.json())
        .then(data => {
          if (data.reports) {
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
    <div className="min-h-screen text-[var(--text)] font-sans selection:bg-white/30 transition-colors duration-500 relative bg-[var(--theme-bg)] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-zinc-800/50 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="mesh-bg" />
      
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 text-white font-medium text-xs shadow-sm group-hover:scale-105 transition-transform">
              OS
            </div>
            <span className="font-bold text-sm tracking-tight  text-white whitespace-nowrap">Recruiter OS</span>
          </Link>
          
          {/* Navigation Tabs (Center) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-black/35 rounded-xl border border-zinc-800/50 shadow-inner">
            {[
              { id: 'live', label: 'Live Monitor', icon: Activity },
              { id: 'candidates', label: 'Hiring Reports', icon: FileText },
              { id: 'users', label: 'Directory', icon: Users },
              { id: 'templates', label: 'Blueprints', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-medium  tracking-tight transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800/50 text-zinc-100 border border-zinc-700 shadow-sm shadow-emerald-500/15' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons & Logout (Right) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={() => setShowBulkInviteModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-100 border border-zinc-700 transition-all rounded-xl text-[10px] font-medium  tracking-tight active:scale-95"
            >
              <Users className="w-3.5 h-3.5" /> CSV Invite
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white text-slate-950 hover:bg-zinc-200 transition-colors rounded-xl text-[10px] font-medium  tracking-tight shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Invite
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 hidden sm:block mx-1" />

            <Link 
              href="/recruiter/security"
              className="text-[10px] font-medium  tracking-tight text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-100" /> Security
            </Link>
            <button 
              onClick={async () => {
                try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
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

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 relative z-10">
        <AnimatePresence mode="wait">

          {/* ── LIVE PROCTORING MODAL ──────────────────────────────────────── */}
          {showLiveModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0A] border border-zinc-700 p-8 rounded-[2rem] w-full max-w-5xl shadow-2xl relative flex flex-col h-[80vh] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-white " />
                <button onClick={() => setShowLiveModal(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-zinc-900/50 p-2 rounded-full border border-zinc-800"><X className="w-4 h-4" /></button>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-medium text-white  tracking-tight flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      Live Feed: {showLiveModal.name}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-400  tracking-tight mt-1">Session: {showLiveModal.sessionId} | Role: {showLiveModal.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                  {/* Left: Terminal Output */}
                  <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-2xl flex flex-col relative overflow-hidden">
                    <div className="bg-zinc-950/50 px-4 py-2 border-b border-zinc-800 text-[9px] font-mono text-white flex justify-between items-center">
                      <span>terminal/tty1 - tail -f live_keystrokes.log</span>
                      <Terminal className="w-3 h-3" />
                    </div>
                    <div className="p-4 flex-1 overflow-hidden font-mono text-[11px] text-zinc-100 space-y-1 relative">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>&gt; CONNECTED TO SANDBOX ENV</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>&gt; Candidate started typing in index.js...</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>const handleRequest = async (req) =&gt; &#123;</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }}>  // Need to add error boundary here</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 }} className="text-yellow-400">&gt; STAKEHOLDER_MSG: "Why is the API slow???" (Injected)</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5.5 }}>&gt; Candidate switching to Slack.app...</motion.div>
                      <div className=" mt-2">_</div>
                    </div>
                  </div>

                  {/* Right: Biometric & Logs */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 flex-1 relative overflow-hidden flex flex-col items-center justify-center group">
                      <div className="absolute inset-0 bg-zinc-900/50 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="w-24 h-24 rounded-full border-2 border-zinc-700 flex items-center justify-center relative mb-4">
                        <motion.div className="absolute inset-0 border-2 border-zinc-500 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
                        <Activity className="w-10 h-10 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-medium text-white">{showLiveModal.trust}%</div>
                        <div className="text-[9px] font-medium  tracking-tight text-white">Live Trust Metric</div>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 flex-1 overflow-hidden flex flex-col">
                      <div className="text-[10px] font-medium  tracking-tight text-zinc-400 mb-3 flex items-center gap-2"><Shield className="w-3 h-3 text-rose-400" /> Proctoring Log</div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        <div className="text-[10px] flex gap-2"><span className="text-zinc-500">10:41</span> <span className="text-zinc-100">Eye contact stable</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-zinc-500">10:42</span> <span className="text-zinc-100">Speech pace optimal</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-zinc-500">10:44</span> <span className="text-rose-400 font-bold">Tab switch detected! (-5 trust)</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-zinc-500">10:45</span> <span className="text-yellow-400">Stress vocal markers detected</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-zinc-500">10:46</span> <span className="text-zinc-100">Returned to focus</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ── INVITE MODAL ──────────────────────────────────────────────── */}
          {showInviteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-950 border-none p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
              >
                <button onClick={() => {setShowInviteModal(false); setGeneratedLink('');}} className="absolute top-4 right-4 text-zinc-400 hover:text-white">✕</button>
                <h2 className="text-2xl font-medium text-white mb-2  tracking-tight">Generate Invite Link</h2>
                <p className="text-xs font-bold text-zinc-400  tracking-tight mb-6">Create a unique, secure assessment gateway for a candidate.</p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400  tracking-tight mb-2">Candidate Name</label>
                    <input type="text" value={inviteData.name} onChange={e => setInviteData(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-900/50 border-none rounded-xl px-4 py-3 text-sm text-white focus:border-zinc-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400  tracking-tight mb-2">Candidate Email</label>
                    <input type="email" value={inviteData.email} onChange={e => setInviteData(p => ({...p, email: e.target.value}))} className="w-full bg-zinc-900/50 border-none rounded-xl px-4 py-3 text-sm text-white focus:border-zinc-500 outline-none" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400  tracking-tight mb-2">Target Role</label>
                    <input type="text" value={inviteData.role} onChange={e => setInviteData(p => ({...p, role: e.target.value}))} className="w-full bg-zinc-900/50 border-none rounded-xl px-4 py-3 text-sm text-white focus:border-zinc-500 outline-none" placeholder="Software Engineer" />
                  </div>
                </div>

                {!generatedLink ? (
                  <button 
                    onClick={() => {
                      if (!inviteData.name || !inviteData.email || !inviteData.role) return alert('Please fill all fields');
                      const token = btoa(JSON.stringify(inviteData));
                      setGeneratedLink(`${window.location.origin}/invite/${token}`);
                    }}
                    className="w-full py-4 bg-[#06b6d4] text-[#020617] hover:bg-[#22d3ee] shadow-sm  rounded-xl text-white text-xs font-medium  tracking-tight shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Generate Secure Link
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl break-all">
                      <p className="text-zinc-100 text-xs font-mono">{generatedLink}</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedLink).then(() => alert('Copied to clipboard!'))}
                      className="w-full py-4 bg-zinc-900/50 border-none rounded-xl text-white text-xs font-medium  tracking-tight hover:bg-white/10 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* ── BULK INVITE MODAL ──────────────────────────────────────── */}
          {showBulkInviteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-950 border-none p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                <button onClick={() => {setShowBulkInviteModal(false); setBulkLinks([]);}} className="absolute top-4 right-4 text-zinc-400 hover:text-white">✕</button>
                <h2 className="text-2xl font-medium text-white mb-2  tracking-tight">Bulk Invite (CSV)</h2>
                <p className="text-xs font-bold text-zinc-400  tracking-tight mb-6">Upload a CSV to generate secure assessment links for multiple candidates.</p>
                
                {!bulkLinks.length ? (
                  <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-950/50">
                    <Users className="w-10 h-10 text-purple-400 mb-4 opacity-50" />
                    <p className="text-sm font-bold text-zinc-400 mb-4">Upload CSV (name, email, role)</p>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          if (!text) return;
                          const rows = text.split('\n').map(r => r.split(','));
                          const newLinks: any[] = [];
                          rows.forEach((row, i) => {
                             if (i === 0 && row[0].toLowerCase().includes('name')) return; // Skip header
                             if (row.length >= 3) {
                               const name = row[0].trim();
                               const email = row[1].trim();
                               const role = row[2].trim();
                               if (name && email && role) {
                                  const token = btoa(JSON.stringify({name, email, role}));
                                  newLinks.push({name, email, role, link: `${window.location.origin}/invite/${token}`});
                               }
                             }
                          });
                          setBulkLinks(newLinks);
                        };
                        reader.readAsText(file);
                      }}
                      className="text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-zinc-100  tracking-tight">{bulkLinks.length} Links Generated</span>
                      <button 
                        onClick={() => {
                          const csvData = bulkLinks.map(l => `${l.name},${l.email},${l.role},${l.link}`).join('\n');
                          const blob = new Blob(['Name,Email,Role,Link\n' + csvData], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.setAttribute('href', url);
                          a.setAttribute('download', 'invite_links.csv');
                          a.click();
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-[10px] font-medium  text-white tracking-tight transition-colors"
                      >
                        Download as CSV
                      </button>
                    </div>
                    {bulkLinks.map((bl, i) => (
                      <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white">{bl.name}</p>
                            <p className="text-[10px] text-zinc-400">{bl.email} • {bl.role}</p>
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText(bl.link).then(() => alert('Copied!'))}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] font-medium text-white  tracking-tight"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-100 font-mono bg-zinc-800/50 p-2 rounded break-all">{bl.link}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

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
                  <h1 className="text-4xl font-medium  text-white  tracking-tight mb-2">Live Monitor</h1>
                  <p className="text-zinc-400 text-xs font-bold  tracking-tight">Watch candidates navigate simulations in real-time.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-100 font-medium  tracking-tight bg-zinc-800/50 border border-zinc-700 px-4 py-2 rounded-xl shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live Polling Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {liveSessions.length === 0 ? (
                  <div className="col-span-full py-32 text-center rounded-[40px] border border-white/10 bg-[var(--theme-bg)]/40 backdrop-blur-3xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Scanning Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                    
                    {/* Radar Sweep Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent w-[200%] h-[200%] origin-center -ml-[50%] -mt-[50%]"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      style={{ transformOrigin: 'center' }}
                    />

                    {/* Central Icon Hologram */}
                    <div className="relative mb-8 z-10">
                      {/* Pulse Rings */}
                      <motion.div className="absolute -inset-8 border border-zinc-700 rounded-full" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
                      <motion.div className="absolute -inset-16 border border-zinc-700 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 4, delay: 1, repeat: Infinity }} />
                      
                      <div className="w-24 h-24 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-white/10 shadow-sm relative z-10">
                        <Activity className="w-10 h-10 text-zinc-100 drop-shadow-sm" />
                      </div>
                    </div>

                    <h3 className="text-3xl font-medium  text-white  tracking-[0.2em] mb-4 z-10 drop-shadow-lg">Awaiting Neural Link</h3>
                    <p className="text-zinc-400 text-[10px] font-bold  tracking-[0.3em] z-10 max-w-sm leading-relaxed text-center">System is actively scanning for incoming candidate simulation streams. Live feeds will materialize here instantaneously.</p>
                    
                    <div className="mt-10 flex items-center gap-3 z-10 bg-zinc-800/50 border border-zinc-700 px-6 py-2 rounded-full shadow-sm">
                      <div className="flex gap-1.5 items-center">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-zinc-200 rounded-full shadow-sm" animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-medium  text-zinc-100 tracking-[0.2em]">Scanning Sector Alpha</span>
                    </div>
                  </div>
                ) : (
                  liveSessions.map(session => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={session.sessionId} 
                      className="glass-card border-none shadow-lg rounded-xl p-8 flex flex-col relative overflow-hidden group"
                    >
                      {/* Live Phase Gradient Line */}
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${
                        session.phase === 'chaos' ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-sm' :
                        session.phase === 'recovery' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-sm' :
                        'bg-gradient-to-r from-white to-zinc-400 shadow-sm'
                      }`} />

                      <div className="flex justify-between items-start mb-8 mt-2">
                        <div>
                          <h3 className="text-xl font-medium text-white">{session.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-400  tracking-tight mt-1">{session.role}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-medium  tracking-tight shadow-sm ${
                          session.phase === 'chaos' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          session.phase === 'recovery' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-zinc-800/50 text-zinc-100 border border-zinc-700'
                        }`}>
                          {session.phase === 'pre_skill' ? 'Skill Test' : session.phase}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-black/20 rounded-2xl p-5 border border-zinc-800/50">
                          <div className="text-[9px] font-bold text-zinc-500  tracking-tight mb-2">Live Trust</div>
                          <div className={`text-3xl font-medium ${session.trust < 40 ? 'text-red-400' : 'text-zinc-100'}`}>
                            {session.trust}%
                          </div>
                        </div>
                        <div className="bg-black/20 rounded-2xl p-5 border border-zinc-800/50">
                          <div className="text-[9px] font-bold text-zinc-500  tracking-tight mb-2">Proj. Score</div>
                          <div className="text-3xl font-medium text-zinc-100">
                            {session.score || '--'}
                          </div>
                        </div>
                      </div>

                      <motion.button 
                          onClick={() => setShowLiveModal(session)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full mt-auto py-4 rounded-xl bg-zinc-800/50 hover:bg-white/20 text-zinc-300 border border-zinc-700 transition-all text-[10px] font-medium  tracking-tight flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Zap className="w-4 h-4" /> Live Spectate
                        </motion.button>
                    </motion.div>
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
                  <h1 className="text-4xl font-medium  text-white  tracking-tight mb-2">Platform Leaderboard</h1>
                  <p className="text-zinc-400 text-xs font-bold  tracking-tight">Visual analytics and comprehensive hiring reports.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToCSV}
                  disabled={dbReports.length === 0}
                  className="flex items-center gap-2 px-5 py-3 glass-card disabled:opacity-50 transition-colors rounded-xl text-[10px] font-medium  tracking-tight border-none text-white shadow-lg"
                >
                  <BarChartIcon className="w-4 h-4" /> Export CSV
                </motion.button>
              </div>

              {/* Data Visualization Grid */}
              {!isLoadingDb && dbReports.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                  {/* KPI Cards */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card border-none shadow-lg rounded-3xl p-8 flex items-center gap-6 hover:border-zinc-600 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700 shadow-sm">
                        <Users className="w-8 h-8 text-zinc-100" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400  tracking-tight font-medium mb-1">Total Processed</div>
                        <div className="text-4xl font-medium text-white">{dbReports.length}</div>
                      </div>
                    </div>
                    <div className="glass-card border-none shadow-lg rounded-3xl p-8 flex items-center gap-6 hover:border-zinc-600 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700 shadow-sm">
                        <Target className="w-8 h-8 text-zinc-100" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400  tracking-tight font-medium mb-1">Avg Quality Score</div>
                        <div className="text-4xl font-medium text-zinc-100">{avgScore}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Bar Chart */}
                  <div className="lg:col-span-2 glass-card border-none shadow-lg rounded-3xl p-8 h-[300px] flex flex-col">
                    <h3 className="text-[10px] font-medium text-zinc-400  tracking-tight mb-6">Score Distribution</h3>
                    <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getScoreDistribution()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="candidates" fill="url(#colorBar)" radius={[6, 6, 0, 0]}>
                            <defs>
                              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingDb ? (
                <div className="py-24 flex justify-center"><div className="w-10 h-10 border-4 border-zinc-500 border-t-transparent rounded-full animate-spin shadow-sm"></div></div>
              ) : dbReports.length === 0 ? (
                <div className="border-none glass-card shadow-lg rounded-xl p-16 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-700">
                    <FileText className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-medium  text-white mb-3 tracking-tight">No Reports Yet</h3>
                  <p className="text-zinc-400 text-xs font-bold  tracking-tight max-w-md mb-8">Candidate merit reports will appear here automatically once a simulation is completed.</p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('templates')}
                    className="px-8 py-4 bg-[#06b6d4] text-[#020617] hover:bg-[#22d3ee] shadow-sm  text-white transition-all rounded-xl text-[10px] font-medium  tracking-tight shadow-sm inline-flex items-center gap-2"
                  >
                    Send Role Invites
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {dbReports.map((report: any, index: number) => {
                    const topPercentile = Math.max(1, Math.round((index / dbReports.length) * 100));
                    return (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={report._id} 
                      className="glass-card border-none shadow-lg rounded-xl p-8 flex flex-col group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/50 blur-[40px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-white/20" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-medium text-white tracking-tight">{report.candidateName}</h3>
                            <span className="px-2 py-0.5 bg-zinc-800/50 text-zinc-300 border border-zinc-700 rounded text-[8px] font-medium  tracking-tight">Top {topPercentile}%</span>
                          </div>
                          <p className="text-[10px] font-bold  tracking-tight text-zinc-400">{report.role} · {report.company}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {report.violations && report.violations.length > 0 && (
                            <div className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 text-[8px] font-medium text-rose-400  tracking-tight group-hover:">
                              <Shield className="w-3 h-3" /> Flagged
                            </div>
                          )}
                          <div className={`px-3 py-1.5 rounded-xl font-medium text-xl shadow-sm ${report.score >= 80 ? 'bg-zinc-800/50 text-zinc-100 border border-zinc-700' : report.score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                            {report.score}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] font-medium text-zinc-500  tracking-tight mb-8 border-b border-zinc-800 pb-5">
                        Completed: <span className="text-zinc-400 ml-1">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <Link href={`/report?sessionId=${report.sessionId}&name=${encodeURIComponent(report.candidateName)}&role=${encodeURIComponent(report.role)}&company=${encodeURIComponent(report.company)}`} className="mt-auto">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 text-white group-hover:text-zinc-100 transition-colors border-none group-hover:border-zinc-600 text-[10px] font-medium  tracking-tight flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> Full Merit Report
                        </motion.button>
                      </Link>
                    </motion.div>
                    );
                  })}
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
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-medium  text-white  tracking-tight mb-2">User Directory</h1>
                  <p className="text-zinc-400 text-xs font-bold  tracking-tight">Manage registered candidate and recruiter accounts.</p>
                </div>
              </div>

              {isLoadingDb ? (
                <div className="py-24 flex justify-center"><div className="w-10 h-10 border-4 border-zinc-500 border-t-transparent rounded-full animate-spin shadow-sm"></div></div>
              ) : dbUsers.length === 0 ? (
                <div className="border-none glass-card shadow-lg rounded-xl p-16 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-700">
                    <Users className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-medium  text-white mb-2 tracking-tight">No Users Found</h3>
                </div>
              ) : (
                <div className="overflow-hidden border-none shadow-xl rounded-xl glass-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-medium  tracking-tight text-zinc-400">Name</th>
                          <th className="px-8 py-5 text-[10px] font-medium  tracking-tight text-zinc-400">Email</th>
                          <th className="px-8 py-5 text-[10px] font-medium  tracking-tight text-zinc-400">Role</th>
                          <th className="px-8 py-5 text-[10px] font-medium  tracking-tight text-zinc-400">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-black/20">
                        {dbUsers.map((user: any) => (
                          <tr key={user._id} className="hover:bg-zinc-900/50 transition-colors">
                            <td className="px-8 py-5 font-bold text-white text-sm">{user.name}</td>
                            <td className="px-8 py-5 text-zinc-400 text-sm font-semibold">{user.email}</td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1.5 rounded-lg text-[9px] font-medium  tracking-tight border shadow-sm ${
                                user.role === 'recruiter' 
                                  ? 'bg-zinc-800/50 text-zinc-100 border-zinc-700' 
                                  : user.role === 'founder'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-500/10 text-zinc-400 border-slate-500/30'
                              }`}>
                                {user.role || 'candidate'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-zinc-400 text-xs font-bold">{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-medium  text-white  tracking-tight mb-2">Role Blueprints</h1>
                  <p className="text-zinc-400 text-xs font-bold  tracking-tight">Launch simulations using pre-configured AI evaluators.</p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl mb-8 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500" />
                <h3 className="text-xl font-medium text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-zinc-100" /> AI Blueprint Generator</h3>
                <p className="text-xs text-zinc-400 font-bold  tracking-tight">Describe the role, tech stack, and evaluation focus to auto-generate a custom rubric.</p>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <input type="text" value={jdInput} onChange={e => setJdInput(e.target.value)} placeholder="e.g. Senior Rust Backend Dev focusing on latency and WebSockets..." className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-zinc-500 outline-none" />
                  <button onClick={() => {
                    setIsGeneratingJd(true);
                    setGeneratedJd(null);
                    setTimeout(() => {
                      setGeneratedJd({
                        title: "Custom AI Track: " + jdInput.substring(0, 20) + "...",
                        content: "This candidate will be evaluated on high-performance concurrency, memory safety, and architectural design under simulated load spikes.",
                        rubric: ["Memory Profiling", "Thread Safety", "Architecture Scalability", "Stress Response"]
                      });
                      setIsGeneratingJd(false);
                      setJdInput('');
                    }, 2500);
                  }} disabled={!jdInput || isGeneratingJd} className="px-6 py-3 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-medium  tracking-tight text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all">
                    {isGeneratingJd ? <><Activity className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Blueprint</>}
                  </button>
                </div>
                {generatedJd && (
                  <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-4 p-5 bg-black/30 border border-zinc-700 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-zinc-100">{generatedJd.title}</h4>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-[10px] font-medium  tracking-tight rounded-lg border border-zinc-800">Save to Library</button>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{generatedJd.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedJd.rubric.map((r, i) => <span key={i} className="px-2 py-1 bg-zinc-800/50 text-zinc-200 border border-zinc-700 text-[9px] font-medium  tracking-tight rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {r}</span>)}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { role: 'Product Manager', type: 'Tech & Strategy', focus: 'Prioritization & Stakeholders', color: 'from-emerald-500 to-emerald-600', trackId: 'it_pm' },
                  { role: 'Software Engineer', type: 'Engineering', focus: 'Technical Judgment & Pressure', color: 'from-emerald-400 to-teal-600', trackId: 'fullstack' },
                  { role: 'Account Executive', type: 'Sales', focus: 'Pipeline & Communication', color: 'from-orange-400 to-red-600', trackId: 'backend' },
                  { role: 'HR Business Partner', type: 'Operations', focus: 'Conflict & Compliance', color: 'from-fuchsia-400 to-pink-600', trackId: 'qa_engineer' },
                ].map(b => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={b.role} 
                    className="glass-card border-none shadow-lg rounded-xl p-8 relative overflow-hidden group"
                  >
                    <div className={`absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br ${b.color} opacity-20 blur-[50px] group-hover:opacity-40 transition-opacity duration-500`} />
                    <div className="inline-block px-3 py-1.5 bg-zinc-900/50 border-none rounded-lg text-[9px] font-medium  tracking-tight text-zinc-400 mb-6 shadow-sm backdrop-blur-md">
                      {b.type}
                    </div>
                    <h3 className="text-2xl font-medium tracking-tight mb-2 text-white">{b.role}</h3>
                    <p className="text-[10px] font-bold  tracking-tight text-zinc-400 mb-8 h-8">Evaluates: <span className="text-zinc-300">{b.focus}</span></p>
                    
                    <Link href={`/instructions?name=Test%20Candidate&track=${b.trackId}`}>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl bg-white text-black hover:bg-slate-200 transition-all text-[10px] font-medium  tracking-tight flex items-center justify-center gap-2 shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4" /> Start Simulation
                      </motion.button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
