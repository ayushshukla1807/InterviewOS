'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowRight, Bot, UserCheck, 
  ShieldAlert, Cpu, Sparkles, FileText, 
  Users, ExternalLink, GraduationCap, ChevronDown,
  Flame, Terminal, Monitor, Code2, CheckCircle, Activity,
  Briefcase, Plus, Server, LayoutDashboard, Award, Clock
} from 'lucide-react';
import Link from 'next/link';
import { ROLES, ROLE_CATEGORIES, getRolesByCategory, type RoleConfig, type RoleCategory } from '../lib/ai/roles';

// Color map for categories
const CAT_COLOR: Record<string, string> = {
  indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
  sky:     'bg-sky-500/10 border-sky-500/20 text-sky-400',
  rose:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

const CAT_RING: Record<string, string> = {
  indigo:  'border-indigo-500 shadow-indigo-500/20',
  violet:  'border-violet-500 shadow-violet-500/20',
  sky:     'border-sky-500 shadow-sky-500/20',
  rose:    'border-rose-500 shadow-rose-500/20',
  emerald: 'border-emerald-500 shadow-emerald-500/20',
  amber:   'border-amber-500 shadow-amber-500/20',
};

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const token = localStorage.getItem('interviewos_token');
    const userStr = localStorage.getItem('interviewos_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAuthenticated(true);
        setUserRole(user.role);
      } catch (e) {}
    }
  }, []);

  // Role selector state
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory>('software_engineering');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // MVP state
  const [selectedJob, setSelectedJob] = useState('REQ-101');
  const [customJobs, setCustomJobs] = useState<any[]>([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');

  const defaultJobs = [
    { id: 'REQ-101', title: 'Senior Staff Engineer (React & AI Integration)' },
    { id: 'REQ-102', title: 'Lead Fullstack & Distributed Systems Architect' },
    { id: 'REQ-103', title: 'Algorithms & Competitive Programmer Intern' }
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          if (data.jobs && data.jobs.length > 0) {
            setCustomJobs(data.jobs.map((j: any) => ({
              id: j.jobId,
              title: j.title,
              description: j.description
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  const mergedJobs = [...defaultJobs, ...customJobs.filter(cj => !defaultJobs.find(dj => dj.id === cj.id))];

  const handleAddCustomJob = async () => {
    if (!newJobTitle || !newJobDesc) return;
    
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newJobTitle, description: newJobDesc })
      });
      
      if (!res.ok) throw new Error('Failed to create job');
      
      const data = await res.json();
      const newJob = { id: data.job.jobId, title: data.job.title, description: data.job.description };
      
      setCustomJobs(prev => [newJob, ...prev]);
      setSelectedJob(newJob.id);
      setNewJobTitle('');
      setNewJobDesc('');
      setShowAddJob(false);
    } catch (err) {
      console.error('Error adding job:', err);
      alert('Failed to add custom job to database.');
    }
  };

  const groupedRoles = getRolesByCategory();

  const handleLaunchTryout = () => {
    if (!selectedRole) return;
    localStorage.setItem('interviewos_candidate_profile', JSON.stringify({
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

  const handleRoleCardClick = (role: RoleConfig, catId: RoleCategory) => {
    setSelectedCategory(catId);
    setSelectedRole(role);
    // Smooth scroll to Tryout Command Center
    const target = document.getElementById('command-center');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateProfile = (key: keyof ProfileData, val: string) =>
    setProfile(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col relative transition-colors duration-500">
      
      {/* Visual background grid and radial blurs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] bg-purple-600/10 blur-[160px] rounded-full mix-blend-screen" />
        <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] bg-emerald-600/10 blur-[160px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[5%] left-[10%] w-[900px] h-[900px] bg-blue-600/10 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 px-6 py-4 lg:px-12 flex items-center justify-between backdrop-blur-xl border-b border-white/5 bg-[#0a0a0c]/85">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 border border-purple-500/20 rounded-xl flex items-center justify-center bg-purple-500/5 shadow-md shadow-purple-500/5">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight leading-none text-white">InterviewOS</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">AI Platform</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link href={userRole === 'founder' ? '/founder' : userRole === 'recruiter' ? '/recruiter' : '/candidate'} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                {userRole === 'recruiter' ? 'Recruiter Dashboard' : 'Candidate Workspace'}
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('interviewos_token');
                  localStorage.removeItem('interviewos_user');
                  fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                    setIsAuthenticated(false);
                    setUserRole(null);
                  });
                }}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Log in</Link>
              <Link href="/login" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20">Sign up free</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-16 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-white/5 border border-white/5 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next-Gen AI Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Practice Real <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
              Technical Interviews
            </span> <br />
            with AI.
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
            Get interview ready with personalized AI evaluation, turn-by-turn live grading feedback, and real-time cloud containers. Designed to simulate real workplace environments.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#command-center" className="px-6 py-3.5 bg-white text-[#050508] hover:bg-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 flex items-center gap-2">
              Start Free Mock <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/login" className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
              Try Sandbox VM
            </Link>
          </div>

          {/* Monochrome partner logos */}
          <div className="pt-6 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Trusted by developers from</p>
            <div className="flex items-center gap-6 opacity-30 grayscale hover:opacity-60 transition-opacity">
              <span className="text-sm font-bold tracking-tight text-white">Google</span>
              <span className="text-sm font-bold tracking-tight text-white">Amazon</span>
              <span className="text-sm font-bold tracking-tight text-white">Slack</span>
              <span className="text-sm font-bold tracking-tight text-white">LinkedIn</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Right: Premium Mock Workspace */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="lg:col-span-6 relative w-full aspect-[4/3] rounded-3xl border border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl p-4 shadow-2xl flex flex-col overflow-hidden group"
        >
          {/* Top border highlight */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />
          
          {/* Browser header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">candidate_session_workspace</div>
            <div className="w-10" />
          </div>

          {/* Split mock editor/terminal */}
          <div className="flex-1 flex gap-3 overflow-hidden">
            {/* Editor Area */}
            <div className="flex-1 rounded-2xl bg-[#050508]/80 p-4 font-mono text-[10px] text-slate-400 space-y-2 relative border border-white/5">
              <div className="text-emerald-500">// Optimal JS Batch Engine</div>
              <div><span className="text-purple-400">class</span> <span className="text-blue-400">TransactionAggregator</span> &#123;</div>
              <div className="pl-4"><span className="text-purple-400">constructor</span>() &#123;</div>
              <div className="pl-8"><span className="text-purple-400">this</span>.transactions = [];</div>
              <div className="pl-4">&#125;</div>
              <div className="pl-4"><span className="text-blue-400">process</span>(tx) &#123;</div>
              <div className="pl-8"><span className="text-purple-400">this</span>.transactions.push(tx);</div>
              <div className="pl-8">// Batch under clean scopes</div>
              <div className="pl-4">&#125;</div>
              <div>&#125;</div>
              
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/5 border border-white/5 rounded text-[8px] font-black uppercase text-blue-400">JavaScript</div>
            </div>
            
            {/* Telemetry/AI output mock */}
            <div className="w-44 flex flex-col gap-3">
              <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center space-y-1">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Voice Confidence</span>
                <span className="text-lg font-black text-white">92%</span>
              </div>
              <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center space-y-1">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Stress telemetry</span>
                <span className="text-sm font-black text-purple-300">Neutral / Focused</span>
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          {/* Top evaluation score card */}
          <div className="absolute top-12 right-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[-4px]">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Evaluation Score</span>
              <span className="text-sm font-black text-white">94/100</span>
            </div>
          </div>

          {/* Bottom Left: Confidence Badge */}
          <div className="absolute bottom-8 left-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[4px]">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Confidence</span>
              <span className="text-sm font-black text-white">Elite</span>
            </div>
          </div>

          {/* Bottom Right: Streak Card */}
          <div className="absolute bottom-20 right-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-x-[-4px]">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Daily Streak</span>
              <span className="text-sm font-black text-white">5 Days Active</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* How it Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-5xl font-black text-white">How InterviewOS Works</h2>
          <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">Start your journey to becoming interview-ready in three simple steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Choose Your Role', desc: 'Select your target engineering domain from Frontend, Backend, Full Stack to Android.' },
            { step: '02', title: 'Job or Internship?', desc: 'Tailor the simulation for professional career shifts or early-career internships.' },
            { step: '03', title: 'Select Your Stack', desc: 'Lock in the specific technologies you use to receive specialized technical probing.' }
          ].map(item => (
            <div key={item.step} className="p-8 bg-[#0a0a0c]/50 border border-white/5 rounded-3xl text-center space-y-4 shadow-lg flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-black text-purple-400">
                {item.step}
              </div>
              <p className="text-md font-bold text-white">{item.title}</p>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specialized Interview Path Cards */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-20 lg:px-12 space-y-8 text-left">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-4xl font-black text-white">Choose Your Path</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Specialized interview loops designed for every engineering domain.</p>
          </div>
          <a href="#command-center" className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5">
            View All 20+ Roles <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Frontend Developer Intern', category: 'software_engineering', roleId: 'FE_INTERN', tags: ['HTML/CSS', 'JS', 'REACT'], duration: '30m Simulation', icon: '💻' },
            { title: 'Frontend Developer', category: 'software_engineering', roleId: 'FE', tags: ['NEXT.JS', 'TAILWIND', 'TS'], duration: '45m Simulation', icon: '⚡' },
            { title: 'Backend Developer Intern', category: 'software_engineering', roleId: 'BE_INTERN', tags: ['NODE.JS', 'SQL', 'APIS'], duration: '45m Simulation', icon: '⚙️' },
            { title: 'Full Stack Developer', category: 'software_engineering', roleId: 'FS', tags: ['MERN', 'POSTGRESQL', 'DOCKER'], duration: '60m Simulation', icon: '🚀' },
            { title: 'Full Stack Developer Intern', category: 'software_engineering', roleId: 'FS_INTERN', tags: ['REACT', 'EXPRESS', 'AUTH'], duration: '45m Simulation', icon: '💎' },
            { title: 'Android App Developer', category: 'software_engineering', roleId: 'ANDROID', tags: ['KOTLIN', 'JETPACK', 'MVVM'], duration: '45m Simulation', icon: '📱' },
          ].map(role => {
            const roleMeta = ROLES.find(r => r.id === role.roleId);
            return (
              <div 
                key={role.roleId}
                onClick={() => roleMeta && handleRoleCardClick(roleMeta, role.category as any)}
                className="p-6 bg-[#0a0a0c]/50 border border-white/5 rounded-3xl hover:border-purple-500/40 hover:bg-[#0c0c10]/70 cursor-pointer transition-all duration-300 shadow-md group flex flex-col justify-between h-48"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{role.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {role.duration}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-white group-hover:text-purple-400 transition-colors leading-snug">{role.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {role.tags.map(t => (
                    <span key={t} className="text-[8px] px-2 py-0.5 bg-white/5 border border-white/5 rounded text-slate-400 font-semibold tracking-wider uppercase">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Command Center (Interactive Tryout Area) */}
      <section id="command-center" className="relative z-10 max-w-5xl mx-auto w-full px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full bg-[#0a0a0c]/85 border border-white/5 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl flex flex-col gap-8 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />

          {/* Navigation tabs */}
          <div className="w-full p-1.5 rounded-2xl flex bg-[#050508]/60 border border-white/5">
            {[
              { id: 'tryout', icon: <Bot className="w-4 h-4" />, label: 'Practice Interview' },
              { id: 'candidate', icon: <GraduationCap className="w-4 h-4" />, label: 'My Workspace' },
              { id: 'recruiter', icon: <Users className="w-4 h-4" />, label: 'Recruiter Portal' },
              { id: 'mvp', icon: <FileText className="w-4 h-4" />, label: 'JD + Resume' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white opacity-70 hover:opacity-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* tryout tab */}
            {activeTab === 'tryout' && (
              <motion.div
                key="tryout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 text-left"
              >
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Configure Practice Interview</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                    Select a role Category → Pick a specialized path → Add background details
                  </p>
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(ROLE_CATEGORIES) as [RoleCategory, {label: string; color: string}][]).map(([catId, catMeta]) => (
                    <button
                      key={catId}
                      onClick={() => setSelectedCategory(catId)}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                        selectedCategory === catId
                          ? `${CAT_COLOR[catMeta.color]} border-purple-500/30`
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {catMeta.label}
                    </button>
                  ))}
                </div>

                {/* Role selection dropdown/chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(groupedRoles[selectedCategory] || []).map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                        selectedRole?.id === role.id
                          ? `${CAT_RING[role.color]} border bg-[#0a0a0c]/60 shadow-lg shadow-purple-500/5`
                          : 'bg-[#050508]/40 border-white/5 hover:border-white/10 hover:bg-[#050508]/60 shadow-md'
                      }`}
                    >
                      <span className="text-xl">{role.icon}</span>
                      <div>
                        <p className="text-xs font-bold leading-tight text-white">{role.title}</p>
                        <p className="text-[9px] leading-relaxed text-slate-500 mt-1">{role.description.slice(0, 50)}…</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected role details card */}
                {selectedRole && (
                  <div className={`p-5 rounded-2xl border ${CAT_COLOR[selectedRole.color]} border-current/25 bg-[#050508]/50`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{selectedRole.icon}</span>
                      <span className="text-xs font-black uppercase tracking-wider text-white">{selectedRole.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRole.coreSkills.map(s => (
                        <span key={s} className="text-[9px] px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-300 font-bold uppercase tracking-wider">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate details form */}
                {selectedRole && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowProfileForm(v => !v)}
                      className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-all"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showProfileForm ? 'rotate-180' : ''}`} />
                      {showProfileForm ? 'Hide' : 'Add'} Customized Background (Resume / Project Context)
                    </button>

                    <AnimatePresence>
                      {showProfileForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 mt-2">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your Name *</label>
                              <input
                                value={profile.candidateName}
                                onChange={e => updateProfile('candidateName', e.target.value)}
                                placeholder="Guest Candidate"
                                className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Education</label>
                              <input
                                value={profile.education}
                                onChange={e => updateProfile('education', e.target.value)}
                                placeholder="e.g. B.S. Computer Science"
                                className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Core Projects</label>
                              <textarea
                                value={profile.projects}
                                onChange={e => updateProfile('projects', e.target.value)}
                                placeholder="e.g. Built an AI chat application using Next.js and WebSockets..."
                                rows={2}
                                className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Work History</label>
                              <textarea
                                value={profile.experience}
                                onChange={e => updateProfile('experience', e.target.value)}
                                placeholder="e.g. Frontend Intern at TechCorp - built dynamic dashboards..."
                                rows={2}
                                className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Additional Skills & Certifications</label>
                              <textarea
                                value={profile.certifications}
                                onChange={e => updateProfile('certifications', e.target.value)}
                                placeholder="e.g. AWS Developer Assoc, Docker, Redux..."
                                rows={2}
                                className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
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
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    selectedRole
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-[0.98]'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {selectedRole
                    ? `Start ${selectedRole.title} Mock Interview`
                    : 'Select a Target Role Above First'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* candidate tab */}
            {activeTab === 'candidate' && (
              <motion.div key="candidate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Candidate Portfolio Workspace</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">View stats, monitor daily activity streaks, download certificates, and check global rankings</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/candidate" className="p-6 bg-[#050508]/40 border border-white/5 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Personalised paths</span>
                    <p className="text-sm font-bold text-white">Learning Roadmap</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Tailored improvement checklists automatically calculated from your actual performance metrics.</p>
                  </Link>
                  <Link href="/candidate" className="p-6 bg-[#050508]/40 border border-white/5 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Verified Credentials</span>
                    <p className="text-sm font-bold text-white">Shareable Portfolio Profile</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Display earned badges, XP achievements, streaks, and capability radar charts on a public link.</p>
                  </Link>
                </div>
                <Link href="/candidate" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20">
                  Open Candidate Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* recruiter tab */}
            {activeTab === 'recruiter' && (
              <motion.div key="recruiter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Recruiter Assessment Center</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Audit candidate behaviors, create customized listings, and analyze competency matrices</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/recruiter" className="p-6 bg-[#050508]/40 border border-white/5 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Behavioral Proctoring</span>
                    <p className="text-sm font-bold text-white">Neural Integrity Log</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Audits candidate gaze shifts, dynamic browser tab focus losses, and audio consistency reports.</p>
                  </Link>
                  <Link href="/recruiter" className="p-6 bg-[#050508]/40 border border-white/5 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Diagnostic Analytics</span>
                    <p className="text-sm font-bold text-white">16-Point Competency Radar</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Generates robust merit reports, code review details, and structured candidate comparison tables.</p>
                  </Link>
                </div>
                <Link href="/recruiter" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20">
                  Open Recruiter Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* mvp tab */}
            {activeTab === 'mvp' && (
              <motion.div key="mvp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">JD + Resume Custom Mock (RAG Assessment)</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Upload a PDF Resume against any Job Description to generate a fully tailored assessment</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Target Job Opening</label>
                    <button onClick={() => setShowAddJob(!showAddJob)} className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:underline">
                      {showAddJob ? 'Cancel' : '+ Create Custom Role'}
                    </button>
                  </div>

                  {showAddJob ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-[#050508] border border-white/5 rounded-2xl space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Job Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Backend Engineer"
                          value={newJobTitle}
                          onChange={e => setNewJobTitle(e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Job Description</label>
                        <textarea
                          placeholder="Paste the full requirements or role details here..."
                          value={newJobDesc}
                          onChange={e => setNewJobDesc(e.target.value)}
                          rows={3}
                          className="w-full bg-[#0a0a0c] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={handleAddCustomJob}
                        disabled={!newJobTitle || !newJobDesc}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Save & Select Role
                      </button>
                    </motion.div>
                  ) : (
                    <select
                      value={selectedJob}
                      onChange={e => setSelectedJob(e.target.value)}
                      className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:bg-[#0a0a0c] outline-none shadow-inner"
                    >
                      {mergedJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.id}: {job.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    You will be redirected to the custom job application portal. There, you can upload your <strong>PDF resume</strong>. The system automatically structures your skills, parses work history, and dynamically prompts you with tailored scenarios reflecting the intersection of your experience and the job description.
                  </p>
                </div>
                <button
                  onClick={handleLaunchMVP}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  Go to Job Application Portal <ExternalLink className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Feature pillars */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-4xl font-black text-white">Don't Just Practice. Improve.</h2>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Actionable Insights & Dynamic Simulations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {[
            { icon: <Bot className="w-6 h-6 text-purple-400" />, bg: 'bg-purple-500/5 border-purple-500/10', title: 'Adaptive AI Mock Prober', desc: 'Syed dynamically questions your projects, architecture choices, and background details rather than asking generic textbook trivia.' },
            { icon: <Server className="w-6 h-6 text-emerald-400" />, bg: 'bg-emerald-500/5 border-emerald-500/10', title: 'Interactive Cloud Sandbox', desc: 'Write backend code, compile modules, execute shell commands, and deploy mini-apps inside a secure StackBlitz WebContainer.' },
            { icon: <UserCheck className="w-6 h-6 text-sky-400" />, bg: 'bg-sky-500/5 border-sky-500/10', title: 'Turn-by-Turn Grading Badges', desc: 'Get live visual check badges (STRONG, VAGUE, INCORRECT) and inline coaching recommendations underneath every answer you submit.' },
          ].map(f => (
            <div key={f.title} className="group flex flex-col items-center gap-4 p-8 bg-[#0a0a0c]/50 border border-white/5 rounded-3xl hover:border-purple-500/40 hover:bg-[#0c0c10]/70 transition-all duration-300 text-center shadow-lg">
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform`}>{f.icon}</div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-white tracking-tight">{f.title}</p>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="p-12 border-t border-white/5 text-center bg-[#0a0a0c] z-10 relative">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">© 2026 InterviewOS Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508]" />}>
      <LandingPageContent />
    </Suspense>
  );
}
