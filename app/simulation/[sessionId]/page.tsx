'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SimulationEngine() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<any>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  
  // Anti-cheat & Pressure
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins for whole test
  const [tabSwitches, setTabSwitches] = useState(0);

  useEffect(() => {
    // Load the blueprint from session storage
    const stored = sessionStorage.getItem(`simulation_${sessionId}`);
    if (stored) {
      setBlueprint(JSON.parse(stored));
    } else {
      alert("Invalid or expired simulation session.");
      router.push('/simulation');
    }
  }, [sessionId, router]);

  useEffect(() => {
    // Anti-cheat tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    // Pressure Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectOption = (opt: string) => {
    const newAnswers = [...answers];
    newAnswers.push({
      module: currentModuleIdx,
      question: currentQuestionIdx,
      selected: opt
    });
    setAnswers(newAnswers);

    // Go to next question or module
    const currentModule = blueprint.modules[currentModuleIdx];
    if (currentQuestionIdx + 1 < currentModule.questions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentModuleIdx + 1 < blueprint.modules.length) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentQuestionIdx(0);
    } else {
      handleSubmitTest(newAnswers);
    }
  };

  const handleSubmitTest = async (finalAnswers = answers) => {
    alert(`Simulation Completed!\nTab Switches (Integrity Risk): ${tabSwitches}`);
    // Here we would POST to /api/test-engine/evaluate to calculate the multi-dimensional score
    router.push('/simulation');
  };

  if (!blueprint) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center font-outfit">Loading Simulation Environment...</div>;

  const currentModule = blueprint.modules[currentModuleIdx];
  const currentQuestion = currentModule.questions[currentQuestionIdx];

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
            <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">
              Integrity Warning: {tabSwitches} Focus Lost
            </div>
          )}
          <div className="text-2xl font-mono text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">
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
