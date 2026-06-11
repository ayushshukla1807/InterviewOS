'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, Send, Mic, Sparkles, AlertCircle, 
  ChevronLeft, LayoutDashboard, TrendingUp, Clock, 
  Shield, CheckCircle, BarChart3, Code2, MessageSquare,
  Maximize2, Play, Power, Volume2, VolumeX, ShieldAlert, Headphones, X, Terminal, Monitor,
  Briefcase, ListTodo, CheckCircle2, Cpu, FileCode, Check, AlertTriangle, RefreshCw, Activity, GripHorizontal
} from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type Message = { role: 'assistant' | 'user'; content: string; };
type TabType = 'simulation' | 'code' | 'voice';

import dynamic from 'next/dynamic';
const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw), { ssr: false });
import CodeIDE from '../components/CodeIDE';

import { questionEngine } from '../../lib/db/questions';
import { INTERVIEWER_PERSONA } from '../../lib/ai/prompts';
import { getScenarioByTrack } from '../../lib/db/scenarios';

const getPrampCompanionData = (trackId: string) => {
  const data: Record<string, { targetTime: string; targetSpace: string; hints: string[]; solution: string }> = {
    JS: {
      targetTime: "O(N) batch operations",
      targetSpace: "O(1) auxiliary",
      hints: [
        "First, draft a simple queue mapping. What are the V8 garbage collector risks of retaining high-frequency events in closure arrays?",
        "Avoid allocating new objects during the iteration loops to prevent heap memory churn and Scavenger collection overhead.",
        "Implement a debounce timeout that invalidates its closure scope variables completely upon execution to avoid V8 memory leaks."
      ],
      solution: `// OPTIMAL V8-COMPLIANT JS BATCH ENGINE
class TransactionAggregator {
  constructor() {
    this.transactions = [];
  }
  public push(tx) {
    this.transactions.push(tx);
    // Batch aggregate under memory-safe scopes
  }
  public getAggregatedSum() {
    let sum = 0;
    for (let i = 0; i < this.transactions.length; i++) {
      sum += this.transactions[i].amount;
    }
    return sum;
  }
}`
    },
    DSA: {
      targetTime: "O((V + E) log V)",
      targetSpace: "O(V + E) network map",
      hints: [
        "Represent the routing network as an Adjacency List Map to ensure O(1) neighbor relaxations.",
        "Implement the Min-Heap priority queue using array-based binary trees. Avoid sorting the vertex list on every iteration.",
        "Ensure Dijkstra relaxation checks if the new path weight is strictly less than the existing node distance before insertion."
      ],
      solution: `// OPTIMAL DIJKSTRA ROUTING PATHFINDER
class MinHeap {
  constructor() {
    this.heap = [];
  }
  public insert(node, weight) {
    this.heap.push({ node, weight });
    this.bubbleUp();
  }
  public extractMin() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown();
    }
    return min;
  }
}`
    },
    ADA: {
      targetTime: "O(1) read/write caching",
      targetSpace: "O(Capacity) node memory",
      hints: [
        "Combine a Hash Map with a Doubly Linked List to secure O(1) lookup and O(1) node re-ordering operations.",
        "Evict nodes from the tail of the Doubly Linked List when size exceeds capacity. Insert fresh nodes at the head.",
        "Ensure concurrent operations use lock-free checks or minimal mutex sections to avoid lock overhead bottlenecks."
      ],
      solution: `// OPTIMAL O(1) CACHE SYNC ENGINE
class LRUNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}
class BidCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
}`
    },
    healthcare_ai: {
      targetTime: "O(N) sanitization",
      targetSpace: "O(W) sliding window bounds",
      hints: [
        "Convert patient attributes into standard FHIR resource structures mapping identifiers, names, and contacts.",
        "Use high-efficiency regular expressions to intercept log outputs and sanitize PHI attributes (names, emails, 10-digit digits).",
        "Implement sliding window rate limiting by pruning timestamps older than the evaluation window before adding a new event."
      ],
      solution: `// OPTIMAL SECURE FHIR LOGGER & LIMITER
export class PHISecureLogger {
  public static redact(message) {
    // Redact 10-digit phone numbers and email formats
    return message
      .replace(/\\b\\d{10}\\b/g, '[REDACTED_PHONE]')
      .replace(/[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  }
}`
    }
  };
  return data[trackId] || data.JS;
};

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') || 'Candidate';
  const track = (searchParams.get('track') || 'JS');
  const isMock = searchParams.get('mock') === 'true'; // controls hint visibility
  const simulationSessionId = searchParams.get('simulationSessionId') || '';
  const [simulationSummary, setSimulationSummary] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (simulationSessionId) {
      const summary = sessionStorage.getItem(`simulation_summary_${simulationSessionId}`) || localStorage.getItem(`simulation_summary_${simulationSessionId}`);
      if (summary) {
        setSimulationSummary(summary);
      }
    }
  }, [simulationSessionId]);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [scenario, setScenario] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState('// Write your solution here\n\n');
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [currentAdaptation, setCurrentAdaptation] = useState<string>('Optimizing assessment...');
  const [detectedSignals, setDetectedSignals] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  // Treat as generating questions if DYNAMIC or if track is a custom roleId (not JS/DSA/ADA)
  const standardTracks = ['JS', 'DSA', 'ADA', 'DYNAMIC'];
  const isRoleTrack = !standardTracks.includes(track);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(track === 'DYNAMIC' || isRoleTrack);
  const [startTime] = useState(new Date().toISOString());
  const [dynamicContext, setDynamicContext] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // LIVE ANALYTICS OSCILLATION
  const [gazeVal, setGazeVal] = useState(98.4);
  const [noiseVal, setNoiseVal] = useState(42);
  const [syncVal, setSyncVal] = useState(99.8);
  const [isStarted, setIsStarted] = useState(false); // Track if session actually started

  // NEW ENTERPRISE FEATURES STATE (Task 4-11)
  const [interviewLanguage, setInterviewLanguage] = useState('English');
  const [isStressMode, setIsStressMode] = useState(false);
  const [showTimeExtension, setShowTimeExtension] = useState(false);
  const [microExpression, setMicroExpression] = useState('Neutral');
  const [voiceConfidence, setVoiceConfidence] = useState(92);
  
  // Salary Negotiation State
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [targetSalary, setTargetSalary] = useState('120000');
  const [targetEquity, setTargetEquity] = useState('0.5%');
  const [negotiationPhase, setNegotiationPhase] = useState<'idle'|'analyzing'|'counter'|'approved'>('idle');

  const [lintErrors, setLintErrors] = useState<string[]>([]);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>(['Could you clarify your approach?', 'What is the time complexity?', 'Can we optimize this?']);
  
  // Pramp practice companion states
  const [showPrampDeck, setShowPrampDeck] = useState(false);
  const [prampHintsRevealed, setPrampHintsRevealed] = useState<number[]>([]);
  const [prampRatings, setPrampRatings] = useState({
    communication: 4,
    cleanliness: 4,
    dsaMastery: 4,
    receptiveness: 4,
  });

  const [faceCount, setFaceCount] = useState(1);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [secondPersonDetected, setSecondPersonDetected] = useState(false);

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => {
      setGazeVal(prev => Math.min(100, Math.max(92, prev + (Math.random() - 0.5) * 2)));
      setNoiseVal(prev => Math.min(55, Math.max(38, prev + (Math.random() - 0.5) * 4)));
      setSyncVal(prev => Math.min(100, Math.max(99.1, prev + (Math.random() - 0.5) * 0.1)));
      
      // Simulate Voice Confidence & Micro-Expressions
      setVoiceConfidence(prev => Math.min(100, Math.max(60, prev + (Math.random() - 0.5) * 5)));
      const expressions = ['Neutral', 'Focused', 'Engaged', 'Thinking', 'Neutral', 'Slight Stress'];
      setMicroExpression(expressions[Math.floor(Math.random() * expressions.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isStarted]);

  // ─── PROCTORING STATE (KOYO AI INTEGRATION) ──────────────────────
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [terminated, setTerminated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctoringLogs, setProctoringLogs] = useState<{time: string, event: string}[]>([]);
  const [koyoSignals, setKoyoSignals] = useState({
    aiAssist: false,
    secondVoice: false,
    eyeShift: false,
    styleShift: false,
    readLikeDelivery: false
  });
  const MAX_VIOLATIONS = 3;
  const proctorReadyRef = useRef(false); // grace period guard

  // ─── SCRATCHPAD & IDE STATE ──────────────────────────────────────────────
  const [scratchpad, setScratchpad] = useState('// Scratchpad: Draft your logic here before final submission...');
  const [activeEditorTab, setActiveEditorTab] = useState<'scratch' | 'final' | 'terminal' | 'canvas'>('scratch');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['> Sandbox initialized.', '> run `npm start` to begin.']);
  const [terminalInput, setTerminalInput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [execTime, setExecTime] = useState<number | null>(null);
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);

  const triggerCodingQuestionAnnouncement = () => {
    speak("We have shared a coding question on the right panel. Please read it carefully and write your solution in the editor.");
  };

  const handleRunCode = async () => {
    const codeToRun = activeEditorTab === 'scratch' ? scratchpad : code;
    if (!codeToRun.trim()) return;
    setIsCodeRunning(true);
    setExecSuccess(null);
    setExecTime(null);
    setConsoleOutput(`> Submitting to execution engine...\n> Language: ${language}\n> Running...\n`);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun, language, stdin: consoleInput }),
      });
      const data = await res.json();
      const lines: string[] = [];
      if (data.error) {
        lines.push(`> ERROR: ${data.error}`);
        setExecSuccess(false);
      } else {
        lines.push(`> Language: ${data.language} ${data.version}`);
        if (data.runtime_ms !== null && data.runtime_ms !== undefined) {
          lines.push(`> Runtime: ${data.runtime_ms}ms`);
          setExecTime(data.runtime_ms);
        }
        lines.push(`> Exit Code: ${data.exit_code}`);
        lines.push('');
        if (data.stdout) {
          lines.push('── OUTPUT ──────────────────────');
          lines.push(data.stdout.trimEnd());
        }
        if (data.stderr) {
          lines.push('');
          lines.push('── ERROR ───────────────────────');
          lines.push(data.stderr.trimEnd());
        }
        if (!data.stdout && !data.stderr) {
          lines.push('(No output)');
        }
        setExecSuccess(data.success);
      }
      setConsoleOutput(lines.join('\n'));
    } catch (err: any) {
      setConsoleOutput(`> Network error: ${err.message}\n> Check your connection and try again.`);
      setExecSuccess(false);
    } finally {
      setIsCodeRunning(false);
    }
  };

  // ─── AURA SUPPORT BOT STATE ──────────────────────────────────────────────
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<{role: 'aura' | 'user', content: string}[]>([
    { role: 'aura', content: 'Hi there! I am Aura, your dedicated support assistant. I\'m here to ensure your interview runs perfectly. Let me know if you need any help!' }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  // ─── VOICE SETTINGS STATE ──────────────────────────────────────────────────
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.95);
  const [voiceGender, setVoiceGender] = useState<'default' | 'male' | 'female'>('default');

  // ─── SPEAKER STATE ─────────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // KOYO SIGNAL SIMULATION
  useEffect(() => {
    if (!isStarted) return;
    const t = setInterval(() => {
      // Simulate high-fidelity signal detection (Koyo-style)
      const roll = Math.random();
      if (roll > 0.98) setKoyoSignals(prev => ({ ...prev, eyeShift: true }));
      if (roll > 0.995) setKoyoSignals(prev => ({ ...prev, aiAssist: true }));
      
      // Auto-clear signals after 3s
      setTimeout(() => {
        setKoyoSignals({ aiAssist: false, secondVoice: false, eyeShift: false, styleShift: false, readLikeDelivery: false });
      }, 3000);
    }, 5000);
    return () => clearInterval(t);
  }, [isStarted]);
  
  // Load initial questions or generate dynamic ones
  useEffect(() => {
    // Load scenario based on track
    const activeScenario = getScenarioByTrack(track);
    setScenario(activeScenario);
    if (activeScenario) {
      setCode(activeScenario.initialCode);
      setLanguage(activeScenario.language);
    }

    // Load candidate profile (set from landing page role selector)
    const savedProfile = localStorage.getItem('interviewos_candidate_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setCandidateProfile(parsedProfile);
    }

    if (track === 'DYNAMIC') {
      const savedCtx = localStorage.getItem('interviewos_candidate_context');
      if (savedCtx) {
        const ctx = JSON.parse(savedCtx);
        setDynamicContext(ctx);
        // Pull simulation summary from storage (may already be in state via simulationSummary)
        const simSummary = simulationSessionId
          ? (sessionStorage.getItem(`simulation_summary_${simulationSessionId}`) || localStorage.getItem(`simulation_summary_${simulationSessionId}`) || null)
          : null;
        fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ctx, simulationSummary: simSummary })
        })
        .then(res => res.json())
        .then(data => {
          setQuestions(data.questions?.length ? data.questions : questionEngine.getQuestionsByTrack('JS').slice(0, 4));
          setIsGeneratingQuestions(false);
        })
        .catch(err => {
          console.error('[generate-questions DYNAMIC]', err);
          setQuestions(questionEngine.getQuestionsByTrack('JS').slice(0, 4));
          setIsGeneratingQuestions(false);
        });
      } else {
        setQuestions(questionEngine.getQuestionsByTrack('JS').slice(0, 4));
        setIsGeneratingQuestions(false);
      }
    } else if (isRoleTrack) {
      // Role-specific question generation (e.g. track = 'fullstack', 'ai_ml_engineer', etc.)
      const profileRaw = localStorage.getItem('interviewos_candidate_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: track,
          candidateName: profile.candidateName || name,
          resumeText: [profile.projects, profile.experience, profile.certifications, profile.education].filter(Boolean).join('\n'),
        })
      })
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions?.length ? data.questions : questionEngine.getQuestionsByTrack('JS').slice(0, 4));
        setIsGeneratingQuestions(false);
      })
      .catch(() => {
        setQuestions(questionEngine.getQuestionsByTrack('JS').slice(0, 4));
        setIsGeneratingQuestions(false);
      });
    } else {
      setQuestions(questionEngine.getQuestionsByTrack(track).slice(0, 4));
      setIsGeneratingQuestions(false);
    }
  }, [track]);

  const [interviewer, setInterviewer] = useState<any>(null);

  useEffect(() => {
    if (isMounted) {
      const saved = localStorage.getItem('interviewos_active_interviewer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatar?.includes('ui-avatars')) {
          const colors: Record<string, string> = { Syed: '4f46e5', Zara: '06b6d4', Ava: 'db2777', Sathvik: '059669', Zoe: '7c3aed' };
          parsed.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${parsed.name}&backgroundColor=${colors[parsed.name] || '4f46e5'}`;
          localStorage.setItem('interviewos_active_interviewer', JSON.stringify(parsed));
        }
        setInterviewer(parsed);
      } else {
        const { INTERVIEWERS } = require('../../lib/ai/interviewers');
        const random = INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];
        setInterviewer(random);
        localStorage.setItem('interviewos_active_interviewer', JSON.stringify(random));
      }
    }
  }, [isMounted]);

  const isTerminalSession = status === 'completed' || status === 'error';
  const question = questions[currentQ];

  useEffect(() => {
    // Only trigger once when the first question loads and starts
    if (question && !isGeneratingQuestions && isStarted && timeLeft > 0) {
      if (!window.sessionStorage.getItem('interviewos_coding_announced')) {
        setTimeout(() => triggerCodingQuestionAnnouncement(), 2000);
        window.sessionStorage.setItem('interviewos_coding_announced', 'true');
      }
    }
  }, [question, isGeneratingQuestions, isStarted, timeLeft]);

  // Handle Fullscreen & Anti-Cheating
  useEffect(() => {
    if (isMounted && question && messages.length === 0 && interviewer) {
      const jobTitle = dynamicContext?.jobTitle ? ` for the ${dynamicContext.jobTitle} position` : '';
      const openingLines = [
        `Hey ${name.split(' ')[0]}! I'm ${interviewer.name}. I'll be your lead interviewer today.`,
        `First of all, don't sweat it. We're just here to have a solid technical chat and see how you think.`,
        `I've got some interesting challenges lined up${jobTitle}.`,
        `We have shared a coding question on your screen. Take your time to read the constraints. Whenever you're ready, let's dive into it. Sound good?`
      ];
      const fullGreeting = openingLines.join(' ');
      setMessages([{ role: 'assistant', content: fullGreeting }]);
      // Auto-speak with a slight human-like hesitation/delay
      setTimeout(() => speak(fullGreeting), 1200);
    }
  }, [isMounted, question, messages.length, name, dynamicContext, interviewer]);

  // ─── PROCTORING ENGINE ─────────────────────────────────────────────
  useEffect(() => {
    const triggerViolation = (msg: string) => {
      setProctoringLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), event: msg }]);
      setViolations(prev => {
        const next = prev + 1;
        setWarningMsg(`${msg} (Warning ${next}/${MAX_VIOLATIONS})`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        if (next >= MAX_VIOLATIONS) {
          setTerminated(true);
          setIsRunning(false);
        }
        return next;
      });
    };

    // Tab/window switch detection
    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation('Warning: Tab switch detected. Do not leave the interview window.');
      }
    };

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) {
        triggerViolation('Warning: Fullscreen exited. Please remain in fullscreen during the interview.');
      }
    };

    // Blur = candidate switched app/window — only fire after grace period
    const handleBlur = () => {
      if (proctorReadyRef.current) {
        triggerViolation('Warning: Window lost focus. Switching windows is not allowed.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);

    // Disable right-click
    const noContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', noContext);

    // Disable common copy-paste shortcuts
    const noKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c','v','x','u','s'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerViolation('Warning: Keyboard shortcut blocked. External help is not allowed.');
      }
      // Block F12, DevTools
      if (e.key === 'F12') { e.preventDefault(); }
    };
    document.addEventListener('keydown', noKeys);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', noContext);
      document.removeEventListener('keydown', noKeys);
    };
  }, []);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
    setIsFullscreen(true);
    setIsStarted(true);

    // UNLOCK AUDIO CONTEXT IMMEDIATELY ON CLICK TO BYPASS AUTOPLAY POLICIES
    const audioEl = document.getElementById('ai-voice') as HTMLAudioElement;
    if (audioEl) {
      audioEl.play().catch(() => {});
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    // Give the browser 2s to settle before blur violations count
    setTimeout(() => { proctorReadyRef.current = true; }, 2000);
  };

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRefMirror = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // ML Trackers
  const initMLTrackers = async (mediaStream: MediaStream, videoElement: HTMLVideoElement) => {
    try {
      // 1. Audio Anomaly Detection (Background noise)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyzer);
      analyzer.fftSize = 256;
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      setInterval(() => {
         analyzer.getByteFrequencyData(dataArray);
         const avgNoise = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
         setNoiseVal(Math.min(100, Math.round(avgNoise)));
      }, 2000);

      // 2. Computer Vision (Gaze & Face)
      const vision = await FilesetResolver.forVisionTasks(
         "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
         baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
         },
         outputFaceBlendshapes: true,
         runningMode: "VIDEO",
         numFaces: 4
      });

      let lastVideoTime = -1;
      const detectFace = () => {
         if (videoElement.readyState >= 2) {
            if (videoElement.currentTime !== lastVideoTime) {
               const results = faceLandmarker.detectForVideo(videoElement, performance.now());
               if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                  const count = results.faceBlendshapes.length;
                  setFaceCount(count);
                  setSecondPersonDetected(count > 1);
                  // Eye tracking logic (simplified)
                  const shapes = results.faceBlendshapes[0].categories;
                  const eyeBlink = shapes.find(s => s.categoryName === 'eyeBlinkLeft')?.score || 0;
                  // If blink is too high or face missing, drop gaze value
                  setGazeVal(Math.max(40, 100 - (eyeBlink * 100)));
               } else {
                  // No face detected
                  setFaceCount(0);
                  setGazeVal(10);
                  setSecondPersonDetected(false);
               }
               lastVideoTime = videoElement.currentTime;
            }
         }
         requestAnimationFrame(detectFace);
      };
      detectFace();

    } catch (e) {
      console.warn("ML Trackers failed to init (expected in strict environments):", e);
    }
  };

  // Initialize Hardware
  useEffect(() => {
    const initHardware = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        setStream(s);
        
        // Setup Media Recorder for S3
        try {
          const mediaRecorder = new MediaRecorder(s, { mimeType: 'video/webm' });
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.start(2000); // chunk every 2s
        } catch (mrErr) {
          console.warn('MediaRecorder init failed:', mrErr);
        }

        if (videoRef.current) {
           videoRef.current.srcObject = s;
           videoRef.current.play();
           initMLTrackers(s, videoRef.current);
        }
        if (videoRefMirror.current) {
           videoRefMirror.current.srcObject = s;
           videoRefMirror.current.play();
        }
      } catch (err) {
        console.error("Hardware access denied:", err);
        setTerminated(true);
        setIsRunning(false);
        setWarningMsg("FATAL: Camera and Microphone permissions are strictly required for this proctored interview. Please allow access and refresh the page.");
      }
    };
    initHardware();
    
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // DO NOT cut off automatically!
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };
      
      // Auto-restart if it stops unexpectedly while we still want to be listening
      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
           try { recognitionRef.current.start(); } catch (e) {}
        }
      };
    }

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fallbackSpeak = (text: string) => {
    const play = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isFemale = voiceGender === 'female' || (voiceGender === 'default' && (interviewer?.name === 'Ava' || interviewer?.name === 'Zoe' || interviewer?.name === 'Zara'));
      
      utterance.rate = 1.0;
      utterance.pitch = isFemale ? 1.2 : 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      let preferred;
      if (isFemale) {
        preferred = voices.find(v => v.name.includes('Google US English')) ||
                    voices.find(v => v.name.includes('Google UK English Female')) ||
                    voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen')) ||
                    voices.find(v => v.name.includes('Microsoft Zira') || v.name.includes('Microsoft Jenny')) ||
                    voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang)) ||
                    voices.find(v => /en/i.test(v.lang));
      } else {
        preferred = voices.find(v => v.name.includes('Google UK English Male')) ||
                    voices.find(v => v.name.includes('Microsoft Mark') || v.name.includes('Microsoft Guy')) ||
                    voices.find(v => v.name.includes('Daniel') || v.name.includes('Arthur')) ||
                    voices.find(v => /male/i.test(v.name) && /en/i.test(v.lang)) ||
                    voices.find(v => /en/i.test(v.lang));
      }
      
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = play;
    } else {
      play();
    }
  };

  const speak = async (text: string) => {
    window.speechSynthesis.cancel();
    if (voiceMuted) return;

    try {
      setIsSpeaking(true);
      const isFemale = voiceGender === 'female' || (voiceGender === 'default' && (interviewer?.name === 'Ava' || interviewer?.name === 'Zoe' || interviewer?.name === 'Zara'));
      const voice = isFemale ? 'nova' : 'alloy';

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });

      if (!res.ok) throw new Error('TTS API failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audioEl = document.getElementById('ai-voice') as HTMLAudioElement;
      
      if (audioEl) {
        audioEl.src = url;
        audioEl.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audioEl.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          fallbackSpeak(text);
        };
        await audioEl.play();
      } else {
        // Fallback if DOM element is missing
        const fallbackAudio = new Audio(url);
        fallbackAudio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        fallbackAudio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); fallbackSpeak(text); };
        await fallbackAudio.play();
      }
    } catch (err) {
      console.warn("OpenAI TTS failed, falling back to browser synthesis:", err);
      fallbackSpeak(text);
    }
  };

  const toggleListening = () => {
    if (isThinking || isSpeaking) return; // Block interruptions during AI turns
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const send = async () => {
    if (!input.trim() || isThinking) return;
    const msg = input;
    setInput('');
    const updated = [...messages, { role: 'user' as const, content: msg }];
    setMessages(updated);
    setIsThinking(true);
    setExchangeCount(p => p + 1);

    try {
      const systemCtx = dynamicContext 
        ? `\n\n[CONTEXT]: You are interviewing for the role of ${dynamicContext.jobTitle}.\nCOMPANY CULTURE TO SIMULATE: ${dynamicContext.blueprint?.companyCultureProfile || 'Standard Professional'}\nJOB DESCRIPTION: ${dynamicContext.jobDescription}\nCANDIDATE RESUME: ${dynamicContext.resumeText}\n${dynamicContext.blueprint ? `TEST BLUEPRINT (BEHAVIORAL SCENARIOS TO ADMINISTER):\n${JSON.stringify(dynamicContext.blueprint, null, 2)}\nYou MUST strictly administer the behavioral scenarios listed in this blueprint to evaluate their workplace situational judgment. Wait for their response to each scenario before moving to the next.` : `Ask highly specific follow-up questions tailored to their resume experience vs job requirements.`}`
        : '';
        
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          track,
          candidateProfile: candidateProfile 
            ? { ...candidateProfile, name, interviewerName: interviewer?.name, interviewerPersona: interviewer?.persona } 
            : { name, interviewerName: interviewer?.name, interviewerPersona: interviewer?.persona },
          simulationSummary: simulationSummary,
          system: !candidateProfile ? (INTERVIEWER_PERSONA.replace(/Syed/gi, interviewer?.name || 'Syed') + systemCtx.replace(/Syed/gi, interviewer?.name || 'Syed') + `\n\nCurrent question: ${question.title}\nProblem: ${question.prompt}\nExchange #${exchangeCount + 1}\n\n[CANDIDATE'S CURRENT CODE STATE]:\n\`\`\`javascript\n${code}\n\`\`\`\nRefer to the code if relevant.`) : undefined,
        }),
      });
      const data = await res.json();
      let content = data.content || data.message || "I hear you. Let's explore this further.";
      let signals: string[] = data.signals || [];
      let adaptation = data.adaptation || 'Maintaining current depth.';

      // Fallback: If the API accidentally returned a raw stringified JSON inside `content`
      if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          content = parsed.content || content;
          if (parsed.signals) signals = parsed.signals;
          if (parsed.adaptation) adaptation = parsed.adaptation;
        } catch (e) {
          // Ignore parse errors, just use the raw string
        }
      }
      
      let spokenContent = content;
      const codeInjectionMatch = content.match(/\[INJECT_CODE\]([\s\S]*?)\[\/INJECT_CODE\]/);
      
      if (codeInjectionMatch) {
        const injectedCode = codeInjectionMatch[1].trim();
        spokenContent = content.replace(/\[INJECT_CODE\][\s\S]*?\[\/INJECT_CODE\]/, '').trim();
        
        // Inject into the IDE
        setCode(prev => prev + `\n\n// --- [AI COLLAB INJECTION] ---\n// Your interviewer just injected this code block.\n// Find the bug and fix it!\n${injectedCode}\n// -----------------------------\n`);
        setActiveEditorTab('final'); // Switch them to final code to see it
      }
      
      setMessages(p => [...p, { role: 'assistant', content: spokenContent }]);
      setDetectedSignals(signals.filter(s => s !== 'NEXT_QUESTION'));
      setCurrentAdaptation(adaptation);
      speak(spokenContent); 

      if (signals.includes('NEXT_QUESTION') && currentQ < questions.length - 1) {
        setTimeout(() => setCurrentQ(p => p + 1), 3000);
        setExchangeCount(0);
      }
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'I appreciate your response. Let\'s continue.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setIsEvaluating(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    try {
      // 0. Upload Video to S3
      let s3VideoUrl = null;
      if (recordedChunksRef.current.length > 0) {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const presignRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'session.webm', contentType: 'video/webm' })
          });
          if (presignRes.ok) {
            const { url, key } = await presignRes.json();
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'video/webm' },
              body: blob
            });
            s3VideoUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
            console.log('Video successfully uploaded to S3:', s3VideoUrl);
          }
        } catch (e) {
          console.error('Failed to upload video to S3:', e);
        }
      }

      // 1. Fetch ML Code Originality
      let originalityScore = null;
      if (code && code.trim()) {
         try {
            const ogRes = await fetch('/api/ml/originality', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ code })
            });
            const ogData = await ogRes.json();
            originalityScore = ogData.originalityScore;
         } catch (e) {
            console.error("Originality ML failed:", e);
         }
      }

      // 2. Fetch Final Evaluation
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          code,
          questionTitle: question.title,
          track,
          originalityScore,
          proctoringStats: {
             finalGaze: gazeVal,
             finalNoise: noiseVal,
             voiceConfidence: voiceConfidence,
             koyoViolations: violations
          },
          simulationSummary
        })
      });
      const evaluationData = await res.json();
      
      const durationSeconds = (60 * 60) - timeLeft;
      
      const reportPayload = {
        // Legacy fields for backwards compat
        score: evaluationData.overallScore || 0,
        commSkills: {
          vocal: Math.round((evaluationData.communication?.verbalFluency || 0) / 20),
          clarity: Math.round((evaluationData.communication?.clarity || 0) / 20),
          structured: Math.round((evaluationData.communication?.structuredCommunication || 0) / 20),
          feedback: evaluationData.communication?.recruiterInterpretation || "No data"
        },
        questionEval: {
          evaluation: evaluationData.codeEvaluation?.evaluation || "No data",
          score: Math.round((evaluationData.codeEvaluation?.score || 0) / 20)
        },
        strengths: evaluationData.keyRecruitInsights?.strongSignals || ["Good core concepts", "Professional communication"],
        risks: evaluationData.keyRecruitInsights?.majorConcerns || ["Needs more depth"],
        // Full evaluation data
        fullEvaluation: evaluationData,
        questionDetails: {
          id: question?.id,
          title: question?.title,
          weightage: question?.weightage,
          difficulty: question?.difficulty,
          prompt: question?.prompt,
          code: code
        },
        simulation: {
          id: scenario?.id,
          title: scenario?.title,
          company: scenario?.company,
          role: scenario?.role,
          completedTasks: completedTasks,
          totalTasks: scenario?.tasks.length || 0,
          skills: scenario?.skills
        },
        metadata: {
          startTime,
          endTime: new Date().toISOString(),
          durationMinutes: Math.floor(durationSeconds / 60),
          track,
          candidateName: name,
          s3VideoUrl: s3VideoUrl
        },
        proctoringLogs: proctoringLogs
      };

      localStorage.setItem('interviewos_report', JSON.stringify(reportPayload));
      
      // PERSIST SUPPORT LOGS FOR PLATFORM BETTERMENT
      const supportLogs = {
        candidateName: name,
        sessionTime: new Date().toISOString(),
        interactions: supportMessages
      };
      const existingLogs = JSON.parse(localStorage.getItem('interviewos_support_insights') || '[]');
      localStorage.setItem('interviewos_support_insights', JSON.stringify([supportLogs, ...existingLogs]));

      // PERSISTENT APPLICATIONS LIST FOR RECRUITERS
      const savedApps = localStorage.getItem('interviewos_applications');
      const apps = savedApps ? JSON.parse(savedApps) : [];
      const newApp = {
        id: `APP-${Math.floor(Math.random() * 10000)}`,
        jobId: dynamicContext?.jobId || 'GENERAL',
        candidateName: name,
        candidateEmail: dynamicContext?.candidateEmail || 'unknown@interviewos.com',
        score: reportPayload.score,
        track: track,
        violations: violations, // PERSIST INTEGRITY DATA
        koyoSignals: koyoSignals, // NEW: PERSIST KOYO DATA
        proctoringLogs: proctoringLogs, // NEW: EXACT TIMESTAMPS
        timestamp: new Date().toISOString(),
        simulation: reportPayload.simulation, // NEW: PERSIST SIMULATION DETAILS
        report: reportPayload
      };
      localStorage.setItem('interviewos_applications', JSON.stringify([newApp, ...apps]));

      // PERSIST REPORT TO MONGODB API
      try {
        const token = localStorage.getItem('interviewos_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        await fetch(`${backendUrl}/api/reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newApp)
        });
        console.log('Successfully saved report to MongoDB database.');
      } catch (dbErr) {
        console.error('Failed to save report to MongoDB:', dbErr);
      }

      router.push(`/feedback?name=${encodeURIComponent(name)}&track=${track}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate evaluation report.");
      setIsEvaluating(false);
    }
  };

  if (isEvaluating) {
    return (
      <div data-theme="dark" className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <User className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 space-y-4"
        >
          <h2 className="text-3xl font-black text-[var(--text)] tracking-tighter uppercase">Evaluation in Progress</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing final assessment metrics</p>
        </motion.div>
      </div>
    );
  }

  if (isGeneratingQuestions || !question) {
    return (
      <div data-theme="dark" className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Matching Profile to Job Description</p>
        <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px] mt-2 animate-pulse">Generating Custom Interview Protocol...</p>
      </div>
    );
  }

  // ─── TERMINATED SCREEN ─────────────────────────────────────────────
  if (terminated) {
    return (
      <div data-theme="dark" className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 text-center space-y-8 transition-colors duration-500">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-[var(--text)] tracking-tighter">Interview Terminated</h1>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">You have exceeded the maximum number of integrity violations. This session has been flagged and your recruiter has been notified.</p>
        </div>
        <div className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest">{violations} / {MAX_VIOLATIONS} Violations Recorded</p>
        </div>
      </div>
    );
  }

  // ─── FULLSCREEN GATE ────────────────────────────────────────────────
  if (!isFullscreen) {
    return (
      <div data-theme="dark" className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 text-center space-y-8 transition-colors duration-500">
        <div className="w-20 h-20 rounded-full bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center">
          <Maximize2 className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-[var(--text)] tracking-tighter">Fullscreen Required</h1>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">This interview must be conducted in fullscreen mode. Exiting fullscreen will be logged as a violation.</p>
        </div>
        <button onClick={enterFullscreen} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3">
          <Maximize2 className="w-4 h-4" /> Enter Fullscreen & Start Interview
        </button>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Tab switching, window changes & copy-paste are blocked during the session.</p>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="h-screen bg-[#020204] flex flex-col overflow-hidden text-[var(--text)] font-sans selection:bg-indigo-500/30 transition-colors duration-500">
      
      {/* Proctoring Violation Toast */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-rose-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 max-w-xl w-[90vw]"
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-black">{warningMsg}</p>
              <p className="text-[10px] opacity-80 mt-0.5">Violation {violations}/{MAX_VIOLATIONS} — Further violations will terminate the session.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salary Negotiation Modal */}
      <AnimatePresence>
        {isNegotiating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[#050508]/90 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter text-white">Compensation Negotiation</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">AI Counter-Offer Engine</p>
                 </div>
                 <button onClick={() => setIsNegotiating(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                 </button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Base Salary (USD)</label>
                    <input 
                      type="text" 
                      value={targetSalary}
                      onChange={(e) => setTargetSalary(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Equity / Options</label>
                    <input 
                      type="text" 
                      value={targetEquity}
                      onChange={(e) => setTargetEquity(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                 </div>
              </div>

              {negotiationPhase === 'analyzing' && (
                 <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Analyzing Market Band & Candidate Performance...</p>
                 </div>
              )}

              {negotiationPhase === 'counter' && (
                 <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">AI Counter-Offer Generated</p>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                       "Based on your performance and current market bands, we can authorize a base of <span className="font-bold text-white">$115,000</span> with <span className="font-bold text-white">0.3%</span> equity. Would you like to proceed with these terms?"
                    </p>
                 </div>
              )}

              {negotiationPhase === 'approved' && (
                 <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-emerald-500" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Offer Terms Approved</p>
                    </div>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                       "Excellent. We have updated your offer profile. These terms will be included in your final packet."
                    </p>
                 </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                 <button onClick={() => setIsNegotiating(false)} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all">Cancel</button>
                 {negotiationPhase === 'idle' ? (
                   <button onClick={() => {
                     setNegotiationPhase('analyzing');
                     setTimeout(() => setNegotiationPhase('counter'), 2500);
                   }} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Submit Request</button>
                 ) : negotiationPhase === 'counter' ? (
                   <button onClick={() => setNegotiationPhase('approved')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Accept Counter</button>
                 ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <header className="px-8 py-3 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Interview Session</h1>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">{track} Evaluation LIVE</p>
          </div>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
             <div className="flex gap-1 items-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Stage:</p>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{currentQ + 1} <span className="text-slate-600">/</span> {questions.length || 0}</p>
             </div>
             <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-indigo-500" 
                  initial={{ width: 0 }} animate={{ width: `${((currentQ + 1) / (questions.length || 1)) * 100}%` }} />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Enterprise Toggles */}
           <div className="hidden lg:flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
              <button 
                onClick={() => setIsStressMode(!isStressMode)}
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${isStressMode ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Stress Test Mode"
              >
                Stress
              </button>
              <select 
                value={interviewLanguage} onChange={e => setInterviewLanguage(e.target.value)}
                className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-0 cursor-pointer"
              >
                <option value="English(UK)">English(UK)</option>
                <option value="English(US)">English(US)</option>
                <option value="Hindi">Hindi</option>
              </select>
           </div>

           {timeLeft < 300 && !showTimeExtension && (
              <button onClick={() => { setTimeLeft(p => p + 900); setShowTimeExtension(true); }} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all animate-pulse">
                 +15 Min Extension
              </button>
           )}
           <button onClick={() => setIsNegotiating(true)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${isNegotiating ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}>
              <TrendingUp className="w-3.5 h-3.5" /> Negotiate Salary
           </button>
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border tabular-nums transition-all ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black tracking-widest">{fmt(timeLeft)}</span>
           </div>
           <button 
             onClick={handleFinish}
             className="px-5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-rose-600/10 flex items-center gap-2"
           >
             <Power className="w-3 h-3" />
             Exit Session
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Code & Question */}
        <div className="flex-1 flex flex-col bg-[var(--bg)] overflow-hidden relative">
            {/* Tab Bar */}
            <div className="px-6 pt-4 flex gap-1 shrink-0 border-b border-white/5 bg-slate-950/40">
               {((track === 'DYNAMIC' ? ['voice', 'simulation', 'code'] : ['voice', 'code']) as TabType[]).map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   className={`px-8 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                     activeTab === tab 
                       ? 'bg-white/5 border-indigo-500 text-white' 
                       : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                   }`}
                 >
                   {tab === 'simulation' && <Briefcase className="w-3.5 h-3.5 text-indigo-400" />}
                   {tab === 'code' && <Code2 className="w-3.5 h-3.5 text-emerald-400" />}
                   {tab === 'voice' && <Mic className="w-3.5 h-3.5 text-rose-400" />}
                   {tab === 'simulation' ? 'Job Simulation' : tab === 'code' ? 'IDE / Code Editor' : 'Live Voice Interview'}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-8 custom-scrollbar">
               <AnimatePresence mode="wait">
                  {activeTab === 'voice' ? (
                     <motion.div 
                       key="voice"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="h-full flex gap-8 p-8"
                     >
                        {/* LEFT: Interview Interaction Area */}
                        <div className="flex-1 flex flex-col items-center justify-center space-y-16">
                           <div className="text-center space-y-2">
                              <h2 className="text-4xl font-black tracking-tighter">Live Session</h2>
                              <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">Adaptive follow-ups, natural conversations, and real-time probing.</p>
                           </div>

                           {/* Avatars & Waveform */}
                           <div className="flex items-center justify-center w-full gap-8">
                              {/* Interviewer Avatar with Circular Audio Ring */}
                              <div className="flex flex-col items-center gap-4 relative">
                                 <div className={`absolute -inset-4 rounded-full border-2 border-indigo-500/20 ${isSpeaking ? 'animate-[spin_4s_linear_infinite]' : ''}`} style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
                                 <div className={`absolute -inset-2 rounded-full border-2 border-purple-500/30 ${isSpeaking ? 'animate-[spin_3s_linear_infinite_reverse]' : ''}`} style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }} />
                                 <div className={`relative w-40 h-40 rounded-full p-2 z-10 ${isSpeaking ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_60px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`}>
                                    <img src={interviewer?.avatar || 'https://ui-avatars.com/api/?name=Syed&background=4f46e5&color=fff&size=200&bold=true'} alt="Interviewer" className="w-full h-full rounded-full object-cover border-4 border-[#0a0a0c]" />
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-slate-900 shadow-lg shadow-indigo-500/20 text-white">AI</div>
                                 </div>
                                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">{interviewer?.name || 'Syed'}</p>
                              </div>

                              {/* Dynamic Waveform Center */}
                              <div className="flex flex-col items-center justify-center w-48 h-32 gap-2">
                                 <div className="flex items-center gap-1.5 h-16">
                                    {[...Array(24)].map((_, i) => {
                                       const isCenter = i >= 8 && i <= 15;
                                       return (
                                          <motion.div 
                                             key={i} 
                                             className={`w-1 rounded-full ${isSpeaking ? 'bg-indigo-500' : isListening ? 'bg-emerald-500' : 'bg-slate-700/50'}`}
                                             animate={{ height: isSpeaking || isListening ? [4, Math.random() * (isCenter ? 60 : 30) + 10, 4] : 4 }}
                                             transition={{ repeat: Infinity, duration: Math.random() * 0.4 + 0.2, ease: 'easeInOut' }}
                                          />
                                       );
                                    })}
                                 </div>
                                 {(isSpeaking || isListening) && (
                                   <div className="text-[9px] font-black uppercase tracking-widest animate-pulse mt-4 text-slate-500">
                                     {isSpeaking ? 'AI Transmitting' : 'Acoustic Feed Active'}
                                   </div>
                                 )}
                              </div>

                              {/* Candidate Avatar with Circular Audio Ring */}
                              <div className="flex flex-col items-center gap-4 relative">
                                 <div className={`absolute -inset-4 rounded-full border-2 border-emerald-500/20 ${isListening && !isSpeaking ? 'animate-[spin_4s_linear_infinite]' : ''}`} style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
                                 <div className={`absolute -inset-2 rounded-full border-2 border-teal-500/30 ${isListening && !isSpeaking ? 'animate-[spin_3s_linear_infinite_reverse]' : ''}`} style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }} />
                                 <div className={`relative w-40 h-40 rounded-full p-2 z-10 ${isListening && !isSpeaking ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}>
                                    <video ref={videoRefMirror} autoPlay playsInline muted className="w-full h-full rounded-full object-cover border-4 border-[#0a0a0c] bg-slate-800 scale-x-[-1]" />
                                    <div className="absolute -bottom-2 -left-2 bg-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-slate-900 shadow-lg shadow-emerald-500/20 text-white">YOU</div>
                                 </div>
                                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">{name}</p>
                              </div>
                           </div>

                           {/* Live Chat Bubbles below */}
                           <div className="w-full max-w-2xl space-y-4">
                              {messages.slice(-2).map((msg, idx) => (
                                 <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-2xl max-w-[85%] ${msg.role === 'assistant' ? 'bg-indigo-500/10 border border-indigo-500/20 self-start rounded-tl-sm backdrop-blur-md' : 'bg-emerald-500/10 border border-emerald-500/20 self-end ml-auto rounded-tr-sm text-right backdrop-blur-md'}`}
                                 >
                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                 </motion.div>
                              ))}
                              {isThinking && (
                                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl w-24 rounded-tl-sm flex items-center justify-center gap-1.5 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                 </div>
                              )}
                              {isListening && !isSpeaking && input && (
                                 <div className="p-5 rounded-2xl max-w-[85%] bg-emerald-500/10 border border-emerald-500/20 self-end ml-auto rounded-tr-sm text-right backdrop-blur-md">
                                    <p className="text-sm font-medium leading-relaxed opacity-80">{input}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-2">Transcribing...</p>
                                 </div>
                              )}
                           </div>
                           
                           {/* Voice Controls */}
                           <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0a0a0c]/80 backdrop-blur-xl p-3 border border-white/10 rounded-full shadow-2xl z-50">
                              <button onClick={toggleListening} className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all ${isListening ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white'}`}>
                                 <Mic className="w-6 h-6" />
                              </button>
                              {isListening && input && (
                                 <button onClick={send} className="px-6 h-14 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-indigo-50 transition-all flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Send Reply
                                 </button>
                              )}
                           </div>
                        </div>


                     </motion.div>
                  ) : activeTab === 'simulation' ? (
                    <motion.div 
                      key="sim"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="space-y-8 pb-32"
                    >
                       {/* 1. Header: Mission Control Hub */}
                       <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                          {/* Ambient glow backing */}
                          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                          <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
                          
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                             <div className="space-y-3 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[9px] font-black tracking-widest uppercase">
                                   <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md">
                                      {scenario?.company || 'Corporate Client'}
                                   </span>
                                   <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                                      {scenario?.role || 'Developer'} Track
                                   </span>
                                   <span className="text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-md">
                                      {scenario?.difficulty || 'Advanced'}
                                   </span>
                                </div>
                                
                                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text">
                                   {scenario?.title || 'Interactive Job Simulator'}
                                </h2>
                                
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                                   <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                   {scenario?.subtitle}
                                </p>
                             </div>

                             {/* System Diagnostic Panel */}
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl p-4 min-w-[280px]">
                                <div className="text-left pr-4 border-r border-white/5">
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Environment</p>
                                   <p className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                                      <Terminal className="w-3 h-3" />
                                      SANDBOX_ACTIVE
                                   </p>
                                </div>
                                <div className="text-left pr-4 border-r border-white/5">
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">SLA Threshold</p>
                                   <p className="text-[10px] font-black text-indigo-400 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      &lt; 50ms
                                   </p>
                                </div>
                                <div className="text-left col-span-2 sm:col-span-1">
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Instance Signature</p>
                                   <p className="text-[9px] font-mono text-slate-400 mt-0.5">{scenario?.id || 'SYS-ID-01'}</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* 2. Simulation Background: Operational Briefing File */}
                       <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-950/20 p-6 shadow-inner group hover:border-white/10 transition-all duration-300">
                          {/* Vertical Accent Glow Bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-cyan-500 to-transparent group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300" />
                          
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                   <Briefcase className="w-4 h-4 text-indigo-400" />
                                   Operational Parameters & Briefing
                                </h3>
                                <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">CLASSIFIED // B2B SIMULATION</span>
                             </div>
                             
                             <p className="text-slate-300 leading-relaxed text-xs font-medium whitespace-pre-wrap pl-2 select-text">
                                {scenario?.overview}
                             </p>
                          </div>
                       </div>

                       {/* 3. Mapped Skills: Core Competency Diagnostics */}
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                             <Activity className="w-4 h-4 text-cyan-400" />
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Competency Diagnostics</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {scenario?.skills?.map((skill: any, idx: number) => {
                               // Calculate segments for the visual bar (10 segments)
                               const totalSegments = 10;
                               const filledSegments = Math.round((skill.weight / 100) * totalSegments);
                               
                               return (
                                 <motion.div 
                                   key={idx}
                                   whileHover={{ y: -4, scale: 1.01 }}
                                   className="relative p-5 bg-slate-950/60 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-indigo-500/20 hover:shadow-[0_0_25px_rgba(99,102,241,0.05)] transition-all duration-300 group"
                                 >
                                    <div className="space-y-1">
                                       <div className="flex items-center justify-between">
                                          <p className="text-xs font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">{skill.name}</p>
                                          <span className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">
                                             {skill.level}
                                          </span>
                                       </div>
                                       <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                                          {skill.description || 'Evaluating runtime execution and optimization metrics.'}
                                       </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                       <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                          <span>Evaluation Weight</span>
                                          <span className="text-indigo-400">{skill.weight}%</span>
                                       </div>
                                       
                                       {/* Segmented hardware-style visualization bar */}
                                       <div className="flex gap-1 h-2 w-full">
                                          {Array.from({ length: totalSegments }).map((_, segmentIdx) => {
                                             const isFilled = segmentIdx < filledSegments;
                                             return (
                                                <div 
                                                   key={segmentIdx} 
                                                   className={`h-full flex-1 rounded-sm transition-all duration-500 ${
                                                      isFilled 
                                                         ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                                         : 'bg-white/5'
                                                   }`}
                                                />
                                             );
                                          })}
                                       </div>
                                    </div>
                                 </motion.div>
                               );
                             })}
                          </div>
                       </div>

                       {/* 4. Project Checklist: System Integration Tasks */}
                       <div className="space-y-4 pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
                                   Integration Checklist & Tasks
                                </h3>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                {/* Visual progress meter */}
                                <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/5 rounded-full px-3 py-1 text-[9px] font-mono text-slate-400">
                                   <span>PROGRESS:</span>
                                   <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden inline-block mx-1">
                                      <div 
                                         className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                                         style={{ width: `${scenario?.tasks?.length ? (completedTasks.length / scenario.tasks.length) * 100 : 0}%` }}
                                      />
                                   </div>
                                   <span className="text-emerald-400 font-bold">
                                      {scenario?.tasks?.length ? Math.round((completedTasks.length / scenario.tasks.length) * 100) : 0}%
                                   </span>
                                </div>
                                
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                                   {completedTasks.length} / {scenario?.tasks?.length || 0} Operational
                                </span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                             {scenario?.tasks?.map((task: any) => {
                               const isDone = completedTasks.includes(task.id);
                               return (
                                 <motion.div 
                                   key={task.id}
                                   whileHover={{ x: 4 }}
                                   onClick={() => {
                                     if (isDone) {
                                       setCompletedTasks(prev => prev.filter(id => id !== task.id));
                                     } else {
                                       setCompletedTasks(prev => [...prev, task.id]);
                                     }
                                   }}
                                   className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                                     isDone 
                                       ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                                       : 'bg-[#0a0a0c] border-white/5 hover:border-white/10 hover:bg-[#111115]'
                                   }`}
                                 >
                                    {/* High-tech animated checkbox */}
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                      isDone 
                                         ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                                         : 'border-white/20 bg-white/5 group-hover:border-white/40'
                                    }`}>
                                       {isDone ? (
                                          <Check className="w-3.5 h-3.5 text-black stroke-[3px]" />
                                       ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-white/20 transition-all" />
                                       )}
                                    </div>
                                    
                                    <div className="flex-1 space-y-1">
                                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                          <p className={`text-xs font-bold tracking-tight transition-all duration-300 ${
                                             isDone ? 'text-emerald-400/80 line-through' : 'text-white'
                                          }`}>
                                             {task.title}
                                          </p>
                                          
                                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md self-start sm:self-center transition-all ${
                                             isDone 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-white/5 text-slate-500 border border-transparent'
                                          }`}>
                                             {isDone ? 'VERIFIED' : 'PENDING'}
                                          </span>
                                       </div>
                                       
                                       <p className={`text-[10px] font-medium leading-relaxed transition-colors ${
                                          isDone ? 'text-slate-500' : 'text-slate-400'
                                       }`}>
                                          {task.description}
                                       </p>
                                    </div>
                                 </motion.div>
                               );
                             })}
                          </div>
                       </div>

                       {/* 5. Direct Uplink to Technical Lead */}
                       {isMock && (
                          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <div className="text-left">
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Architect Uplink Channel</p>
                                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                      Connected to: {interviewer?.name || 'Syed'} ({interviewer?.role || 'Lead Architect'})
                                   </p>
                                </div>
                             </div>
                             
                             <button 
                                onClick={() => setInput("Can you give me a hint on this simulation task? I'm a bit stuck on implementation.")} 
                                className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/25 hover:border-amber-500/40 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] cursor-pointer"
                             >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                   Request Architectural Assist
                                </span>
                                {/* Hover sweep highlight */}
                                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                   <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                      initial={{ x: '-100%' }}
                                      whileHover={{ x: '100%' }}
                                      transition={{ repeat: Infinity, repeatType: "loop", duration: 1.2, ease: "easeInOut" }}
                                   />
                                </div>
                             </button>
                          </div>
                       )}
                    </motion.div>
                  ) : (
                   <motion.div 
                     key="c"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="h-full flex overflow-hidden"
                   >
                      {/* Left side: Problem Description */}
                      <div className="w-1/4 border-r border-[var(--border-color)] bg-[var(--card-bg)] p-6 overflow-y-auto flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                           <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                              {question.difficulty || 'Hard'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Time Limit: 60 mins
                           </span>
                        </div>
                        <h2 className="text-2xl font-black mb-6">{question.title || 'Coding Challenge'}</h2>
                        <div className="prose prose-invert max-w-none text-sm space-y-4">
                           {question.prompt?.split('\n').map((line: string, i: number) => (
                              <p key={i} className="leading-relaxed text-[var(--text)] opacity-90">{line}</p>
                           ))}
                        </div>
                        <div className="mt-8 space-y-4">
                           {/* Placeholder for standard LeetCode style sections if not in prompt */}
                           {question.prompt && !question.prompt.toLowerCase().includes('constraints') && (
                             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Constraints & Assumptions</h3>
                                <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                                   <li>Optimize for Time Complexity O(N) where applicable.</li>
                                   <li>Memory limits are enforced (256MB).</li>
                                </ul>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* Right side: Editor & Console */}
                      <div className={`${showPrampDeck ? 'flex-1' : 'w-3/4'} flex flex-col bg-[var(--bg)] overflow-hidden`}>
                        {/* IDE Toolbar */}
                        <div className="flex items-center justify-between bg-white/5 p-3 border-b border-white/5">
                           <div className="flex gap-2">
                              <select 
                                value={language} onChange={e => setLanguage(e.target.value)}
                                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest outline-none focus:border-indigo-500 transition-all">
                                 <option value="javascript">JavaScript (Node 20)</option>
                                 <option value="typescript">TypeScript (5.0)</option>
                                 <option value="python">Python (3.11)</option>
                                 <option value="cpp">C++ (GCC 13)</option>
                                 <option value="java">Java (OpenJDK 21)</option>
                                 <option value="go">Go (1.16)</option>
                                 <option value="rust">Rust (1.50)</option>
                              </select>
                              <div className="flex gap-1 bg-[var(--card-bg)] p-1 rounded-lg border border-[var(--border-color)]">
                                 <button onClick={() => setActiveEditorTab('scratch')} 
                                   className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${activeEditorTab === 'scratch' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-[var(--text)]'}`}>
                                   Scratchpad
                                 </button>
                                 <button onClick={() => setActiveEditorTab('final')} 
                                   className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${activeEditorTab === 'final' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-[var(--text)]'}`}>
                                   Final Code
                                 </button>
                                 <button onClick={() => setActiveEditorTab('terminal')} 
                                   className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeEditorTab === 'terminal' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-[var(--text)]'}`}>
                                   <Terminal className="w-3 h-3" /> Sandbox
                                 </button>
                                 <button onClick={() => setActiveEditorTab('canvas')} 
                                   className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeEditorTab === 'canvas' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-[var(--text)]'}`}>
                                   <LayoutDashboard className="w-3 h-3" /> Canvas
                                 </button>
                              </div>
                              {isMock && (
                                 <button 
                                    onClick={() => setShowPrampDeck(!showPrampDeck)}
                                    className={`px-3 py-1 border rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                                       showPrampDeck 
                                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                    }`}
                                 >
                                    <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                                    Pramp Deck
                                 </button>
                              )}
                           </div>
                           <div className="flex gap-2">
                              <button 
                                 onClick={handleRunCode}
                                 disabled={isCodeRunning}
                                 className={`px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                   isCodeRunning 
                                     ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                                     : execSuccess === true
                                     ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                                     : execSuccess === false
                                     ? 'bg-rose-600/10 border-rose-500/30 text-rose-400 hover:bg-rose-600/20'
                                     : 'bg-white/5 border-white/10 hover:bg-white/10'
                                 }`}
                               >
                                 {isCodeRunning 
                                   ? <><div className="w-3 h-3 border-2 border-white/20 border-t-[var(--text)] rounded-full animate-spin" /> Executing...</>
                                   : execSuccess === true
                                   ? <><CheckCircle className="w-3 h-3" /> Ran OK {execTime !== null ? `· ${execTime}ms` : ''}</>
                                   : execSuccess === false
                                   ? <><AlertCircle className="w-3 h-3" /> Run Code</>
                                   : <><Play className="w-3 h-3 text-indigo-400" /> Run Code</>
                                 }
                               </button>
                              <button onClick={handleFinish}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
                                 <Send className="w-3 h-3" /> Submit Final Solution
                              </button>
                           </div>
                        </div>
                        {/* Editor Split View */}
                        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg)]">
                          <div className="flex-1 relative">
                            {activeEditorTab === 'scratch' ? (
                              <textarea
                                value={scratchpad}
                                onChange={e => setScratchpad(e.target.value)}
                                className="w-full h-full bg-transparent p-8 text-[13px] font-mono text-amber-300/80 focus:outline-none resize-none"
                                spellCheck={false}
                              />
                            ) : activeEditorTab === 'final' ? (
                              <CodeIDE
                                problem="Solve the problem discussed with the AI Interviewer. Apply the approach you described in your answers."
                                difficulty="Medium"
                                language={language}
                                initialCode={code}
                                tags={['Interview', 'Live Coding']}
                                onSubmit={(newCode, newLang) => {
                                  setCode(newCode);
                                  setLanguage(newLang);
                                  handleFinish();
                                }}
                              />
                            ) : activeEditorTab === 'terminal' ? (
                              <div className="w-full h-full bg-black/50 p-6 flex flex-col font-mono text-[12px]">
                                <div className="flex-1 overflow-y-auto space-y-1">
                                  {terminalLogs.map((log, i) => (
                                    <div key={i} className={log.includes('Error') || log.includes('Exception') ? 'text-rose-400' : 'text-slate-300'}>{log}</div>
                                  ))}
                                </div>
                                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                                  <span className="text-emerald-500 font-black">~/sandbox $</span>
                                  <input 
                                    type="text" 
                                    value={terminalInput}
                                    onChange={e => setTerminalInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && terminalInput.trim()) {
                                        setTerminalLogs(prev => [...prev, `~/sandbox $ ${terminalInput}`, `Error: Cannot execute '${terminalInput}'. Sandbox environment disconnected.`]);
                                        setTerminalInput('');
                                      }
                                    }}
                                    className="flex-1 bg-transparent outline-none text-white font-mono"
                                    placeholder="Enter terminal command..."
                                  />
                                </div>
                              </div>
                            ) : activeEditorTab === 'canvas' ? (
                              <div className="w-full h-full bg-white relative">
                                 <Excalidraw />
                              </div>
                            ) : null}
                            
                            {/* Code Editor Status Bar & Live Linting */}
                            <div className="absolute bottom-4 right-8 flex items-center gap-4 px-3 py-1.5 bg-[var(--card-bg)] rounded-full border border-[var(--border-color)] backdrop-blur-md">
                               <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">UTF-8</span>
                               <div className="w-px h-2 bg-white/10" />
                               <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Line {code.split('\n').length}, Col {code.length}</span>
                               <div className="w-px h-2 bg-white/10" />
                               <span className={`text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${lintErrors.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {lintErrors.length > 0 ? <><AlertCircle className="w-2.5 h-2.5" /> {lintErrors.length} Warnings</> : <><CheckCircle className="w-2.5 h-2.5" /> No Issues</>}
                               </span>
                            </div>
                          </div>

                          {/* Console Area */}
                          <div className="h-48 border-t border-[var(--border-color)] bg-[var(--card-bg)] flex overflow-hidden">
                             <div className="flex-1 border-r border-[var(--border-color)] flex flex-col">
                                <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
                                   <Terminal className="w-3 h-3 text-slate-500" />
                                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Input Console</span>
                                </div>
                                <textarea 
                                  value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                                  placeholder="Provide standard input here..."
                                  className="flex-1 bg-transparent p-4 text-[11px] font-mono opacity-80 outline-none resize-none"
                                />
                             </div>
                             <div className="flex-1 flex flex-col bg-black/20">
                                <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <Monitor className="w-3 h-3 text-indigo-500" />
                                     <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Execution Output</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                     {execTime !== null && <span className="text-[8px] font-black text-slate-500">{execTime}ms</span>}
                                     {execSuccess === true && <span className="text-[8px] font-black text-emerald-400">OK</span>}
                                     {execSuccess === false && <span className="text-[8px] font-black text-rose-400">Error</span>}
                                   </div>
                                </div>
                                <div className={`flex-1 p-4 text-[11px] font-mono whitespace-pre overflow-y-auto ${execSuccess === false ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                   {consoleOutput || '> System idle. Write code and click Run.'}
                                </div>
                             </div>
                          </div>
                        </div>
                         {showPrampDeck && (
                            <div className="w-[320px] shrink-0 border-l border-white/10 bg-[#0e0e12] p-5 overflow-y-auto flex flex-col gap-6 relative z-10">
                               {/* Header */}
                               <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                     <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                                       <Activity className="w-3.5 h-3.5" /> Pramp Companion
                                     </h3>
                                     <button onClick={() => setShowPrampDeck(false)} className="text-slate-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">COLLABORATIVE MOCK WORKSPACE</p>
                               </div>

                               {/* 1. Rubrics */}
                               <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Interviewer Rubric Checklist</p>
                                  <div className="space-y-3">
                                     {Object.entries(prampRatings).map(([key, val]) => (
                                        <div key={key} className="space-y-1">
                                           <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                                              <span className="text-cyan-400 font-mono">{val}/5</span>
                                           </div>
                                           <input 
                                              type="range" min="1" max="5" value={val} 
                                              onChange={e => setPrampRatings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                              className="w-full accent-cyan-500 bg-white/5 h-1 rounded-full outline-none cursor-pointer"
                                           />
                                        </div>
                                     ))}
                                  </div>
                               </div>

                               {/* 2. Complexity Targets */}
                               {(() => {
                                  const prampData = getPrampCompanionData(track);
                                  return (
                                    <>
                                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Optimal Complexity Metrics</p>
                                         <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                               <span className="text-[7px] text-slate-500 block mb-0.5">Target Time</span>
                                               <span className="text-indigo-400 text-xs font-mono lowercase">{prampData.targetTime}</span>
                                            </div>
                                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                               <span className="text-[7px] text-slate-500 block mb-0.5">Target Space</span>
                                               <span className="text-violet-400 text-xs font-mono lowercase">{prampData.targetSpace}</span>
                                            </div>
                                         </div>
                                      </div>

                                      {/* 3. Hint Disclosure Tree */}
                                      <div className="space-y-2">
                                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Hint Disclosure Pipeline</p>
                                         <div className="space-y-2">
                                            {prampData.hints.map((hint, idx) => {
                                               const isRevealed = prampHintsRevealed.includes(idx);
                                               return (
                                                  <div key={idx} className={`border rounded-2xl p-3.5 transition-all ${
                                                     isRevealed ? 'bg-[#0a0a0d] border-cyan-500/20' : 'bg-black/20 border-white/5'
                                                  }`}>
                                                     <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hint #{idx + 1}</span>
                                                        {!isRevealed && (
                                                           <button 
                                                              onClick={() => setPrampHintsRevealed(prev => [...prev, idx])}
                                                              className="text-[8px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md"
                                                           >
                                                              Reveal Hint
                                                           </button>
                                                        )}
                                                     </div>
                                                     {isRevealed && (
                                                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-medium transition-all animate-fadeIn">
                                                           {hint}
                                                        </p>
                                                     )}
                                                  </div>
                                               );
                                            })}
                                         </div>
                                      </div>

                                      {/* 4. Model Solution Cheat Code */}
                                      <div className="border border-white/5 rounded-2xl bg-black/40 overflow-hidden">
                                         <button 
                                            onClick={() => setPrampHintsRevealed(prev => prev.includes(99) ? prev.filter(x => x !== 99) : [...prev, 99])}
                                            className="w-full px-4 py-3 bg-white/5 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all"
                                         >
                                            <span>Interviewer Model Solution</span>
                                            <span className="text-cyan-400 font-mono">{prampHintsRevealed.includes(99) ? 'HIDE' : 'SHOW'}</span>
                                         </button>
                                         {prampHintsRevealed.includes(99) && (
                                            <div className="p-3 bg-[#050508] border-t border-white/5">
                                               <pre className="text-[8px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                                                  {prampData.solution}
                                               </pre>
                                            </div>
                                         )}
                                      </div>
                                    </>
                                  );
                               })()}
                            </div>
                         )}
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* Right: Neural Assessment Hub */}
         <div className="w-[450px] border-l border-white/5 bg-[#0a0a0c]/50 backdrop-blur-3xl flex flex-col overflow-hidden relative shadow-2xl shrink-0">
            
            {/* Interviewer & Sync Status */}
            <div className="h-[260px] w-full bg-slate-950 relative overflow-hidden shrink-0 border-b border-white/5">
               {/* Ambient Neural Pulsing */}
               <AnimatePresence>
                 {isSpeaking && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />
                 )}
               </AnimatePresence>

               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4" style={{ perspective: 1000 }}>
                  <motion.div 
                     className="relative"
                     animate={{ rotateY: isSpeaking ? [0, 15, -15, 0] : [0, 2, -2, 0], rotateX: isSpeaking ? [0, 5, -5, 0] : 0 }}
                     transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                     style={{ transformStyle: 'preserve-3d' }}
                  >
                    {isSpeaking && (
                      <motion.div className="absolute inset-[-20px] rounded-full border border-indigo-500/40"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8], rotateZ: [0, 180, 360] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} 
                        style={{ translateZ: -50 }} />
                    )}
                     <div className={`w-28 h-28 rounded-full overflow-hidden border-2 transition-all duration-500 ${isSpeaking ? 'border-indigo-500 shadow-[0_0_60px_rgba(79,70,229,0.8)]' : 'border-white/10 shadow-xl shadow-black/50'}`}>
                       <motion.img 
                         src={interviewer?.avatar || 'https://ui-avatars.com/api/?name=Syed&background=4f46e5&color=fff&size=200&bold=true&font-size=0.4'}
                         alt="Interviewer" 
                         className="w-full h-full object-cover bg-slate-900"
                         animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                         transition={{ repeat: Infinity, duration: 2 }}
                       />
                     </div>
                     {/* 3D Holographic Base glow */}
                     {isSpeaking && (
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-3 bg-indigo-500/40 blur-xl rounded-full" />
                     )}
                  </motion.div>
                   <div>
                      <h3 className="text-[11px] font-black text-white tracking-[0.3em] leading-none mb-1">{interviewer?.name || 'SYED'}</h3>
                      <div className="flex items-center justify-center gap-1.5">
                         <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                           animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                           transition={{ repeat: Infinity, duration: 2 }} />
                         <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                           {isSpeaking ? `${interviewer?.name || 'SYED'} IS SPEAKING...` : isThinking ? `${interviewer?.name || 'SYED'} IS THINKING...` : `${interviewer?.role || 'SENIOR INTERVIEWER'} · InterviewOS`}
                         </p>
                      </div>
                   </div>
               </div>

               {/* Acoustic Signal Visualization */}
               <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                  <div className="flex gap-1 items-end h-6">
                     {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                       <motion.div key={i} className="w-0.5 bg-indigo-500/30 rounded-full"
                         animate={{ height: isSpeaking ? [4, 18, 4] : 4 }}
                         transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }} />
                     ))}
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">Session Sync: {syncVal.toFixed(1)}%</span>
                  </div>
               </div>
            </div>


            {/* Dialogue Nexus */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-[#020204]/80 backdrop-blur-3xl">
               {messages.map((m, i) => (
                 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} 
                   className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'} gap-4`}>
                   
                   {/* System Avatar */}
                   {m.role === 'assistant' && (
                     <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-2 bg-indigo-500 border border-white/10 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                        <img src={interviewer?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Syed'} alt="AI" className="w-full h-full object-cover bg-slate-900" />
                     </div>
                   )}

                   <div className={`flex flex-col ${m.role === 'assistant' ? 'items-start' : 'items-end'} max-w-[85%]`}>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            {m.role === 'assistant' ? `SYSTEM: ${interviewer?.name || 'SYED'}` : `CANDIDATE: ${name.split(' ')[0]}`}
                          </span>
                          <div className={`w-1 h-1 rounded-full ${m.role === 'assistant' ? 'bg-indigo-500 shadow-[0_0_5px_rgba(79,70,229,1)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]'}`} />
                       </div>
                       <div className={`p-5 rounded-2xl text-[12px] font-medium leading-relaxed tracking-tight shadow-xl ${
                         m.role === 'assistant' ? 'bg-white/[0.02] border border-white/10 text-slate-300 rounded-tl-sm backdrop-blur-md' : 'bg-indigo-600 border border-indigo-500 text-white shadow-[0_5px_20px_rgba(79,70,229,0.3)] rounded-tr-sm'
                       }`}>
                          {m.content}
                       </div>
                   </div>

                   {/* Candidate Avatar */}
                   {m.role === 'user' && (
                     <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-2 bg-slate-800 border border-white/10">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} alt="Candidate" className="w-full h-full object-cover" />
                     </div>
                   )}
                 </motion.div>
               ))}
               {isThinking && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-2 bg-indigo-500 border border-white/10 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                        <img src={interviewer?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Syed'} alt="AI" className="w-full h-full object-cover bg-slate-900" />
                    </div>
                    <div className="flex flex-col items-start max-w-[85%]">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">SYSTEM: {interviewer?.name || 'SYED'}</span>
                           <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,1)]" />
                        </div>
                        <div className="p-5 rounded-2xl rounded-tl-sm bg-white/[0.02] border border-white/10 flex gap-1.5 items-center shadow-xl backdrop-blur-md">
                           {[0, 1, 2].map(i => (
                             <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                               animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                           ))}
                        </div>
                    </div>
                 </motion.div>
               )}
            </div>

            {/* Response Protocol */}
            <div className="p-8 bg-slate-950/80 border-t border-white/5 relative shrink-0 backdrop-blur-md">
               
               <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                     {isListening && (
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-1 items-end h-4 pointer-events-none z-10">
                          {[1, 2, 3, 4, 5].map(i => (
                            <motion.div key={i} className="w-0.5 bg-indigo-500/60 rounded-full"
                              animate={{ height: [4, 16, 4] }}
                              transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }} />
                          ))}
                       </div>
                     )}
                     <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                       placeholder={isListening ? "" : "Input Response Protocol..."}
                       className={`w-full bg-[#050508] border ${isListening ? 'border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.25)]' : 'border-white/5'} rounded-[20px] px-6 py-5 text-[12px] text-white focus:ring-1 focus:ring-indigo-500/40 outline-none transition-all placeholder:text-slate-700 font-medium ${isListening ? 'pl-16' : ''}`} />
                     <button onClick={toggleListening} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-all p-2 rounded-xl ${isListening ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-indigo-400'}`}>
                       <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                     </button>
                  </div>
                  <button onClick={send} disabled={!input.trim() || isThinking} className="bg-white hover:bg-slate-200 disabled:opacity-20 text-black p-5 rounded-[20px] shadow-2xl transition-all shrink-0 active:scale-95">
                    <Send className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Neural Load Indicator */}
            <div className="h-1.5 w-full bg-white/5 overflow-hidden">
               <motion.div className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.8)]" 
                 animate={{ width: questions.length ? `${((currentQ + 1) / questions.length) * 100}%` : '0%' }} transition={{ duration: 1.2, ease: 'circOut' }} />
            </div>

           {/* Metrics Bar */}
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600/10 overflow-hidden">
              <div className="w-full bg-indigo-500" style={{ height: '40%' }} />
           </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-slate-950 border-t border-white/5 px-8 py-2.5 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <ShieldAlert className="w-3 h-3 text-emerald-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Environment Security: SECURE</span>
            </div>
            <div className="h-4 w-px bg-white/5" />
            <div className="flex items-center gap-2">
               <Shield className="w-3 h-3 text-indigo-400" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Proctoring Active</span>
            </div>
            <div className="h-4 w-px bg-white/5" />
            <div className="flex items-center gap-2">
               <AlertCircle className={`w-3 h-3 ${violations > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
               <span className={`text-[9px] font-black uppercase tracking-widest ${violations > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                 Violations: {violations}/{MAX_VIOLATIONS}
               </span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assessment Mode: ACTIVE</span>
         </div>
      </div>

        {/* Voice Control Panel (Floating) */}
        <div className="fixed bottom-24 left-8 z-[100]">
           <AnimatePresence>
              {isVoicePanelOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="mb-4 w-72 bg-[#0e0e11]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                   <div className="p-5 bg-gradient-to-r from-violet-700 to-indigo-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Volume2 className="w-4 h-4 text-white" />
                         <div>
                            <p className="text-[11px] font-black text-white tracking-widest">Voice Controls</p>
                            <p className="text-[7px] text-violet-200 font-bold uppercase tracking-widest">AI Interviewer Audio</p>
                         </div>
                      </div>
                      <button onClick={() => setIsVoicePanelOpen(false)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
                   </div>
                   <div className="p-5 space-y-5">
                      {/* Mute Toggle */}
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Interviewer Voice</span>
                         <button onClick={() => setVoiceMuted(!voiceMuted)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                             voiceMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                           }`}>
                           {voiceMuted ? <><VolumeX className="w-3 h-3" /> Muted</> : <><Volume2 className="w-3 h-3" /> On</>}
                         </button>
                      </div>
                      {/* Speed Slider */}
                      <div className="space-y-2">
                         <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Speaking Speed</span>
                            <span className="text-[10px] font-black text-indigo-400">{voiceSpeed.toFixed(2)}x</span>
                         </div>
                         <input type="range" min="0.6" max="1.4" step="0.05" value={voiceSpeed} onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                           className="w-full accent-indigo-500 cursor-pointer" />
                         <div className="flex justify-between text-[7px] font-black text-slate-600 uppercase tracking-widest">
                            <span>Slow</span><span>Normal</span><span>Fast</span>
                         </div>
                      </div>
                      {/* Voice Gender */}
                      <div className="space-y-2">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Voice Gender</span>
                         <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['default', 'male', 'female'] as const).map(g => (
                              <button key={g} onClick={() => setVoiceGender(g)}
                                className={`py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all capitalize ${
                                  voiceGender === g ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                                }`}>{g}</button>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
           <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
             onClick={() => setIsVoicePanelOpen(!isVoicePanelOpen)}
             className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.4)] border-2 border-violet-500/50 relative group">
              <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-ping pointer-events-none" />
              {voiceMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white group-hover:animate-pulse" />}
           </motion.button>
        </div>

        {/* Aura Support Bot (Floating) */}
        <div className="fixed bottom-24 right-8 z-[100]">
           <AnimatePresence>
              {isSupportOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="mb-4 w-80 bg-[#0e0e11]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[450px]">
                   <div className="p-5 bg-indigo-600 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shrink-0 shadow-lg bg-indigo-500">
                           <img src="https://api.dicebear.com/7.x/lorelei/svg?seed=Aura" alt="Aura" className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-white tracking-widest leading-none mb-1">Aura</p>
                            <div className="flex items-center gap-1.5">
                               <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                               <span className="text-[7px] font-bold text-indigo-100 uppercase tracking-widest leading-none">Your Virtual Assistant</span>
                            </div>
                         </div>
                      </div>
                      <button onClick={() => setIsSupportOpen(false)} className="text-white/60 hover:text-white transition-colors">
                         <X className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-indigo-600/5">
                      {supportMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'aura' ? 'justify-start' : 'justify-end'} gap-2`}>
                           {msg.role === 'aura' && (
                             <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-1 shadow-sm bg-indigo-500/20">
                               <img src="https://api.dicebear.com/7.x/lorelei/svg?seed=Aura" alt="Aura" className="w-full h-full object-cover" />
                             </div>
                           )}
                           <div className={`max-w-[80%] p-3.5 rounded-2xl text-[11px] font-medium leading-relaxed ${
                             msg.role === 'aura' ? 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-sm' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 rounded-tr-sm'
                           }`}>
                              {msg.content}
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-4 bg-black/40 border-t border-white/5">
                      <div className="relative">
                         <input 
                           value={supportInput} 
                           onChange={e => setSupportInput(e.target.value)}
                           onKeyDown={e => {
                             if (e.key === 'Enter' && supportInput.trim()) {
                               const newMsgs: { role: 'user' | 'aura'; content: string }[] = [...supportMessages, { role: 'user', content: supportInput }];
                               setSupportMessages(newMsgs);
                               setSupportInput('');
                               // Simulated Aura Response
                               setTimeout(() => {
                                 setSupportMessages(prev => [...prev, { role: 'aura', content: "I've noted your request. I am here to ensure your interview goes smoothly. Our engineers are also monitoring this session to help if needed! How else can I assist?" }]);
                               }, 800);
                             }
                           }}
                           placeholder="Describe your issue..."
                           className="w-full bg-[#0a0a0c] border border-white/5 rounded-2xl pl-5 pr-12 py-3 text-[10px] text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                         />
                         <button className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
                            <Send className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
           
           <motion.button 
             whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
             onClick={() => setIsSupportOpen(!isSupportOpen)}
             className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(79,70,229,0.5)] border-2 border-indigo-400/50 group relative"
           >
              {/* Pulsing ring for the bot */}
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping pointer-events-none" />
              <AnimatePresence mode="wait">
                 {isSupportOpen ? (
                   <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X className="w-6 h-6 text-white" />
                   </motion.div>
                 ) : (
                   <motion.div key="h" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="relative w-full h-full rounded-full overflow-hidden border-2 border-transparent">
                      <img src="https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=Aura&backgroundColor=4f46e5" alt="Aura" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-indigo-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
                   </motion.div>
                 )}
              </AnimatePresence>
           </motion.button>
        </div>

         {/* Floating Draggable Candidate Camera Card */}
         <motion.div 
            drag
            dragMomentum={false}
            dragConstraints={{ left: -2000, right: 20, top: -2000, bottom: 20 }}
            className="fixed bottom-8 right-8 z-[150] w-[280px] rounded-2xl overflow-hidden border border-white/20 bg-[#070709]/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col group cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors"
         >
            {/* Drag Handle (Visible on Hover) */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-30 flex items-start justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
               <GripHorizontal className="w-5 h-5 text-white/70 drop-shadow-md" />
            </div>

            {/* Video Feed */}
            <div className="relative w-full aspect-[4/3] bg-slate-900 pointer-events-none">
               {stream ? (
                  <video 
                     ref={videoRef} 
                     autoPlay 
                     playsInline 
                     muted 
                     className="w-full h-full object-cover scale-x-[-1]" 
                  />
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80">
                     <User className="text-slate-600 w-10 h-10 animate-pulse mb-2" />
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initializing Camera...</p>
                  </div>
               )}
               
               {/* Pulsing overlay shadow for a premium feel */}
               <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] z-10" />

               {/* Integrity Status overlay */}
               <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 z-20 shadow-lg">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                     (phoneDetected || faceCount !== 1 || violations > 0) ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  }`} />
                  <span className="text-[7px] font-black tracking-widest text-slate-200 uppercase drop-shadow-sm">
                     {(phoneDetected || faceCount !== 1 || violations > 0) ? 'Alert Mode' : 'Secure Pilot'}
                  </span>
               </div>
               
               {/* Camera label */}
               <div className="absolute bottom-3 left-3 text-[7px] font-black text-white/90 uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 z-20 shadow-lg">
                  Feed: Candidate Camera
               </div>
            </div>
         </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default function SessionPage() {
  const [isMounted, setIsMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Loading Interview Session...</div>;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[11px] font-black uppercase tracking-widest animate-pulse">Syncing...</div>}>
      <SessionContent />
    </Suspense>
  );
}




