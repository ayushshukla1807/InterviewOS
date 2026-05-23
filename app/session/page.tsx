'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, Send, Mic, Sparkles, AlertCircle, 
  ChevronLeft, LayoutDashboard, TrendingUp, Clock, 
  Shield, CheckCircle, BarChart3, Code2, MessageSquare,
  Maximize2, Play, Power, Volume2, VolumeX, ShieldAlert, Headphones, X, Terminal, Monitor,
  Briefcase, ListTodo, CheckCircle2
} from 'lucide-react';

type Message = { role: 'assistant' | 'user'; content: string; };
type TabType = 'simulation' | 'code';

import dynamic from 'next/dynamic';
const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw), { ssr: false });

import { questionEngine } from '../../lib/db/questions';
import { INTERVIEWER_PERSONA } from '../../lib/ai/prompts';
import { getScenarioByTrack } from '../../lib/db/scenarios';

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') || 'Candidate';
  const track = (searchParams.get('track') || 'JS');
  const isMock = searchParams.get('mock') === 'true'; // controls hint visibility
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>(track === 'DYNAMIC' ? 'simulation' : 'code');
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

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => {
      setGazeVal(prev => Math.min(100, Math.max(92, prev + (Math.random() - 0.5) * 2)));
      setNoiseVal(prev => Math.min(55, Math.max(38, prev + (Math.random() - 0.5) * 4)));
      setSyncVal(prev => Math.min(100, Math.max(99.1, prev + (Math.random() - 0.5) * 0.1)));
    }, 2000);
    return () => clearInterval(interval);
  }, [isStarted]);

  // ─── PROCTORING STATE (KOYO AI INTEGRATION) ──────────────────────
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [terminated, setTerminated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const [scratchpad, setScratchpad] = useState('// Neural Scratchpad: Draft your logic here before final submission...');
  const [activeEditorTab, setActiveEditorTab] = useState<'scratch' | 'final' | 'terminal' | 'canvas'>('scratch');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['> Sandbox initialized.', '> run `npm start` to begin.']);
  const [terminalInput, setTerminalInput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [execTime, setExecTime] = useState<number | null>(null);
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);

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
    const savedProfile = localStorage.getItem('hyrte_candidate_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setCandidateProfile(parsedProfile);
    }

    if (track === 'DYNAMIC') {
      const savedCtx = localStorage.getItem('hyrte_candidate_context');
      if (savedCtx) {
        const ctx = JSON.parse(savedCtx);
        setDynamicContext(ctx);
        fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ctx)
        })
        .then(res => res.json())
        .then(data => {
          setQuestions(data.questions || []);
          setIsGeneratingQuestions(false);
        })
        .catch(err => {
          console.error(err);
          setQuestions(questionEngine.getQuestionsByTrack('JS').slice(0, 4));
          setIsGeneratingQuestions(false);
        });
      } else {
        setQuestions(questionEngine.getQuestionsByTrack('JS').slice(0, 4));
        setIsGeneratingQuestions(false);
      }
    } else if (isRoleTrack) {
      // Role-specific question generation (e.g. track = 'fullstack', 'ai_ml_engineer', etc.)
      const profileRaw = localStorage.getItem('hyrte_candidate_profile');
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
      const saved = localStorage.getItem('hyrte_active_interviewer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatar?.includes('ui-avatars')) {
          const colors: Record<string, string> = { Syed: '4f46e5', Ava: 'db2777', Sathvik: '059669', Zoe: '7c3aed' };
          parsed.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${parsed.name}&backgroundColor=${colors[parsed.name] || '4f46e5'}`;
          localStorage.setItem('hyrte_active_interviewer', JSON.stringify(parsed));
        }
        setInterviewer(parsed);
      } else {
        const { INTERVIEWERS } = require('../../lib/ai/interviewers');
        const random = INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];
        setInterviewer(random);
        localStorage.setItem('hyrte_active_interviewer', JSON.stringify(random));
      }
    }
  }, [isMounted]);

  const question = questions[currentQ];

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
      setViolations(prev => {
        const next = prev + 1;
        setWarningMsg(msg);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4000);
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
        triggerViolation('⚠️ Tab switch detected. Do not leave the interview window.');
      }
    };

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) {
        triggerViolation('⚠️ Fullscreen exited. Please remain in fullscreen during the interview.');
      }
    };

    // Blur = candidate switched app/window — only fire after grace period
    const handleBlur = () => {
      if (proctorReadyRef.current) {
        triggerViolation('⚠️ Window lost focus. Switching windows is not allowed.');
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
        triggerViolation('⚠️ Keyboard shortcut blocked. External help is not allowed.');
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Hardware
  useEffect(() => {
    const initHardware = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Hardware access denied:", err);
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
        if (isListening) {
           try { recognitionRef.current.start(); } catch (e) {}
        }
      };
    }

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    if (voiceMuted) return;
    
    const play = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const isFemale = voiceGender === 'female' || (voiceGender === 'default' && (interviewer?.name === 'Ava' || interviewer?.name === 'Zoe'));
      
      utterance.rate = voiceSpeed;
      utterance.pitch = isFemale ? 1.2 : 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      let preferred;
      if (isFemale) {
        // Aggressively prefer premium natural voices (Google/Microsoft)
        preferred = voices.find(v => /google us english/i.test(v.name)) ||
                    voices.find(v => /google uk english female/i.test(v.name)) ||
                    voices.find(v => /microsoft zira|microsoft aria|microsoft jenny/i.test(v.name)) ||
                    voices.find(v => /samantha|victoria|karen/i.test(v.name)) || 
                    voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang)) ||
                    voices.find(v => /en/i.test(v.lang));
      } else {
        preferred = voices.find(v => /google uk english male/i.test(v.name)) ||
                    voices.find(v => /microsoft mark|microsoft guy|microsoft david/i.test(v.name)) ||
                    voices.find(v => /daniel|arthur|aaron/i.test(v.name)) || 
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

  const toggleListening = () => {
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
          candidateProfile: candidateProfile ? { ...candidateProfile, name } : null,
          system: !candidateProfile ? (INTERVIEWER_PERSONA + systemCtx + `\n\nCurrent question: ${question.title}\nProblem: ${question.prompt}\nExchange #${exchangeCount + 1}\n\n[CANDIDATE'S CURRENT CODE STATE]:\n\`\`\`javascript\n${code}\n\`\`\`\nRefer to the code if relevant.`) : undefined,
        }),
      });
      const data = await res.json();
      const content = data.content || data.message || 'I hear you. Let\'s explore this further.';
      const signals: string[] = data.signals || [];
      const adaptation = data.adaptation || 'Maintaining current depth.';
      
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

    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          code,
          questionTitle: question.title,
          track
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
          candidateName: name
        }
      };

      localStorage.setItem('hyrte_report', JSON.stringify(reportPayload));
      
      // PERSIST SUPPORT LOGS FOR PLATFORM BETTERMENT
      const supportLogs = {
        candidateName: name,
        sessionTime: new Date().toISOString(),
        interactions: supportMessages
      };
      const existingLogs = JSON.parse(localStorage.getItem('hyrte_support_insights') || '[]');
      localStorage.setItem('hyrte_support_insights', JSON.stringify([supportLogs, ...existingLogs]));

      // PERSISTENT APPLICATIONS LIST FOR RECRUITERS
      const savedApps = localStorage.getItem('hyrte_applications');
      const apps = savedApps ? JSON.parse(savedApps) : [];
      const newApp = {
        id: `APP-${Math.floor(Math.random() * 10000)}`,
        jobId: dynamicContext?.jobId || 'GENERAL',
        candidateName: name,
        candidateEmail: dynamicContext?.candidateEmail || 'unknown@hyrte.com',
        score: reportPayload.score,
        track: track,
        violations: violations, // PERSIST INTEGRITY DATA
        koyoSignals: koyoSignals, // NEW: PERSIST KOYO DATA
        timestamp: new Date().toISOString(),
        simulation: reportPayload.simulation, // NEW: PERSIST SIMULATION DETAILS
        report: reportPayload
      };
      localStorage.setItem('hyrte_applications', JSON.stringify([newApp, ...apps]));

      router.push(`/feedback?name=${encodeURIComponent(name)}&track=${track}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate evaluation report.");
      setIsEvaluating(false);
    }
  };

  if (isEvaluating) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center">
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
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Evaluation in Progress</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing final assessment metrics</p>
        </motion.div>
      </div>
    );
  }

  if (isGeneratingQuestions || !question) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Matching Profile to Job Description</p>
        <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px] mt-2 animate-pulse">Generating Custom Interview Protocol...</p>
      </div>
    );
  }

  // ─── TERMINATED SCREEN ─────────────────────────────────────────────
  if (terminated) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tighter">Interview Terminated</h1>
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
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center">
          <Maximize2 className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-white tracking-tighter">Fullscreen Required</h1>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">This interview must be conducted in fullscreen mode. Exiting fullscreen will be logged as a violation.</p>
        </div>
        <button onClick={enterFullscreen} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3">
          <Maximize2 className="w-4 h-4" /> Enter Fullscreen & Start Interview
        </button>
        <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Tab switching, window changes & copy-paste are blocked during the session.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--bg)] flex flex-col overflow-hidden text-[var(--text)] font-sans selection:bg-indigo-500/30">
      
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
               {((track === 'DYNAMIC' ? ['simulation', 'code'] : ['code']) as TabType[]).map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   className={`px-8 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                     activeTab === tab 
                       ? 'bg-white/5 border-indigo-500 text-white' 
                       : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                   }`}
                 >
                   {tab === 'simulation' ? <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> : <Code2 className="w-3.5 h-3.5 text-emerald-400" />}
                   {tab === 'simulation' ? 'Job Simulation' : 'IDE / Code Editor'}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-8 custom-scrollbar">
               <AnimatePresence mode="wait">
                  {activeTab === 'simulation' ? (
                    <motion.div 
                      key="sim"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                                {scenario?.company || 'Corporate Client'} · {scenario?.role || 'Developer'} Track
                             </span>
                             <div className="h-px flex-1 bg-white/5" />
                             <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                                {scenario?.difficulty || 'Advanced'}
                             </span>
                          </div>
                          <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">{scenario?.title || 'Interactive Job Simulator'}</h2>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{scenario?.subtitle}</p>
                       </div>

                       <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
                          <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                             Simulation Background
                          </h3>
                          <p className="text-slate-400 leading-relaxed text-xs font-medium whitespace-pre-wrap">
                             {scenario?.overview}
                          </p>
                       </div>

                       {/* Mapped Skills */}
                       <div className="space-y-3">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Skills Evaluated</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                             {scenario?.skills?.map((skill: any, idx: number) => (
                               <div key={idx} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl flex flex-col justify-between space-y-2 hover:border-indigo-500/20 transition-all">
                                  <div>
                                     <p className="text-[10px] font-black text-white leading-tight">{skill.name}</p>
                                     <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{skill.level} Level</p>
                                  </div>
                                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                                     <div className="h-full bg-indigo-500" style={{ width: `${skill.weight}%` }} />
                                  </div>
                                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Weight: {skill.weight}%</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       {/* Project Checklist */}
                       <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                             <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                                Project Checklist & Tasks
                             </h3>
                             <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {completedTasks.length} / {scenario?.tasks?.length || 0} Completed
                             </span>
                          </div>
                          
                          <div className="space-y-3">
                             {scenario?.tasks?.map((task: any) => {
                               const isDone = completedTasks.includes(task.id);
                               return (
                                 <div 
                                   key={task.id}
                                   onClick={() => {
                                     if (isDone) {
                                       setCompletedTasks(prev => prev.filter(id => id !== task.id));
                                     } else {
                                       setCompletedTasks(prev => [...prev, task.id]);
                                     }
                                   }}
                                   className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                                     isDone 
                                       ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30' 
                                       : 'bg-[#111113] border-white/5 hover:border-white/10'
                                   }`}
                                 >
                                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                      isDone ? 'bg-emerald-600 border-emerald-600' : 'border-white/20 bg-white/5'
                                    }`}>
                                       {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                       <p className={`text-xs font-black transition-all ${isDone ? 'text-emerald-400 line-through' : 'text-white'}`}>{task.title}</p>
                                       <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                                    </div>
                                 </div>
                               );
                             })}
                          </div>
                       </div>

                       {isMock && (
                          <div className="pt-4 border-t border-white/5">
                             <button onClick={() => setInput("Can you give me a hint on this simulation task? I'm a bit stuck on implementation.")} 
                               className="group flex items-center gap-2 px-4 py-2 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition-all">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:animate-pulse" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Request Hint from {interviewer?.name || 'Syed'}</span>
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
                      <div className="w-1/3 border-r border-[var(--border-color)] bg-[var(--card-bg)] p-6 overflow-y-auto flex flex-col">
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
                      <div className="w-2/3 flex flex-col bg-[var(--bg)] overflow-hidden">
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
                              <textarea
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="w-full h-full bg-transparent p-8 text-[13px] font-mono text-emerald-300/90 focus:outline-none resize-none"
                                spellCheck={false}
                                placeholder="// Write your final solution here..."
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
                            
                            {/* Code Editor Status Bar */}
                            <div className="absolute bottom-4 right-8 flex items-center gap-4 px-3 py-1.5 bg-[var(--card-bg)] rounded-full border border-[var(--border-color)] backdrop-blur-md">
                               <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">UTF-8</span>
                               <div className="w-px h-2 bg-white/10" />
                               <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Line {code.split('\n').length}, Col {code.length}</span>
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
                                     {execSuccess === true && <span className="text-[8px] font-black text-emerald-400">✓ OK</span>}
                                     {execSuccess === false && <span className="text-[8px] font-black text-rose-400">✗ Error</span>}
                                   </div>
                                </div>
                                <div className={`flex-1 p-4 text-[11px] font-mono whitespace-pre overflow-y-auto ${execSuccess === false ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                   {consoleOutput || '> System idle. Write code and click Run.'}
                                </div>
                             </div>
                          </div>
                        </div>
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
                           {isSpeaking ? `${interviewer?.name || 'SYED'} IS SPEAKING...` : isThinking ? `${interviewer?.name || 'SYED'} IS THINKING...` : `${interviewer?.role || 'SENIOR INTERVIEWER'} · HYRTE`}
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
                     <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">Neural Sync: {syncVal.toFixed(1)}%</span>
                  </div>
               </div>
            </div>

            {/* Koyo AI Signals (Live Proctoring) */}
            <div className="px-8 py-4 bg-rose-500/5 border-b border-white/5">
               <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'eyeShift', label: 'Eye Shift', active: koyoSignals.eyeShift },
                    { id: 'aiAssist', label: 'AI-Assist', active: koyoSignals.aiAssist },
                    { id: 'secondVoice', label: 'Second Voice', active: koyoSignals.secondVoice },
                    { id: 'tabs', label: 'Tab Switch', active: violations > 0 },
                  ].map(s => (
                    <div key={s.id} className={`px-2 py-1 rounded border transition-all flex items-center gap-1.5 ${s.active ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                       <div className={`w-1 h-1 rounded-full ${s.active ? 'bg-rose-500' : 'bg-slate-600'}`} />
                       <span className="text-[7px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Neural Analytics Summary */}
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] space-y-6 shrink-0">
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Gaze Focus', value: `${gazeVal.toFixed(1)}%`, color: gazeVal > 95 ? 'text-emerald-400' : 'text-amber-400' },
                    { label: 'Facial Stress (Micro)', value: violations > 0 || !gazeVal ? 'Elevated' : 'Calm / Focused', color: violations > 0 || !gazeVal ? 'text-rose-400' : 'text-emerald-400' },
                    { label: 'Vocal Tonality', value: isSpeaking ? 'Analyzing...' : 'Confident (92%)', color: 'text-indigo-400' },
                    { label: 'Ambient Noise', value: `${noiseVal.toFixed(0)}dB`, color: noiseVal < 50 ? 'text-indigo-400' : 'text-rose-400' },
                    { label: 'Risk Index', value: violations > 0 || koyoSignals.aiAssist ? 'Critical' : 'Nominal', color: violations > 0 || koyoSignals.aiAssist ? 'text-rose-400' : 'text-emerald-400' },
                    { label: 'Sync Latency', value: '18ms', color: 'text-slate-500' },
                  ].map((m, i) => (
                    <div key={i} className="space-y-1">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">{m.label}</p>
                        <p className={`text-xs font-black ${m.color} tabular-nums`}>{m.value}</p>
                    </div>
                  ))}
               </div>
               
               <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Sentient Adaptation Flow</span>
                     <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase tracking-wider">
                    {currentAdaptation}
                  </p>
               </div>
            </div>

            {/* Assessment Cloud (Floating) */}
            <div className="absolute top-[270px] right-6 left-6 z-20 flex flex-wrap gap-1.5 pointer-events-none">
               <AnimatePresence>
                  {detectedSignals.map((s, i) => (
                    <motion.div key={s + i} initial={{ opacity: 0, scale: 0.7, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }}
                      className="px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/40 rounded text-[7px] font-black text-indigo-300 uppercase tracking-widest backdrop-blur-md shadow-lg">
                       {s}
                    </motion.div>
                  ))}
               </AnimatePresence>
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
               
               {/* Neural Mirror Feed */}
               <motion.div drag dragConstraints={{ left: -300, right: 0, top: -400, bottom: 0 }}
                 className="absolute -top-32 right-8 w-28 h-28 rounded-[24px] overflow-hidden border border-white/10 shadow-2xl z-50 cursor-move bg-slate-900 ring-4 ring-black/40">
                  {stream ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" /> : <div className="w-full h-full flex items-center justify-center"><User className="text-slate-700 w-8 h-8" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                     <span className="text-[6px] font-black text-white uppercase tracking-widest">Neural Feed: Live</span>
                  </div>
               </motion.div>
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
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Neural Link Establishing...</div>;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500 text-[11px] font-black uppercase tracking-widest animate-pulse">Syncing...</div>}>
      <SessionContent />
    </Suspense>
  );
}




