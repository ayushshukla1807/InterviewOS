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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-300 font-medium mb-2">
            <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full " />
            Powered by AI Behavioral Intelligence
          </div>
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">InterviewOS</span>
            <span className="text-gray-300"> Workplace</span>
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
            Drop candidates into a real workplace crisis. Watch how they handle Slack fires, angry clients, and impossible deadlines — not just MCQs.
          </p>
        </div>
        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <MessageSquare className="w-6 h-6 text-violet-400" />, title: 'Team Chat', desc: 'Simulated Slack messages from panicking coworkers' },
            { icon: <Mail className="w-6 h-6 text-sky-400" />, title: 'Client Emails', desc: 'Angry escalation emails requiring professional replies' },
            { icon: <ClipboardCheck className="w-6 h-6 text-zinc-100" />, title: 'Task Triage', desc: 'Critical Jira tickets demanding instant prioritization' }
          ].map(f => (
            <div key={f.title} className="glass-card hud-border p-4 space-y-2 flex flex-col items-start transition-all hover:bg-[var(--card-bg)]/80">
              <div className="mb-1">{f.icon}</div>
              <h3 className="text-sm font-semibold text-gray-200">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-card hud-border p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">Paste Job Description</label>
            <span className="text-xs text-gray-600">{jd.length} chars</span>
          </div>
          <textarea
            className="w-full h-48 bg-black/40 border border-[var(--color-theme-border)] rounded-xl p-4 text-sm font-mono text-emerald-50 focus:border-zinc-600 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none placeholder-slate-600"
            placeholder="e.g. We are looking for a Senior Product Manager who can lead cross-functional teams, manage high-stakes client escalations, and handle sudden priority shifts..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <button
            onClick={handleGenerateTest}
            disabled={loading || !jd.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-emerald-600 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed font-medium  tracking-tight text-white text-[10px] transition-all flex items-center justify-center gap-2 "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Workplace Simulation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Launch Simulation Engine
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
