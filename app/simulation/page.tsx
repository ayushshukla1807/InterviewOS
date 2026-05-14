'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      
      // In a real app, we'd save this to a DB and get an ID. 
      // For MVP, we pass the generated blueprint via sessionStorage
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 font-outfit">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            HYRTE Workplace Simulator
          </h1>
          <p className="text-gray-400">
            Paste a Job Description to auto-generate a multi-dimensional behavioral test engine.
          </p>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 shadow-2xl space-y-4">
          <label className="block text-sm font-medium text-gray-300">Job Description (JD)</label>
          <textarea
            className="w-full h-64 bg-black border border-gray-700 rounded-lg p-4 text-sm font-inter text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="e.g. We are looking for a Senior Product Manager who can lead cross-functional teams, manage high-stakes client escalations, and handle sudden priority shifts..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <button
            onClick={handleGenerateTest}
            disabled={loading || !jd.trim()}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Translating JD to Test...
              </>
            ) : (
              'Generate Simulation Engine'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
