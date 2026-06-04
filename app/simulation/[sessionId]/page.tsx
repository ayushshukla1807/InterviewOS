'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SimulationBlueprint,
  SimulationRuntimeState,
  SimulationEvent,
  CandidateActionType,
  StakeholderState
} from '../../../lib/simulation/types';
import CodeChallenge from '../../components/CodeChallenge';
import { MessageSquare, Mail, ClipboardCheck, Calendar, ShieldAlert, Cpu, Sparkles, User, Terminal, Palette, Check } from 'lucide-react';

// ─── Theme System ─────────────────────────────────────────────────────────────
type SimThemeKey = 'noir' | 'terminal' | 'corporate' | 'sunset' | 'arctic';

const THEMES: Record<SimThemeKey, {
  label: string;
  preview: string;  // accent hex for preview swatch
  bg: string;       // page background
  surface: string;  // panels / cards
  surfaceAlt: string; // slightly lighter surface
  border: string;   // border colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;   // interactive accent
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentHover: string;
  fontFamily: string;
}> = {
  noir: {
    label: 'Noir',
    preview: '#6366f1',
    bg: '#0e0e10',
    surface: '#111113',
    surfaceAlt: '#1a1a1c',
    border: 'rgba(255,255,255,0.06)',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    accent: '#6366f1',
    accentText: '#a5b4fc',
    accentBg: 'rgba(99,102,241,0.12)',
    accentBorder: 'rgba(99,102,241,0.3)',
    accentHover: '#4f46e5',
    fontFamily: 'Outfit, sans-serif',
  },
  terminal: {
    label: 'Terminal',
    preview: '#22c55e',
    bg: '#020b02',
    surface: '#051005',
    surfaceAlt: '#0a1f0a',
    border: 'rgba(34,197,94,0.15)',
    textPrimary: '#86efac',
    textSecondary: '#4ade80',
    textMuted: '#166534',
    accent: '#22c55e',
    accentText: '#86efac',
    accentBg: 'rgba(34,197,94,0.1)',
    accentBorder: 'rgba(34,197,94,0.3)',
    accentHover: '#16a34a',
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
  },
  corporate: {
    label: 'Corporate',
    preview: '#3b82f6',
    bg: '#f0f4f8',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#3b82f6',
    accentText: '#1d4ed8',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    accentHover: '#2563eb',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  sunset: {
    label: 'Sunset',
    preview: '#f97316',
    bg: '#120a00',
    surface: '#1c1008',
    surfaceAlt: '#271608',
    border: 'rgba(251,146,60,0.12)',
    textPrimary: '#fed7aa',
    textSecondary: '#fdba74',
    textMuted: '#92400e',
    accent: '#f97316',
    accentText: '#fed7aa',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    accentHover: '#ea580c',
    fontFamily: 'Outfit, sans-serif',
  },
  arctic: {
    label: 'Arctic',
    preview: '#06b6d4',
    bg: '#030f1a',
    surface: '#061525',
    surfaceAlt: '#0a2035',
    border: 'rgba(6,182,212,0.12)',
    textPrimary: '#cffafe',
    textSecondary: '#67e8f9',
    textMuted: '#164e63',
    accent: '#06b6d4',
    accentText: '#cffafe',
    accentBg: 'rgba(6,182,212,0.1)',
    accentBorder: 'rgba(6,182,212,0.3)',
    accentHover: '#0891b2',
    fontFamily: 'Outfit, sans-serif',
  },
};

export default function LivingWorkplaceSimulation() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [blueprint, setBlueprint] = useState<SimulationBlueprint | null>(null);
  const [runtime, setRuntime] = useState<SimulationRuntimeState | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'slack' | 'email' | 'tasks' | 'calendar' | 'notifications'>('slack');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Monaco Coding Split View State
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('// Write code here...');
  const [sandboxLang, setSandboxLang] = useState('javascript');

  // Senior Hint Colleague Chatbot State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLogs, setAssistantLogs] = useState<{ role: 'user' | 'colleague'; content: string }[]>([
    { role: 'colleague', content: 'Hey! I know you are in the middle of a crunch, but if you get blocked, let me know. I can give you a subtle nudge.' }
  ]);

  // Face PiP Camera Stream State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Submit Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Anti-cheat & Timer
  const [timeLeft, setTimeLeft] = useState(2400); // 40 mins
  const [tabSwitches, setTabSwitches] = useState(0);

  // Theme
  const [themeKey, setThemeKey] = useState<SimThemeKey>('noir');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const t = THEMES[themeKey];

  // Camera initialization for Face PiP
  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Webcam permission denied or unavailable for Face PiP:', err);
      }
    }
    enableCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(`simulation_${sessionId}`);
    if (stored) {
      try {
        const bp = JSON.parse(stored) as SimulationBlueprint;
        setBlueprint(bp);
        
        // Initialize Runtime State
        const stakeholderStates = bp.stakeholders.reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as Record<string, StakeholderState>);

        setRuntime({
          blueprint: bp,
          currentAct: 1,
          actStartTime: Date.now(),
          eventStream: bp.acts[0].initialEvents,
          pendingConsequences: [],
          stakeholderStates,
          candidateActions: [],
          currentChallenge: bp.acts[0].challenge,
          challengeResponses: [],
          assistantUsageCount: 0,
          tabSwitches: 0,
          behavioralSignals: {
            ignoredEventIds: [],
            escalatedEventIds: [],
            clarificationCount: 0,
            averageResponseTimeSeconds: 0,
            responseTimes: [],
            openedEmails: [],
            openedSlacks: [],
          }
        });
      } catch (e) {
        alert("Failed to parse blueprint.");
        router.push('/simulation');
      }
    } else {
      alert("Invalid or expired simulation session.");
      router.push('/simulation');
    }
  }, [sessionId, router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitches(prev => prev + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleAction = async (actionType: CandidateActionType, eventId: string) => {
    if (!runtime) return;
    setIsProcessingAction(true);

    const event = runtime.eventStream.find(e => e.id === eventId);
    if (!event) return;

    const stakeholder = runtime.stakeholderStates[event.fromStakeholderId];
    
    // Optimistic UI Update
    setRuntime(prev => {
      if (!prev) return prev;
      const updatedStream = prev.eventStream.map(e => 
        e.id === eventId ? { ...e, isAnswered: true } : e
      );
      return { ...prev, eventStream: updatedStream };
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
          currentAct: runtime.currentAct,
          candidateAction: actionType,
          candidateResponse: actionType === 'responded' || actionType === 'asked_clarification' ? replyText : null,
          triggeringEvent: event,
          stakeholder,
          allStakeholders: runtime.stakeholderStates,
          recentHistory: runtime.candidateActions.slice(-5).map(a => a.type)
        })
      });

      const data = await res.json();
      
      setRuntime(prev => {
        if (!prev) return prev;
        
        const newStakeholderStates = { ...prev.stakeholderStates };
        if (data.updatedStakeholder) {
          newStakeholderStates[stakeholder.id] = data.updatedStakeholder;
        }

        const updatedSignals = { ...prev.behavioralSignals };
        if (actionType === 'asked_clarification') {
          updatedSignals.clarificationCount = (updatedSignals.clarificationCount || 0) + 1;
        } else if (actionType === 'ignored') {
          updatedSignals.ignoredEventIds = [...(updatedSignals.ignoredEventIds || []), eventId];
        } else if (actionType === 'escalated') {
          updatedSignals.escalatedEventIds = [...(updatedSignals.escalatedEventIds || []), eventId];
        }

        return {
          ...prev,
          stakeholderStates: newStakeholderStates,
          eventStream: [...prev.eventStream, ...(data.consequenceEvents || [])],
          behavioralSignals: updatedSignals,
          candidateActions: [...prev.candidateActions, {
            type: actionType,
            eventId,
            stakeholderId: stakeholder.id,
            response: replyText,
            responseTimeSeconds: Math.floor((Date.now() - prev.actStartTime) / 1000),
            timestamp: Date.now()
          }]
        };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAskAssistant = async () => {
    if (!assistantInput.trim() || !runtime) return;
    const userMsg = assistantInput;
    setAssistantInput('');
    setAssistantLogs(prev => [...prev, { role: 'user', content: userMsg }]);
    
    // Increment assistant usage
    setRuntime(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        assistantUsageCount: (prev.assistantUsageCount || 0) + 1
      };
    });

    try {
      const res = await fetch('/api/simulation/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: runtime.blueprint.role,
          simulationContext: `Candidate is in Act ${runtime.currentAct} of simulation. Active tab is ${activeTab}.`,
          stakeholderStates: runtime.stakeholderStates,
          currentChallenge: runtime.currentChallenge,
          question: userMsg,
          hintNumber: runtime.assistantUsageCount || 0,
        })
      });
      const data = await res.json();
      setAssistantLogs(prev => [...prev, { role: 'colleague', content: data.hint || 'Think about who is blocking you.' }]);
    } catch {
      setAssistantLogs(prev => [...prev, { role: 'colleague', content: 'Sorry, I am a bit swamped right now. Try reviewing your tasks!' }]);
    }
  };

  const handleAdvanceAct = () => {
    if (!runtime) return;
    if (runtime.currentAct >= 3) {
      handleSubmitTest();
      return;
    }
    
    const nextActNum = runtime.currentAct + 1;
    const nextAct = runtime.blueprint.acts.find(a => a.act === nextActNum);
    
    if (nextAct) {
      setRuntime(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentAct: nextActNum as 1 | 2 | 3,
          actStartTime: Date.now(),
          eventStream: [...prev.eventStream, ...nextAct.initialEvents],
          currentChallenge: nextAct.challenge
        };
      });
    }
  };

  const compileSimulationSummary = (currentRuntime: SimulationRuntimeState) => {
    const actions = currentRuntime.candidateActions;
    const stakeholders = Object.values(currentRuntime.stakeholderStates);
    
    let summary = `### Simulation Performance Metrics
- **Role Evaluated:** ${currentRuntime.blueprint.role}
- **Total Acts Completed:** ${currentRuntime.currentAct} / 3
- **Ignored Events Count:** ${currentRuntime.behavioralSignals.ignoredEventIds?.length || 0}
- **Escalated Events Count:** ${currentRuntime.behavioralSignals.escalatedEventIds?.length || 0}
- **Clarification Requests Raised:** ${currentRuntime.behavioralSignals.clarificationCount || 0}
- **Senior Hints Requested:** ${currentRuntime.assistantUsageCount || 0}
- **Tab Focus Mismatches (Cheating Proctor Signal):** ${tabSwitches}

### Stakeholder Trust Summary:
`;

    stakeholders.forEach(s => {
      summary += `- **${s.name} (${s.role}):** Trust: ${s.trust}/100, Frustration: ${s.frustration}/100, Escalation Level: ${s.escalationLevel}/3\n`;
    });

    summary += `\n### Candidate Action Logs:\n`;
    actions.forEach((act, idx) => {
      summary += `${idx + 1}. Candidate **${act.type}** in response to Event ID ${act.eventId} (from ${currentRuntime.stakeholderStates[act.stakeholderId]?.name || 'System'}). Response: "${act.response || 'No text response'}" (took ${act.responseTimeSeconds}s)\n`;
    });

    if (currentRuntime.challengeResponses && currentRuntime.challengeResponses.length > 0) {
      summary += `\n### Challenge Code Solutions:\n`;
      currentRuntime.challengeResponses.forEach((resp) => {
        summary += `- **Challenge ID ${resp.challengeId}:**\n\`\`\`${sandboxLang}\n${resp.response}\n\`\`\`\n`;
      });
    }

    return summary;
  };

  const handleSubmitTest = async () => {
    setShowSubmitModal(true);
  };

  const handleProceedToInterview = () => {
    if (!runtime || !blueprint) return;
    const summary = compileSimulationSummary(runtime);
    sessionStorage.setItem(`simulation_summary_${sessionId}`, summary);
    localStorage.setItem(`simulation_summary_${sessionId}`, summary);

    const candidateName = blueprint.candidateName || 'Candidate';
    router.push(`/instructions?name=${encodeURIComponent(candidateName)}&track=DYNAMIC&simulationSessionId=${sessionId}`);
  };

  if (!blueprint || !runtime) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center font-outfit">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400">Booting Workspace OS...</span>
        </div>
      </div>
    );
  }

  const activeEvents = runtime.eventStream.filter(e => e.type === activeTab || (activeTab === 'slack' && e.type === 'notification'));
  const selectedEvent = runtime.eventStream.find(e => e.id === selectedEventId);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: t.bg,
        color: t.textPrimary,
        fontFamily: t.fontFamily,
        transition: 'background-color 0.35s, color 0.35s',
      }}
    >
      {/* ─── Top Bar: Progress & Status ─── */}
      <div
        className="border-b px-6 py-3 flex justify-between items-center z-20"
        style={{ backgroundColor: t.surface, borderColor: t.border }}
      >
        <div className="flex items-center gap-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg"
            style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentHover})`, color: '#fff' }}
          >OS</div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: t.textPrimary }}>{blueprint.company} Workspace</h1>
            <p className="text-xs" style={{ color: t.textMuted }}>{blueprint.role}</p>
          </div>

          {/* Act Progress Bar */}
          <div
            className="flex items-center gap-2 ml-8 px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: t.surfaceAlt, borderColor: t.border }}
          >
            {[1, 2, 3].map(act => (
              <div key={act} className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: runtime.currentAct >= act ? t.accent : t.textMuted }}
                />
                <span
                  className="text-xs ml-2 mr-3 font-medium"
                  style={{ color: runtime.currentAct >= act ? t.accentText : t.textMuted }}
                >Act {act}</span>
                {act < 3 && <div className="w-4 h-[1px] mr-3" style={{ backgroundColor: t.border }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {tabSwitches > 0 && (
            <div className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold border border-red-500/20 animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Focus Lost ({tabSwitches})
            </div>
          )}

          <div
            className={`text-xl font-mono px-3 py-1.5 rounded-lg ${timeLeft < 300 ? 'text-red-400 animate-pulse' : ''}`}
            style={{
              backgroundColor: timeLeft < 300 ? 'rgba(239,68,68,0.1)' : t.surfaceAlt,
              color: timeLeft < 300 ? '#f87171' : t.textSecondary,
              border: `1px solid ${t.border}`,
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* ─── Theme Picker ─── */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{
                backgroundColor: t.accentBg,
                color: t.accentText,
                borderColor: t.accentBorder,
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              {t.label}
            </button>
            {showThemePicker && (
              <div
                className="absolute right-0 top-10 w-44 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ backgroundColor: t.surface, borderColor: t.border }}
              >
                {(Object.keys(THEMES) as SimThemeKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setThemeKey(key); setShowThemePicker(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition-all"
                    style={{
                      color: themeKey === key ? THEMES[key].accent : t.textSecondary,
                      backgroundColor: themeKey === key ? THEMES[key].accentBg : 'transparent',
                    }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: THEMES[key].preview }}
                    />
                    {THEMES[key].label}
                    {themeKey === key && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitTest}
            className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-white"
            style={{ backgroundColor: t.accent }}
          >
            Submit Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ─── Sidebar Navigation ─── */}
        <div
          className="w-16 border-r flex flex-col items-center py-4 gap-2 shrink-0"
          style={{ backgroundColor: t.surface, borderColor: t.border }}
        >
          {[
            { key: 'slack' as const, icon: <MessageSquare className="w-5 h-5" />, count: runtime.eventStream.filter(e => e.type === 'slack' && !e.isRead).length },
            { key: 'email' as const, icon: <Mail className="w-5 h-5" />, count: runtime.eventStream.filter(e => e.type === 'email' && !e.isRead).length },
            { key: 'tasks' as const, icon: <ClipboardCheck className="w-5 h-5" />, count: runtime.eventStream.filter(e => e.type === 'task' && !e.isRead).length },
            { key: 'calendar' as const, icon: <Calendar className="w-5 h-5" />, count: 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all"
              style={activeTab === tab.key ? {
                backgroundColor: t.accentBg,
                color: t.accentText,
                border: `1px solid ${t.accentBorder}`,
              } : {
                color: t.textMuted,
                border: '1px solid transparent',
              }}
            >
              {tab.icon}
              {tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {tab.count}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ─── Inbox / List View ─── */}
        <div
          className="w-[380px] border-r flex flex-col shrink-0 overflow-hidden"
          style={{ backgroundColor: t.surface, borderColor: t.border }}
        >
          <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: t.border }}>
            <h2 className="text-sm font-semibold capitalize" style={{ color: t.textPrimary }}>{activeTab}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeEvents.map(event => {
              const stakeholder = runtime.stakeholderStates[event.fromStakeholderId];
              const isSelected = selectedEventId === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className="w-full text-left p-4 border-b flex gap-3 items-start transition-all"
                  style={{
                    borderColor: t.border,
                    backgroundColor: isSelected ? t.surfaceAlt : 'transparent',
                  }}
                >
                  {stakeholder ? (
                    stakeholder.photoUrl ? (
                      <img src={stakeholder.photoUrl} alt={stakeholder.name} className="w-9 h-9 rounded-full object-cover shrink-0 border mt-0.5" style={{ borderColor: t.border }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white uppercase shrink-0 mt-0.5" style={{ backgroundColor: stakeholder.avatarColor }}>
                        {stakeholder.avatar}
                      </div>
                    )
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ backgroundColor: t.surfaceAlt, color: t.textMuted }}><Cpu className="w-4 h-4" /></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm truncate" style={{ color: t.textPrimary }}>
                        {stakeholder ? stakeholder.name : 'System'}
                      </span>
                      {event.priority === 'CRITICAL' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-red-500/20 text-red-400">URGENT</span>}
                    </div>
                    <div className="text-xs mb-2 truncate" style={{ color: t.textMuted }}>
                      {event.subject || event.channel || 'Direct Message'}
                    </div>
                    <p className="text-sm line-clamp-2" style={{ color: t.textSecondary }}>
                      {event.message}
                    </p>
                    {event.isAnswered && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Responded
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {activeEvents.length === 0 && (
              <div className="p-8 text-center text-sm" style={{ color: t.textMuted }}>
                No active items here.
              </div>
            )}
          </div>
        </div>

        {/* ─── Reading Pane & Monaco Code IDE Split Pane ─── */}
        <div className="flex-1 flex min-h-0" style={{ backgroundColor: t.bg }}>

          {/* Left Side: Message View */}
          <div
            className={`flex-1 flex flex-col relative min-h-0 overflow-y-auto ${showSandbox ? 'w-1/2 border-r' : 'w-full'}`}
            style={{ borderColor: t.border }}
          >
            {selectedEvent ? (
              <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8 min-h-0">
                <div className="flex justify-between items-start w-full mb-8">
                  <div className="flex items-center gap-4">
                    {runtime.stakeholderStates[selectedEvent.fromStakeholderId] && (
                      runtime.stakeholderStates[selectedEvent.fromStakeholderId].photoUrl ? (
                        <img 
                          src={runtime.stakeholderStates[selectedEvent.fromStakeholderId].photoUrl} 
                          alt={runtime.stakeholderStates[selectedEvent.fromStakeholderId].name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-800"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: runtime.stakeholderStates[selectedEvent.fromStakeholderId].avatarColor }}
                        >
                          {runtime.stakeholderStates[selectedEvent.fromStakeholderId].avatar}
                        </div>
                      )
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100">
                        {selectedEvent.subject || selectedEvent.channel || 'Direct Message'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        From: <span className="text-gray-300">{runtime.stakeholderStates[selectedEvent.fromStakeholderId]?.name || 'System'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Monaco IDE Sandbox Toggle */}
                  <button
                    onClick={() => setShowSandbox(prev => !prev)}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all"
                    style={showSandbox ? {
                      backgroundColor: t.accentBg,
                      color: t.accentText,
                      borderColor: t.accentBorder,
                    } : {
                      backgroundColor: t.surface,
                      color: t.textMuted,
                      borderColor: t.border,
                    }}
                  >
                    <Terminal className="w-3.5 h-3.5" /> {showSandbox ? 'Close Coding Editor' : 'Open Coding Editor'}
                  </button>
                </div>
                
                <div
                  className="rounded-xl p-6 mb-8 leading-relaxed whitespace-pre-wrap shadow-lg shrink-0 border"
                  style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textSecondary }}
                >
                  {selectedEvent.message}
                </div>

                {!selectedEvent.isAnswered && selectedEvent.requiresResponse && (
                  <div className="mt-auto space-y-4 shrink-0">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Draft your response..."
                      className="w-full h-32 rounded-xl p-4 text-sm focus:outline-none resize-none border"
                      style={{
                        backgroundColor: t.surface,
                        borderColor: t.border,
                        color: t.textPrimary,
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('ignored', selectedEvent.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400"
                          style={{ color: t.textMuted }}
                        >
                          Ignore & Archive
                        </button>

                        <button
                          onClick={() => handleAction('asked_clarification', selectedEvent.id)}
                          disabled={isProcessingAction || !replyText.trim()}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)' }}
                        >
                          Ask Clarification
                        </button>
                      </div>

                      <button
                        onClick={() => handleAction('responded', selectedEvent.id)}
                        disabled={isProcessingAction || !replyText.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: t.accent }}
                      >
                        {isProcessingAction ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-600">
                Select an item from the list to read
              </div>
            )}
            
            {/* ─── Challenge Overlay ─── */}
            {runtime.currentChallenge && (
              <div
                className="absolute top-4 right-4 w-80 rounded-xl shadow-2xl overflow-hidden z-30 border"
                style={{ backgroundColor: t.surface, borderColor: t.accentBorder }}
              >
                <div
                  className="px-4 py-2 border-b flex justify-between items-center"
                  style={{ backgroundColor: t.accentBg, borderColor: t.accentBorder }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.accentText }}>Current Objective</span>
                </div>
                <div className="p-4">
                  <p className="text-xs mb-4" style={{ color: t.textSecondary }}>{runtime.currentChallenge.prompt}</p>
                  <button
                    onClick={handleAdvanceAct}
                    className="w-full py-2 rounded-lg text-xs font-medium transition-colors border"
                    style={{ backgroundColor: t.accentBg, color: t.accentText, borderColor: t.accentBorder }}
                  >
                    Complete Objective & Advance
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Monaco IDE Sandbox */}
          {showSandbox && (
            <div className="w-1/2 flex flex-col h-full bg-[#0a0a0c] border-l border-gray-800/80">
              <CodeChallenge
                question={runtime.currentChallenge?.prompt || "Analyze the current situation and write your code proposal or resolution scripts here."}
                initialCode={sandboxCode}
                language={sandboxLang}
                onSubmit={(code, lang) => {
                  setSandboxCode(code);
                  setSandboxLang(lang);
                  // Update challenge response in runtime state
                  setRuntime(prev => {
                    if (!prev) return prev;
                    const challengeId = prev.currentChallenge?.id || 'ch-sandbox';
                    const idx = prev.challengeResponses.findIndex(r => r.challengeId === challengeId);
                    const newResponses = [...prev.challengeResponses];
                    if (idx > -1) {
                      newResponses[idx] = { challengeId, response: code };
                    } else {
                      newResponses.push({ challengeId, response: code });
                    }
                    return { ...prev, challengeResponses: newResponses };
                  });
                  alert('Code draft saved successfully to your simulation progress!');
                }}
              />
            </div>
          )}

        </div>

        {/* ─── Real-Time Progress Analysis Panel ─── */}
        <div
          className="w-72 border-l flex flex-col overflow-y-auto shrink-0"
          style={{ backgroundColor: t.bg, borderColor: t.border }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b shrink-0"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: t.accent }} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: t.accent }}>Live Behavioral Monitor</p>
            </div>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: t.textMuted }}>Real-time progress analysis</p>
          </div>

          <div className="flex-1 p-3 space-y-4 overflow-y-auto">

            {/* Session Vitals */}
            <div className="rounded-xl p-3 space-y-2 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Session Vitals</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 text-center border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <p className="text-lg font-black" style={{ color: t.accent }}>{runtime.currentAct}/3</p>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>Act</p>
                </div>
                <div className="rounded-lg p-2 text-center border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <p className="text-lg font-black text-rose-400">{runtime.behavioralSignals.ignoredEventIds?.length || 0}</p>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>Ignored</p>
                </div>
                <div className="rounded-lg p-2 text-center border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <p className="text-lg font-black text-amber-400">{runtime.behavioralSignals.clarificationCount || 0}</p>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>Clarified</p>
                </div>
                <div className="rounded-lg p-2 text-center border" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <p className="text-lg font-black" style={{ color: t.textSecondary }}>{tabSwitches}</p>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>Focus Lost</p>
                </div>
              </div>
            </div>

            {/* Stakeholder Trust & Frustration Monitor */}
            <div className="rounded-xl p-3 space-y-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>Stakeholder Monitor</p>
              {Object.values(runtime.stakeholderStates).map((s: StakeholderState) => {
                const frustrationLevel = s.frustration || 0;
                const trustLevel = s.trust !== undefined ? s.trust : 100;
                const isCritical = frustrationLevel >= 70 || trustLevel <= 30;
                const isWarning = frustrationLevel >= 40 || trustLevel <= 60;
                return (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg border transition-all"
                    style={{
                      borderColor: isCritical ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.2)' : t.border,
                      backgroundColor: isCritical ? 'rgba(239,68,68,0.05)' : isWarning ? 'rgba(245,158,11,0.05)' : t.bg,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                        style={{ backgroundColor: s.avatarColor || '#4f46e5' }}
                      >
                        {s.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: t.textPrimary }}>{s.name}</p>
                        <p className="text-[8px] truncate" style={{ color: t.textMuted }}>{s.role}</p>
                      </div>
                      {isCritical && (
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      )}
                    </div>

                    {/* Trust Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-gray-600 uppercase tracking-wider">Trust</span>
                        <span className={`text-[8px] font-black ${
                          trustLevel > 60 ? 'text-emerald-400' : trustLevel > 30 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{trustLevel}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            trustLevel > 60 ? 'bg-emerald-500' : trustLevel > 30 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${trustLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Frustration Bar */}
                    <div className="space-y-1 mt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-gray-600 uppercase tracking-wider">Frustration</span>
                        <span className={`text-[8px] font-black ${
                          frustrationLevel < 30 ? 'text-emerald-400' : frustrationLevel < 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{frustrationLevel}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            frustrationLevel < 30 ? 'bg-emerald-500' : frustrationLevel < 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${frustrationLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Escalation Badge */}
                    {(s.escalationLevel || 0) > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[8px] text-gray-600 uppercase tracking-wider">Escalation:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(lvl => (
                            <div
                              key={lvl}
                              className={`w-2.5 h-1.5 rounded-sm ${
                                (s.escalationLevel || 0) >= lvl ? 'bg-rose-500' : 'bg-gray-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Candidate Action Log */}
            <div className="rounded-xl p-3 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Action Log</p>
              {runtime.candidateActions.length === 0 ? (
                <p className="text-[9px] text-center py-3" style={{ color: t.textMuted }}>No actions recorded yet</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[...runtime.candidateActions].reverse().map((action, i) => {
                    const stName = runtime.stakeholderStates[action.stakeholderId]?.name || 'System';
                    const typeColors: Record<string, string> = {
                      responded: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      ignored: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                      escalated: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      asked_clarification: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                    };
                    const color = typeColors[action.type] || 'text-gray-400 bg-white/5 border-white/10';
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${color}`}>
                          {action.type === 'asked_clarification' ? 'CLARIFY' : action.type.toUpperCase()}
                        </span>
                        <p className="text-[8px] leading-relaxed" style={{ color: t.textMuted }}>{stName} — {action.responseTimeSeconds}s</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Alerts */}
            {(() => {
              const alerts: { label: string; color: string }[] = [];
              const ignoredCount = runtime.behavioralSignals.ignoredEventIds?.length || 0;
              const escalatedCount = runtime.behavioralSignals.escalatedEventIds?.length || 0;
              const criticalStakeholders = Object.values(runtime.stakeholderStates).filter(s => (s.frustration || 0) >= 70);
              if (ignoredCount >= 2) alerts.push({ label: `${ignoredCount} ignored — stakeholders may escalate`, color: 'border-rose-500/20 bg-rose-500/5 text-rose-400' });
              if (escalatedCount >= 1) alerts.push({ label: `${escalatedCount} escalation(s) flagged`, color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' });
              criticalStakeholders.forEach(s => alerts.push({ label: `${s.name} frustration critical`, color: 'border-rose-500/20 bg-rose-500/5 text-rose-400' }));
              if (tabSwitches >= 2) alerts.push({ label: `${tabSwitches} focus losses detected`, color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' });
              if (alerts.length === 0) return null;
              return (
                <div className="rounded-xl p-3 space-y-2 border" style={{ backgroundColor: t.surface, borderColor: t.border }}>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>Active Alerts</p>
                  {alerts.map((al, i) => (
                    <div key={i} className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border ${al.color}`}>
                      {al.label}
                    </div>
                  ))}
                </div>
              );
            })()}

          </div>
        </div>

      </div>

      {/* ─── Face PiP (Micro proctoring camera feed) ─── */}
      <div
        className="fixed bottom-4 right-4 w-40 h-28 rounded-xl overflow-hidden shadow-2xl z-50 border"
        style={{ backgroundColor: t.surface, borderColor: t.border }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">Live PiP</span>
        </div>
      </div>

      {/* ─── Senior Hint Assistant Chatbot Float Button ─── */}
      <button
        onClick={() => setIsAssistantOpen(prev => !prev)}
        className="fixed bottom-36 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-white transition-all z-40"
        style={{ backgroundColor: t.accent }}
        title="Consult Colleague"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* ─── Senior Hint Colleague Chatbot Window ─── */}
      {isAssistantOpen && (
        <div
          className="fixed bottom-4 right-20 w-80 h-[420px] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border"
          style={{ backgroundColor: t.surface, borderColor: t.border, fontFamily: t.fontFamily }}
        >
          <div
            className="border-b p-4 flex justify-between items-center shrink-0"
            style={{ backgroundColor: t.surfaceAlt, borderColor: t.border }}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: t.textSecondary }} />
              <div>
                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>Senior Colleague (AURA)</p>
                <p className="text-[9px]" style={{ color: t.textMuted }}>Ask for a subtle hint or nudge</p>
              </div>
            </div>
            <button onClick={() => setIsAssistantOpen(false)} className="text-gray-400 hover:text-white text-sm">X</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: t.bg }}>
            {assistantLogs.map((log, i) => (
              <div key={i} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed"
                  style={log.role === 'user'
                    ? { backgroundColor: t.accent, color: '#fff' }
                    : { backgroundColor: t.surfaceAlt, color: t.textSecondary }
                  }
                >
                  {log.content}
                </div>
              </div>
            ))}
          </div>
          
          <div
            className="p-3 border-t flex gap-2 shrink-0"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            <input
              type="text"
              value={assistantInput}
              onChange={e => setAssistantInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskAssistant()}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none border"
              style={{ backgroundColor: t.surfaceAlt, borderColor: t.border, color: t.textPrimary }}
            />
            <button
              onClick={handleAskAssistant}
              className="text-white px-3 py-2 rounded-xl text-xs font-medium shrink-0"
              style={{ backgroundColor: t.accent }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ─── Submit Transition Modal ─── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div
            className="rounded-[32px] max-w-lg w-full p-8 text-center space-y-6 shadow-2xl border"
            style={{ backgroundColor: t.surface, borderColor: t.border, fontFamily: t.fontFamily }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border"
              style={{ backgroundColor: t.accentBg, borderColor: t.accentBorder }}
            >
              <Sparkles className="w-8 h-8" style={{ color: t.accentText }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Workplace Simulation Complete!</h2>
              <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>
                Your actions, code solutions, communication tone, and stakeholder trust scores have been recorded.
              </p>
            </div>

            <div
              className="p-4 rounded-2xl text-left space-y-1 text-xs border"
              style={{ backgroundColor: t.accentBg, borderColor: t.accentBorder, color: t.accentText }}
            >
              <p className="font-bold">Summary Metrics Captured:</p>
              <ul className="list-disc pl-4 space-y-1 mt-2">
                <li>Ignored Actions: {runtime?.behavioralSignals.ignoredEventIds?.length || 0}</li>
                <li>Clarification Questions: {runtime?.behavioralSignals.clarificationCount || 0}</li>
                <li>Senior Colleagues Consulted: {runtime?.assistantUsageCount || 0} hints</li>
                <li>Stakeholders Escalation Flags: {Object.values(runtime?.stakeholderStates || {}).filter(s => s.escalationLevel > 1).length}</li>
              </ul>
            </div>

            <button
              onClick={handleProceedToInterview}
              className="w-full py-3.5 text-white rounded-xl text-sm font-semibold tracking-wider transition-all"
              style={{ backgroundColor: t.accent }}
            >
              Proceed to Phase 2: Live AI Voice Interview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
