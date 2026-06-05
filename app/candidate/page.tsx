'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, BrainCircuit, Code2, Briefcase, Award, 
  ArrowRight, ExternalLink, Calendar, CheckCircle2, 
  BookOpen, Sparkles, Star, ClipboardList, RefreshCw, Share2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidateContext, setCandidateContext] = useState<any>(null);
  const [pastInterviews, setPastInterviews] = useState<any[]>([]);

  useEffect(() => {
    // Get candidate info from database auth token if exists
    let candidateName = 'Guest Candidate';
    let candidateEmail = 'no-email@interviewos.ai';

    const savedUser = localStorage.getItem('interviewos_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      candidateName = user.name;
      candidateEmail = user.email;
      setCandidateContext(user);
    } else {
      const savedContext = localStorage.getItem('interviewos_candidate_context');
      if (savedContext) {
        const context = JSON.parse(savedContext);
        candidateName = context.name || candidateName;
        candidateEmail = context.email || candidateEmail;
        setCandidateContext(context);
      }
    }

    // Default test records as fallback
    const defaultPastRecords = [
      {
        id: 'INT-9021',
        jobTitle: 'JavaScript Performance & UI Engineer',
        date: '2026-05-18',
        score: 87,
        status: 'Completed',
        feedbackUrl: '/feedback/candidate?name=Ayush&track=JS',
        skills: { JS: 92, DSA: 78, System: 85, Communication: 90 }
      },
      {
        id: 'INT-4391',
        jobTitle: 'Algorithms & Competitive Coding (Tryout)',
        date: '2026-05-19',
        score: 94,
        status: 'Completed',
        feedbackUrl: '/feedback/candidate?name=Ayush&track=DSA',
        skills: { JS: 75, DSA: 98, System: 80, Communication: 92 }
      }
    ];

    // Try fetching reports from MongoDB via Next.js API
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
        
        // Fallback to local storage if API fails or no reports
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
          skills: { JS: 85, DSA: 80, System: 88, Communication: 92 }
        }));
        setPastInterviews(formatted);
      } else {
        setPastInterviews(defaultPastRecords);
      }
    };

    const userStr = localStorage.getItem('interviewos_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      fetchReports(user.id || user._id);
    } else {
      loadLocalStorageRecords([]);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('interviewos_applications');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12 relative z-10">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              <Shield className="w-7 h-7 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-[var(--text)] tracking-tighter uppercase">Candidate Dashboard</h1>
                <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Profile: Active</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Verified Certifications & Learning Path Matrix</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={clearHistory}
              className="px-5 py-3 border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear History
            </button>
            <Link 
              href="/"
              className="px-6 py-3 bg-white text-black hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5"
            >
              Start New Tryout
            </Link>
          </div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Profile & Quick Tryout */}
          <div className="lg:col-span-1 space-y-8">
            {/* Candidate Metadata */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 backdrop-blur-xl">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Account Profile</h2>
              
              <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center font-bold text-indigo-400 uppercase text-lg">
                    {candidateContext?.name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)]">{candidateContext?.name || 'Guest Candidate'}</h3>
                    <p className="text-[10px] text-slate-500">{candidateContext?.email || 'no-email@interviewos.ai'}</p>
                  </div>
                </div>
              </div>

              {/* Feature 4: Public Profile Sharing */}
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/report?sessionId=${pastInterviews[0]?.id || 'demo'}&name=${encodeURIComponent(candidateContext?.name || 'Guest')}&public=true`;
                  navigator.clipboard.writeText(url);
                  alert('Public Profile Link copied to clipboard!');
                }}
                className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
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
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {pastInterviews.length > 0 
                      ? Math.round(pastInterviews.reduce((acc, curr) => acc + curr.score, 0) / pastInterviews.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Track Selection */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 backdrop-blur-xl shadow-sm">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Practice Simulator</h2>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Launch a generic 4-question AI coding interview instantly</p>
              </div>

              <div className="space-y-3">
                <Link 
                  href="/instructions?track=JS"
                  className="w-full p-4 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-indigo-500/20 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[var(--text)]">JavaScript & UI Stacks</p>
                      <p className="text-[9px] text-slate-500">Node, React internals, Optimization</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
                </Link>

                <Link 
                  href="/instructions?track=DSA"
                  className="w-full p-4 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-emerald-500/20 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[var(--text)]">Data Structures & Algo</p>
                      <p className="text-[9px] text-slate-500">Big-O, DP, Graphs, Logic Trees</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                </Link>

                <Link 
                  href="/instructions?track=ADA"
                  className="w-full p-4 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-violet-500/20 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-violet-400" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[var(--text)]">Distributed Architectures</p>
                      <p className="text-[9px] text-slate-500">Scalability, caching, microservices</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 group-hover:text-violet-400 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Panel: Past Sessions & Learning Paths */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Past Interview Sessions */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 backdrop-blur-xl shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Completed Assessments</h2>
              
              <div className="space-y-4">
                {pastInterviews.map((record, idx) => (
                  <div key={record.id} className="p-6 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded border border-indigo-500/20">
                          {record.id}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {record.date}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[var(--text)]">{record.jobTitle}</h3>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(record.skills).map(([skill, val]: any) => (
                          <span key={skill} className="text-[9px] bg-slate-900 border border-[var(--border-color)] px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase">
                            {skill}: <strong className="text-[var(--text)]">{val}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 self-stretch md:self-auto justify-between border-t border-[var(--border-color)] md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Merit Score</span>
                        <p className="text-2xl font-black text-[var(--text)]">{record.score}%</p>
                      </div>

                      <div className="flex gap-2">
                        <Link 
                          href={record.feedbackUrl}
                          className="px-4 py-3 bg-[var(--bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        >
                          Feedback <ClipboardList className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                          href={record.feedbackUrl} // The certificate widget is inside candidate feedback page
                          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
                        >
                          Certificate <Award className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Curated Learning Paths */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6 backdrop-blur-xl shadow-sm">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Customized AI Learning Path</h2>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Dynamic development checklist generated from your assessment metrics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* JS Roadmap */}
                <div className="p-6 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">React & Core V8 Engine</h3>
                    </div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                      In Progress
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-[11px] text-slate-400 font-medium">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Profile garbage collection lifecycles on event handlers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Implement customized debouncing middleware.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-indigo-500/40 shrink-0 mt-0.5" />
                      <span className="text-slate-500">Benchmark React fiber commit phases under heavy state batches.</span>
                    </li>
                  </ul>
                </div>

                {/* System Roadmap */}
                <div className="p-6 bg-[var(--bg)] border border-[var(--border-color)] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">Scalability & Algorithms</h3>
                    </div>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      Assigned
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-[11px] text-slate-400 font-medium">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Implement Dynamic Programming on knapsack variants.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-emerald-500/40 shrink-0 mt-0.5" />
                      <span className="text-slate-500">Design consistent hashing rings for distributed nodes load balancing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-emerald-500/40 shrink-0 mt-0.5" />
                      <span className="text-slate-500">Analyze graph traversal limits with bipartite matching algorithms.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
