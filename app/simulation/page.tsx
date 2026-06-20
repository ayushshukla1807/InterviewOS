'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Mail, ClipboardCheck, ShieldCheck } from 'lucide-react';

export default function SimulationLanding() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerateTest = async () => {
    if (!jd.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/test-engine/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd })
      });

      const data = await res.json();
      
      if (data.blueprint) {
        const sessionId = Math.random().toString(36).substring(7);
        sessionStorage.setItem(`simulation_${sessionId}`, JSON.stringify(data.blueprint));
        router.push(`/simulation/${sessionId}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate simulation test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[var(--color-theme-text)] flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-theme-primary)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-zinc-800/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full text-[9px] text-zinc-100 font-medium mb-2 tracking-tight">
            <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full " />
            Powered by AI Behavioral Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white">
            InterviewOS Workplace
          </h1>
          <p className="text-zinc-300 text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Drop candidates into a real workplace crisis. Watch how they handle Slack fires, angry clients, and impossible deadlines — not just MCQs.
          </p>
        </div>
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <MessageSquare className="w-6 h-6 text-zinc-300" />, title: 'Team Chat', desc: 'Simulated Slack messages from panicking coworkers' },
            { icon: <Mail className="w-6 h-6 text-zinc-300" />, title: 'Client Emails', desc: 'Angry escalation emails requiring professional replies' },
            { icon: <ClipboardCheck className="w-6 h-6 text-zinc-300" />, title: 'Task Triage', desc: 'Critical Jira tickets demanding instant prioritization' }
          ].map(f => (
            <div key={f.title} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3 flex flex-col items-start transition-all hover:bg-zinc-800/60 hover:border-zinc-700">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-2">{f.icon}</div>
              <h3 className="text-base font-medium text-slate-100 tracking-tight">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-100 tracking-tight">Paste Job Description</label>
            <span className="text-xs text-zinc-500 font-medium">{jd.length} chars</span>
          </div>
          <textarea
            className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm font-mono text-zinc-300 focus:border-zinc-600 outline-none resize-none placeholder-zinc-600 transition-colors"
            placeholder="e.g. We are looking for a Senior Product Manager who can lead cross-functional teams, manage high-stakes client escalations, and handle sudden priority shifts..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <button
            onClick={handleGenerateTest}
            disabled={loading || !jd.trim()}
            className="w-full py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm tracking-tight transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Generating Workplace Simulation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" /> Launch Simulation Engine
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          Evaluates: Prioritization • Communication • Emotional Control • Stakeholder Management • Integrity
        </p>
      </div>
    </div>
  );
}
