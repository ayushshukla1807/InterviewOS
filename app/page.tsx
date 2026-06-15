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

interface QuestionDetails {
  id: string;
  title: string;
  score: string;
  time: string;
  notes: string;
  questionText: string;
  verbalResponse: string;
  candidateCode?: string;
  optimalCode?: string;
}

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  background: string;
  score: number;
  summary: string;
  skills: {
    problemSolving: { level: string; desc: string };
    technical: { level: string; desc: string };
    codeQuality: { level: string; desc: string };
  };
  radar: { subject: string; A: number; B: number; fullMark: number }[];
  questions: QuestionDetails[];
}

const CANDIDATES: Candidate[] = [
  {
    id: 'shubh',
    name: 'Shubh Agarwal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    background: 'IIT student who built a startup platform and worked on medical AI.',
    score: 80,
    summary: 'Strong maybe. Solid on DSA and theory, but indexing and temporal caching knowledge was a bit shaky. But was fairly good at communicating thoughts.',
    skills: {
      problemSolving: { level: 'Decent', desc: 'Broke down the Indexing Problem well, but missed edge cases.' },
      technical: { level: 'Weak', desc: 'Showed strong understanding of indexing, but lacked depth in caching concepts.' },
      codeQuality: { level: 'Good', desc: 'Code was mostly clean, could improve naming and structure.' }
    },
    radar: [
      { subject: 'Thinking', A: 4.7, B: 3.5, fullMark: 5 },
      { subject: 'Language', A: 3.6, B: 3.8, fullMark: 5 },
      { subject: 'Clarity', A: 3.5, B: 4.0, fullMark: 5 },
      { subject: 'Fluency', A: 4.8, B: 3.6, fullMark: 5 },
      { subject: 'Overall', A: 3.7, B: 3.9, fullMark: 5 },
    ],
    questions: [
      {
        id: 'q1',
        title: 'Q1. Binary Echo Determination',
        score: '5/5',
        time: '27 Min',
        notes: 'Explained the O(log n) division and bitwise checks perfectly...',
        questionText: 'Given a streams list, determine if the signal contains binary echo repetitions. Optimize to O(log N).',
        verbalResponse: 'I divided the stream search spaces logarithmically and applied bitwise XOR checks to spot repeating tracks. I also handled buffer boundaries.',
        candidateCode: `public int detectEcho(int[] stream) {\n    int low = 0, high = stream.length - 1;\n    while(low <= high) {\n        int mid = low + (high - low) / 2;\n        if(stream[mid] == (stream[mid] ^ 1)) return mid;\n        low = mid + 1;\n    }\n    return -1;\n}`,
        optimalCode: `public int detectEcho(int[] stream) {\n    int low = 0, high = stream.length - 1;\n    while(low < high) {\n        int mid = low + (high - low) / 2;\n        if (stream[mid] == stream[mid ^ 1]) {\n            low = mid + 1;\n        } else {\n            high = mid;\n        }\n    }\n    return low;\n}`
      },
      {
        id: 'q2',
        title: 'Q2. What is caching?',
        score: '3/5',
        time: '5 Min',
        notes: 'Got hits/misses and TTL right, but shaky on temporal invalidations...',
        questionText: 'Explain caching principles, hits, misses, TTL, and temporal data consistency.',
        verbalResponse: 'Caching keeps hot data closer to the client. I explained TTL expiration using weather updates, but I got confused about database cache-locks.',
      },
      {
        id: 'q3',
        title: 'Q3. Indexing in RDBMS?',
        score: '4/5',
        time: '3 Min',
        notes: 'Explained B-tree indexing, write-performance trade-offs...',
        questionText: 'Explain indexing in RDBMS, B-Tree nodes, and how it impacts read/write costs.',
        verbalResponse: 'I explained that index speeds up select queries using B-Tree lookup traversals but slows down insert/update queries because index trees must rebuild.',
      }
    ]
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
    background: "Stanford CS Master's with 3 years engineering at Stripe, AI research focus.",
    score: 96,
    summary: 'Strong Hire. Solved complex system design and edge cases with optimal complexity. Outstanding Distributed Consensus reasoning.',
    skills: {
      problemSolving: { level: 'Elite', desc: 'Solved complex system design and edge cases with optimal complexity.' },
      technical: { level: 'Strong', desc: 'In-depth understanding of distributed consensus, Raft, and database locks.' },
      codeQuality: { level: 'Excellent', desc: 'Flawless modular code style with complete test coverage.' }
    },
    radar: [
      { subject: 'Thinking', A: 5.0, B: 3.5, fullMark: 5 },
      { subject: 'Language', A: 4.8, B: 3.8, fullMark: 5 },
      { subject: 'Clarity', A: 4.7, B: 4.0, fullMark: 5 },
      { subject: 'Fluency', A: 4.9, B: 3.6, fullMark: 5 },
      { subject: 'Overall', A: 4.8, B: 3.9, fullMark: 5 },
    ],
    questions: [
      {
        id: 'q1',
        title: 'Q1. Consensus Commit Protocol',
        score: '5/5',
        time: '15 Min',
        notes: 'Implemented rollback transaction maps flawlessly with atomic commit states.',
        questionText: 'Implement a simplified consensus commit log rollback system with atomic states.',
        verbalResponse: 'I used a two-phase commit scheme with transactional state maps to roll back active nodes upon prepare failure.',
        candidateCode: `public void commitOrRollback(Transaction tx, List<Node> cluster) {\n    boolean prepareOk = cluster.stream().allMatch(n -> n.prepare(tx));\n    if (prepareOk) {\n        cluster.forEach(n -> n.commit(tx));\n    } else {\n        cluster.forEach(n -> n.abort(tx));\n    }\n}`,
        optimalCode: `public void commitOrRollback(Transaction tx, List<Node> cluster) {\n    boolean prepareOk = cluster.stream().allMatch(n -> n.prepare(tx));\n    if (prepareOk) {\n        cluster.forEach(n -> n.commit(tx));\n    } else {\n        cluster.forEach(n -> n.abort(tx));\n    }\n}`
      },
      {
        id: 'q2',
        title: 'Q2. JS Memory Leaks',
        score: '5/5',
        time: '8 Min',
        notes: 'Explained closures, detached DOM nodes, and V8 garbage collection hooks.',
        questionText: 'Explain typical causes of JS memory leaks in large single-page applications.',
        verbalResponse: 'I explained detached DOM elements, global state stores retaining variables, and event listeners that fail to clean up on component unmount.'
      },
      {
        id: 'q3',
        title: 'Q3. Lock-Free Ring Buffer',
        score: '4/5',
        time: '20 Min',
        notes: 'Good concurrent buffer write/read logic, but missed edge CPU spinlock checks.',
        questionText: 'Design a lock-free single-producer single-consumer ring buffer in Java.',
        verbalResponse: 'I implemented standard volatile read/write indices with atomic cache pad loops to prevent CPU cash conflicts.',
        candidateCode: `public class RingBuffer {\n    private final Object[] buffer = new Object[1024];\n    private volatile int head = 0;\n    private volatile int tail = 0;\n    public boolean write(Object obj) {\n        if (tail - head == 1024) return false;\n        buffer[tail % 1024] = obj;\n        tail++;\n        return true;\n    }\n}`,
        optimalCode: `public class RingBuffer {\n    private final Object[] buffer = new Object[1024];\n    private volatile long head = 0;\n    private volatile long tail = 0;\n    public boolean write(Object obj) {\n        if (tail - head == 1024) return false;\n        buffer[(int)(tail & 1023)] = obj;\n        tail++;\n        return true;\n    }\n}`
      }
    ]
  },
  {
    id: 'marcus',
    name: 'Marcus Brody',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
    background: 'Mid-level sales operations and CRM pipelines lead at Hubspot.',
    score: 72,
    summary: 'Candidate was good at pipeline qualification and speech metrics, but showed average performance in custom analytics workflows.',
    skills: {
      problemSolving: { level: 'Average', desc: 'Good pitch layout, but lacked structural qualification details.' },
      technical: { level: 'Fair', desc: 'Excellent CRM pipeline understanding but weak on API automation hooks.' },
      codeQuality: { level: 'N/A', desc: 'Role evaluated is Business Development. Coding not required.' }
    },
    radar: [
      { subject: 'Thinking', A: 3.2, B: 3.5, fullMark: 5 },
      { subject: 'Language', A: 4.5, B: 3.8, fullMark: 5 },
      { subject: 'Clarity', A: 4.1, B: 4.0, fullMark: 5 },
      { subject: 'Fluency', A: 4.4, B: 3.6, fullMark: 5 },
      { subject: 'Overall', A: 3.6, B: 3.9, fullMark: 5 },
    ],
    questions: [
      {
        id: 'q1',
        title: 'Q1. Outbound Intent Filtering',
        score: '4/5',
        time: '12 Min',
        notes: 'Good pipeline segment flow. Highlighted key intent triggers.',
        questionText: 'How do you filter high-intent target logos for custom B2B email sequences?',
        verbalResponse: 'I segment target logos using active job postings, technology stack detection, and funding rounds to define intent levels before launching outbound sequences.'
      },
      {
        id: 'q2',
        title: 'Q2. Handling Budget Objections',
        score: '3/5',
        time: '8 Min',
        notes: 'Lacked standard consultative discovery hooks when facing strict budget limits.',
        questionText: 'How do you handle budget objections during a consultative discovery call?',
        verbalResponse: 'I explain ROI value loops first and show how our tool cuts manpower costs, but I need to focus more on scoping candidate volume constraints.'
      },
      {
        id: 'q3',
        title: 'Q3. CRM Pipeline Sync',
        score: '4/5',
        time: '10 Min',
        notes: 'Solid explanation of triggers, but missed data conflict overrides.',
        questionText: 'Explain how you design CRM trigger updates between Ashby and Salesforce.',
        verbalResponse: 'I configure standard webhook callbacks when candidates hit screening states, updating contact fields and logging proctor transcripts.'
      }
    ]
  }
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
  const [showFaceMesh, setShowFaceMesh] = useState(true);

  // Evaluation Report States
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>(CANDIDATES[0]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('q1');

  // Interactive dialogue player state
  const [dialoguePlaying, setDialoguePlaying] = useState(false);
  const [dialogueStep, setDialogueStep] = useState(0);

  // Hiring scale savings slider state
  const [candidateVolume, setCandidateVolume] = useState(500);

  // Try Interview Tab category filter
  const [activeTryTab, setActiveTryTab] = useState<'popular' | 'tech' | 'sales' | 'marketing' | 'product'>('popular');

  // Product tour state
  const [activeTourTab, setActiveTourTab] = useState<string>('live-session');

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

  // Dialogue simulated player
  const triggerDialogueSimulation = () => {
    setDialoguePlaying(true);
    setDialogueStep(1);
    setTimeout(() => {
      setDialogueStep(2);
      setTimeout(() => {
        setDialoguePlaying(false);
      }, 3000);
    }, 2500);
  };

  // Candidate swap handler
  const handleCandidateSwap = (candId: string) => {
    const cand = CANDIDATES.find(c => c.id === candId);
    if (cand) {
      setSelectedCandidate(cand);
      setSelectedQuestionId('q1');
    }
  };

  const activeQuestionDetails = selectedCandidate.questions.find(q => q.id === selectedQuestionId) || selectedCandidate.questions[0];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-purple-500/20 overflow-x-hidden flex flex-col relative transition-colors duration-500">
      
      {/* Background blurs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-[-5%] left-[-10%] w-[800px] h-[800px] bg-purple-500/5 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/3 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-5%] w-[900px] h-[900px] bg-indigo-500/3 blur-[160px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 px-6 py-4 lg:px-12 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 border border-purple-500/20 rounded-xl flex items-center justify-center bg-purple-500/5 shadow-md">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 leading-none font-mono">InterviewOS</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">AI Platform</span>
          </div>
        </motion.div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-wider text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Product</a>
          <a href="#anti-cheating" className="hover:text-slate-900 transition-colors">Why InterviewOS?</a>
          <a href="#integrations" className="hover:text-slate-900 transition-colors">Integrations</a>
          <a href="#case-studies" className="hover:text-slate-900 transition-colors">Case Studies</a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="hidden sm:inline-block px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            Book a Demo
          </button>
          {isAuthenticated ? (
            <Link href={userRole === 'founder' ? '/founder' : userRole === 'recruiter' ? '/recruiter' : '/candidate'} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-slate-200/40 shadow-purple-600/20">
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-slate-100 border border-slate-200/80 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Trained on 1 Lakh+ Interviews</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.05] text-slate-900">
            Never take an <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-medium">Interview</span> again <br />
            <span className="font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 font-black px-1">InterviewOS</span> takes them for you.
          </h1>

          <p className="text-sm md:text-base font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Fully automated human-like AI Interviews. Automated assessments, interactive coding sandboxes, proctoring telemetry, and instant candidate grading reports.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="px-8 py-4 bg-white text-[#050508] hover:bg-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-slate-200/40 shadow-white/5"
            >
              Book a Demo
            </button>
            <a 
              href="#command-center"
              className="px-8 py-4 bg-slate-100/80 hover:bg-slate-100/80 text-slate-900 border border-slate-200/80 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Try AI Interview
            </a>
          </div>
        </motion.div>

        {/* Hero Interactive Switcher Tabs */}
        <div className="flex gap-2 p-1.5 bg-white/60 border border-slate-200/80 rounded-2xl max-w-2xl mx-auto mt-16 w-full relative z-20">
          {(['coding', 'sales', 'data', 'product', 'marketer'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveHeroTab(tab);
                setIsUnmuted(false);
              }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeHeroTab === tab
                  ? 'bg-purple-600 text-slate-900 shadow-md shadow-slate-200/40 shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
          className="w-full max-w-5xl aspect-[16/10] md:aspect-[16/9] rounded-[2.5rem] border border-slate-200/80 bg-white/70 backdrop-blur-xl mt-6 p-4 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden relative group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />
          
          {/* Header tab buttons representing different mock modes */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              {activeHeroTab.toUpperCase()}_DEMO_WORKSPACE
            </div>
            <div className="text-[9px] px-2 py-0.5 bg-emerald-50 border border-emerald-500/20 rounded font-black uppercase text-emerald-600">
              Proctoring Active
            </div>
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden text-left">
            {activeHeroTab === 'coding' ? (
              // Coding Workspace Template
              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left side problem statement */}
                <div className="w-1/3 bg-[#050508]/60 border border-slate-200/80 rounded-2xl p-5 font-sans space-y-3 overflow-y-auto hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-500/20 px-2 py-0.5 rounded">Task 1</span>
                    <span className="text-[9px] text-slate-500 font-bold">Time Limit: 25m</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Word Search by Prefix & Suffix</h4>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Design a special dictionary that searches words by a prefix and a suffix. Implement `WordFilter(words)` and `filter(prefix, suffix)` to return the maximum matching index. Optimize performance to ensure \(O(L)\) query time.
                  </p>
                  <div className="p-3 bg-slate-100/80 border border-slate-200/80 rounded-xl text-[10px] space-y-1">
                    <span className="font-bold text-slate-300 block">Example Case:</span>
                    <code className="text-slate-600 block font-mono">words = ["apple"], filter("a", "e") =&gt; Index 0</code>
                  </div>
                </div>

                {/* Middle: Code Editor */}
                <div className="flex-1 rounded-2xl bg-[#050508]/80 p-4 font-mono text-[10px] text-slate-600 flex flex-col justify-between border border-slate-200/80 overflow-hidden">
                  <div className="space-y-1.5 overflow-y-auto flex-1 select-none">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 mb-2 shrink-0 text-[9px] text-slate-500 font-bold">
                      <span className="text-purple-600">Solution.java</span>
                      <span>•</span>
                      <span>Java (OpenJDK 13.0.1)</span>
                    </div>
                    <div className="text-emerald-500">// Optimal prefix tree (Trie) based solution</div>
                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{editorText}</pre>
                  </div>
                  
                  {/* Console logs */}
                  <div className="bg-slate-100/50 border border-slate-200/80 rounded-xl p-3 h-28 shrink-0 flex flex-col justify-between font-mono text-[9px] text-slate-600">
                    <div className="overflow-y-auto space-y-1">
                      {compilerLogs.map((log, idx) => (
                        <div key={idx} className={log.startsWith('✓') ? 'text-emerald-600' : log.startsWith('!') ? 'text-rose-600' : 'text-slate-500'}>
                          {log}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 mt-1">
                      <span className="text-[8px] text-slate-600">Console Terminal Output</span>
                      <button 
                        onClick={handleRunCode}
                        disabled={isCompiling}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {isCompiling ? 'Running...' : 'Compile & Run'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Biometric meters */}
                <div className="w-44 flex flex-col gap-3 shrink-0 hidden lg:flex">
                  <div className="flex-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 p-4 flex flex-col justify-center items-center text-center space-y-1">
                    <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Voice Confidence</span>
                    <span className="text-lg font-black text-slate-900">92%</span>
                  </div>
                  <div className="flex-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 p-4 flex flex-col justify-center items-center text-center space-y-1">
                    <Monitor className="w-5 h-5 text-purple-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Stress Tracking</span>
                    <span className="text-xs font-black text-purple-300">Focused / Stable</span>
                  </div>
                </div>
              </div>
            ) : (
              // Video/Audio Calling Mock Grid (Sales, Data, Product, Marketer)
              <div className="flex-1 flex gap-4 overflow-hidden relative">
                {/* Candidate Feed */}
                <div className="flex-1 bg-slate-100/50 border border-slate-200/80 rounded-3xl overflow-hidden relative flex items-center justify-center">
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
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 text-[9px] font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Candidate Video Stream
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/85 border border-slate-200/80 rounded-2xl p-4 backdrop-blur-md">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Live Subtitles</p>
                    <p className="text-xs text-slate-900 leading-relaxed font-medium">
                      {activeHeroTab === 'sales' && '"For our B2B sales cycles, I focus on identifying high-intent outbound leads using customer intent data..."'}
                      {activeHeroTab === 'data' && '"I analyzed the temporal schema logs and discovered a bottleneck in our indexing pipeline..."'}
                      {activeHeroTab === 'product' && '"I believe product management requires a strong focus on bridging technical complexity and customer value..."'}
                      {activeHeroTab === 'marketer' && '"We optimized our CAC by leveraging search-intent loops and programmatic content pipelines..."'}
                    </p>
                  </div>
                </div>

                {/* AI Interviewer Feed */}
                <div className="w-1/3 bg-slate-100/50 border border-slate-200/80 rounded-3xl overflow-hidden relative flex flex-col hidden md:flex">
                  <div className="flex-1 relative flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=300"
                      alt="AI Invigilator video feed stream"
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-500/20 flex items-center justify-center animate-pulse">
                        <Bot className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">AI Interviewer</span>
                      <span className="text-[9px] text-slate-500 font-mono">Analyzing Audio & Tone</span>
                    </div>
                  </div>
                  <div className="bg-[#050508] border-t border-slate-200/80 p-4 text-left space-y-2">
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
                        className="px-6 py-4 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center gap-3 shadow-md shadow-slate-200/40 shadow-white/5 active:scale-95 transition-all"
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
          <div className="absolute top-16 right-6 bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[-4px] hidden md:flex">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-600 uppercase">Evaluation Score</span>
              <span className="text-sm font-black text-slate-900">80/100</span>
            </div>
          </div>

          <div className="absolute bottom-24 left-6 bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3 transition-transform group-hover:translate-y-[4px] hidden md:flex">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-500/20 flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-purple-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black tracking-widest text-slate-600 uppercase">Status</span>
              <span className="text-sm font-black text-slate-900">Strong Candidate</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Trust partners Marquee */}
      <section className="relative z-10 border-y border-slate-200/80 bg-white py-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            InterviewOS - A Name Trusted by <span className="text-purple-600">800+</span> hiring partners
          </span>
          {/* Logo ticker mockup */}
          <div className="w-full flex justify-center gap-12 flex-wrap opacity-40 grayscale filter hover:grayscale-0 hover:opacity-80 transition-all duration-300">
            {['Greenhouse', 'Ashby', 'BambooHR', 'PeopleStrong', 'Oracle Taleo', 'iCIMS', 'Workday', 'Bullhorn'].map((logo, idx) => (
              <span key={idx} className="text-sm font-extrabold text-slate-600 uppercase tracking-widest">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Showcase */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Core Product Modules</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Everything you need to run interviews automatically, end-to-end
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Feature 1: Built on 3000+ Questions */}
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-500/20 px-2 py-0.5 rounded">Question Pools</span>
              <h3 className="text-xl font-bold text-slate-900">Built on 3000+ Industry Questions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Picked from our comprehensive pool or tailored to your specific developer requirements. Ready to use and fully customizable.
              </p>
            </div>
            
            {/* Interactive tag cards group */}
            <div className="relative h-44 mt-6 flex items-center justify-center overflow-hidden">
              <div className="absolute left-4 rotate-[-8deg] p-4 bg-slate-100/80 border border-slate-200/80 rounded-2xl w-48 shadow-md shadow-slate-200/40 shadow-black/40">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">DSA / Coding</span>
                <p className="text-[10px] font-black text-slate-900 mt-1">Java, Python, C++, SQL</p>
                <p className="text-[9px] text-purple-600 font-bold mt-0.5">1500+ questions</p>
              </div>
              <div className="absolute right-4 rotate-[8deg] p-4 bg-slate-100/80 border border-slate-200/80 rounded-2xl w-48 shadow-md shadow-slate-200/40 shadow-black/40 z-0">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sales Ops</span>
                <p className="text-[10px] font-black text-slate-900 mt-1">Objection handling</p>
                <p className="text-[9px] text-amber-600 font-bold mt-0.5">300+ questions</p>
              </div>
              <div className="absolute p-5 bg-[#0e0e12] border border-slate-200/80 rounded-2xl w-52 shadow-xl shadow-slate-200/50 z-10 scale-105">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">System Architecture</span>
                <p className="text-[11px] font-black text-slate-900 mt-1">Root Cause Analysis</p>
                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">500+ questions</p>
              </div>
            </div>
          </div>

          {/* Feature 2: 100% Anti-Cheating Simulator with Face Mesh */}
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-500/20 px-2 py-0.5 rounded">Neural Proctoring</span>
                <button 
                  onClick={() => setShowFaceMesh(!showFaceMesh)}
                  className="text-[8px] font-black uppercase text-purple-600 hover:text-purple-300 tracking-wider flex items-center gap-1"
                >
                  <Cpu className="w-3 h-3" /> {showFaceMesh ? 'Hide Face Mesh' : 'Show Face Mesh'}
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900">100% Anti-Cheating</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We monitor browser focus states, eye shift patterns, voice presence anomalies, and keystroke injection signatures in real-time.
              </p>
            </div>

            {/* Anti-Cheating timeline logger preview with SVG landmarks */}
            <div className="bg-[#050508] border border-slate-200/80 rounded-2xl p-4 mt-6 space-y-4 text-left relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100/50 border border-slate-200/80 relative shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
                    alt="Mock proctored user"
                    className="w-full h-full object-cover"
                  />
                  {/* Face Mesh SVG Overlay */}
                  {showFaceMesh && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      {/* Bounding box */}
                      <rect x="20" y="15" width="60" height="70" fill="none" stroke={selectedViolation.id ? '#f43f5e' : '#10b981'} strokeWidth="1" strokeDasharray="2 2" />
                      
                      {/* Connection mesh lines */}
                      <path d="M50,20 L35,40 L40,65 L50,80 L60,65 L65,40 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                      <line x1="35" y1="40" x2="65" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                      <line x1="40" y1="65" x2="60" y2="65" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                      
                      {/* Eye dots (shifts left on eye shift violation) */}
                      <circle cx={selectedViolation.videoState === 'eye-shift' ? 33 : 38} cy="38" r="2" fill={selectedViolation.id ? '#f43f5e' : '#10b981'} />
                      <circle cx={selectedViolation.videoState === 'eye-shift' ? 57 : 62} cy="38" r="2" fill={selectedViolation.id ? '#f43f5e' : '#10b981'} />
                      
                      {/* Mouth dot */}
                      <circle cx="50" cy="68" r="3" fill="none" stroke={selectedViolation.id ? '#f43f5e' : '#10b981'} strokeWidth="1" />
                    </svg>
                  )}
                  {selectedViolation.videoState === 'camera-off' && (
                    <div className="absolute inset-0 bg-slate-100/50 flex flex-col items-center justify-center text-center p-1 space-y-1">
                      <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                      <span className="text-[6px] font-black uppercase text-rose-500 tracking-wider">Feed Blocked</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">{selectedViolation.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{selectedViolation.time} / 03:41</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{selectedViolation.desc}</p>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-1.5 flex gap-2">
                    <span className="text-emerald-600">FPS: 60.0</span>
                    <span className={selectedViolation.id ? 'text-rose-600' : 'text-slate-500'}>
                      Gaze: {selectedViolation.videoState === 'eye-shift' ? 'DEVIATING' : 'FOCUSED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider Track */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-slate-100/80 rounded-full relative overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 absolute top-0 left-0 transition-all duration-300"
                    style={{ width: `${(selectedViolation.timeSec / 221) * 100}%` }}
                  />
                </div>
                {/* Timeline violations logs grid */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {VIOLATIONS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedViolation(v)}
                      className={`py-1 text-[8px] font-bold uppercase tracking-wider rounded border text-center transition-all ${
                        selectedViolation.id === v.id
                          ? 'bg-rose-50 border-rose-500/30 text-rose-600'
                          : 'bg-slate-100/80 border-slate-200/80 text-slate-500 hover:text-slate-900'
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
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-500/20 px-2 py-0.5 rounded">Compiler Sandbox</span>
              <h3 className="text-xl font-bold text-slate-900">Integrated Code Editor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built-in compiler environment and interactive editor scratchpad to evaluate structural code efficiency, edge cases, and runtime complexity.
              </p>
            </div>

            {/* Code mockup */}
            <div className="bg-[#050508] border border-slate-200/80 rounded-2xl p-4 mt-6 text-left font-mono text-[9px] text-slate-600 space-y-1">
              <div className="text-emerald-500">// Evaluated Code Stream</div>
              <div><span className="text-purple-600">class</span> <span className="text-blue-400">Solution</span> &#123;</div>
              <div className="pl-4"><span className="text-blue-400">int</span> <span className="text-yellow-400">sumOfDigits</span>(<span className="text-blue-400">int</span> n) &#123;</div>
              <div className="pl-8"><span className="text-blue-400">int</span> sum = 0;</div>
              <div className="pl-8"><span className="text-purple-600">if</span> (n &lt; 0) &#123; n = -n; &#125;</div>
              <div className="pl-8"><span className="text-purple-600">while</span> (n &gt; 0) &#123;</div>
              <div className="pl-12">sum += n % 10;</div>
              <div className="pl-12">n /= 10;</div>
              <div className="pl-8">&#125;</div>
              <div className="pl-8"><span className="text-purple-600">return</span> sum;</div>
              <div className="pl-4">&#125;</div>
              <div>&#125;</div>
            </div>
          </div>

          {/* Feature 4: Feels Like a Real Interview with Dialogue Player */}
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 shadow-xl min-h-[400px]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-500/20 px-2 py-0.5 rounded">Adaptive Dialogues</span>
                <button 
                  onClick={triggerDialogueSimulation}
                  disabled={dialoguePlaying}
                  className="text-[8px] font-black uppercase text-purple-600 hover:text-purple-300 tracking-wider flex items-center gap-1 disabled:opacity-50"
                >
                  <Play className="w-2.5 h-2.5" /> Play Dialogue Demo
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Feels Like a Real Interview</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adaptive follow-ups, natural voice parsing, and real-time probing prompts structured to evaluate logic depth, not just memorized syntax.
              </p>
            </div>

            {/* Bubble Dialogue mockup with voice waves */}
            <div className="bg-[#050508] border border-slate-200/80 rounded-2xl p-4 mt-6 text-left space-y-3 font-sans relative">
              <div className="space-y-1 max-w-[90%]">
                <span className="text-[8px] font-black text-purple-600 uppercase tracking-wider">AI interviewer</span>
                <div className="p-3 bg-purple-50 border border-purple-500/20 rounded-2xl rounded-tl-none text-[10px] text-slate-200 leading-relaxed">
                  "Can you tell me about one project you’re proud of and the tech stack you used?"
                </div>
              </div>
              
              <div className={`space-y-1 max-w-[90%] ml-auto text-right transition-opacity duration-500 ${
                dialogueStep >= 1 ? 'opacity-100' : 'opacity-30'
              }`}>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Candidate response</span>
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl rounded-tr-none text-[10px] text-slate-200 leading-relaxed text-left">
                  {dialogueStep >= 2 
                    ? '"Yeah sure, I’ve worked on a P2P food delivery system... MERN stack, MongoDB, React, Node..."' 
                    : '"Thinking... evaluating project archives..."'}
                </div>
              </div>

              {/* Glowing voice waves */}
              {dialoguePlaying && (
                <div className="absolute top-4 right-4 flex gap-1 items-end h-6 z-20 bg-white px-3 py-1 border border-slate-200/80 rounded-full">
                  {[1, 2, 3, 4, 5, 6].map(bar => (
                    <span 
                      key={bar} 
                      className="w-1 bg-purple-500 rounded-full animate-pulse" 
                      style={{ 
                        height: `${Math.floor(Math.random() * 16) + 4}px`, 
                        animationDelay: `${bar * 100}ms` 
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Tour / Interface Showcase with Pictures */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Platform Walkthrough</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            InterviewOS in Action: Product Tour
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mx-auto">
            Explore the comprehensive candidate interfaces, recruiter analytics portals, and secure testing environments that drive automated hiring.
          </p>
        </div>

        {/* Interactive Tabbed Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-center">
          {/* Left Column: Interactive Feature List (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            {[
              {
                id: 'live-session',
                title: 'Secure Candidate Coding & Voice Session',
                desc: 'Live browser terminal sandbox with stack execution compiler, face mesh gaze tracking, and real-time voice response dialogues.',
                image: '/images/session_feature.png',
                tag: 'Candidate Environment'
              },
              {
                id: 'grading-report',
                title: 'Advanced AI Grading & Evaluation Trace',
                desc: 'Recruiter intelligence portal with circular score gauges, competency radar charts, question checkmarks, and side-by-side code diff audits.',
                image: '/images/dashboard_feature.png',
                tag: 'Evaluation Analytics'
              },
              {
                id: 'permissions-check',
                title: 'Pre-Interview Integrity Permissions Verification',
                desc: 'Mandatory automated diagnostic checking for camera feed, microphone levels, browser focus, and screen-sharing authorization.',
                image: '/images/permissions_feature.png',
                tag: 'Neural Proctoring Config'
              },
              {
                id: 'platform-overview',
                title: 'Gamified Candidate Hub & Streaks Leaderboard',
                desc: 'Gamification tracking showcasing student profiles, levels, XP accumulation, daily streaks, custom achievement badges, and global rank.',
                image: '/images/platform_collage.png',
                tag: 'Full Platform Ecosystem'
              }
            ].map((feat) => (
              <button
                key={feat.id}
                onClick={() => setActiveTourTab(feat.id)}
                className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                  activeTourTab === feat.id
                    ? 'bg-purple-50 border-purple-500/30 shadow-md shadow-slate-200/40 shadow-purple-900/5'
                    : 'bg-white border-slate-200/80 hover:border-slate-200/80 hover:bg-white/[0.02]'
                }`}
              >
                {activeTourTab === feat.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                )}
                <span className="text-[8px] font-black uppercase tracking-wider text-purple-600 block mb-1">
                  {feat.tag}
                </span>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-300 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  {feat.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Right Column: Visual Interface Frame (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl shadow-sm p-4 md:p-6 shadow-xl shadow-slate-200/50 relative group overflow-hidden flex flex-col justify-center min-h-[400px]">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-50 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Frame navigation header mockup */}
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3 mb-4 text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div className="px-3 py-0.5 bg-slate-100/80 rounded-md text-[9px] border border-slate-200/80">
                {activeTourTab === 'live-session' && 'interviewos.com/session/LIVE-9291'}
                {activeTourTab === 'grading-report' && 'interviewos.com/recruiter/report/shubh_agarwal'}
                {activeTourTab === 'permissions-check' && 'interviewos.com/instructions?name=Shubh'}
                {activeTourTab === 'platform-overview' && 'interviewos.com/candidate/dashboard'}
              </div>
              <div className="w-12" />
            </div>

            {/* Main Image Viewport */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100/50 flex items-center justify-center group-hover:border-purple-500/20 transition-all duration-300">
              {[
                { id: 'live-session', image: '/images/session_feature.png' },
                { id: 'grading-report', image: '/images/dashboard_feature.png' },
                { id: 'permissions-check', image: '/images/permissions_feature.png' },
                { id: 'platform-overview', image: '/images/platform_collage.png' }
              ].map((item) => (
                <img
                  key={item.id}
                  src={item.image}
                  alt={item.id}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    activeTourTab === item.id ? 'opacity-100 z-10 font-sans' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Report Dashboard with Candidate Switcher & Code Diff */}
      <section className="relative z-10 border-y border-slate-200/80 bg-white/40 py-20 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Grading Dashboard</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Detailed & Instance-backed Interview Evaluation
            </h2>
          </div>

          {/* Candidate Profile selector pills */}
          <div className="flex justify-center gap-3 max-w-lg mx-auto">
            {CANDIDATES.map(c => (
              <button
                key={c.id}
                onClick={() => handleCandidateSwap(c.id)}
                className={`flex items-center gap-2 px-4 py-2 bg-slate-100/80 border rounded-2xl transition-all ${
                  selectedCandidate.id === c.id 
                    ? 'border-purple-500 bg-purple-600/5 text-slate-900 shadow-md shadow-slate-200/40 shadow-purple-500/10' 
                    : 'border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-200/80">
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />

            {/* Left Side: Summary Card */}
            <div className="lg:col-span-4 bg-[#050508]/60 border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100/50 border border-slate-200/80">
                    <img 
                      src={selectedCandidate.avatar}
                      alt={selectedCandidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-900">{selectedCandidate.name}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Candidate Scorecard</p>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  <strong>Background</strong>: {selectedCandidate.background}
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
                    stroke="rgba(0,0,0,0.06)" 
                    strokeWidth="16" 
                    strokeLinecap="round"
                  />
                  {/* Active fill based on score */}
                  <path 
                    d="M 10 90 A 80 80 0 0 1 170 90" 
                    fill="none" 
                    stroke="url(#gaugeGradient)" 
                    strokeWidth="16" 
                    strokeLinecap="round"
                    strokeDasharray={`${(selectedCandidate.score / 100) * 251.2} 251.2`}
                  />
                  {/* Center arrow indicator pointing at score */}
                  <g transform="translate(90, 90)">
                    <line 
                      x1="0" 
                      y1="0" 
                      x2={selectedCandidate.score >= 90 ? "-45" : selectedCandidate.score >= 80 ? "-55" : "-58"} 
                      y2={selectedCandidate.score >= 90 ? "-45" : selectedCandidate.score >= 80 ? "-20" : "15"} 
                      stroke="#ffffff" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />
                    <circle cx="0" cy="0" r="6" fill="#ffffff" />
                  </g>
                </svg>
                <div className="text-center mt-2">
                  <span className="text-2xl font-black text-slate-900 block">{selectedCandidate.score}/100</span>
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Final Score</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[10px] text-slate-600 leading-relaxed">
                <strong>AI Assessment</strong>: "{selectedCandidate.summary}"
              </div>
            </div>

            {/* Right Side: Skill Breakdown & Interactive Grid */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Skill level summary list */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Skill Level Summary</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#050508]/60 border border-slate-200/80 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-amber-600">Problem Solving</span>
                    <span className="text-xs font-bold text-slate-900 block">{selectedCandidate.skills.problemSolving.level}</span>
                    <p className="text-[10px] text-slate-600 leading-normal">{selectedCandidate.skills.problemSolving.desc}</p>
                  </div>
                  <div className="p-4 bg-[#050508]/60 border border-slate-200/80 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-rose-600">Technical knowledge</span>
                    <span className="text-xs font-bold text-slate-900 block">{selectedCandidate.skills.technical.level}</span>
                    <p className="text-[10px] text-slate-600 leading-normal">{selectedCandidate.skills.technical.desc}</p>
                  </div>
                  <div className="p-4 bg-[#050508]/60 border border-slate-200/80 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-black uppercase text-emerald-600">Code Quality</span>
                    <span className="text-xs font-bold text-slate-900 block">{selectedCandidate.skills.codeQuality.level}</span>
                    <p className="text-[10px] text-slate-600 leading-normal">{selectedCandidate.skills.codeQuality.desc}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Recharts Radar chart wrapper */}
                <div className="md:col-span-5 h-44 flex items-center justify-center bg-slate-100/80 border border-slate-200/80 rounded-2xl p-2">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedCandidate.radar}>
                        <PolarGrid stroke="rgba(0,0,0,0.06)" />
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
                    <span className="flex items-center gap-1.5 text-purple-600"><span className="w-2.5 h-2.5 bg-purple-600 rounded" /> Candidate</span>
                    <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Industry Benchmark</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    InterviewOS maps candidates across a 5-point competency dimension, overlaying their performance live against thousands of vetted developer benchmarks.
                  </p>
                </div>
              </div>

              {/* Questions table grid */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Question Breakdown logs</span>
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-[#050508]/40">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-[#050508]/80">
                        <th className="p-4">Question</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Time</th>
                        <th className="p-4">Notes Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCandidate.questions.map(q => (
                        <tr 
                          key={q.id}
                          onClick={() => setSelectedQuestionId(q.id)}
                          className={`border-b border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors ${
                            selectedQuestionId === q.id ? 'bg-purple-600/5 text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          <td className="p-4 font-bold">{q.title}</td>
                          <td className="p-4 text-purple-600 font-extrabold">{q.score}</td>
                          <td className="p-4 font-mono">{q.time}</td>
                          <td className="p-4 text-[10px] truncate max-w-[200px]">{q.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Code Diff & Transcript panel */}
              {activeQuestionDetails && (
                <div className="p-5 bg-[#050508] border border-slate-200/80 rounded-3xl space-y-4 text-left font-sans">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AI Transcript & Evaluation Trace</span>
                    <h4 className="text-xs font-black text-slate-900 mt-1">{activeQuestionDetails.title}</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed mt-1"><strong>Prompt</strong>: {activeQuestionDetails.questionText}</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed mt-1"><strong>Candidate response</strong>: "{activeQuestionDetails.verbalResponse}"</p>
                  </div>

                  {activeQuestionDetails.candidateCode && activeQuestionDetails.optimalCode && (
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Code comparison (Candidate vs Optimal)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[8px] overflow-x-auto">
                        {/* Candidate solution */}
                        <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl space-y-1">
                          <span className="text-rose-600 uppercase font-black text-[7px] block border-b border-red-500/10 pb-1 mb-1">Candidate solution</span>
                          <pre className="text-red-400 leading-normal">{activeQuestionDetails.candidateCode}</pre>
                        </div>
                        {/* Optimal solution */}
                        <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-1">
                          <span className="text-emerald-600 uppercase font-black text-[7px] block border-b border-emerald-500/10 pb-1 mb-1">Optimal solution</span>
                          <pre className="text-emerald-400 leading-normal">{activeQuestionDetails.optimalCode}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Try Interview Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 text-center space-y-12">
        <div className="space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Try Simulator</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            AI Interview tailored for every Role
          </h2>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex justify-center gap-2 flex-wrap max-w-xl mx-auto p-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl">
          {(['popular', 'tech', 'sales', 'marketing', 'product'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTryTab(tab)}
              className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTryTab === tab
                  ? 'bg-purple-600 text-slate-900 shadow-md shadow-slate-200/40 shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900'
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
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-md shadow-slate-200/40 group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">💻</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-600" /> 45m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Software Engineer 1</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Evaluate algorithms, array/tree traversal, system design constraints, and clean syntax structures.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/80">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">React</span>
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">Java</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('fullstack', 'software_engineering')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* BDE Sales card */}
          {activeTryTab === 'popular' || activeTryTab === 'sales' ? (
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-md shadow-slate-200/40 group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🤝</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-600" /> 30m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">BDE (Sales)</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Tests objection handling, speech confidence levels, negotiation triggers, and sales flow pipelines.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/80">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">Cold Pitching</span>
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">CRM</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('sales_associate', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* Performance Marketer card */}
          {activeTryTab === 'popular' || activeTryTab === 'marketing' ? (
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-md shadow-slate-200/40 group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">📈</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-600" /> 35m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Performance Marketer</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Evaluate user acquisition frameworks, ROAS statistics, search-intent algorithms, and budget allocation.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/80">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">ROAS</span>
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">SEO</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('performance_marketer', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* AI Engineer card */}
          {activeTryTab === 'tech' ? (
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-md shadow-slate-200/40 group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🤖</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-600" /> 45m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">AI / ML Engineer</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Assess transformer architectures, pipeline training, vector database RAG structures, and prompt modeling.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/80">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">PyTorch</span>
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">Transformers</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('ai_ml_engineer', 'ai_ml')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}

          {/* Product Manager card */}
          {activeTryTab === 'product' ? (
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 shadow-md shadow-slate-200/40 group text-left h-60">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🗺️</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-purple-600" /> 40m Simulation
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Product Manager</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    Assess roadmap prioritization frameworks, user metrics modeling, and customer feedback architectures.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/80">
                <div className="flex gap-1">
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">GIST</span>
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100/80 rounded text-slate-600 uppercase">Priorities</span>
                </div>
                <button 
                  onClick={() => handleConfigureTryout('product_manager', 'management_qa')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Try Interview now
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Anti-Cheating Marquee Banner */}
      <section className="relative z-10 bg-slate-100/50 py-8 border-y border-slate-200/80 overflow-hidden">
        <div className="flex gap-8 items-center whitespace-nowrap animate-[marquee_25s_linear_infinite] opacity-60">
          {VIOLATIONS.map((v, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-[10px] text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-extrabold uppercase">{v.label} Detected</span>
              <span className="text-slate-500">at {v.time}</span>
            </div>
          ))}
          {/* duplicate loop to prevent gaps */}
          {VIOLATIONS.map((v, idx) => (
            <div key={`dup-${idx}`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-[10px] text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-extrabold uppercase">{v.label} Detected</span>
              <span className="text-slate-500">at {v.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Savings Slider Comparison Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-16">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Efficiency Calculator</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Fewer steps. Faster decisions. Make hiring peaceful.
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm p-8 md:p-12 shadow-xl shadow-slate-200/50 relative">
          
          {/* Left panel: comparison timeline bars */}
          <div className="md:col-span-7 space-y-6 text-left">
            {/* Volume scale slider */}
            <div className="p-4 bg-slate-100/80 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Candidates to Interview (Per Month)</span>
                <span className="text-sm font-black text-purple-600">{candidateVolume}</span>
              </div>
              <input 
                type="range"
                min="50"
                max="2500"
                step="50"
                value={candidateVolume}
                onChange={e => setCandidateVolume(Number(e.target.value))}
                className="w-full accent-purple-600 bg-slate-100/80 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* WITHOUT INTERVIEWOS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>WITHOUT InterviewOS</span>
                <span className="text-slate-300 font-extrabold">29 DAYS</span>
              </div>
              <div className="w-full h-8 bg-slate-100/80 rounded-xl border border-slate-200/80 relative overflow-hidden flex items-center px-4">
                <div className="h-full bg-rose-500/25 absolute top-0 left-0 w-full" />
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider relative z-10">
                  Shortlist → Screening Call → Round-1 → Follow-ups → Offer
                </span>
              </div>
            </div>

            {/* WITH INTERVIEWOS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                <span>WITH InterviewOS</span>
                <span className="text-purple-600 font-extrabold">14 Days</span>
              </div>
              <div className="w-full h-8 bg-slate-100/80 rounded-xl border border-slate-200/80 relative overflow-hidden flex items-center px-4">
                <div className="h-full bg-purple-600/30 absolute top-0 left-0 w-[48%]" />
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider relative z-10">
                  Resume Parse + AI Round-1 Screening (1 Day) → Final Rounds
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: savings indicators */}
          <div className="md:col-span-5 bg-slate-100/80 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4">
            <div>
              <span className="text-3xl font-black text-slate-900 block">
                {Math.round(candidateVolume * 1.8)} Hrs
              </span>
              <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest block mt-0.5">Engineering Time Saved</span>
            </div>
            <div className="border-t border-slate-200/80 pt-4">
              <span className="text-3xl font-black text-purple-600 block">
                ${(candidateVolume * 35).toLocaleString()}
              </span>
              <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest block mt-0.5">Hiring budget saved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials ("What Hiring Teams Are Saying") */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">hiring partners feedback</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            What Hiring Teams Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between text-left hover:border-purple-500/20 transition-all duration-300">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200/80">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-slate-200/80">
                  <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{t.author}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 text-center">
        <div className="max-w-6xl mx-auto bg-slate-100/80 border border-slate-200/80 rounded-[2.5rem] p-8 md:p-12 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-3xl md:text-5xl font-black text-slate-900 block">20,000+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Interviews</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-purple-600 block">60%</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Cost Reduction</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-slate-900 block">80+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Scoring metrics</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-black text-emerald-600 block">115+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-1.5">Candidates Hired</span>
          </div>
        </div>
      </section>

      {/* ATS Integrations Section */}
      <section id="integrations" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">ATS Integrations</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Integrate Effortlessly with your Hiring Workflow
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200/80 rounded-[2.5rem] p-8 lg:p-12 shadow-xl backdrop-blur-xl">
          
          {/* Left Grid: 3 ATS Logos */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {['Ashby', 'greyHR', 'Freshworks', 'Workable'].map(logo => (
              <div key={logo} className="h-16 bg-[#050508]/60 border border-slate-200/80 rounded-2xl flex items-center justify-center text-xs font-black uppercase text-slate-500 hover:text-purple-600 hover:border-purple-500/30 transition-all select-none">
                {logo}
              </div>
            ))}
          </div>

          {/* Middle: Integration graphic */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-20 h-20 rounded-full bg-purple-50 border border-purple-500/20 flex items-center justify-center shadow-md shadow-slate-200/40 shadow-purple-500/5">
              <Shield className="w-10 h-10 text-purple-600" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="w-1 h-8 border-l border-dashed border-purple-500/40" />
              <div className="px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600">
                Data Sync
              </div>
              <span className="w-1 h-8 border-l border-dashed border-purple-500/40" />
            </div>
            <div className="w-20 h-20 rounded-full bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-[10px] font-black uppercase text-slate-600">
              Your ATS
            </div>
          </div>

          {/* Right Grid: 3 ATS Logos */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {['Greenhouse', 'Breezy HR', 'Keka', 'Bullhorn'].map(logo => (
              <div key={logo} className="h-16 bg-[#050508]/60 border border-slate-200/80 rounded-2xl flex items-center justify-center text-xs font-black uppercase text-slate-500 hover:text-purple-600 hover:border-purple-500/30 transition-all select-none">
                {logo}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Candidate Feedback Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 lg:px-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Candidate Experience</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Because Candidate Experience Matters
          </h2>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-lg font-black text-slate-900">4.2</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(idx => (
                <Star key={idx} className="w-4.5 h-4.5 fill-amber-400 text-amber-600" />
              ))}
              <Star className="w-4.5 h-4.5 text-slate-600 fill-slate-800" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">18K Ratings</span>
          </div>
        </div>

        {/* Dynamic review feed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {FEEDBACKS.slice(0, 6).map((f, idx) => (
            <div key={idx} className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between text-left h-40 hover:border-purple-500/20 transition-all duration-300">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">"{f.comment}"</p>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/80">
                <span className="text-xs font-black text-slate-900">{f.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: f.stars }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
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
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">proven success</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Stop wasting WEEKS on interviews
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Case Study 1 */}
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm text-left space-y-6 flex flex-col justify-between hover:border-purple-500/20 transition-all">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-500/20 px-2 py-0.5 rounded">17 Hires / Month</span>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                How EdTech Scale-Up Saved 15 Hours/Week for Their Senior Sales Managers
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                By delegating early behavioral screening loops to InterviewOS AI, hiring managers skipped the scheduling bottlenecks, accelerating pipeline velocity.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 flex items-center gap-1.5 hover:underline cursor-pointer">
              Read Case Study <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Case Study 2 */}
          <div className="p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm text-left space-y-6 flex flex-col justify-between hover:border-purple-500/20 transition-all">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">Hiring in 3 Hours</span>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                How Global AI SaaS Hired a Data Analyst with InterviewOS's Super TA
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An immediate resume parse matched against database requirements triggered a mock assessment sandbox round, finishing evaluations within 180 minutes.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 hover:underline cursor-pointer">
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
          className="w-full bg-white/85 border border-slate-200/80 rounded-[2.5rem] p-6 lg:p-10 shadow-xl shadow-slate-200/50 flex flex-col gap-8 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60" />

          {/* Navigation tabs */}
          <div className="w-full p-1.5 rounded-2xl flex bg-[#050508]/60 border border-slate-200/80">
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
                  activeTab === tab.id ? 'bg-purple-600 text-slate-900 shadow-md shadow-slate-200/40 shadow-purple-600/20' : 'text-slate-600 hover:text-slate-900 opacity-70 hover:opacity-100'
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
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Configure Practice Interview</h3>
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
                          ? 'bg-purple-50 border-purple-500/20 text-purple-600'
                          : 'bg-slate-100/80 border-slate-200/80 text-slate-600 hover:text-slate-900'
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
                          ? 'border-purple-500 shadow-md shadow-slate-200/40 shadow-purple-500/20 bg-white/60 shadow-md shadow-slate-200/40'
                          : 'bg-[#050508]/40 border-slate-200/80 hover:border-slate-200/80 hover:bg-[#050508]/60 shadow-md'
                      }`}
                    >
                      <span className="text-xl">🛠️</span>
                      <div>
                        <p className="text-xs font-bold leading-tight text-slate-900">{role.title}</p>
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
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">{selectedRole.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRole.coreSkills.map(s => (
                        <span key={s} className="text-[9px] px-2.5 py-1 bg-slate-100/80 border border-slate-200/80 rounded-lg text-slate-300 font-bold uppercase tracking-wider">
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
                      className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-300 transition-all"
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 mt-2">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your Name *</label>
                              <input
                                value={profile.candidateName}
                                onChange={e => updateProfile('candidateName', e.target.value)}
                                placeholder="Guest Candidate"
                                className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Education</label>
                              <input
                                value={profile.education}
                                onChange={e => updateProfile('education', e.target.value)}
                                placeholder="e.g. B.S. Computer Science"
                                className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Core Projects</label>
                              <textarea
                                value={profile.projects}
                                onChange={e => updateProfile('projects', e.target.value)}
                                placeholder="e.g. Built an AI chat application using Next.js and WebSockets..."
                                rows={2}
                                className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Work History</label>
                              <textarea
                                value={profile.experience}
                                onChange={e => updateProfile('experience', e.target.value)}
                                placeholder="e.g. Frontend Intern at TechCorp - built dynamic dashboards..."
                                rows={2}
                                className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Additional Skills & Certifications</label>
                              <textarea
                                value={profile.certifications}
                                onChange={e => updateProfile('certifications', e.target.value)}
                                placeholder="e.g. AWS Developer Assoc, Docker, Redux..."
                                rows={2}
                                className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 resize-none placeholder-slate-600 shadow-inner"
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
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-slate-200/40 shadow-purple-600/20 active:scale-[0.98] transition-all"
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
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Candidate Portfolio Workspace</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">View stats, monitor daily activity streaks, download certificates, and check rankings</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/candidate" className="p-6 bg-[#050508]/40 border border-slate-200/80 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Personalised paths</span>
                    <p className="text-sm font-bold text-slate-900">Learning Roadmap</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Tailored improvement checklists automatically calculated from your actual performance metrics.</p>
                  </Link>
                  <Link href="/candidate" className="p-6 bg-[#050508]/40 border border-slate-200/80 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Verified Credentials</span>
                    <p className="text-sm font-bold text-slate-900">Shareable Portfolio Profile</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Display earned badges, XP achievements, streaks, and capability radar charts on a public link.</p>
                  </Link>
                </div>
                <Link href="/candidate" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-200/40 shadow-purple-600/20 text-center">
                  Open Candidate Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* recruiter tab */}
            {activeTab === 'recruiter' && (
              <motion.div key="recruiter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Recruiter Assessment Center</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Audit candidate behaviors, create customized listings, and analyze competency matrices</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/recruiter" className="p-6 bg-[#050508]/40 border border-slate-200/80 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Behavioral Proctoring</span>
                    <p className="text-sm font-bold text-slate-900">Neural Integrity Log</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Audits candidate gaze shifts, dynamic browser tab focus losses, and audio consistency reports.</p>
                  </Link>
                  <Link href="/recruiter" className="p-6 bg-[#050508]/40 border border-slate-200/80 hover:border-purple-500/30 rounded-2xl space-y-1.5 block transition-colors">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Diagnostic Analytics</span>
                    <p className="text-sm font-bold text-slate-900">16-Point Competency Radar</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Generates robust merit reports, code review details, and structured candidate comparison tables.</p>
                  </Link>
                </div>
                <Link href="/recruiter" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-200/40 shadow-purple-600/20 text-center">
                  Open Recruiter Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* mvp tab */}
            {activeTab === 'mvp' && (
              <motion.div key="mvp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">JD + Resume Custom Mock (RAG Assessment)</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Upload a PDF Resume against any Job Description to generate a fully tailored assessment</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Target Job Opening</label>
                    <button onClick={() => setShowAddJob(!showAddJob)} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                      {showAddJob ? 'Cancel' : '+ Create Custom Role'}
                    </button>
                  </div>

                  {showAddJob ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-[#050508] border border-slate-200/80 rounded-2xl space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Job Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Backend Engineer"
                          value={newJobTitle}
                          onChange={e => setNewJobTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Job Description</label>
                        <textarea
                          placeholder="Paste the requirements or role details here..."
                          value={newJobDesc}
                          onChange={e => setNewJobDesc(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={handleAddCustomJob}
                        disabled={!newJobTitle || !newJobDesc}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Save & Select Role
                      </button>
                    </motion.div>
                  ) : (
                    <select
                      value={selectedJob}
                      onChange={e => setSelectedJob(e.target.value)}
                      className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white outline-none shadow-inner"
                    >
                      {mergedJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.id}: {job.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    You will be redirected to the custom job application portal. There, you can upload your <strong>PDF resume</strong>. The system automatically structures your skills, parses work history, and dynamically prompts you with tailored scenarios reflecting the intersection of your experience and the job description.
                  </p>
                </div>
                <button
                  onClick={handleLaunchMVP}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-slate-200/40 shadow-emerald-600/20 active:scale-[0.98] transition-all animate-bounce"
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
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Questions</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
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
            <div key={idx} className="bg-white/60 border border-slate-200/80 rounded-2xl overflow-hidden text-left">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left"
              >
                <span className="text-sm font-bold text-slate-900">{item.q}</span>
                <span className="text-slate-600">
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
                    <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/80">
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
      <footer className="relative z-10 border-t border-slate-200/80 bg-white px-6 py-16 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-purple-500/20 rounded-xl flex items-center justify-center bg-purple-500/5">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">InterviewOS</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              We are here to make technical evaluations peaceful, accurate, and secure. AI-driven behavioral proctoring and compilation sandboxes.
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Contact: support@interviewos.ai</p>
          </div>

          {/* Middle link columns */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8 text-xs font-semibold text-slate-600">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">Why InterviewOS?</span>
              <a href="#anti-cheating" className="hover:text-slate-900 block transition-colors">100% Anti-cheating</a>
              <a href="#features" className="hover:text-slate-900 block transition-colors">Evaluation Report</a>
              <a href="#integrations" className="hover:text-slate-900 block transition-colors">ATS Integrations</a>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">Proven Results</span>
              <a href="#case-studies" className="hover:text-slate-900 block transition-colors">Case Studies</a>
              <Link href="/leaderboard" className="hover:text-slate-900 block transition-colors">Leaderboard Rankings</Link>
              <Link href="/pricing" className="hover:text-slate-900 block transition-colors">Pricing Plans</Link>
            </div>
          </div>

          {/* Right Japanese origin Card */}
          <div className="lg:col-span-3 bg-slate-100/80 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-black text-slate-900">InterviewOS - (雇用)</span>
              <div className="w-6 h-6 rounded-full bg-purple-50 border border-purple-500/20 flex items-center justify-center">
                <span className="text-[9px] text-purple-600 font-black">OS</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">noun</p>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
              "1. a blend of 'skillful finesse' and 'employment' — symbolizing technical assessments carried out with precision, grace, and mastery."
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-200/80 mt-12 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
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
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 space-y-6 shadow-xl shadow-slate-200/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500" />
              
              <div className="flex justify-between items-start text-left">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">Book a Demo Slot</h3>
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
                  className="w-8 h-8 rounded-full bg-slate-100/80 flex items-center justify-center hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-md font-bold text-slate-900">Demo Booked Successfully!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">We have sent a calendar invite and details to your email address: <span className="font-bold text-slate-900">{bookingEmail}</span>.</p>
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
                      className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 placeholder-slate-600"
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
                      className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 placeholder-slate-600"
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
                      className="w-full bg-[#050508] border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 placeholder-slate-600"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-slate-200/40 shadow-purple-600/20 transition-all"
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
