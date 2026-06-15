'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowRight, Bot, UserCheck, 
  ShieldAlert, Cpu, Sparkles, FileText, 
  Users, ExternalLink, GraduationCap, ChevronDown,
  Flame, Terminal, Monitor, Code2, CheckCircle, Activity,
  Briefcase, Plus, Server, LayoutDashboard, Award, Clock,
  Play, Pause, X, AlertTriangle, AlertCircle, HelpCircle, ChevronRight,
  Volume2, Star, ThumbsUp, BarChart3, Database, Workflow, ShieldCheck, Mail
} from 'lucide-react';
import Link from 'next/link';
import { ROLES, ROLE_CATEGORIES, getRolesByCategory, type RoleConfig, type RoleCategory } from '../lib/ai/roles';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Proctor violations data for Anti-Cheating Simulator
interface Violation {
  id: string;
  label: string;
  time: string;
  timeSec: number;
  desc: string;
  videoState: 'eye-shift' | 'camera-off' | 'switched-tabs' | 'second-voice' | 'ai-assist';
}

const VIOLATIONS: Violation[] = [
  { id: 'eye', label: 'Eye Shift', time: '01:12', timeSec: 72, desc: 'Candidate eyes drifted away from the primary compiler window repeatedly.', videoState: 'eye-shift' },
  { id: 'camera', label: 'Camera Off Detected', time: '01:45', timeSec: 105, desc: 'Webcam feed was disabled, frozen, or obstructed during runtime.', videoState: 'camera-off' },
  { id: 'tab', label: 'Switched Tabs', time: '01:41', timeSec: 101, desc: 'Candidate shifted browser window focus to read external resources.', videoState: 'switched-tabs' },
  { id: 'voice', label: 'Second voice', time: '03:00', timeSec: 180, desc: 'Multiple distinct voice tracks detected in the testing environment.', videoState: 'second-voice' },
  { id: 'assist', label: 'AI-Assist Detected', time: '03:32', timeSec: 212, desc: 'Copilot query inputs matched active workspace compiler hooks.', videoState: 'ai-assist' },
];

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

interface Testimonial {
  logo: string;
  quote: string;
  author: string;
  role: string;
  image: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    logo: 'InterviewOS Logo',
    quote: 'For Growth Associate hiring, our team spent countless hours on Round-1 screening interviews. InterviewOS helped us automate the initial evaluation process and quickly identify strong candidates.',
    author: 'Krishna Choudhary',
    role: 'Head of Growth',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    logo: 'InterviewOS Logo',
    quote: "We needed a Data Analyst fast, the team was already stretched thin, and running Round-1s manually was only making things slower. InterviewOS helped us do 10x the interviews at decent accuracy without anyone on the team having to sit through them. Saved us time when we really couldn't afford to lose any.",
    author: 'Devansh',
    role: 'Hiring Manager',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    logo: 'InterviewOS Logo',
    quote: 'With the volume of applications we receive for BDE roles, managing Round-1 interviews became extremely time-consuming. InterviewOS reduced repetitive screening effort and made the shortlisting process far more efficient.',
    author: 'Pratiksha',
    role: 'Talent Acquisition Specialist',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    logo: 'InterviewOS Logo',
    quote: 'Earlier, a large part of the HR team’s bandwidth went into scheduling and conducting Round-1 interviews. InterviewOS helped us save time, improve consistency, and speed up hiring by automating the round-1 interviews for all of our roles.',
    author: 'Bharat Bhartia',
    role: 'HR Head',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

const FEEDBACKS = [
  { name: 'Nikhil R', stars: 5, comment: 'The clarification given by the interviewer was to the point and precise.' },
  { name: 'Priyanka Reddy', stars: 5, comment: 'It felt more like a meaningful discussion than just a Q&A.' },
  { name: 'Devanshi K', stars: 5, comment: 'The way AI kept helping me led to me eventually solving the question.' },
  { name: 'Prachi A', stars: 5, comment: 'AI follow-ups were very relevant and it listened patiently without interrupting.' },
  { name: 'Debanshika D', stars: 4, comment: 'I appreciated how clear and structured the questions were. The AI followed up well.' },
  { name: 'Swapnil Pahari', stars: 5, comment: 'I have been giving a few AI interviews lately, and this one stands out as it doesn’t interrupt.' },
  { name: 'Ayushmann', stars: 5, comment: 'It feels like a real interview is happening. The interface is extremely fluid.' },
  { name: 'Uttam Thakur', stars: 4, comment: 'It is very helpful for the main interview preparation. It helped a lot with confidence.' },
  { name: 'B Barua', stars: 5, comment: 'Good experience overall, nothing confusing. The sandbox terminal ran perfectly.' },
  { name: 'Mallijayesh', stars: 4, comment: 'I liked that the questions dynamically adjusted based on my previous answers.' },
  { name: 'Juhi Soni', stars: 4, comment: 'It didn’t feel like an AI interview. Everything was so natural and fast.' },
  { name: 'Nabik', stars: 5, comment: 'Listened to my answers patiently and clarified my questions immediately.' },
  { name: 'Vinod S', stars: 5, comment: 'The AI asks relevant questions, and stayed on point without shifting context.' },
  { name: 'Nalinir', stars: 4, comment: 'The way the questions were framed and how the AI responded to my answers was good.' },
  { name: 'Saranya Adda', stars: 3, comment: 'I liked the structured flow of the interview and the focus on core computer science fundamentals.' }
];

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
  const [mounted, setMounted] = useState(false);

