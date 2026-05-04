'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowRight, Bot, UserCheck, 
  ShieldAlert, Cpu, Sparkles, FileText, 
  Users, ExternalLink, GraduationCap, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { ROLES, ROLE_CATEGORIES, getRolesByCategory, type RoleConfig, type RoleCategory } from '../lib/ai/roles';

// ── Color map for category badges ──────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
  sky:     'bg-sky-500/10 border-sky-500/20 text-sky-400',
  rose:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

const CAT_RING: Record<string, string> = {
  indigo:  'border-indigo-500',
  violet:  'border-violet-500',
  sky:     'border-sky-500',
  rose:    'border-rose-500',
  emerald: 'border-emerald-500',
  amber:   'border-amber-500',
};

// ── Candidate Profile Form ─────────────────────────────────────────────────────
interface ProfileData {
  candidateName: string;
  education: string;
  experience: string;
  projects: string;
  certifications: string;
  skills: string;
}

const emptyProfile: ProfileData = {
  candidateName: '',
  education: '',
  experience: '',
  projects: '',
  certifications: '',
  skills: '',
};

// ── Landing Page ────────────────────────────────────────────────────────────────
function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nameParam = searchParams.get('name');
  const trackParam = searchParams.get('track');

  // Recruiter invite redirect
  useEffect(() => {
    if (nameParam && trackParam) {
      router.push(`/instructions?name=${encodeURIComponent(nameParam)}&track=${trackParam}`);
    }
  }, [nameParam, trackParam, router]);

  const [activeTab, setActiveTab] = useState<'tryout' | 'candidate' | 'recruiter' | 'mvp'>('tryout');

  // Role selector state
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory>('software_engineering');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // MVP state
  const [selectedJob, setSelectedJob] = useState('REQ-101');

  const groupedRoles = getRolesByCategory();

  const handleLaunchTryout = () => {
    if (!selectedRole) return;
    // Save profile to localStorage so the session page can use it
    localStorage.setItem('hyrte_candidate_profile', JSON.stringify({
      ...profile,
      roleId: selectedRole.id,
      roleTitle: selectedRole.title,
    }));
    const nameToUse = profile.candidateName || 'Guest Candidate';
    router.push(`/instructions?name=${encodeURIComponent(nameToUse)}&track=${selectedRole.id}`);
  };

  const handleLaunchMVP = () => {
    router.push(`/apply/${selectedJob}`);
  };

  const updateProfile = (key: keyof ProfileData, val: string) =>
    setProfile(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#020204] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col relative">

      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full opacity-40" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.3em] leading-none">Hyrte</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Intelligence</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Neural Core: Active</span>
          </div>
          <Link href="/recruiter" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">Recruiter</Link>
          <Link href="/candidate" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">Candidate</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-16 relative z-10 gap-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'circOut' }}
          className="max-w-4xl w-full text-center space-y-6"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">AI-Powered Technical Interviews · Personalised to You</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase">
            Next-Gen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">AI Interview</span><br />
            Platform.
          </h1>
          <p className="text-sm md:text-base font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
            Select your target role. Share your background. Get a 100% personalised interview — exactly like a real Google Meet with a senior engineer.
          </p>
        </motion.div>

        {/* ── CONTROL CENTER ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-5xl w-full bg-[#0c0c0e]/90 border border-white/5 rounded-[36px] backdrop-blur-2xl p-8 lg:p-10 space-y-8"
        >
          {/* Tab bar */}
          <div className="flex bg-[#070709] border border-white/5 p-1 rounded-2xl gap-1">
            {[
              { id: 'tryout', icon: <Bot className="w-3.5 h-3.5" />, label: 'Practice Interview' },
              { id: 'candidate', icon: <GraduationCap className="w-3.5 h-3.5" />, label: 'My Workspace' },
              { id: 'recruiter', icon: <Users className="w-3.5 h-3.5" />, label: 'Recruiter Portal' },
              { id: 'mvp', icon: <FileText className="w-3.5 h-3.5" />, label: 'JD + Resume (MVP)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* ── TRYOUT TAB ──────────────────────────────────────────────────── */}
            {activeTab === 'tryout' && (
              <motion.div
                key="tryout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 text-left"
              >
                <div>
                  <h3 className="text-xl font-black text-white">What is your target role?</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Select a role → fill your background → get a personalised AI mock interview
                  </p>
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(ROLE_CATEGORIES) as [RoleCategory, {label: string; color: string}][]).map(([catId, catMeta]) => (
                    <button
                      key={catId}
                      onClick={() => setSelectedCategory(catId)}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                        selectedCategory === catId
                          ? `${CAT_COLOR[catMeta.color]} border-current`
                          : 'border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {catMeta.label}
                    </button>
                  ))}
                </div>

                {/* Role cards for selected category */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(groupedRoles[selectedCategory] || []).map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                        selectedRole?.id === role.id
                          ? `bg-white/5 ${CAT_RING[role.color]} border-2`
                          : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                      }`}
                    >
                      <span className="text-xl">{role.icon}</span>
                      <p className="text-xs font-black text-white leading-tight">{role.title}</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed">{role.description.slice(0, 60)}…</p>
                    </button>
                  ))}
                </div>

                {/* Selected role chip + skills */}
                {selectedRole && (
                  <div className={`p-4 rounded-2xl border ${CAT_COLOR[selectedRole.color]} border-current/20`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{selectedRole.icon}</span>
                      <span className="text-xs font-black text-white">{selectedRole.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRole.coreSkills.map(s => (
                        <span key={s} className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-slate-400 font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile form toggle */}
                {selectedRole && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowProfileForm(v => !v)}
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-wider hover:text-indigo-300 transition-all"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showProfileForm ? 'rotate-180' : ''}`} />
                      {showProfileForm ? 'Hide' : 'Add'} Your Background (Projects · Experience · Certifications)
                    </button>

                    <AnimatePresence>
                      {showProfileForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Name *</label>
                              <input
                                value={profile.candidateName}
                                onChange={e => updateProfile('candidateName', e.target.value)}
                                placeholder="Ayush Shukla"
                                className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education</label>
                              <input
                                value={profile.education}
                                onChange={e => updateProfile('education', e.target.value)}
                                placeholder="BTech CS, IIT Mandi · Minor in AI/ML"
                                className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projects</label>
                              <textarea
                                value={profile.projects}
                                onChange={e => updateProfile('projects', e.target.value)}
                                placeholder="e.g. Built InterviewOS — an AI-powered hiring platform using Next.js, Gemini API, and real-time WebRTC proctoring..."
                                rows={2}
                                className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none resize-none placeholder-slate-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Experience</label>
                              <textarea
                                value={profile.experience}
                                onChange={e => updateProfile('experience', e.target.value)}
                                placeholder="e.g. SDE Intern at XYZ — built payment APIs handling 10K req/min..."
                                rows={2}
                                className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none resize-none placeholder-slate-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certifications & Skills</label>
                              <textarea
                                value={profile.certifications}
                                onChange={e => updateProfile('certifications', e.target.value)}
                                placeholder="e.g. AWS Solutions Architect, Google AI Essentials, Minor in AI/ML from IIT Mandi..."
                                rows={2}
                                className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none resize-none placeholder-slate-600"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <button
                  onClick={handleLaunchTryout}
                  disabled={!selectedRole}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    selectedRole
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {selectedRole
                    ? `Start ${selectedRole.title} Interview`
                    : 'Select a Target Role First'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── CANDIDATE TAB ──────────────────────────────────────────── */}
            {activeTab === 'candidate' && (
              <motion.div key="candidate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-black text-white">Candidate Portfolio Workspace</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">View past assessments, download verified certificates, and follow your AI learning roadmap</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Personalised Paths</span>
                    <p className="text-sm font-black text-white">AI Learning Roadmap</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Customised skill improvement checklists based on your actual interview results.</p>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Verified Badge</span>
                    <p className="text-sm font-black text-white">Shareable Certificate</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Download and share glassmorphic completion certificates with unique hashes.</p>
                  </div>
                </div>
                <Link href="/candidate" className="w-full py-4 bg-white text-black hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  Open My Candidate Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* ── RECRUITER TAB ──────────────────────────────────────────── */}
            {activeTab === 'recruiter' && (
              <motion.div key="recruiter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-black text-white">Recruiter Control Dashboard</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Create job listings, send candidate invite links, audit proctor logs, evaluate competency radars</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Visual Proctoring</span>
                    <p className="text-sm font-black text-white">Neural Integrity Audit Log</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Gaze tracking, tab-switch violations, and screen-sharing audit snapshots.</p>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Analytics</span>
                    <p className="text-sm font-black text-white">Competency Radar Grid</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">16-point merit reports with hiring-readiness scores and risk flags.</p>
                  </div>
                </div>
                <Link href="/recruiter" className="w-full py-4 bg-white text-black hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  Open Recruiter Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* ── MVP TAB ─────────────────────────────────────────────────── */}
            {activeTab === 'mvp' && (
              <motion.div key="mvp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-black text-white">JD + Resume Custom Assessment (MVP Flow)</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Upload your resume against a recruiter's job description — AI generates a 100% custom interview</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Job Opening</label>
                  <select
                    value={selectedJob}
                    onChange={e => setSelectedJob(e.target.value)}
                    className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="REQ-101">REQ-101: Senior Staff Engineer (React & AI Integration)</option>
                    <option value="REQ-102">REQ-102: Lead Fullstack & Distributed Systems Architect</option>
                    <option value="REQ-103">REQ-103: Algorithms & Competitive Programmer Intern</option>
                  </select>
                </div>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    📄 You will land on the job application page, enter your details, and upload a <strong>PDF Resume</strong>. The AI parses your resume, matches it against the JD requirements, and generates a personalised 4-question technical assessment covering exactly the intersection of your skills and the role's needs.
                  </p>
                </div>
                <button
                  onClick={handleLaunchMVP}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  Go to Job Application Portal <ExternalLink className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feature pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            { icon: <Bot className="w-5 h-5 text-indigo-400" />, bg: 'bg-indigo-600/10 border-indigo-500/20', title: 'Sentient AI Interviewer', desc: 'Syed probes your actual projects, not textbook definitions.' },
            { icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Neural Proctoring', desc: 'Gaze tracking, tab-switch detection, zero false positives.' },
            { icon: <UserCheck className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/10 border-violet-500/20', title: '16-Point Merit Reports', desc: 'Hiring-ready competency radars delivered instantly.' },
          ].map(f => (
            <div key={f.title} className="group flex flex-col items-center gap-4 p-8 bg-white/[0.02] border border-white/5 rounded-[32px] hover:border-white/10 transition-all duration-500 text-center">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform`}>{f.icon}</div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{f.title}</p>
                <p className="text-[9px] font-bold text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-12 border-t border-white/5 text-center bg-black/40">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 opacity-20">
            <Cpu className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-[0.5em]">System Version 5.0 // Sentient Core</span>
          </div>
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">© 2026 Hyrte Intelligence Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020204]" />}>
      <LandingPageContent />
    </Suspense>
  );
}
