'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Users, Search, Filter, Layers, BarChart, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';

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
  const [activeTab, setActiveTab] = useState<'candidates' | 'live' | 'templates'>('live');
  const [liveSessions, setLiveSessions] = useState<ActiveSession[]>([]);

  // Poll localStorage for active simulations (demo of "live" tracking)
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
              // It's a runtime state
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
          } catch (e) {
            // ignore
          }
        }
      }
      setLiveSessions(sessions);
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-violet-500/30">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 font-black text-xs">
              OS
            </div>
            <span className="font-bold text-sm tracking-widest uppercase">InterviewOS <span className="text-violet-400">HYRTE</span></span>
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {[
              { id: 'live', label: 'Live Monitor', icon: Activity },
              { id: 'candidates', label: 'Hiring Reports', icon: Users },
              { id: 'templates', label: 'Role Blueprints', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${
                  activeTab === tab.id ? 'bg-white/10 text-white font-semibold' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> New Simulation
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
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Live Monitor</h1>
                  <p className="text-white/50">Watch candidates navigate HYRTE simulations in real-time.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Live Polling Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.length === 0 ? (
                  <div className="col-span-full py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                    <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white/80 mb-2">No Active Simulations</h3>
                    <p className="text-white/40">Candidates taking a test right now will appear here.</p>
                  </div>
                ) : (
                  liveSessions.map(session => (
                    <div key={session.sessionId} className="border border-white/10 bg-[#111115] rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                      
                      {/* Live Phase Gradient Line */}
                      <div className={`absolute top-0 left-0 w-full h-1 ${
                        session.phase === 'chaos' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        session.phase === 'recovery' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`} />

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold">{session.name}</h3>
                          <p className="text-xs text-white/50">{session.role}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          session.phase === 'chaos' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          session.phase === 'recovery' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {session.phase === 'pre_skill' ? 'Skill Test' : session.phase}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                          <div className="text-xs text-white/40 mb-1">Live Trust</div>
                          <div className={`text-xl font-bold ${session.trust < 40 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {session.trust}%
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                          <div className="text-xs text-white/40 mb-1">HYRTE Projection</div>
                          <div className="text-xl font-bold text-violet-400">
                            {session.score || '--'}
                          </div>
                        </div>
                      </div>

                      <Link href={`/report?sessionId=${session.sessionId}&name=${encodeURIComponent(session.name)}&role=${encodeURIComponent(session.role)}&company=InterviewOS`} className="mt-auto">
                        <button className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-semibold flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4" /> View Full Report <ArrowRight className="w-4 h-4" />
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
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Completed Reports</h1>
                  <p className="text-white/50">Full PDF-ready HYRTE evaluation reports.</p>
                </div>
              </div>

              <div className="border border-white/10 bg-[#111115] rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white/80 mb-2">No Reports Yet</h3>
                <p className="text-white/40 max-w-md mx-auto mb-6">Reports will appear here once candidates complete their simulations. To view a demo report, complete a simulation yourself or check the Live Monitor.</p>
              </div>
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
                  <h1 className="text-3xl font-bold mb-2">Role Blueprints</h1>
                  <p className="text-white/50">HYRTE v3 templates configured for 15/35/50 scoring.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { role: 'Product Manager', type: 'Tech', focus: 'Prioritization & Stakeholders', color: 'from-violet-500 to-indigo-600' },
                  { role: 'Software Engineer', type: 'Tech', focus: 'Technical Judgment & Pressure', color: 'from-emerald-500 to-teal-600' },
                  { role: 'Account Executive', type: 'Sales', focus: 'Pipeline & Communication', color: 'from-orange-500 to-red-600' },
                  { role: 'HR Business Partner', type: 'Ops', focus: 'Conflict & Compliance', color: 'from-fuchsia-500 to-pink-600' },
                ].map(b => (
                  <div key={b.role} className="border border-white/10 bg-[#111115] rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${b.color} opacity-20 blur-3xl -mr-10 -mt-10`} />
                    <div className="inline-block px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs font-semibold mb-4">
                      {b.type}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{b.role}</h3>
                    <p className="text-sm text-white/50 mb-6">Tests for: {b.focus}</p>
                    
                    <Link href={`/simulation?role=${encodeURIComponent(b.role)}`}>
                      <button className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-white/20">
                        <PlayCircle className="w-4 h-4" /> Test Simulation
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
