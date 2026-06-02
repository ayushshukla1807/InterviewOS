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
    <div className="min-h-screen bg-[#0e0e10] text-white flex flex-col font-outfit relative">
      
      {/* ─── Top Bar: Progress & Status ─── */}
      <div className="border-b border-gray-800/50 bg-[#111113] px-6 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/20">OS</div>
          <div>
            <h1 className="text-base font-semibold text-gray-100">{blueprint.company} Workspace</h1>
            <p className="text-xs text-gray-500">{blueprint.role}</p>
          </div>
          
          {/* Act Progress Bar */}
          <div className="flex items-center gap-2 ml-8 bg-[#1a1a1c] px-3 py-1.5 rounded-full border border-gray-800">
            {[1, 2, 3].map(act => (
              <div key={act} className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${runtime.currentAct >= act ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                <span className={`text-xs ml-2 mr-3 font-medium ${runtime.currentAct >= act ? 'text-indigo-200' : 'text-gray-600'}`}>Act {act}</span>
                {act < 3 && <div className="w-4 h-[1px] bg-gray-800 mr-3" />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          {tabSwitches > 0 && (
            <div className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold border border-red-500/20 animate-pulse">
              ⚠ Focus Lost ({tabSwitches})
            </div>
          )}
          <div className={`text-xl font-mono px-3 py-1.5 rounded-lg ${timeLeft < 300 ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-[#1a1a1c] text-gray-300'}`}>
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={handleSubmitTest}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider"
          >
            Submit Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ─── Sidebar Navigation ─── */}
        <div className="w-16 bg-[#111113] border-r border-gray-800/50 flex flex-col items-center py-4 gap-2 shrink-0">
          {[
            { key: 'slack' as const, icon: '💬', count: runtime.eventStream.filter(e => e.type === 'slack' && !e.isRead).length },
            { key: 'email' as const, icon: '📧', count: runtime.eventStream.filter(e => e.type === 'email' && !e.isRead).length },
            { key: 'tasks' as const, icon: '📋', count: runtime.eventStream.filter(e => e.type === 'task' && !e.isRead).length },
            { key: 'calendar' as const, icon: '📅', count: 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center text-lg transition-all ${activeTab === tab.key ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' : 'text-gray-500 hover:bg-[#1a1a1c] hover:text-gray-300'}`}
            >
              {tab.icon}
              {tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
                  {tab.count}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ─── Inbox / List View ─── */}
        <div className="w-[380px] border-r border-gray-800/50 bg-[#111113] flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-300 capitalize">{activeTab}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeEvents.map(event => {
              const stakeholder = runtime.stakeholderStates[event.fromStakeholderId];
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full text-left p-4 border-b border-gray-800/30 transition-colors flex gap-3 items-start ${selectedEventId === event.id ? 'bg-[#1a1a1c]' : 'hover:bg-[#151517]'}`}
                >
                  {/* Photo avatar */}
                  {stakeholder ? (
                    stakeholder.photoUrl ? (
                      <img src={stakeholder.photoUrl} alt={stakeholder.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-800 mt-0.5" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white uppercase shrink-0 mt-0.5" style={{ backgroundColor: stakeholder.avatarColor }}>
                        {stakeholder.avatar}
                      </div>
                    )
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs text-gray-400 shrink-0 mt-0.5">🤖</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-gray-200 truncate">
                        {stakeholder ? stakeholder.name : 'System'}
                      </span>
                      {event.priority === 'CRITICAL' && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold shrink-0">URGENT</span>}
                    </div>
                    <div className="text-xs text-gray-500 mb-2 truncate">
                      {event.subject || event.channel || 'Direct Message'}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
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
              <div className="p-8 text-center text-gray-500 text-sm">
                No active items here.
              </div>
            )}
          </div>
        </div>

        {/* ─── Reading Pane & Monaco Code IDE Split Pane ─── */}
        <div className="flex-1 bg-[#0a0a0c] flex min-h-0">
          
          {/* Left Side: Message View */}
          <div className={`flex-1 flex flex-col relative min-h-0 overflow-y-auto ${showSandbox ? 'w-1/2 border-r border-gray-800/50' : 'w-full'}`}>
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${showSandbox ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-[#111113] text-gray-400 border-gray-800/80 hover:text-gray-200 hover:border-gray-700'}`}
                  >
                    💻 {showSandbox ? 'Close Coding Editor' : 'Open Coding Editor'}
                  </button>
                </div>
                
                <div className="bg-[#111113] border border-gray-800 rounded-xl p-6 mb-8 text-gray-300 leading-relaxed whitespace-pre-wrap shadow-lg shrink-0">
                  {selectedEvent.message}
                </div>

                {!selectedEvent.isAnswered && selectedEvent.requiresResponse && (
                  <div className="mt-auto space-y-4 shrink-0">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Draft your response..."
                      className="w-full h-32 bg-[#111113] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('ignored', selectedEvent.id)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Ignore & Archive
                        </button>
                        
                        {/* Clarification Button */}
                        <button
                          onClick={() => handleAction('asked_clarification', selectedEvent.id)}
                          disabled={isProcessingAction || !replyText.trim()}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors border border-amber-500/20"
                        >
                          Ask Clarification
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleAction('responded', selectedEvent.id)}
                        disabled={isProcessingAction || !replyText.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
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
              <div className="absolute top-4 right-4 w-80 bg-[#111113] border border-indigo-500/30 rounded-xl shadow-2xl shadow-indigo-500/10 overflow-hidden z-30">
                <div className="bg-indigo-500/10 px-4 py-2 border-b border-indigo-500/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Objective</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-300 mb-4">{runtime.currentChallenge.prompt}</p>
                  <button
                    onClick={handleAdvanceAct}
                    className="w-full py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium hover:bg-indigo-600 hover:text-white transition-colors"
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

      </div>

      {/* ─── Face PiP (Micro proctoring camera feed) ─── */}
      <div className="fixed bottom-4 right-4 w-40 h-28 bg-[#111113] border border-gray-800 rounded-xl overflow-hidden shadow-2xl z-50">
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
        className="fixed bottom-36 right-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30 text-lg transition-all z-40"
        title="Consult Colleague"
      >
        💬
      </button>

      {/* ─── Senior Hint Colleague Chatbot Window ─── */}
      {isAssistantOpen && (
        <div className="fixed bottom-4 right-20 w-80 h-[420px] bg-[#111113] border border-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden font-outfit">
          <div className="bg-[#1a1a1c] border-b border-gray-800 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧑‍💻</span>
              <div>
                <p className="text-xs font-bold text-gray-200">Senior Colleague (AURA)</p>
                <p className="text-[9px] text-gray-500">Ask for a subtle hint or nudge</p>
              </div>
            </div>
            <button onClick={() => setIsAssistantOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e0e10]">
            {assistantLogs.map((log, i) => (
              <div key={i} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${log.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#1a1a1c] text-gray-300'}`}>
                  {log.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-[#111113] border-t border-gray-800 flex gap-2 shrink-0">
            <input
              type="text"
              value={assistantInput}
              onChange={e => setAssistantInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskAssistant()}
              placeholder="Ask a question..."
              className="flex-1 bg-[#1a1a1c] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAskAssistant}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-medium shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ─── Submit Transition Modal ─── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center font-outfit p-6">
          <div className="bg-[#111113] border border-gray-800 rounded-[32px] max-w-lg w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">🚀</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-100">Workplace Simulation Complete!</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your actions, code solutions, communication tone, and stakeholder trust scores have been recorded.
              </p>
            </div>
            
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-left space-y-1 text-xs text-indigo-300">
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
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wider hover:shadow-lg transition-all"
            >
              Proceed to Phase 2: Live AI Voice Interview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