  // Check auth state
  useEffect(() => {
    setMounted(true);
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

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingCompany, setBookingCompany] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Hero interactive workspace mockup state
  const [activeHeroTab, setActiveHeroTab] = useState<'coding' | 'sales' | 'data' | 'product' | 'marketer'>('coding');
  const [isUnmuted, setIsUnmuted] = useState(false);
  const [editorText, setEditorText] = useState(`class Solution {
    int sumOfDigits(int n) {
        int sum = 0;
        if (n < 0) {
            n = -n;
        }
        while (n > 0) {
            sum += n % 10;
            n /= 10;
        }
        return sum;
    }
}`);
  const [editorFile, setEditorFile] = useState('Solution.java');
  const [compilerLogs, setCompilerLogs] = useState<string[]>(['Ready to execute. Press Compile & Run.']);
  const [isCompiling, setIsCompiling] = useState(false);

  // Anti-Cheating Simulator state
  const [selectedViolation, setSelectedViolation] = useState<Violation>(VIOLATIONS[2]); // Switched Tabs
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Evaluation Report states
  const [selectedQuestionId, setSelectedQuestionId] = useState<'q1' | 'q2' | 'q3'>('q1');

  // Try Interview Tab category filter
  const [activeTryTab, setActiveTryTab] = useState<'popular' | 'tech' | 'sales' | 'marketing' | 'product'>('popular');

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
    const roleToUse = selectedRole || ROLES.find(r => r.id === 'fullstack');
    if (!roleToUse) return;
    localStorage.setItem('interviewos_candidate_profile', JSON.stringify({
      ...profile,
      roleId: roleToUse.id,
      roleTitle: roleToUse.title,
    }));
    const nameToUse = profile.candidateName || 'Guest Candidate';
    router.push(`/instructions?name=${encodeURIComponent(nameToUse)}&track=${roleToUse.id}`);
  };

  const handleLaunchMVP = () => {
    router.push(`/apply/${selectedJob}`);
  };

