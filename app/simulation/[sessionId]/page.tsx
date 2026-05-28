'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ─── Types ───
interface SlackMessage {
  id: string; from: string; avatar: string; avatarColor: string; time: string; message: string; channel: string;
}
interface Email {
  id: string; from: string; subject: string; receivedAt: string; body: string; isUnread: boolean;
}
interface Task {
  id: string; title: string; priority: string; assignedTo: string; dueIn: string; description: string;
}
interface Challenge {
  id: string; type: string; prompt: string; evaluationCriteria: string[];
}
interface WorkplaceScenario {
  context: string; slackMessages: SlackMessage[]; emails: Email[]; tasks: Task[];
}

export default function SimulationEngine() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<any>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  // Workplace Simulation State
  const [wsActiveTab, setWsActiveTab] = useState<'slack' | 'email' | 'tasks'>('slack');
  const [wsChallengeIdx, setWsChallengeIdx] = useState(0);
  const [wsResponse, setWsResponse] = useState('');
  const [wsResponses, setWsResponses] = useState<any[]>([]);
  const [wsSlackRevealed, setWsSlackRevealed] = useState(0);
  const [wsEmailRevealed, setWsEmailRevealed] = useState(false);
  const [wsPhase, setWsPhase] = useState<'immersion' | 'challenge'>('immersion');

  // Anti-cheat & Pressure
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins for whole test
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`simulation_${sessionId}`);
    if (stored) {
      setBlueprint(JSON.parse(stored));
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
    if (submitted) return;
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
  }, [submitted]);

  // Drip-feed slack messages for immersion
  useEffect(() => {
    if (!blueprint) return;
    const currentModule = blueprint.modules[currentModuleIdx];
    if (currentModule?.type !== 'workplace_simulation') return;
    const msgs = currentModule.scenario?.slackMessages || [];
    if (wsSlackRevealed < msgs.length) {
      const timer = setTimeout(() => {
        setWsSlackRevealed(prev => prev + 1);
        // Play notification sound effect
        try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=').play().catch(()=>{}); } catch(e){}
      }, 2500 + wsSlackRevealed * 3000);
      return () => clearTimeout(timer);
    }
  }, [blueprint, currentModuleIdx, wsSlackRevealed]);

  // Reveal email after all slack messages
  useEffect(() => {
    if (!blueprint) return;
    const currentModule = blueprint.modules[currentModuleIdx];
    if (currentModule?.type !== 'workplace_simulation') return;
    const msgs = currentModule.scenario?.slackMessages || [];
    if (wsSlackRevealed >= msgs.length && !wsEmailRevealed) {
      const timer = setTimeout(() => setWsEmailRevealed(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [blueprint, currentModuleIdx, wsSlackRevealed, wsEmailRevealed]);

  const handleSelectOption = (opt: string) => {
    const newAnswers = [...answers, { module: currentModuleIdx, question: currentQuestionIdx, selected: opt }];
    setAnswers(newAnswers);

    const currentModule = blueprint.modules[currentModuleIdx];
    if (currentQuestionIdx + 1 < currentModule.questions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentModuleIdx + 1 < blueprint.modules.length) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentQuestionIdx(0);
      setWsSlackRevealed(0);
      setWsEmailRevealed(false);
      setWsPhase('immersion');
      setWsChallengeIdx(0);
    } else {
      handleSubmitTest(newAnswers);
    }
  };

  const handleWsChallengeSubmit = () => {
    if (!wsResponse.trim()) return;
    const currentModule = blueprint.modules[currentModuleIdx];
    const challenges = currentModule.challenges || [];
    const newResponses = [...wsResponses, { challengeId: challenges[wsChallengeIdx]?.id, response: wsResponse }];
    setWsResponses(newResponses);
    setWsResponse('');

    if (wsChallengeIdx + 1 < challenges.length) {
      setWsChallengeIdx(wsChallengeIdx + 1);
    } else if (currentModuleIdx + 1 < blueprint.modules.length) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentQuestionIdx(0);
    } else {
      handleSubmitTest(answers, newResponses);
    }
  };

  const handleSubmitTest = async (finalAnswers = answers, finalWsResponses = wsResponses) => {
    setSubmitted(true);
    setEvaluating(true);
    try {
      const res = await fetch('/api/test-engine/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint,
          answers: finalAnswers,
          workplaceResponses: finalWsResponses,
          tabSwitches,
          timeUsed: 900 - timeLeft
        })
      });
      const data = await res.json();
      setEvalResult(data);
    } catch (e) {
      setEvalResult({ overallScore: 0, summary: 'Evaluation failed. Please try again.' });
    }
    setEvaluating(false);
    setShowResults(true);
  };

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center font-outfit">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400">Initializing Workplace Simulation Engine...</span>
        </div>
      </div>
    );
  }

  const currentModule = blueprint.modules[currentModuleIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Results Screen ───
  if (showResults) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-8 font-outfit">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {evaluating ? '...' : (evalResult?.overallScore ?? evalResult?.score ?? '—')}
            </div>
            <h1 className="text-2xl font-semibold text-gray-200">Simulation Complete</h1>
            <p className="text-gray-500 text-sm">Role: {blueprint.role}</p>
          </div>
          {evaluating ? (
            <div className="flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                  <span className="text-gray-500 block text-xs mb-1">Time Used</span>
                  <span className="text-lg font-mono text-blue-400">{formatTime(900 - timeLeft)}</span>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                  <span className="text-gray-500 block text-xs mb-1">Integrity Flags</span>
                  <span className={`text-lg font-mono ${tabSwitches > 2 ? 'text-red-400' : 'text-emerald-400'}`}>{tabSwitches} tab switches</span>
                </div>
              </div>
              {evalResult?.summary && <p className="text-gray-300 text-sm leading-relaxed">{evalResult.summary}</p>}
              {evalResult?.breakdown && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400">Breakdown</h3>
                  {Object.entries(evalResult.breakdown).map(([key, val]: any) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => router.push('/simulation')} className="w-full py-3 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-colors">
                ← Back to Simulations
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Workplace Simulation Module ───
  if (currentModule?.type === 'workplace_simulation') {
    const scenario: WorkplaceScenario = currentModule.scenario || {};
    const challenges: Challenge[] = currentModule.challenges || [];
    const slackMessages = scenario.slackMessages || [];
    const emails = scenario.emails || [];
    const tasks = scenario.tasks || [];

    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex flex-col font-outfit">
        {/* Top Bar */}
        <div className="border-b border-gray-800/50 bg-[#111113] px-6 py-3 flex justify-between items-center shadow-lg z-20">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/20">WS</div>
            <div>
              <h1 className="text-base font-semibold text-gray-100">{blueprint.role} — Workplace Simulation</h1>
              <p className="text-xs text-gray-500">Module {currentModuleIdx + 1} of {blueprint.modules.length}</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {tabSwitches > 0 && (
              <div className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold border border-red-500/20 animate-pulse">
                ⚠ {tabSwitches} Focus Lost
              </div>
            )}
            <div className={`text-xl font-mono px-3 py-1.5 rounded-lg ${timeLeft < 120 ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-[#1a1a1c] text-gray-300'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Context Banner */}
        <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10 border-b border-indigo-500/10 px-6 py-3">
          <p className="text-sm text-indigo-200 max-w-4xl mx-auto">
            <span className="font-semibold text-indigo-300">📍 Situation: </span>{scenario.context}
          </p>
        </div>

        <div className="flex-1 flex">
          {/* ─── Left Sidebar: Tabs ─── */}
          <div className="w-16 bg-[#111113] border-r border-gray-800/50 flex flex-col items-center py-4 gap-2">
            {[
              { key: 'slack' as const, icon: '💬', label: 'Chat', count: Math.min(wsSlackRevealed, slackMessages.length) },
              { key: 'email' as const, icon: '📧', label: 'Mail', count: wsEmailRevealed ? emails.length : 0 },
              { key: 'tasks' as const, icon: '📋', label: 'Tasks', count: tasks.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setWsActiveTab(tab.key)}
                className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center text-lg transition-all ${wsActiveTab === tab.key ? 'bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10' : 'text-gray-500 hover:bg-[#1a1a1c] hover:text-gray-300'}`}
              >
                {tab.icon}
                {tab.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {tab.count}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* ─── Center: Inbox Content ─── */}
          <div className="flex-1 flex max-w-[1400px] mx-auto">
            <div className="w-[420px] border-r border-gray-800/50 bg-[#111113] flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-300">
                  {wsActiveTab === 'slack' ? '# Team Messages' : wsActiveTab === 'email' ? 'Inbox' : 'Active Tasks'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Slack Tab */}
                {wsActiveTab === 'slack' && (
                  <div className="p-3 space-y-1">
                    {slackMessages.slice(0, wsSlackRevealed).map((msg, i) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-xl bg-[#1a1a1c] border border-gray-800/50 hover:border-indigo-500/30 transition-all cursor-default animate-in slide-in-from-left"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md"
                            style={{ backgroundColor: msg.avatarColor }}
                          >
                            {msg.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-200 block truncate">{msg.from}</span>
                            <span className="text-[10px] text-gray-500">{msg.channel} • {msg.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{msg.message}</p>
                      </div>
                    ))}
                    {wsSlackRevealed < slackMessages.length && (
                      <div className="flex items-center gap-2 p-3 text-gray-500 text-xs">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                        </div>
                        Someone is typing...
                      </div>
                    )}
                  </div>
                )}

                {/* Email Tab */}
                {wsActiveTab === 'email' && (
                  <div className="p-3 space-y-1">
                    {!wsEmailRevealed ? (
                      <div className="p-6 text-center text-gray-500 text-sm">No new emails yet...</div>
                    ) : emails.map(email => (
                      <div key={email.id} className="p-4 rounded-xl bg-[#1a1a1c] border border-gray-800/50 hover:border-orange-500/30 transition-all space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-200">{email.from.split('<')[0].trim()}</p>
                            <p className="text-xs text-gray-500">{email.from}</p>
                          </div>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">{email.receivedAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {email.isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                          <p className="text-sm font-medium text-orange-300">{email.subject}</p>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed border-t border-gray-800/50 pt-3">{email.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks Tab */}
                {wsActiveTab === 'tasks' && (
                  <div className="p-3 space-y-1">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 rounded-xl bg-[#1a1a1c] border border-gray-800/50 hover:border-yellow-500/30 transition-all space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-gray-500">Due: {task.dueIn}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-200">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.description}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <div className="w-4 h-4 bg-indigo-500/30 rounded flex items-center justify-center text-[8px] text-indigo-300 font-bold">Y</div>
                          Assigned to: {task.assignedTo}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right Panel: Action / Challenge Area ─── */}
            <div className="flex-1 flex flex-col bg-[#0e0e10]">
              {wsPhase === 'immersion' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                  <div className="max-w-md text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-violet-500/20">
                      <span className="text-3xl">🏢</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-200">Workplace Simulation Active</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Review the incoming messages, emails, and tasks in the left panel. Once you have absorbed the situation, proceed to the response challenges.
                    </p>
                    <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${wsSlackRevealed >= slackMessages.length ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                      {wsSlackRevealed >= slackMessages.length ? 'All messages received' : `${wsSlackRevealed}/${slackMessages.length} messages received...`}
                    </div>
                    <button
                      onClick={() => setWsPhase('challenge')}
                      disabled={wsSlackRevealed < slackMessages.length}
                      className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                      Begin Responding →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
                  {challenges.length > 0 && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-cyan-500/20">
                          {wsChallengeIdx + 1}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-200">
                            {challenges[wsChallengeIdx]?.type === 'priority_decision' ? '🎯 Priority Decision' : '✉️ Draft Your Response'}
                          </h3>
                          <p className="text-xs text-gray-500">Challenge {wsChallengeIdx + 1} of {challenges.length}</p>
                        </div>
                      </div>

                      <div className="bg-[#111113] border border-gray-800/50 rounded-xl p-5">
                        <p className="text-sm text-gray-300 leading-relaxed">{challenges[wsChallengeIdx]?.prompt}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {challenges[wsChallengeIdx]?.evaluationCriteria?.map((c: string) => (
                            <span key={c} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={wsResponse}
                        onChange={e => setWsResponse(e.target.value)}
                        placeholder={
                          challenges[wsChallengeIdx]?.type === 'priority_decision'
                            ? "1. First, I would...\n2. Then...\n3. Finally...\n\nReasoning: ..."
                            : "Dear David,\n\nThank you for bringing this to our attention..."
                        }
                        className="flex-1 min-h-[200px] bg-[#111113] border border-gray-800/50 rounded-xl p-5 text-sm text-gray-200 placeholder-gray-600 resize-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none font-inter leading-relaxed"
                      />

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{wsResponse.length} characters</span>
                        <button
                          onClick={handleWsChallengeSubmit}
                          disabled={!wsResponse.trim()}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Submit Response →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Standard MCQ / SJT Module ───
  const currentQuestion = currentModule?.questions?.[currentQuestionIdx];
  if (!currentQuestion) {
    handleSubmitTest();
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-outfit">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-[#111] p-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            {blueprint.role} - Simulation
          </h1>
          <p className="text-sm text-gray-400">Module: {currentModule.title}</p>
        </div>
        <div className="flex gap-6 items-center">
          {tabSwitches > 0 && (
            <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30 animate-pulse">
              Integrity Warning: {tabSwitches} Focus Lost
            </div>
          )}
          <div className={`text-2xl font-mono drop-shadow-[0_0_8px_rgba(248,113,113,0.5)] ${timeLeft < 120 ? 'text-red-400 animate-pulse' : 'text-red-400'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col justify-center">
        {currentModule.type === 'behavioral' && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-200 text-sm">
            <strong>Workplace Scenario:</strong> You are experiencing a high-pressure situation. Choose the most appropriate action.
          </div>
        )}
        
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-8">
          <h2 className="text-2xl font-medium leading-relaxed">
            {currentQuestion.q || currentQuestion.scenario}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSelectOption(opt)}
                className="w-full text-left p-5 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:border-blue-500 hover:bg-blue-500/10 transition-all font-inter text-gray-300"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          Module {currentModuleIdx + 1} of {blueprint.modules.length} • Question {currentQuestionIdx + 1} of {currentModule.questions.length}
        </div>
      </div>
    </div>
  );
}
