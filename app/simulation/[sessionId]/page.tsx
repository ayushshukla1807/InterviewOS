'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTTS } from '../../hooks/useTTS';
import {
  SimulationBlueprint,
  SimulationRuntimeState,
  SimulationEvent,
  CandidateActionType,
  StakeholderState,
  HyrteSkillScore,
  HyrtePhase,
  EmbeddedChallenge,
} from '../../../lib/simulation/types';
import {
  MessageSquare, Mail, ClipboardCheck, Calendar, ShieldAlert, Cpu, Sparkles,
  Terminal, Palette, Check, Zap, AlertTriangle, RotateCcw, ChevronRight,
  TrendingUp, Clock, Users, Target, Award, Brain, Eye, EyeOff, Send,
  ChevronDown, ChevronUp, Activity, Volume2, VolumeX, BookOpen, AlertCircle
} from 'lucide-react';
import CodeIDE from '../../components/CodeIDE';

const THEME = { label:'Sci-Fi', preview:'var(--accent)', bg:'transparent', surface:'var(--card-bg)', surfaceAlt:'var(--card-bg)', border:'var(--border-color)', textPrimary:'var(--text)', textSecondary:'var(--text-muted)', textMuted:'var(--text-muted)', accent:'var(--accent)', accentText:'var(--accent)', accentBg:'rgba(34,211,238,0.1)', accentBorder:'rgba(34,211,238,0.3)', accentHover:'var(--accent)', fontFamily:'"Inter", sans-serif' };

// ─── Skill dimension labels ───────────────────────────────────────────────────
const DIM_LABELS: Record<string, string> = {
  communication: 'Communication', adaptability: 'Adaptability', conflictHandling: 'Conflict Handling',
  stakeholderManagement: 'Stakeholder Mgmt', prioritization: 'Prioritization',
  accountability: 'Accountability', pressureResponse: 'Pressure Response', decisionQuality: 'Decision Quality',
};