  const handleConfigureTryout = (roleId: string, category: RoleCategory) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role) {
      setSelectedCategory(category);
      setSelectedRole(role);
      setActiveTab('tryout');
      const target = document.getElementById('command-center');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleBookDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) return;
    setBookingSuccess(true);
  };

  const updateProfile = (key: keyof ProfileData, val: string) =>
    setProfile(prev => ({ ...prev, [key]: val }));

  // Run mock code in editor
  const handleRunCode = () => {
    setIsCompiling(true);
    setCompilerLogs(prev => [...prev, '> Compiling code...']);
    setTimeout(() => {
      setCompilerLogs(prev => [
        ...prev,
        '> Executing Java compiler sandbox JVM...',
        '> Loading test inputs: [123, -456, 0]',
        '✓ Test Case 1: n = 123 | Output = 6 (Passed)',
        '✓ Test Case 2: n = -456 | Output = 15 (Passed)',
        '✓ Test Case 3: n = 0 | Output = 0 (Passed)',
        '✓ Build finished successfully. 3/3 test cases passed!'
      ]);
      setIsCompiling(false);
    }, 1200);
  };

  // Switch tab in mockup sandbox
  const handleHeroFileTab = (fileName: string, code: string) => {
    setEditorFile(fileName);
    setEditorText(code);
    setCompilerLogs([`Loaded file ${fileName}. Press Compile & Run to evaluate.`]);
  };

  // Radar chart data for Shubh Agarwal
  const radarData = [
    { subject: 'Thinking', A: 4.7, B: 3.5, fullMark: 5 },
    { subject: 'Language', A: 3.6, B: 3.8, fullMark: 5 },
    { subject: 'Clarity', A: 3.5, B: 4.0, fullMark: 5 },
    { subject: 'Fluency', A: 4.8, B: 3.6, fullMark: 5 },
    { subject: 'Overall', A: 3.7, B: 3.9, fullMark: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col relative transition-colors duration-500">
      
      {/* Background blurs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-[-5%] left-[-10%] w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] bg-emerald-600/5 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] left-[-5%] w-[900px] h-[900px] bg-indigo-600/5 blur-[160px] rounded-full mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 px-6 py-4 lg:px-12 flex items-center justify-between border-b border-white/5 bg-[#0a0a0c]/85 backdrop-blur-xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 border border-purple-500/20 rounded-xl flex items-center justify-center bg-purple-500/5 shadow-md">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white leading-none">InterviewOS</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">AI Platform</span>
          </div>
        </motion.div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-wider text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Product</a>
          <a href="#anti-cheating" className="hover:text-white transition-colors">Why InterviewOS?</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          <a href="#case-studies" className="hover:text-white transition-colors">Case Studies</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="hidden sm:inline-block px-4 py-2.5 bg-white hover:bg-slate-200 text-[#050508] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Book a Demo
          </button>
          {isAuthenticated ? (
            <Link href={userRole === 'founder' ? '/founder' : userRole === 'recruiter' ? '/recruiter' : '/candidate'} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20">
              Try AI Interview
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-16 pb-12 lg:px-12 text-center flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-white/5 border border-white/5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trained on 1 Lakh+ Interviews</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
            Never take an <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 font-medium">Interview</span> again <br />
            InterviewOS takes them for you.
          </h1>

          <p className="text-sm md:text-base font-medium text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Fully automated human-like AI Interviews. Automated assessments, interactive coding sandboxes, proctoring telemetry, and instant candidate grading reports.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="px-8 py-4 bg-white text-[#050508] hover:bg-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5"
            >
              Book a Demo
            </button>
            <a 
              href="#command-center"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Try AI Interview
            </a>
          </div>
        </motion.div>

        {/* Hero Interactive Switcher Tabs */}
        <div className="flex gap-2 p-1.5 bg-[#0a0a0c]/60 border border-white/5 rounded-2xl max-w-2xl mx-auto mt-16 w-full relative z-20">
          {(['coding', 'sales', 'data', 'product', 'marketer'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveHeroTab(tab);
                setIsUnmuted(false);
              }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeHeroTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'coding' && 'Coding'}
              {tab === 'sales' && 'Sales'}
              {tab === 'data' && 'Data Analyst'}
              {tab === 'product' && 'Product Manager'}
              {tab === 'marketer' && 'Marketer'}
            </button>
          ))}
        </div>

        {/* Workspace Mockup Viewport */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="w-full max-w-5xl aspect-[16/10] md:aspect-[16/9] rounded-[2.5rem] border border-white/5 bg-[#0a0a0c]/70 backdrop-blur-xl mt-6 p-4 shadow-2xl flex flex-col overflow-hidden relative group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />
          
          {/* Header tab buttons representing different mock modes */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              {activeHeroTab.toUpperCase()}_DEMO_WORKSPACE
            </div>
            <div className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-black uppercase text-emerald-400">
              Proctoring Active
            </div>
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden text-left">
            {activeHeroTab === 'coding' ? (
              // Coding Workspace Template
              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left side problem statement */}
                <div className="w-1/3 bg-[#050508]/60 border border-white/5 rounded-2xl p-5 font-sans space-y-3 overflow-y-auto hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Task 1</span>
                    <span className="text-[9px] text-slate-500 font-bold">Time Limit: 25m</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Word Search by Prefix & Suffix</h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Design a special dictionary that searches words by a prefix and a suffix. Implement `WordFilter(words)` and `filter(prefix, suffix)` to return the maximum matching index. Optimize performance to ensure \(O(L)\) query time.
                  </p>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] space-y-1">
                    <span className="font-bold text-slate-300 block">Example Case:</span>
                    <code className="text-slate-400 block font-mono">words = ["apple"], filter("a", "e") =&gt; Index 0</code>
                  </div>
                </div>

                {/* Middle: Code Editor */}
                <div className="flex-1 rounded-2xl bg-[#050508]/80 p-4 font-mono text-[10px] text-slate-400 flex flex-col justify-between border border-white/5 overflow-hidden">
                  <div className="space-y-1.5 overflow-y-auto flex-1 select-none">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2 shrink-0 text-[9px] text-slate-500">
                      <span className="text-purple-400">Solution.java</span>
                      <span>•</span>
                      <span>Java (OpenJDK 13.0.1)</span>
                    </div>
                    <div className="text-emerald-500">// Optimal prefix tree (Trie) based solution</div>
                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{editorText}</pre>
                  </div>
                  
                  {/* Console logs */}
                  <div className="bg-slate-950 border border-white/5 rounded-xl p-3 h-28 shrink-0 flex flex-col justify-between font-mono text-[9px] text-slate-400">
                    <div className="overflow-y-auto space-y-1">
                      {compilerLogs.map((log, idx) => (
                        <div key={idx} className={log.startsWith('✓') ? 'text-emerald-400' : log.startsWith('!') ? 'text-rose-400' : 'text-slate-500'}>
                          {log}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                      <span className="text-[8px] text-slate-600">Console Terminal Output</span>
                      <button 
                        onClick={handleRunCode}
                        disabled={isCompiling}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {isCompiling ? 'Running...' : 'Compile & Run'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Biometric meters */}
                <div className="w-44 flex flex-col gap-3 shrink-0 hidden lg:flex">
                  <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center space-y-1">
                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Voice Confidence</span>
                    <span className="text-lg font-black text-white">92%</span>
                  </div>
                  <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center space-y-1">
                    <Monitor className="w-5 h-5 text-purple-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Stress Tracking</span>
                    <span className="text-xs font-black text-purple-300">Focused / Stable</span>
                  </div>
                </div>
              </div>
            ) : (
              // Video/Audio Calling Mock Grid (Sales, Data, Product, Marketer)
              <div className="flex-1 flex gap-4 overflow-hidden relative">
                {/* Candidate Feed */}
                <div className="flex-1 bg-slate-950 border border-white/5 rounded-3xl overflow-hidden relative flex items-center justify-center">
                  {/* Mock video background image */}
                  <img 
                    src={activeHeroTab === 'sales'
                      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=450'
                      : activeHeroTab === 'data'
                      ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600&h=450'
                      : activeHeroTab === 'product'
                      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=450'
                      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=450'
                    }
                    alt="Candidate video feed stream"
                    className="w-full h-full object-cover opacity-70 filter grayscale-[20%]"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Candidate Video Stream
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-[#0a0a0c]/85 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Live Subtitles</p>
                    <p className="text-xs text-white leading-relaxed font-medium">
                      {activeHeroTab === 'sales' && '"For our B2B sales cycles, I focus on identifying high-intent outbound leads using customer intent data..."'}
                      {activeHeroTab === 'data' && '"I analyzed the temporal schema logs and discovered a bottleneck in our indexing pipeline..."'}
                      {activeHeroTab === 'product' && '"I believe product management requires a strong focus on bridging technical complexity and customer value..."'}
                      {activeHeroTab === 'marketer' && '"We optimized our CAC by leveraging search-intent loops and programmatic content pipelines..."'}
                    </p>
                  </div>
                </div>

                {/* AI Interviewer Feed */}
                <div className="w-1/3 bg-slate-950 border border-white/5 rounded-3xl overflow-hidden relative flex flex-col hidden md:flex">
                  <div className="flex-1 relative flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=300"
                      alt="AI Invigilator video feed stream"
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center animate-pulse">
                        <Bot className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">AI Interviewer</span>
                      <span className="text-[9px] text-slate-500 font-mono">Analyzing Audio & Tone</span>
                    </div>
                  </div>
                  <div className="bg-[#050508] border-t border-white/5 p-4 text-left space-y-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Question</span>
                    <p className="text-[11px] text-slate-300 font-medium">
                      {activeHeroTab === 'sales' && 'How would you qualify outbound target companies?'}
                      {activeHeroTab === 'data' && 'Can you explain the difference between a B-Tree and an LSM-Tree?'}
                      {activeHeroTab === 'product' && 'How do you prioritize features for a product in early beta?'}
                      {activeHeroTab === 'marketer' && 'What is your strategy for optimizing programmatic LCP content?'}
                    </p>
                  </div>
                </div>

                {/* Speaker indicator layer */}
                <AnimatePresence>
                  {!isUnmuted && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center z-30"
                    >
                      <button 
                        onClick={() => setIsUnmuted(true)}
                        className="px-6 py-4 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center gap-3 shadow-lg shadow-white/5 active:scale-95 transition-all"
                      >
                        <Volume2 className="w-4.5 h-4.5 text-black" />
                        Tap to unmute
                      </button>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Listen to AI dialogue logs</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Floating Badges */}
          <div className="absolute top-16 right-6 bg-[#0a0a0c]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[-4px] hidden md:flex">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Evaluation Score</span>
              <span className="text-sm font-black text-white">80/100</span>
            </div>
          </div>

          <div className="absolute bottom-24 left-6 bg-[#0a0a0c]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[4px] hidden md:flex">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Status</span>
              <span className="text-sm font-black text-white">Strong Candidate</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Trust partners Marquee */}
      <section className="relative z-10 border-y border-white/5 bg-[#0a0a0c] py-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            InterviewOS - A Name Trusted by <span className="text-purple-400">800+</span> hiring partners
          </span>
          {/* Logo ticker mockup */}
          <div className="w-full flex justify-center gap-12 flex-wrap opacity-40 grayscale filter hover:grayscale-0 hover:opacity-80 transition-all duration-300">
            {['Greenhouse', 'Ashby', 'BambooHR', 'PeopleStrong', 'Oracle Taleo', 'iCIMS', 'Workday', 'Bullhorn'].map((logo, idx) => (
              <span key={idx} className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Showcase */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Core Product Modules</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Everything you need to run interviews automatically, end-to-end
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Feature 1: Built on 3000+ Questions */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Question Pools</span>
              <h3 className="text-xl font-bold text-white">Built on 3000+ Industry Questions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Picked from our comprehensive pool or tailored to your specific developer requirements. Ready to use and fully customizable.
              </p>
            </div>
            
            {/* Interactive tag cards group */}
            <div className="relative h-44 mt-6 flex items-center justify-center overflow-hidden">
              <div className="absolute left-4 rotate-[-8deg] p-4 bg-white/5 border border-white/5 rounded-2xl w-48 shadow-lg shadow-black/40">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">DSA / Coding</span>
                <p className="text-[10px] font-black text-white mt-1">Java, Python, C++, SQL</p>
                <p className="text-[9px] text-purple-400 font-bold mt-0.5">1500+ questions</p>
              </div>
              <div className="absolute right-4 rotate-[8deg] p-4 bg-white/5 border border-white/5 rounded-2xl w-48 shadow-lg shadow-black/40 z-0">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sales Ops</span>
                <p className="text-[10px] font-black text-white mt-1">Objection handling</p>
                <p className="text-[9px] text-amber-400 font-bold mt-0.5">300+ questions</p>
              </div>
              <div className="absolute p-5 bg-[#0e0e12] border border-white/10 rounded-2xl w-52 shadow-2xl z-10 scale-105">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">System Architecture</span>
                <p className="text-[11px] font-black text-white mt-1">Root Cause Analysis</p>
                <p className="text-[9px] text-emerald-400 font-bold mt-0.5">500+ questions</p>
              </div>
            </div>
          </div>

          {/* Feature 2: 100% Anti-Cheating Simulator */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Neural Proctoring</span>
              <h3 className="text-xl font-bold text-white">100% Anti-Cheating</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We monitor browser focus states, eye shift patterns, voice presence anomalies, and keystroke injection signatures in real-time.
              </p>
            </div>

            {/* Anti-Cheating timeline logger preview */}
            <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 mt-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-950 border border-white/10 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
                    alt="Mock proctored user"
                    className="w-full h-full object-cover"
                  />
                  {selectedViolation.id && (
                    <div className="absolute inset-0 bg-rose-500/25 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">{selectedViolation.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{selectedViolation.time} / 03:41</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedViolation.desc}</p>
                </div>
              </div>

              {/* Slider Track */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 absolute top-0 left-0 transition-all duration-300"
                    style={{ width: `${(selectedViolation.timeSec / 221) * 100}%` }}
                  />
                </div>
                {/* Timeline violations logs grid */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {VIOLATIONS.slice(0, 4).map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedViolation(v)}
                      className={`py-1 text-[8px] font-bold uppercase tracking-wider rounded border text-center transition-all ${
                        selectedViolation.id === v.id
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Integrated Code Editor */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Compiler Sandbox</span>
              <h3 className="text-xl font-bold text-white">Integrated Code Editor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built-in compiler environment and interactive editor scratchpad to evaluate structural code efficiency, edge cases, and runtime complexity.
              </p>
            </div>

            {/* Code mockup */}
            <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 mt-6 text-left font-mono text-[9px] text-slate-400 space-y-1">
              <div className="text-emerald-500">// Evaluated Code Stream</div>
              <div><span className="text-purple-400">class</span> <span className="text-blue-400">Solution</span> &#123;</div>
              <div className="pl-4"><span className="text-blue-400">int</span> <span className="text-yellow-400">sumOfDigits</span>(<span className="text-blue-400">int</span> n) &#123;</div>
              <div className="pl-8"><span className="text-blue-400">int</span> sum = 0;</div>
              <div className="pl-8"><span className="text-purple-400">if</span> (n &lt; 0) &#123; n = -n; &#125;</div>
              <div className="pl-8"><span className="text-purple-400">while</span> (n &gt; 0) &#123;</div>
              <div className="pl-12">sum += n % 10;</div>
              <div className="pl-12">n /= 10;</div>
              <div className="pl-8">&#125;</div>
              <div className="pl-8"><span className="text-purple-400">return</span> sum;</div>
              <div className="pl-4">&#125;</div>
              <div>&#125;</div>
            </div>
          </div>

          {/* Feature 4: Feels Like a Real Interview */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Adaptive Dialogues</span>
              <h3 className="text-xl font-bold text-white">Feels Like a Real Interview</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive follow-ups, natural voice parsing, and real-time probing prompts structured to evaluate logic depth, not just memorized syntax.
              </p>
            </div>

            {/* Bubble Dialogue mockup */}
            <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 mt-6 text-left space-y-3 font-sans">
              <div className="space-y-1 max-w-[90%]">
                <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider">AI interviewer</span>
                <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-2xl rounded-tl-none text-[10px] text-slate-300 leading-relaxed">
                  "Can you tell me about one project you’re proud of and the tech stack you used?"
                </div>
              </div>
              <div className="space-y-1 max-w-[90%] ml-auto text-right">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Candidate response</span>
                <div className="p-3 bg-[#0a0a0c] border border-white/5 rounded-2xl rounded-tr-none text-[10px] text-slate-300 leading-relaxed text-left">
                  "Yeah sure, I’ve worked on a P2P food delivery system... I used the MERN stack with MongoDB, Express, React, and Node.js. For security, we implemented Firebase OAuth and deployed to AWS EC2."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Report Dashboard */}
      <section className="relative z-10 border-y border-white/5 bg-[#0a0a0c]/50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Grading Dashboard</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Detailed & Instance-backed Interview Evaluation
            </h2>
          </div>

          <div className="max-w-6xl mx-auto bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />

            {/* Left Side: Summary Card */}
            <div className="lg:col-span-4 bg-[#050508]/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-950 border border-white/10">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120"
                      alt="Shubh Agarwal candidate avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white">Shubh Agarwal</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Candidate Scorecard</p>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Background</strong>: IIT student who built a startup platform and worked on medical AI.
                </p>
              </div>

              {/* Custom SVG Gauge Chart */}
              <div className="flex flex-col items-center py-4 relative">
                <svg width="180" height="100" viewBox="0 0 180 90">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Outer track */}
                  <path 
                    d="M 10 90 A 80 80 0 0 1 170 90" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="16" 
                    strokeLinecap="round"
                  />
                  {/* Active fill (80% score = 144 degrees of arc) */}
                  <path 
                    d="M 10 90 A 80 80 0 0 1 170 90" 
                    fill="none" 
                    stroke="url(#gaugeGradient)" 
                    strokeWidth="16" 
                    strokeLinecap="round"
                    strokeDasharray={`${(80 / 100) * 251.2} 251.2`}
                  />
                  {/* Center arrow indicator pointing at 144 degrees */}
                  <g transform="translate(90, 90)">
                    <line 
                      x1="0" 
                      y1="0" 
                      x2="-55" 
                      y2="-20" 
                      stroke="#ffffff" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />
                    <circle cx="0" cy="0" r="6" fill="#ffffff" />
                  </g>
                </svg>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-white block">80/100</span>
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Final Score</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
                <strong>AI Assessment</strong>: "Strong maybe. Solid on DSA and theory, but indexing and temporal caching knowledge was a bit shaky. But was fairly good at communicating thoughts."
              </div>
            </div>

            {/* Right Side: Skill Breakdown & Interactive Grid */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Skill level summary list */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Skill Level Summary</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#050508]/60 border border-white/5 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-amber-400">Problem Solving</span>
                    <span className="text-xs font-bold text-white block">Decent</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Broke down the Indexing Problem well, but missed edge cases</p>
                  </div>
                  <div className="p-4 bg-[#050508]/60 border border-white/5 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-rose-400">Technical knowledge</span>
                    <span className="text-xs font-bold text-white block">Weak</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Shaky understanding of temporal cache invalidations and locks</p>
                  </div>
                  <div className="p-4 bg-[#050508]/60 border border-white/5 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-emerald-400">Code Quality</span>
                    <span className="text-xs font-bold text-white block">Good</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Code was mostly clean, could improve naming and structure</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Recharts Radar chart wrapper */}
                <div className="md:col-span-5 h-44 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl p-2">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" stroke="#8c95a6" fontSize={8} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} stroke="rgba(255,255,255,0.1)" />
                        <Radar name="Candidate" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                        <Radar name="Benchmark" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-[9px] text-slate-600 uppercase">Loading telemetry...</div>
                  )}
                </div>

                {/* Radar legend description */}
                <div className="md:col-span-7 text-left space-y-2">
                  <div className="flex gap-4 text-[9px] uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1.5 text-purple-400"><span className="w-2.5 h-2.5 bg-purple-600 rounded" /> Candidate</span>
                    <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Industry Benchmark</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    InterviewOS maps candidates across a 5-point competency dimension, overlaying their performance live against thousands of vetted developer benchmarks.
                  </p>
                </div>
              </div>

              {/* Questions table grid */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Question Breakdown logs</span>
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#050508]/40">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-[#050508]/80">
                        <th className="p-4">Question</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Time</th>
                        <th className="p-4">Notes Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        onClick={() => setSelectedQuestionId('q1')}
                        className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                          selectedQuestionId === 'q1' ? 'bg-purple-600/5 text-white' : 'text-slate-400'
                        }`}
                      >
                        <td className="p-4 font-bold">Q1. Binary Echo Determination</td>
                        <td className="p-4 text-purple-400 font-extrabold">5/5</td>
                        <td className="p-4 font-mono">27m</td>
                        <td className="p-4 text-[10px]">Explained the O(log n) division and bitwise checks perfectly...</td>
                      </tr>
                      <tr 
                        onClick={() => setSelectedQuestionId('q2')}
                        className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                          selectedQuestionId === 'q2' ? 'bg-purple-600/5 text-white' : 'text-slate-400'
                        }`}
                      >
                        <td className="p-4 font-bold">Q2. What is caching?</td>
                        <td className="p-4 text-amber-400 font-extrabold">3/5</td>
                        <td className="p-4 font-mono">5m</td>
                        <td className="p-4 text-[10px]">Got hits/misses right, but shaky on temporal invalidations...</td>
                      </tr>
                      <tr 
                        onClick={() => setSelectedQuestionId('q3')}
                        className={`cursor-pointer hover:bg-white/5 transition-colors ${
                          selectedQuestionId === 'q3' ? 'bg-purple-600/5 text-white' : 'text-slate-400'
                        }`}
                      >
                        <td className="p-4 font-bold">Q3. Indexing in RDBMS?</td>
                        <td className="p-4 text-emerald-400 font-extrabold">4/5</td>
                        <td className="p-4 font-mono">3m</td>
                        <td className="p-4 text-[10px]">Explained B-trees, leaf nodes, and write-performance trade-offs...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Try Interview Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 text-center space-y-12">
        <div className="space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Try Simulator</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            AI Interview tailored for every Role
          </h2>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex justify-center gap-2 flex-wrap max-w-xl mx-auto p-1 bg-white/5 border border-white/5 rounded-2xl">
          {(['popular', 'tech', 'sales', 'marketing', 'product'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTryTab(tab)}
              className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTryTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'popular' && 'Popular'}
              {tab === 'tech' && 'Tech/IT'}
              {tab === 'sales' && 'Sales'}
              {tab === 'marketing' && 'Marketing'}
              {tab === 'product' && 'Product'}
            </button>
          ))}
        </div>

        {/* Roles list based on filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Software Engineer card */}
          {activeTryTab === 'popular' || activeTryTab === 'tech' ? (
            <div className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">💻</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-400" /> 45m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Software Engineer 1</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Evaluate algorithms, array/tree traversal, system design constraints, and clean syntax structures.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">React</span>
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">Java</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('fullstack', 'software_engineering')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* BDE Sales card */}
          {activeTryTab === 'popular' || activeTryTab === 'sales' ? (
            <div className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🤝</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-400" /> 30m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">BDE (Sales)</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Tests objection handling, speech confidence levels, negotiation triggers, and sales flow pipelines.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">Cold Pitching</span>
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">CRM</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('sales_associate', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* Performance Marketer card */}
          {activeTryTab === 'popular' || activeTryTab === 'marketing' ? (
            <div className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">📈</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-400" /> 35m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Performance Marketer</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Evaluate user acquisition frameworks, ROAS statistics, search-intent algorithms, and budget allocation.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">ROAS</span>
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">SEO</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('performance_marketer', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* AI Engineer card */}
          {activeTryTab === 'tech' ? (
            <div className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🤖</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-400" /> 45m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">AI / ML Engineer</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Assess transformer architectures, pipeline training, vector database RAG structures, and prompt modeling.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">PyTorch</span>
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">Transformers</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('ai_ml_engineer', 'ai_ml')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* Product Manager card */}
          {activeTryTab === 'product' ? (
            <div className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-lg group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🗺️</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-400" /> 40m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Product Manager</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Assess roadmap prioritization frameworks, user metrics modeling, and customer feedback architectures.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">GIST</span>
                  <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-400 uppercase">Priorities</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('product_manager', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Anti-Cheating Marquee Banner */}
      <section className="relative z-10 bg-slate-950 py-8 border-y border-white/5 overflow-hidden">
        <div className="flex gap-8 items-center whitespace-nowrap animate-[marquee_25s_linear_infinite] opacity-60">
          {VIOLATIONS.map((v, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="font-extrabold uppercase">{v.label} Detected</span>
              <span className="text-slate-500">at {v.time}</span>
            </div>
          ))}
          {/* duplicate loop to prevent gaps */}
          {VIOLATIONS.map((v, idx) => (
            <div key={`dup-${idx}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="font-extrabold uppercase">{v.label} Detected</span>
              <span className="text-slate-500">at {v.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Timeline Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Efficiency Metrics</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Fewer steps. Faster decisions. Make hiring peaceful.
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0a0a0c]/60 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative">
          
          {/* Left panel: comparison timeline bars */}
          <div className="md:col-span-8 space-y-6 text-left">
            {/* WITHOUT INTERVIEWOS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>WITHOUT InterviewOS</span>
                <span className="text-slate-300 font-extrabold">29 DAYS</span>
              </div>
              <div className="w-full h-8 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden flex items-center px-4">
                <div className="h-full bg-rose-500/25 absolute top-0 left-0 w-full" />
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider relative z-10">
                  Shortlist → Screening Call → Round-1 → Follow-ups → Offer
                </span>
              </div>
            </div>

            {/* WITH INTERVIEWOS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                <span>WITH InterviewOS</span>
                <span className="text-purple-400 font-extrabold">14 Days</span>
              </div>
              <div className="w-full h-8 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden flex items-center px-4">
                <div className="h-full bg-purple-600/30 absolute top-0 left-0 w-[48%]" />
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider relative z-10">
                  Resume Parse + AI Round-1 Screening (1 Day) → Final Rounds
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: savings indicators */}
          <div className="md:col-span-4 bg-white/5 border border-white/5 rounded-3xl p-6 text-center space-y-4">
            <div>
              <span className="text-3xl font-black text-white block">9x</span>
              <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest block mt-0.5">Lesser Manpower</span>
            </div>
            <div className="border-t border-white/5 pt-4">
              <span className="text-3xl font-black text-purple-400 block">6x</span>
              <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest block mt-0.5">Cheaper Cost</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials ("What Hiring Teams Are Saying") */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">hiring partners feedback</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            What Hiring Teams Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between text-left hover:border-purple-500/20 transition-all duration-300">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-white/10">
                  <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{t.author}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 text-center">
        <div className="max-w-6xl mx-auto bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-3xl md:text-5xl font-black text-white block">20,000+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Interviews</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-purple-400 block">60%</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Cost Reduction</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-white block">80+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Scoring metrics</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-emerald-400 block">115+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Candidates Hired</span>
          </div>
        </div>
      </section>

      {/* ATS Integrations Section */}
      <section id="integrations" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">ATS Integrations</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Integrate Effortlessly with your Hiring Workflow
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0a0a0c]/40 border border-white/5 rounded-[2.5rem] p-8 lg:p-12 shadow-xl backdrop-blur-xl">
          
          {/* Left Grid: 3 ATS Logos */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {['Ashby', 'greyHR', 'Freshworks', 'Workable'].map(logo => (
              <div key={logo} className="h-16 bg-[#050508]/60 border border-white/5 rounded-2xl flex items-center justify-center text-xs font-black uppercase text-slate-500 hover:text-purple-400 hover:border-purple-500/30 transition-all select-none">
                {logo}
              </div>
            ))}
          </div>

          {/* Middle: Integration graphic */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-20 h-20 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5">
              <Shield className="w-10 h-10 text-purple-400" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="w-1 h-8 border-l border-dashed border-purple-500/40" />
              <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400">
                Data Sync
              </div>
              <span className="w-1 h-8 border-l border-dashed border-purple-500/40" />
            </div>
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase text-slate-400">
              Your ATS
            </div>
          </div>

          {/* Right Grid: 3 ATS Logos */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {['Greenhouse', 'Breezy HR', 'Keka', 'Bullhorn'].map(logo => (
              <div key={logo} className="h-16 bg-[#050508]/60 border border-white/5 rounded-2xl flex items-center justify-center text-xs font-black uppercase text-slate-500 hover:text-purple-400 hover:border-purple-500/30 transition-all select-none">
                {logo}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Candidate Feedback Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Candidate Experience</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Because Candidate Experience Matters
          </h2>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-lg font-black text-white">4.2</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(idx => (
                <Star key={idx} className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
              ))}
              <Star className="w-4.5 h-4.5 text-slate-600 fill-slate-800" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">18K Ratings</span>
          </div>
        </div>

        {/* Dynamic review feed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {FEEDBACKS.slice(0, 6).map((f, idx) => (
            <div key={idx} className="p-6 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl flex flex-col justify-between text-left h-40 hover:border-purple-500/20 transition-all duration-300">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">"{f.comment}"</p>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                <span className="text-xs font-black text-white">{f.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: f.stars }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="case-studies" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">proven success</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Stop wasting WEEKS on interviews
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Case Study 1 */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl text-left space-y-6 flex flex-col justify-between hover:border-purple-500/20 transition-all">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">17 Hires / Month</span>
              <h3 className="text-xl font-bold text-white leading-tight">
                How Newton School Saved 15 Hours/Week for Their Senior Sales Managers
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                By delegating early behavioral screening loops to InterviewOS AI, hiring managers skipped the scheduling bottlenecks, accelerating pipeline velocity.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 hover:underline cursor-pointer">
              Read Case Study <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Case Study 2 */}
          <div className="p-8 bg-[#0a0a0c]/60 border border-white/5 rounded-3xl text-left space-y-6 flex flex-col justify-between hover:border-purple-500/20 transition-all">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Hiring in 3 Hours</span>
              <h3 className="text-xl font-bold text-white leading-tight">
                How Newton School Hired a Data Analyst with InterviewOS's Super TA
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An immediate resume parse matched against database requirements triggered a mock assessment sandbox round, finishing evaluations within 180 minutes.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 hover:underline cursor-pointer">
              Read Case Study <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Command Center (Configurator Sandbox) */}
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
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {catMeta.label}
                    </button>
                  ))}
                </div>

                {/* Role selection chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(groupedRoles[selectedCategory] || []).map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                        selectedRole?.id === role.id
                          ? 'border-purple-500 shadow-lg shadow-purple-500/20 bg-[#0a0a0c]/60 shadow-lg'
                          : 'bg-[#050508]/40 border-white/5 hover:border-white/10 hover:bg-[#050508]/60 shadow-md'
                      }`}
                    >
                      <span className="text-xl">🛠️</span>
                      <div>
                        <p className="text-xs font-bold leading-tight text-white">{role.title}</p>
                        <p className="text-[9px] leading-relaxed text-slate-500 mt-1">{role.description.slice(0, 50)}…</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected role details card */}
                {selectedRole && (
                  <div className="p-5 rounded-2xl border border-purple-500/25 bg-[#050508]/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🛡️</span>
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
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all animate-pulse"
                >
                  Start Practice Interview Session
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* candidate tab */}
            {activeTab === 'candidate' && (
              <motion.div key="candidate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Candidate Portfolio Workspace</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">View stats, monitor daily activity streaks, download certificates, and check rankings</p>
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
                <Link href="/candidate" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 text-center">
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
                <Link href="/recruiter" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 text-center">
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
                          placeholder="Paste the requirements or role details here..."
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

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto w-full px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Questions</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { q: "What is InterviewOS?", a: "InterviewOS is an AI-powered technical and behavioral screening platform designed to run round-1 interviews automatically, evaluating coding, problem-solving, and communication skills." },
            { q: "How does InterviewOS evaluate candidates beyond just answers?", a: "We monitor execution efficiency in a real Cloud VM Sandbox, track stress metrics, voice confidence patterns, and flag proctor integrity violations (like eye shifts or tab switching)." },
            { q: "How quickly can we go from interview to decision?", a: "Evaluations are generated instantly. A full 16-point competency scorecard and detailed transcript logs are uploaded to your dashboard in less than 2 minutes." },
            { q: "Can we customize interviews and questions?", a: "Yes. Recruiter dashboard users can paste custom Job Descriptions and candidate Resumes to run dynamic, context-aware RAG interview sessions." },
            { q: "Does InterviewOS integrate with our ATS?", a: "Yes, we support effortless data sync hooks with Ashby, Greenhouse, BambooHR, greyHR, workdays, Zoho, Keka, Breezy, and major HR platforms." }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0a0a0c]/60 border border-white/5 rounded-2xl overflow-hidden text-left">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left"
              >
                <span className="text-sm font-bold text-white">{item.q}</span>
                <span className="text-slate-400">
                  {activeFaq === idx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section with Definition Card */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0c] px-6 py-16 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-purple-500/20 rounded-xl flex items-center justify-center bg-purple-500/5">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white">InterviewOS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              We are here to make technical evaluations peaceful, accurate, and secure. AI-driven behavioral proctoring and compilation sandboxes.
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Contact: support@interviewos.ai</p>
          </div>

          {/* Middle link columns */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8 text-xs font-semibold text-slate-400">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">Why InterviewOS?</span>
              <a href="#anti-cheating" className="hover:text-white block transition-colors">100% Anti-cheating</a>
              <a href="#features" className="hover:text-white block transition-colors">Evaluation Report</a>
              <a href="#integrations" className="hover:text-white block transition-colors">ATS Integrations</a>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">Proven Results</span>
              <a href="#case-studies" className="hover:text-white block transition-colors">Case Studies</a>
              <Link href="/leaderboard" className="hover:text-white block transition-colors">Leaderboard Rankings</Link>
              <Link href="/pricing" className="hover:text-white block transition-colors">Pricing Plans</Link>
            </div>
          </div>

          {/* Right Japanese origin Card */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-black text-white">InterviewOS - (雇用)</span>
              <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <span className="text-[9px] text-purple-400 font-black">OS</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">noun</p>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
              "1. a blend of 'skillful finesse' and 'employment' — symbolizing technical assessments carried out with precision, grace, and mastery."
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
          © 2026 InterviewOS Inc. All rights reserved.
        </div>
      </footer>

      {/* Book a Demo Modal */}
      <AnimatePresence>
        {isBookingOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]/90 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0c] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500" />
              
              <div className="flex justify-between items-start text-left">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Book a Demo Slot</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Schedule a walkthrough with our core engineering team</p>
                </div>
                <button 
                  onClick={() => {
                    setIsBookingOpen(false);
                    setBookingSuccess(false);
                    setBookingName('');
                    setBookingEmail('');
                    setBookingCompany('');
                  }} 
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-md font-bold text-white">Demo Booked Successfully!</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">We have sent a calendar invite and details to your email address: <span className="font-bold text-white">{bookingEmail}</span>.</p>
                </div>
              ) : (
                <form onSubmit={handleBookDemoSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={bookingName}
                      onChange={e => setBookingName(e.target.value)}
                      placeholder="Jane Doe" 
                      className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 placeholder-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Business Email</label>
                    <input 
                      type="email" 
                      required
                      value={bookingEmail}
                      onChange={e => setBookingEmail(e.target.value)}
                      placeholder="jane@company.com" 
                      className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 placeholder-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={bookingCompany}
                      onChange={e => setBookingCompany(e.target.value)}
                      placeholder="Acme Corp" 
                      className="w-full bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600 placeholder-slate-600"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all"
                  >
                    Confirm Booking
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