export default function LivingWorkplaceSimulation() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [blueprint, setBlueprint] = useState<SimulationBlueprint | null>(null);
  const [runtime, setRuntime] = useState<SimulationRuntimeState | null>(null);

  // ── HYRTE Phase ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<HyrtePhase>('pre_skill');
  const [preSkillAnswers, setPreSkillAnswers] = useState<Record<string, string>>({});
  const [preSkillTimeLeft, setPreSkillTimeLeft] = useState(300); // 5 min
  const [preSkillSubmitted, setPreSkillSubmitted] = useState(false);

  // ── Chaos / Recovery Banners ─────────────────────────────────────────────
  const [chaosActive, setChaosActive] = useState(false);
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [recoveryResponse, setRecoveryResponse] = useState('');

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'slack' | 'email' | 'tasks' | 'calendar' | 'wiki'>('slack');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // ── Coding Sandbox ───────────────────────────────────────────────────────
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('// Write your solution here...');
  const [sandboxLang, setSandboxLang] = useState('javascript');

  // ── Assistant ────────────────────────────────────────────────────────────
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLogs, setAssistantLogs] = useState<{ role: 'user' | 'colleague'; content: string }[]>([
    { role: 'colleague', content: "Heads up — things move fast here. If you get stuck, I can point you in the right direction. Just ping me." }
  ]);

  // ── Camera PiP ───────────────────────────────────────────────────────────
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Timer & Anti-cheat ───────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(2400);
  const [tabSwitches, setTabSwitches] = useState(0);
  const simulationStartTime = useRef(Date.now());

  // ── HYRTE Score ──────────────────────────────────────────────────────────
  const [hyrteScore, setHyrteScore] = useState<HyrteSkillScore | null>(null);
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isComputingScore, setIsComputingScore] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [challengeResponseText, setChallengeResponseText] = useState('');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);

  // ── Theme ────────────────────────────────────────────────────────────────
  const t = THEME;
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // ── Candidate Stress Level (Feature 6) & Coworker Interruptions (Feature 5) ──
  const [stressLevel, setStressLevel] = useState(0); // 0 to 100

  // Feature 6: Stress Indicator Engine
  useEffect(() => {
    if (!runtime || phase !== 'workspace') return;
    const interval = setInterval(() => {
      setStressLevel(prev => {
        let newStress = prev;
        const unreadCount = runtime.eventStream.filter(e => !e.isRead).length;
        if (unreadCount > 2) newStress += 5;
        if (unreadCount === 0) newStress -= 2;
        if (timeLeft < 300) newStress += 2; // last 5 mins
        if (runtime.chaosWaveActive) newStress += 10;
        return Math.max(0, Math.min(100, newStress));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [runtime?.eventStream, timeLeft, runtime?.chaosWaveActive, phase]);

  // ─── Challenge Trigger Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!runtime || phase !== 'workspace') return;
    
    const readCount = runtime.eventStream.filter(e => e.isRead).length;
    
    // Check embedded challenges first
    const triggeredEmbedded = runtime.embeddedChallenges.find(c => 
      !c.triggered && 
      (c.triggerCondition === 'after_2_events_read' && readCount >= 2) ||
      (c.triggerCondition === 'after_chaos_wave_starts' && runtime.chaosWaveActive)
    );

    if (triggeredEmbedded) {
      setRuntime(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          embeddedChallenges: prev.embeddedChallenges.map(c => 
            c.id === triggeredEmbedded.id ? { ...c, triggered: true } : c
          )
        };
      });
      setActiveChallenge(triggeredEmbedded);
      setShowChallengeModal(true);
      return;
    }

    // If no embedded challenge is active, check if Act challenge is unsubmitted
    // We only force it if they click "Advance Act" or if we want to show it explicitly.
    // For now, let's let the user open the Act Challenge manually, or trigger it at the end of the Act.
  }, [runtime?.eventStream, runtime?.embeddedChallenges, runtime?.chaosWaveActive, phase]);

  // Feature 5: Dynamic Coworker Interruptions
  useEffect(() => {
    if (!runtime || phase !== 'workspace') return;
    const interval = setInterval(() => {
      // 30% chance every 45 seconds to get a random ping
      if (Math.random() > 0.7) {
        const pingEvent: SimulationEvent = {
          id: `ping_${Date.now()}`,
          revealedAt: Date.now(),
          type: 'slack',
          priority: 'LOW',
          fromStakeholderId: Object.keys(runtime.stakeholderStates)[0] || 'Coworker',
          message: 'Hey, do you want to grab lunch soon? Or are you swamped?',
          requiresResponse: true,
          isRead: false,
          isAnswered: false,
        };
        setRuntime(prev => {
          if (!prev) return prev;
          return { ...prev, eventStream: [pingEvent, ...prev.eventStream] };
        });
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [runtime, phase]);

  // ─── TTS Hook ─────────────────────────────────────────────────────────────
  const { speak, stop: stopTTS } = useTTS({ enabled: ttsEnabled, volume: 1.0 });

  // Auto-speak new incoming events
  const spokenEventsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!runtime) return;
    const newEvents = runtime.eventStream.filter(e => !spokenEventsRef.current.has(e.id) && !e.isRead && (e.type === 'slack' || e.type === 'email' || e.type === 'notification' || e.type === 'escalation'));
    if (newEvents.length > 0) {
      newEvents.forEach(e => {
        spokenEventsRef.current.add(e.id);
        const stakeholder = runtime.stakeholderStates[e.fromStakeholderId];
        speak(e, stakeholder);
      });
    }
  }, [runtime?.eventStream, speak, runtime?.stakeholderStates]);



  // ─── Camera Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { /* denied */ }
    })();
    return () => { cameraStream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Blueprint Load ───────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`simulation_${sessionId}`);
    if (stored) {
      try {
        const bp = JSON.parse(stored) as SimulationBlueprint;
        setBlueprint(bp);
        const stakeholderStates = bp.stakeholders.reduce((acc, s) => {
          acc[s.id] = s; return acc;
        }, {} as Record<string, StakeholderState>);

        setRuntime({
          blueprint: bp,
          phase: 'pre_skill',
          currentAct: 1,
          actStartTime: Date.now(),
          simulationStartTime: Date.now(),
          eventStream: [],
          pendingConsequences: [],
          consequenceWaveLog: [],
          stakeholderStates,
          candidateActions: [],
          currentChallenge: bp.acts[0]?.challenge || null,
          embeddedChallenges: bp.acts[0]?.embeddedChallenges || [],
          challengeResponses: [],
          skillValidationAnswers: [],
          recoveryActions: [],
          chaosWaveActive: false,
          liveHyrteScore: {},
          assistantUsageCount: 0,
          tabSwitches: 0,
          behavioralSignals: {
            ignoredEventIds: [], escalatedEventIds: [], clarificationCount: 0,
            averageResponseTimeSeconds: 0, responseTimes: [],
            openedEmails: [], openedSlacks: [],
            recoveryAttempted: false, firstToRespondToHighPriority: false,
            respondedWithDataBeforeDeciding: false, acknowledgedMistakeProactively: false,
          },
        });

        // If no pre-skill questions, skip directly to workspace
        if (!bp.skillValidationQuestions || bp.skillValidationQuestions.length === 0) {
          setPhase('workspace');
        }
      } catch {
        setHasLoadError(true);
      }
    } else {
      setHasLoadError(true);
    }
  }, [sessionId, router]);

  // ─── Pre-Skill Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'pre_skill') return;
    const t = setInterval(() => {
      setPreSkillTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); handleEnterWorkspace(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Main Timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'workspace' && phase !== 'chaos' && phase !== 'recovery') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmitTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Tab Switch Detection ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => { if (document.hidden) setTabSwitches(p => p + 1); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Enter Workspace (after pre-skill) ───────────────────────────────────
  const handleEnterWorkspace = useCallback(() => {
    if (!blueprint) return;
    // Save pre-skill answers to runtime
    const answers = blueprint.skillValidationQuestions?.map(q => ({
      questionId: q.id,
      response: preSkillAnswers[q.id] || '',
      timeSpentSeconds: 300 - preSkillTimeLeft,
    })) || [];

    setRuntime(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: 'workspace',
        skillValidationAnswers: answers,
        eventStream: blueprint.acts[0]?.initialEvents || [],
        currentChallenge: blueprint.acts[0]?.challenge || null,
        embeddedChallenges: blueprint.acts[0]?.embeddedChallenges || [],
      };
    });
    setPhase('workspace');
    setPreSkillSubmitted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint, preSkillAnswers, preSkillTimeLeft]);

  // ─── Handle Action ────────────────────────────────────────────────────────
  const handleAction = async (actionType: CandidateActionType, eventId: string) => {
    if (!runtime) return;
    setIsProcessingAction(true);

    const event = runtime.eventStream.find(e => e.id === eventId);
    if (!event) { setIsProcessingAction(false); return; }

    const stakeholder = runtime.stakeholderStates[event.fromStakeholderId];

    // Optimistic UI update
    setRuntime(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        eventStream: prev.eventStream.map(e => e.id === eventId ? { ...e, isAnswered: true, isRead: true } : e),
      };
    });
    setReplyText('');
    setSelectedEventId(null);

    try {
      const res = await fetch('/api/simulation/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: runtime.blueprint.role,
          companyCultureProfile: runtime.blueprint.companyCultureProfile,
          businessObjective: runtime.blueprint.businessObjective,
          currentAct: runtime.currentAct,
          candidateAction: actionType,
          candidateResponse: (actionType === 'responded' || actionType === 'asked_clarification') ? replyText : null,
          triggeringEvent: event,
          stakeholder,
          allStakeholders: runtime.stakeholderStates,
          recentHistory: runtime.candidateActions.slice(-5).map(a => a.type),
          ignoredCount: runtime.behavioralSignals.ignoredEventIds.length,
          consequenceWaves: runtime.blueprint.consequenceWaveRules || [],
          simulationElapsedSeconds: Math.floor((Date.now() - simulationStartTime.current) / 1000),
        }),
      });

      const data = await res.json();

      setRuntime(prev => {
        if (!prev) return prev;

        // Update stakeholder
        const newStakeholderStates = { ...prev.stakeholderStates };
        if (data.updatedStakeholder) {
          newStakeholderStates[stakeholder.id] = data.updatedStakeholder;
        }

        // Update behavioral signals
        const signals = { ...prev.behavioralSignals };
        if (actionType === 'ignored') {
          signals.ignoredEventIds = [...signals.ignoredEventIds, eventId];
        } else if (actionType === 'asked_clarification') {
          signals.clarificationCount = (signals.clarificationCount || 0) + 1;
        } else if (actionType === 'escalated') {
          signals.escalatedEventIds = [...signals.escalatedEventIds, eventId];
        }
        if (actionType === 'responded' && (replyText?.length || 0) > 80) {
          signals.respondedWithDataBeforeDeciding = true;
        }

        // Update fired waves
        const updatedWaveLog = [
          ...(prev.consequenceWaveLog || []),
          ...(data.firedWaves || []),
        ];

        // Update consequence waves in blueprint (mark fired)
        const updatedBlueprint = {
          ...prev.blueprint,
          consequenceWaveRules: (prev.blueprint.consequenceWaveRules || []).map(w => {
            const fired = data.firedWaves?.find((fw: { id: string }) => fw.id === w.id);
            return fired ? { ...w, fired: true, firedAt: fired.firedAt } : w;
          }),
        };

        // New candidate action
        const newAction = {
          type: actionType,
          eventId,
          stakeholderId: stakeholder.id,
          response: replyText,
          responseTimeSeconds: Math.floor((Date.now() - prev.actStartTime) / 1000),
          timestamp: Date.now(),
          behaviorSignals: data.behaviorSignals,
        };

        // Auto phase transition logic (behavior-driven)
        let nextActNum = prev.currentAct;
        if (data.chaosThresholdReached && prev.currentAct < 2) nextActNum = 2;
        if (data.recoveryPhaseTriggered && prev.currentAct < 3) nextActNum = 3;

        if (nextActNum > prev.currentAct) {
          const nextAct = updatedBlueprint.acts.find(a => a.act === nextActNum);
          if (nextAct) {
            // Auto advance act
            setTimeout(() => {
              if (nextActNum >= 2) { setChaosActive(true); setPhase('chaos'); }
              if (nextActNum === 3) { setRecoveryActive(true); setPhase('recovery'); }
            }, 0);

            // If simultaneous is true or it's Act 2, all events reveal at 0
            const autoRevealEvents = nextAct.initialEvents.map(e => ({
              ...e,
              revealAt: 0, // Force simultaneous delivery for chaos wave
            }));

            return {
              ...prev,
              blueprint: updatedBlueprint,
              stakeholderStates: newStakeholderStates,
              currentAct: nextActNum,
              actStartTime: Date.now(),
              eventStream: [...prev.eventStream, ...(data.consequenceEvents || []), ...autoRevealEvents],
              currentChallenge: nextAct.challenge,
              embeddedChallenges: nextAct.embeddedChallenges || [],
              behavioralSignals: signals,
              consequenceWaveLog: updatedWaveLog,
              candidateActions: [...prev.candidateActions, newAction],
              chaosWaveActive: data.chaosThresholdReached || prev.chaosWaveActive,
            };
          }
        }

        return {
          ...prev,
          blueprint: updatedBlueprint,
          stakeholderStates: newStakeholderStates,
          eventStream: [...prev.eventStream, ...(data.consequenceEvents || [])],
          behavioralSignals: signals,
          consequenceWaveLog: updatedWaveLog,
          candidateActions: [...prev.candidateActions, newAction],
          chaosWaveActive: data.chaosThresholdReached || prev.chaosWaveActive,
        };
      });

    } catch (e) {
      console.error('Action error:', e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ─── Advance Act ──────────────────────────────────────────────────────────
  const handleAdvanceAct = () => {
    if (!runtime) return;

    // Force Act Challenge before advancing if not submitted
    if (runtime.currentChallenge) {
      const isSubmitted = runtime.challengeResponses.some(r => r.challengeId === runtime.currentChallenge!.id);
      if (!isSubmitted) {
        setActiveChallenge(runtime.currentChallenge);
        setShowChallengeModal(true);
        return; // Block advancement until submitted
      }
    }

    if (runtime.currentAct >= 3) { handleSubmitTest(); return; }
    const nextActNum = (runtime.currentAct + 1) as 1 | 2 | 3;
    const nextAct = runtime.blueprint.acts.find(a => a.act === nextActNum);
    if (!nextAct) return;
    setRuntime(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentAct: nextActNum,
        actStartTime: Date.now(),
        eventStream: [...prev.eventStream, ...nextAct.initialEvents],
        currentChallenge: nextAct.challenge,
        embeddedChallenges: nextAct.embeddedChallenges || [],
      };
    });
    if (nextActNum === 2) { setChaosActive(true); setPhase('chaos'); }
    if (nextActNum === 3) { setRecoveryActive(true); setPhase('recovery'); }
  };

  // ─── Ask Assistant ────────────────────────────────────────────────────────
  const handleAskAssistant = async () => {
    if (!assistantInput.trim() || !runtime) return;
    const userMsg = assistantInput;
    setAssistantInput('');
    setAssistantLogs(prev => [...prev, { role: 'user', content: userMsg }]);
    setRuntime(prev => prev ? { ...prev, assistantUsageCount: (prev.assistantUsageCount || 0) + 1 } : prev);
    try {
      const res = await fetch('/api/simulation/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: runtime.blueprint.role,
          simulationContext: `Act ${runtime.currentAct} — Phase: ${phase} — Events ignored: ${runtime.behavioralSignals.ignoredEventIds.length}`,
          stakeholderStates: runtime.stakeholderStates,
          currentChallenge: runtime.currentChallenge,
          question: userMsg,
          hintNumber: runtime.assistantUsageCount || 0,
        }),
      });
      const data = await res.json();
      setAssistantLogs(prev => [...prev, { role: 'colleague', content: data.hint || 'Think about who is most affected right now.' }]);
    } catch {
      setAssistantLogs(prev => [...prev, { role: 'colleague', content: 'Sorry — swamped. Check your tasks list.' }]);
    }
  };

  // ─── Compute + Show Final HYRTE Score ────────────────────────────────────
  const handleSubmitTest = useCallback(async () => {
    if (!runtime) return;
    setShowSubmitModal(true);
    setIsComputingScore(true);
    try {
      const res = await fetch('/api/simulation/hyrte-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtime: { ...runtime, tabSwitches },
          skillValidationAnswers: runtime.skillValidationAnswers,
          isFinal: true,
        }),
      });
      const score = await res.json() as HyrteSkillScore;
      setHyrteScore(score);
      // Save score to session
      sessionStorage.setItem(`hyrte_score_${sessionId}`, JSON.stringify(score));
    } catch { /* show modal without score */ } finally {
      setIsComputingScore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime, tabSwitches, sessionId]);

  // ─── Proceed to Interview / Save Report ───────────────────────────────────
  const handleProceedToInterview = async () => {
    if (!runtime || !blueprint) return;
    const actions = runtime.candidateActions;
    const stakeholders = Object.values(runtime.stakeholderStates);
    let summary = `### HYRTE Simulation Summary
- Role: ${blueprint.role}
- Company: ${blueprint.company} (${blueprint.companyCultureProfile})
- Business Objective: ${blueprint.businessObjective}
- Acts Completed: ${runtime.currentAct}/3
- Phase Reached: ${phase}
- Events Ignored: ${runtime.behavioralSignals.ignoredEventIds.length}
- Clarifications Asked: ${runtime.behavioralSignals.clarificationCount}
- Hints Used: ${runtime.assistantUsageCount}
- Tab Switches: ${tabSwitches}
- Chaos Wave Active: ${chaosActive}
- Recovery Attempted: ${runtime.behavioralSignals.recoveryAttempted}

Stakeholder Final States:
${stakeholders.map(s => `- ${s.name} (${s.role}): Trust=${s.trust}/100, Frustration=${s.frustration}/100, EscLevel=${s.escalationLevel}/3`).join('\n')}

Action Log:
${actions.map((a, i) => `${i+1}. ${a.type} → ${runtime.stakeholderStates[a.stakeholderId]?.name || '?'}: "${a.response || 'no text'}" (${a.responseTimeSeconds}s)`).join('\n')}

HYRTE Score: ${hyrteScore?.total ?? 'Pending'}/100
${hyrteScore ? `- Direct Skill: ${hyrteScore.directSkill.score}/100\n- Embedded Skills: ${hyrteScore.embeddedSkills.score}/100\n- Workplace Intelligence: ${hyrteScore.workplaceIntelligence.score}/100` : ''}
Hiring Insight: ${hyrteScore?.hiringInsight || 'Pending'}`;

    sessionStorage.setItem(`simulation_summary_${sessionId}`, summary);
    localStorage.setItem(`simulation_summary_${sessionId}`, summary);
    
    // Save to Database
    try {
      const userStr = localStorage.getItem('interviewos_user');
      const userId = userStr ? (JSON.parse(userStr).id || JSON.parse(userStr)._id) : undefined;

      await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          candidateName: blueprint.candidateName || 'Candidate',
          sessionId,
          role: blueprint.role,
          company: blueprint.company,
          score: hyrteScore?.total || 0,
          fullReportData: hyrteScore,
          runtimeSummary: summary,
          phaseCompletedAt: phase,
        }),
      });
    } catch (err) {
      console.error('Failed to save report to DB:', err);
    }

    const candidateName = blueprint.candidateName || 'Candidate';
    router.push(`/instructions?name=${encodeURIComponent(candidateName)}&track=DYNAMIC&simulationSessionId=${sessionId}`);
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (hasLoadError) {
    return (
      <div className="min-h-screen mesh-bg text-[var(--text)] flex flex-col items-center justify-center p-6 text-center">
        <div className="noise-overlay" />
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Session Not Found or Expired</h2>
        <p className="text-gray-400 max-w-md mb-8">The simulation session you are trying to access is invalid or has expired. Please launch a new simulation from your dashboard.</p>
        <button
          onClick={() => router.push('/candidate')}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (!blueprint || !runtime) {
    return (
      <div className="min-h-screen mesh-bg text-[var(--text)] flex items-center justify-center">
        <div className="noise-overlay" />
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-gray-400">Booting HYRTE Simulation Engine...</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PHASE: PRE-SKILL VALIDATION ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'pre_skill' && !preSkillSubmitted && blueprint.skillValidationQuestions?.length > 0) {
    const questions = blueprint.skillValidationQuestions;
    return (
      <div className="min-h-screen mesh-bg text-[var(--text)] flex flex-col" style={{ fontFamily: t.fontFamily }}>
        <div className="noise-overlay" />
        {/* Header */}
        <div className="border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: t.border, backgroundColor: t.surface }}>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black">OS</div>
            <div>
              <div className="text-sm font-semibold text-gray-100">HYRTE Simulation</div>
              <div className="text-xs text-gray-500">{blueprint.role} · {blueprint.company}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300">
              Direct Skill Validation · 15% of Score
            </div>
            <div className={`font-mono text-lg px-3 py-1 rounded-lg border ${preSkillTimeLeft < 60 ? 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse' : 'text-gray-300 border-white/10 bg-white/5'}`}>
              {formatTime(preSkillTimeLeft)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
          <div className="max-w-3xl w-full space-y-6">
            {/* Context Banner */}
            <div className="bg-gradient-to-r from-violet-950/50 to-indigo-950/50 border border-violet-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">Before You Enter the Workplace</div>
                  <div className="text-base font-semibold text-gray-100 mb-1">Business Objective</div>
                  <div className="text-sm text-gray-300 leading-relaxed">{blueprint.businessObjective}</div>
                  <div className="mt-3 text-xs text-gray-500">Answer {questions.length} question{questions.length > 1 ? 's' : ''} to validate your baseline competency. This scores 15% of your total HYRTE score. Take your time — you have 5 minutes.</div>
                </div>
              </div>
            </div>

            {/* Questions */}
            {questions.map((q, qi) => (
              <div key={q.id} className="glass-card hud-border p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-400 shrink-0">
                    {qi + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
                      {q.type === 'priority_decision' ? '⚡ Priority Decision' :
                       q.type === 'data_analysis' ? '📊 Data Analysis' :
                       q.type === 'scenario_judgment' ? '🎯 Scenario Judgment' : '💬 Open Ended'}
                    </div>
                    <div className="text-sm text-gray-200 leading-relaxed font-medium">{q.prompt}</div>
                  </div>
                </div>

                {/* Context / Data Table */}
                {q.context && (
                  <div className="ml-10 bg-black/40 border border-[var(--border-color)] rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Context / Data</div>
                    {q.context.includes('|') ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-300">
                          <thead>
                            <tr className="border-b border-white/10">
                              {q.context.split('\n')[0]?.split('|').map((h, i) => (
                                <th key={i} className="pb-2 pr-4 font-semibold text-gray-400">{h.trim()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {q.context.split('\n').slice(1).filter(r => r.trim()).map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-white/5 last:border-0">
                                {row.split('|').map((cell, cIdx) => (
                                  <td key={cIdx} className="py-2 pr-4 text-gray-300">{cell.trim()}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">{q.context}</pre>
                    )}
                  </div>
                )}

                {/* Options (for priority_decision) or Textarea */}
                {q.type === 'priority_decision' && q.options && q.options.length > 0 ? (
                  <div className="ml-10 space-y-2">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        preSkillAnswers[q.id] === opt
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-white/6 bg-transparent hover:border-white/15'
                      }`}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={preSkillAnswers[q.id] === opt}
                          onChange={() => setPreSkillAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className="mt-0.5 accent-indigo-500"
                        />
                        <span className="text-sm text-gray-300">{opt}</span>
                      </label>
                    ))}
                    {/* Open reasoning field */}
                    <textarea
                      value={preSkillAnswers[`${q.id}_reason`] || ''}
                      onChange={e => setPreSkillAnswers(prev => ({ ...prev, [`${q.id}_reason`]: e.target.value }))}
                      placeholder="Explain your reasoning... (evaluated for depth and data-driven thinking)"
                      className="w-full mt-2 h-24 bg-black/40 border border-[var(--border-color)] rounded-xl p-3 text-sm font-mono text-cyan-50 outline-none resize-none placeholder-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                ) : (
                  <div className="ml-10">
                    <textarea
                      value={preSkillAnswers[q.id] || ''}
                      onChange={e => setPreSkillAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your answer..."
                      rows={5}
                      className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl p-4 text-sm font-mono text-cyan-50 outline-none resize-none placeholder-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Submit */}
            <button
              onClick={handleEnterWorkspace}
              className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <ChevronRight className="w-4 h-4" />
              Submit & Enter Workplace Dashboard
            </button>
            <p className="text-center text-xs text-gray-600">Your answers are recorded and scored as 15% of your total HYRTE assessment</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PHASE: WORKSPACE / CHAOS / RECOVERY ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  const activeEvents = runtime.eventStream.filter(e =>
    activeTab === 'slack' ? (e.type === 'slack' || e.type === 'notification') :
    activeTab === 'email' ? e.type === 'email' :
    activeTab === 'tasks' ? e.type === 'task' :
    activeTab === 'calendar' ? e.type === 'meeting' : false
  );
  const selectedEvent = runtime.eventStream.find(e => e.id === selectedEventId);
  const lowTrustStakeholders = Object.values(runtime.stakeholderStates).filter(s => s.trust < 40);

  return (
    <div
      className="min-h-screen flex flex-col relative mesh-bg"
      style={{ color: t.textPrimary, fontFamily: t.fontFamily }}
    >
      <div className="noise-overlay" />
      {/* ── Chaos Wave Banner ─────────────────────────────────────────────── */}
      {chaosActive && (
        <div className="relative z-50 px-6 py-2.5 flex items-center gap-3 border-b"
          style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(251,146,60,0.12))', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-2 animate-pulse">
            <Zap className="w-4 h-4 text-red-400" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">Chaos Wave Active</span>
          </div>
          <span className="text-xs text-orange-300">Multiple stakeholders demanding attention simultaneously. Prioritize by business impact.</span>
          {lowTrustStakeholders.length > 0 && (
            <span className="ml-auto text-xs text-red-300 font-bold">{lowTrustStakeholders.length} stakeholder{lowTrustStakeholders.length > 1 ? 's' : ''} at critical trust level</span>
          )}
        </div>
      )}

      {/* ── Recovery Phase Banner ──────────────────────────────────────────── */}
      {recoveryActive && (
        <div className="relative z-50 px-6 py-2.5 flex items-center gap-3 border-b"
          style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(251,191,36,0.08))', borderColor: 'rgba(245,158,11,0.3)' }}>
          <RotateCcw className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">Recovery Phase</span>
          <span className="text-xs text-amber-300">Things went wrong. How you recover is being evaluated — this is unique to HYRTE.</span>
          <span className="ml-auto text-xs text-amber-400 font-bold">Recovery quality: 50% Workplace Intelligence score</span>
        </div>
      )}

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div
        className="border-b px-5 py-2.5 flex justify-between items-center z-20 shrink-0"
        style={{ backgroundColor: t.surface, borderColor: t.border }}
      >
        {/* Left: Logo + Company + Act Progress */}
        <div className="flex items-center gap-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentHover})` }}
          >OS</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: t.textPrimary }}>{blueprint.company}</div>
            <div className="text-xs" style={{ color: t.textMuted }}>{blueprint.role}</div>
          </div>

          {/* Business Objective tag */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
            style={{ borderColor: t.border, backgroundColor: t.surfaceAlt, color: t.textMuted }}>
            <Target className="w-3 h-3" />
            <span className="truncate max-w-xs">{blueprint.businessObjective}</span>
          </div>

          {/* Act Progress */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: t.surfaceAlt, borderColor: t.border }}>
            {[1, 2, 3].map(act => (
              <div key={act} className="flex items-center">
                <div className={`w-2 h-2 rounded-full transition-all`}
                  style={{ backgroundColor: runtime.currentAct >= act ? t.accent : t.textMuted }} />
                <span className="text-xs ml-1.5 mr-2.5 font-medium"
                  style={{ color: runtime.currentAct >= act ? t.accentText : t.textMuted }}>
                  {act === 1 ? 'Day' : act === 2 ? 'Chaos' : 'Recovery'}
                </span>
                {act < 3 && <div className="w-3 h-px mr-2" style={{ backgroundColor: t.border }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Alerts + Timer + Theme + Score + Submit */}
        <div className="flex items-center gap-4">
          
          {/* Feature 6: Stress Indicator */}
          <div className="hidden md:flex flex-col items-end gap-1 px-3 py-1.5 rounded-lg border bg-black/20"
               style={{ borderColor: t.border }}>
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${stressLevel > 75 ? 'text-red-500 animate-pulse' : stressLevel > 40 ? 'text-amber-500' : 'text-emerald-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Stress Level</span>
            </div>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${stressLevel > 75 ? 'bg-red-500' : stressLevel > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${stressLevel}%` }} />
            </div>
          </div>

          {tabSwitches > 0 && (
            <div className="px-2.5 py-1.5 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 bg-red-500/10 animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {tabSwitches}
            </div>
          )}

          {/* TTS Volume Toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) stopTTS();
            }}
            className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors"
            style={{ backgroundColor: t.surfaceAlt, borderColor: t.border, color: ttsEnabled ? t.accent : t.textMuted }}
            title={ttsEnabled ? "Disable Voice" : "Enable Voice"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Phase badge */}
          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
            phase === 'chaos' ? 'text-red-400 border-red-500/25 bg-red-500/10' :
            phase === 'recovery' ? 'text-amber-400 border-amber-500/25 bg-amber-500/10' :
            'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
          }`}>
            {phase === 'chaos' ? '⚡ Chaos' : phase === 'recovery' ? '↩ Recovery' : '● Live'}
          </div>

          <div
            className={`text-lg font-mono px-3 py-1.5 rounded-lg border ${timeLeft < 300 ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: timeLeft < 300 ? 'rgba(239,68,68,0.1)' : t.surfaceAlt,
              color: timeLeft < 300 ? '#f87171' : t.textSecondary,
              border: `1px solid ${timeLeft < 300 ? 'rgba(239,68,68,0.3)' : t.border}`,
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Theme Picker Removed */}

          <button
            onClick={() => setShowScorePanel(p => !p)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all"
            style={{ color: t.textMuted, borderColor: t.border, backgroundColor: t.surfaceAlt }}
          >
            {showScorePanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Score
          </button>

          <button
            onClick={handleSubmitTest}
            className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90"
            style={{ backgroundColor: t.accent }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar Nav */}
        <div className="w-14 border-r flex flex-col items-center py-3 gap-1.5 shrink-0"
          style={{ backgroundColor: t.surface, borderColor: t.border }}>
          {([
            { key: 'slack', icon: <MessageSquare className="w-4.5 h-4.5" />, count: runtime.eventStream.filter(e => (e.type === 'slack' || e.type === 'notification') && !e.isRead).length },
            { key: 'email', icon: <Mail className="w-4.5 h-4.5" />, count: runtime.eventStream.filter(e => e.type === 'email' && !e.isRead).length },
            { key: 'tasks', icon: <ClipboardCheck className="w-4.5 h-4.5" />, count: runtime.eventStream.filter(e => e.type === 'task' && !e.isRead).length },
            { key: 'calendar', icon: <Calendar className="w-4.5 h-4.5" />, count: 0 },
            { key: 'wiki', icon: <BookOpen className="w-4.5 h-4.5" />, count: 0 },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={activeTab === tab.key ? { backgroundColor: t.accentBg, color: t.accentText, border: `1px solid ${t.accentBorder}` } : { color: t.textMuted, border: '1px solid transparent' }}>
              {tab.icon}
              {tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{tab.count}</div>
              )}
            </button>
          ))}
        </div>

        {/* Feature 8: Wiki Main View */}
        {activeTab === 'wiki' ? (
          <div className="flex-1 overflow-y-auto p-10 space-y-8" style={{ backgroundColor: t.bg }}>
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: t.surfaceAlt, borderColor: t.border }}>
                    <BookOpen className="w-8 h-8" style={{ color: t.accent }} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: t.textPrimary }}>Company Internal Wiki</h1>
                    <p style={{ color: t.textSecondary }}>Confidential guidelines and policies. Employees must consult these before making critical decisions.</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  <div className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: t.textPrimary }}><ShieldAlert className="w-4 h-4 text-red-400" /> Policy 41A: Incident Response</h3>
                      <p className="text-sm leading-relaxed" style={{ color: t.textMuted }}>In the event of a critical system failure or data breach, employees must NOT respond to external media or stakeholders without explicit approval from Legal. The primary directive is to immediately isolate the system and inform the VP of Engineering.</p>
                  </div>
                  <div className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: t.textPrimary }}><Target className="w-4 h-4 text-amber-400" /> Policy 12B: Resource Allocation</h3>
                      <p className="text-sm leading-relaxed" style={{ color: t.textMuted }}>When two projects demand the same engineering resources, priority is given to the project with immediate revenue impact (Tier 1) over infrastructure improvements (Tier 2), unless the infrastructure risk exceeds an estimated 99.9% uptime failure.</p>
                  </div>
                  <div className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: t.textPrimary }}><Users className="w-4 h-4 text-emerald-400" /> Culture Guide: Communication</h3>
                      <p className="text-sm leading-relaxed" style={{ color: t.textMuted }}>We value radical candor. However, public channels are for alignment, not debate. Take disagreements to DMs or synchronous meetings. If you make a mistake, "Retract & Apologize" early rather than attempting to quietly fix it.</p>
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <>
            {/* Inbox List */}
        <div className="w-[320px] border-r flex flex-col shrink-0 overflow-hidden"
          style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <div className="px-4 py-2.5 border-b flex justify-between items-center" style={{ borderColor: t.border }}>
            <h2 className="text-xs font-black uppercase tracking-widest capitalize" style={{ color: t.textPrimary }}>{activeTab}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.surfaceAlt, color: t.textMuted }}>{activeEvents.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeEvents.map(event => {
              const sh = runtime.stakeholderStates[event.fromStakeholderId];
              const isSelected = selectedEventId === event.id;
              return (
                <button key={event.id} onClick={() => {
                  setSelectedEventId(event.id);
                  setRuntime(prev => prev ? {
                    ...prev,
                    eventStream: prev.eventStream.map(e => e.id === event.id ? { ...e, isRead: true } : e)
                  } : prev);
                }}
                  className="w-full text-left p-3.5 border-b flex gap-3 items-start transition-all"
                  style={{ borderColor: t.border, backgroundColor: isSelected ? t.surfaceAlt : 'transparent' }}>
                  {sh ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: sh.avatarColor }}>{sh.avatar}</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: t.surfaceAlt, color: t.textMuted }}><Cpu className="w-3.5 h-3.5" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-xs truncate" style={{ color: !event.isRead ? t.textPrimary : t.textSecondary }}>{sh?.name || 'System'}</span>
                      {event.priority === 'CRITICAL' && <span className="text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 bg-red-500/20 text-red-400 animate-pulse">URGENT</span>}
                      {event.priority === 'HIGH' && !event.isAnswered && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-orange-500/20 text-orange-400">HIGH</span>}
                    </div>
                    <div className="text-[10px] mb-1 truncate" style={{ color: t.textMuted }}>{event.subject || event.channel || 'DM'}</div>
                    <p className="text-xs line-clamp-2" style={{ color: t.textMuted }}>{event.message}</p>
                    {event.isAnswered && (
                      <div className="mt-1.5 text-[9px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Responded
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {activeEvents.length === 0 && (
              <div className="p-8 text-center text-xs" style={{ color: t.textMuted }}>No items in {activeTab}.</div>
            )}
          </div>
        </div>

        {/* Main Reading Pane */}
        <div className={`flex-1 flex min-h-0 ${showSandbox ? '' : ''}`} style={{ backgroundColor: t.bg }}>
          <div
            className={`flex-1 flex flex-col relative min-h-0 overflow-y-auto ${showSandbox ? 'border-r' : ''}`}
            style={{ borderColor: t.border }}
          >
            {selectedEvent ? (
              <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-7 min-h-0">
                {/* Message Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    {runtime.stakeholderStates[selectedEvent.fromStakeholderId] && (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base shrink-0"
                        style={{ backgroundColor: runtime.stakeholderStates[selectedEvent.fromStakeholderId]?.avatarColor }}
                      >
                        {runtime.stakeholderStates[selectedEvent.fromStakeholderId]?.avatar}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                        {selectedEvent.subject || selectedEvent.channel || 'Direct Message'}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                        From: <span style={{ color: t.textSecondary }}>{runtime.stakeholderStates[selectedEvent.fromStakeholderId]?.name || 'System'}</span>
                        {runtime.stakeholderStates[selectedEvent.fromStakeholderId] && (
                          <span className="ml-1.5 text-[10px]" style={{ color: t.textMuted }}>
                            ({runtime.stakeholderStates[selectedEvent.fromStakeholderId]?.role})
                          </span>
                        )}
                        {selectedEvent.priority === 'CRITICAL' && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">URGENT</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSandbox(p => !p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all"
                    style={showSandbox ? { backgroundColor: t.accentBg, color: t.accentText, borderColor: t.accentBorder } : { backgroundColor: t.surface, color: t.textMuted, borderColor: t.border }}
                  >
                    <Terminal className="w-3.5 h-3.5" /> {showSandbox ? 'Close' : 'Code'}
                  </button>
                </div>

                {/* Message Body */}
                <div
                  className="rounded-xl p-5 mb-6 leading-relaxed whitespace-pre-wrap border text-sm shrink-0"
                  style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textSecondary }}
                >
                  {selectedEvent.message}
                </div>

                {/* Response Area */}
                {!selectedEvent.isAnswered && selectedEvent.requiresResponse && (
                  <div className="space-y-3 shrink-0">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Draft your response... (quality and speed both matter)"
                      className="w-full h-28 rounded-xl p-4 text-sm focus:outline-none resize-none border"
                      style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('ignored', selectedEvent.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-red-500/10 hover:text-red-400"
                          style={{ color: t.textMuted }}
                        >
                          Ignore & Archive
                        </button>
                        <button
                          onClick={() => handleAction('asked_clarification', selectedEvent.id)}
                          disabled={isProcessingAction || !replyText.trim()}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40"
                          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.06)' }}
                        >
                          Ask Clarification
                        </button>
                        <button
                          onClick={() => handleAction('escalated', selectedEvent.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:-translate-y-0.5"
                          style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.25)', backgroundColor: 'rgba(248,113,113,0.06)' }}
                        >
                          Escalate
                        </button>
                        {/* Feature 7: Retract / Apologize */}
                        <button
                          onClick={() => handleAction('retracted_apologized' as CandidateActionType, selectedEvent.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:-translate-y-0.5"
                          style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.25)', backgroundColor: 'rgba(139,92,246,0.06)' }}
                          title="If you realize you made a mistake, take accountability."
                        >
                          Retract & Apologize
                        </button>
                      </div>
                      <button
                        onClick={() => handleAction('responded', selectedEvent.id)}
                        disabled={isProcessingAction || !replyText.trim()}
                        className="px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 disabled:opacity-40 transition-all"
                        style={{ backgroundColor: t.accent }}
                      >
                        {isProcessingAction ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isProcessingAction ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedEvent.isAnswered && (
                  <div className="p-3 rounded-xl border flex items-center gap-2 text-xs text-emerald-400 shrink-0"
                    style={{ borderColor: 'rgba(52,211,153,0.2)', backgroundColor: 'rgba(52,211,153,0.06)' }}>
                    <Check className="w-3.5 h-3.5" /> Response sent
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8" style={{ color: t.textMuted }}>
                {/* Empty state — show dashboard overview */}
                <div className="text-center max-w-sm">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: t.surfaceAlt, border: `1px solid ${t.border}` }}>
                    <Activity className="w-7 h-7" style={{ color: t.textMuted }} />
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: t.textSecondary }}>Select a message to respond</div>
                  <div className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    {runtime.eventStream.filter(e => !e.isAnswered && e.requiresResponse).length} item{runtime.eventStream.filter(e => !e.isAnswered && e.requiresResponse).length !== 1 ? 's' : ''} waiting for your attention.
                    Every action is recorded and evaluated.
                  </div>
                </div>
              </div>
            )}

        {/* Removed old Right-Panel currentChallenge overlay */}
          </div>

          {/* Removed CodeIDE Sandbox (replaced by Challenge Modal) */}
        </div>
        </>
      )}

        {/* ── Right Panel: Live Behavioral Monitor ──────────────────────── */}
        <div
          className="w-64 border-l flex flex-col overflow-hidden shrink-0"
          style={{ backgroundColor: t.bg, borderColor: t.border }}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b shrink-0" style={{ backgroundColor: t.surface, borderColor: t.border }}>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: t.accent }} />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: t.accent }}>Live Monitor</p>
            </div>
            <p className="text-[8px] uppercase tracking-widest" style={{ color: t.textMuted }}>Behavioral analysis · hidden from candidate</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Session Vitals */}
            <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Session Vitals</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: `${runtime.currentAct}/3`, label: 'Act', color: t.accent },
                  { val: runtime.behavioralSignals.ignoredEventIds.length, label: 'Ignored', color: '#f87171' },
                  { val: runtime.behavioralSignals.clarificationCount, label: 'Clarified', color: '#fb923c' },
                  { val: tabSwitches, label: 'Focus Lost', color: t.textMuted },
                  { val: runtime.candidateActions.filter(a => a.type === 'responded').length, label: 'Responded', color: '#34d399' },
                  { val: runtime.assistantUsageCount, label: 'Hints Used', color: '#a78bfa' },
                ].map(v => (
                  <div key={v.label} className="rounded-lg p-2 text-center border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                    <p className="text-base font-black" style={{ color: v.color }}>{v.val}</p>
                    <p className="text-[7px] uppercase tracking-wider mt-0.5" style={{ color: t.textMuted }}>{v.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stakeholder Monitor */}
            <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Stakeholder Trust</p>
              {Object.values(runtime.stakeholderStates).map((s: StakeholderState) => {
                const isCrit = s.frustration >= 70 || s.trust <= 30;
                const isWarn = s.frustration >= 40 || s.trust <= 60;
                return (
                  <div key={s.id} className="mb-2 last:mb-0 p-2 rounded-lg border"
                    style={{ borderColor: isCrit ? 'rgba(239,68,68,0.3)' : isWarn ? 'rgba(245,158,11,0.2)' : t.border, backgroundColor: isCrit ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                          style={{ backgroundColor: s.avatarColor }}>{s.avatar}</div>
                        <span className="text-[9px] font-semibold truncate max-w-[70px]" style={{ color: t.textPrimary }}>{s.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-[8px] font-bold" style={{ color: isCrit ? '#f87171' : isWarn ? '#fb923c' : '#34d399' }}>
                        {s.trust}/100
                      </span>
                    </div>
                    {/* Trust bar */}
                    <div className="h-1 rounded-full overflow-hidden mb-1" style={{ backgroundColor: t.surfaceAlt }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.trust}%`, backgroundColor: isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#34d399' }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[7px]" style={{ color: t.textMuted }}>Trust</span>
                      {isCrit && <span className="text-[7px] text-red-400 font-bold animate-pulse">⚠ Critical</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HYRTE Score Preview (if computed) */}
            {showScorePanel && hyrteScore && (
              <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>HYRTE Score Preview</p>
                <div className="text-center mb-3">
                  <div className="text-3xl font-black" style={{ color: t.accent }}>{hyrteScore.total}</div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>/ 100</div>
                </div>
                {/* 15/35/50 breakdown */}
                {[
                  { label: 'Direct Skill (15%)', val: hyrteScore.directSkill.score },
                  { label: 'Embedded Skills (35%)', val: hyrteScore.embeddedSkills.score },
                  { label: 'Workplace Intel (50%)', val: hyrteScore.workplaceIntelligence.score },
                ].map(row => (
                  <div key={row.label} className="mb-1.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[8px]" style={{ color: t.textMuted }}>{row.label}</span>
                      <span className="text-[9px] font-bold" style={{ color: t.textSecondary }}>{row.val}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: t.surfaceAlt }}>
                      <div className="h-full rounded-full" style={{ width: `${row.val}%`, backgroundColor: t.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chaos Wave Log */}
            {runtime.consequenceWaveLog && runtime.consequenceWaveLog.length > 0 && (
              <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                <p className="text-[8px] font-black uppercase tracking-widest mb-2 text-amber-400">Consequence Waves Fired</p>
                {runtime.consequenceWaveLog.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5 last:mb-0">
                    <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[8px]" style={{ color: t.textMuted }}>{w.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Log */}
            <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Action Log</p>
              {runtime.candidateActions.slice(-5).reverse().map((a, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    a.type === 'ignored' ? 'bg-red-400' :
                    a.type === 'responded' ? 'bg-emerald-400' :
                    a.type === 'asked_clarification' ? 'bg-amber-400' :
                    a.type === 'escalated' ? 'bg-orange-400' : 'bg-gray-400'
                  }`} />
                  <div>
                    <span className="text-[8px] font-bold capitalize" style={{ color: t.textSecondary }}>{a.type}</span>
                    <span className="text-[8px] ml-1" style={{ color: t.textMuted }}>→ {runtime.stakeholderStates[a.stakeholderId]?.name?.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
              {runtime.candidateActions.length === 0 && (
                <p className="text-[8px]" style={{ color: t.textMuted }}>No actions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Face PiP Camera ───────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 z-40">
        <video
          ref={videoRef}
          autoPlay muted playsInline
          className="w-36 h-24 rounded-xl object-cover border shadow-2xl"
          style={{ transform: 'scaleX(-1)', borderColor: t.border, display: cameraStream ? 'block' : 'none' }}
        />
      </div>

      {/* ── Assistant Button ──────────────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsAssistantOpen(p => !p)}
          className="w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center text-white relative transition-all hover:scale-110"
          style={{ backgroundColor: t.accent }}
        >
          <Sparkles className="w-5 h-5" />
          {runtime.assistantUsageCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-black text-[9px] font-black rounded-full flex items-center justify-center">
              {runtime.assistantUsageCount}
            </div>
          )}
        </button>

        {/* Assistant Chat Panel */}
        {isAssistantOpen && (
          <div
            className="absolute bottom-16 right-0 w-80 rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: t.border, backgroundColor: t.accentBg }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: t.accent }} />
                <span className="text-xs font-black" style={{ color: t.accentText }}>AURA — Senior Colleague</span>
              </div>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: t.accentBorder, color: t.accentText }}>
                Hint {runtime.assistantUsageCount + 1}
              </span>
            </div>
            <div className="h-52 overflow-y-auto p-3 space-y-2">
              {assistantLogs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                    style={msg.role === 'user'
                      ? { backgroundColor: t.accent, color: '#fff' }
                      : { backgroundColor: t.surfaceAlt, color: t.textSecondary }}
                  >{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2" style={{ borderColor: t.border }}>
              <input
                value={assistantInput}
                onChange={e => setAssistantInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAssistant(); } }}
                placeholder="Ask for a nudge..."
                className="flex-1 rounded-lg px-3 py-1.5 text-xs border outline-none"
                style={{ backgroundColor: t.bg, borderColor: t.border, color: t.textPrimary }}
              />
              <button
                onClick={handleAskAssistant}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all"
                style={{ backgroundColor: t.accent }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Submit Modal — HYRTE Score Breakdown                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b" style={{ borderColor: t.border, background: `linear-gradient(135deg, ${t.accentBg}, transparent)` }}>
              <div className="flex items-center gap-3 mb-1">
                <Award className="w-6 h-6" style={{ color: t.accent }} />
                <h2 className="text-xl font-black" style={{ color: t.textPrimary }}>HYRTE Assessment Complete</h2>
              </div>
              <p className="text-sm" style={{ color: t.textMuted }}>
                {blueprint.role} · {blueprint.company} · {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {isComputingScore ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 border-4 border-t-violet-500 border-violet-500/20 rounded-full animate-spin" />
                  <div className="text-sm text-gray-400">Computing your HYRTE behavioral score...</div>
                  <div className="text-xs text-gray-600">This may take 10–15 seconds. We're analyzing {runtime.candidateActions.length} actions across {runtime.currentAct} act{runtime.currentAct > 1 ? 's' : ''}.</div>
                </div>
              ) : hyrteScore ? (
                <>
                  {/* Total Score */}
                  <div className="text-center py-6 rounded-xl border" style={{ borderColor: t.accentBorder, backgroundColor: t.accentBg }}>
                    <div className="text-6xl font-black mb-1" style={{ color: t.accent }}>{hyrteScore.total}</div>
                    <div className="text-sm font-semibold" style={{ color: t.accentText }}>HYRTE Score / 100</div>
                  </div>

                  {/* 15 / 35 / 50 breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Direct Skill', pct: '15%', score: hyrteScore.directSkill.score, color: '#818cf8', desc: 'Pre-simulation case question' },
                      { label: 'Embedded Skills', pct: '35%', score: hyrteScore.embeddedSkills.score, color: '#34d399', desc: 'In-simulation decisions' },
                      { label: 'Workplace Intel', pct: '50%', score: hyrteScore.workplaceIntelligence.score, color: '#f59e0b', desc: 'Behavioral signals' },
                    ].map(row => (
                      <div key={row.label} className="rounded-xl p-4 border text-center" style={{ borderColor: t.border, backgroundColor: t.bg }}>
                        <div className="text-xs font-bold mb-1" style={{ color: row.color }}>{row.pct}</div>
                        <div className="text-3xl font-black mb-1" style={{ color: row.color }}>{row.score}</div>
                        <div className="text-xs font-semibold mb-0.5" style={{ color: t.textPrimary }}>{row.label}</div>
                        <div className="text-[10px]" style={{ color: t.textMuted }}>{row.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Workplace Intelligence Dimensions */}
                  <div className="rounded-xl p-4 border" style={{ borderColor: t.border, backgroundColor: t.bg }}>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: t.textMuted }}>Workplace Intelligence Breakdown (50%)</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(hyrteScore.workplaceIntelligence.dimensions).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: t.textSecondary }}>{DIM_LABELS[key] || key}</span>
                            <span className="font-bold" style={{ color: t.textPrimary }}>{val}/100</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: t.surfaceAlt }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${val}%`, backgroundColor: val >= 75 ? '#34d399' : val >= 55 ? '#f59e0b' : '#f87171' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recovery Score */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: t.border, backgroundColor: t.bg }}>
                    <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold mb-0.5" style={{ color: t.textPrimary }}>Recovery Score</div>
                      <div className="text-xs" style={{ color: t.textMuted }}>How well you recovered from mistakes — unique to HYRTE</div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{hyrteScore.recoveryScore}</div>
                  </div>

                  {/* Hiring Insight */}
                  {hyrteScore.hiringInsight && (
                    <div className="p-4 rounded-xl border" style={{ borderColor: t.accentBorder, backgroundColor: t.accentBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4" style={{ color: t.accentText }} />
                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: t.accentText }}>Hiring Insight</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{hyrteScore.hiringInsight}</p>
                    </div>
                  )}

                  {/* Observations */}
                  {hyrteScore.workplaceIntelligence.observations?.length > 0 && (
                    <div className="p-4 rounded-xl border" style={{ borderColor: t.border, backgroundColor: t.bg }}>
                      <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: t.textMuted }}>Key Observations</div>
                      <ul className="space-y-1.5">
                        {hyrteScore.workplaceIntelligence.observations.map((obs, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: t.textSecondary }}>
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: t.accent }} />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm mb-2" style={{ color: t.textSecondary }}>Simulation completed.</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>Score computation unavailable. Proceed to Phase 2.</div>
                </div>
              )}

              {/* Session Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Acts Done', val: `${runtime.currentAct}/3` },
                  { label: 'Ignored', val: runtime.behavioralSignals.ignoredEventIds.length },
                  { label: 'Clarified', val: runtime.behavioralSignals.clarificationCount },
                  { label: 'Hints', val: runtime.assistantUsageCount },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 border text-center" style={{ borderColor: t.border, backgroundColor: t.bg }}>
                    <div className="text-xl font-black" style={{ color: t.accent }}>{s.val}</div>
                    <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: t.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleProceedToInterview}
                className="w-full py-4 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentHover})` }}
              >
                <ChevronRight className="w-4 h-4" />
                Proceed to Phase 2: Live AI Voice Interview
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Challenge Modal Overlay                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showChallengeModal && activeChallenge && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div
            className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: t.surface, borderColor: t.accentBorder }}
          >
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: t.border, background: `linear-gradient(135deg, ${t.accentBg}, transparent)` }}>
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5" style={{ color: t.accent }} />
                <h2 className="text-lg font-black uppercase tracking-wider" style={{ color: t.textPrimary }}>
                  {activeChallenge.type ? activeChallenge.type.replace('_', ' ') : 'Critical Decision Required'}
                </h2>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest" style={{ backgroundColor: t.accentBorder, color: t.accentText }}>
                Embedded Challenge · 35% Score
              </span>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: t.textMuted }}>Situation</h3>
                <p className="text-base leading-relaxed" style={{ color: t.textPrimary }}>{activeChallenge.prompt}</p>
              </div>

              {activeChallenge.context && (
                <div className="rounded-xl p-4 border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textMuted }}>Context / Data</h3>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: t.textSecondary }}>{activeChallenge.context}</pre>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: t.textMuted }}>Your Response</h3>
                <textarea
                  value={challengeResponseText}
                  onChange={e => setChallengeResponseText(e.target.value)}
                  placeholder="Write your detailed response here. Your actual words matter..."
                  className="w-full h-40 rounded-xl p-4 text-sm border outline-none resize-none transition-all"
                  style={{ backgroundColor: t.bg, borderColor: t.border, color: t.textPrimary }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: t.border, backgroundColor: t.surfaceAlt }}>
              <button
                onClick={() => {
                  if (!challengeResponseText.trim()) return;
                  setRuntime(prev => {
                    if (!prev) return prev;
                    const newResponses = [...prev.challengeResponses];
                    const idx = newResponses.findIndex(r => r.challengeId === activeChallenge.id);
                    if (idx > -1) newResponses[idx].response = challengeResponseText;
                    else newResponses.push({ challengeId: activeChallenge.id, response: challengeResponseText });
                    return { ...prev, challengeResponses: newResponses };
                  });
                  setChallengeResponseText('');
                  setShowChallengeModal(false);
                  setActiveChallenge(null);
                  
                  // If it was the currentChallenge, advance act automatically
                  if (activeChallenge.id === runtime?.currentChallenge?.id) {
                    if (runtime.currentAct >= 3) handleSubmitTest();
                    else handleAdvanceAct();
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:scale-105"
                style={{ backgroundColor: t.accent, color: '#fff' }}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
