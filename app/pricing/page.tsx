'use client';
import { useState } from 'react';
import { Check, Zap, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center pt-32 px-6">
      <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500 text-center">
        Level Up Your Interviews
      </h1>
      <p className="text-white/60 mb-16 max-w-xl text-center">
        Upgrade to Pro to unlock unlimited realistic AI mock interviews, detailed behavioral analytics, and session recordings.
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Tier */}
        <div className="border border-white/10 bg-white/5 rounded-3xl p-8 relative overflow-hidden">
          <h3 className="text-2xl font-bold mb-2">Basic Candidate</h3>
          <div className="text-4xl font-black mb-6">$0<span className="text-lg text-white/40 font-normal">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3"><Check className="text-emerald-400 w-5 h-5"/> 1 Mock Interview / month</li>
            <li className="flex items-center gap-3"><Check className="text-emerald-400 w-5 h-5"/> Basic ML Scoring</li>
            <li className="flex items-center gap-3 text-white/40"><Check className="w-5 h-5"/> No Session Recordings</li>
          </ul>
          <button className="w-full py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-colors" disabled>
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div className="border border-violet-500 bg-violet-500/10 rounded-3xl p-8 relative overflow-hidden ring-1 ring-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <div className="absolute top-0 right-0 bg-violet-500 text-xs font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
            Popular
          </div>
          <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">Pro Candidate <Zap className="text-amber-400 w-5 h-5 fill-amber-400"/></h3>
          <div className="text-4xl font-black mb-6">$19<span className="text-lg text-white/40 font-normal">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3"><Check className="text-violet-400 w-5 h-5"/> Unlimited Mock Interviews</li>
            <li className="flex items-center gap-3"><Check className="text-violet-400 w-5 h-5"/> Advanced ML Behavior Analytics</li>
            <li className="flex items-center gap-3"><Check className="text-violet-400 w-5 h-5"/> Session Video Recordings</li>
            <li className="flex items-center gap-3"><Check className="text-violet-400 w-5 h-5"/> Priority ElevenLabs Voice Latency</li>
          </ul>
          <button 
            onClick={handleSubscribe} 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 font-bold hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-pulse">Loading...</span> : <><Sparkles className="w-4 h-4"/> Upgrade to Pro</>}
          </button>
        </div>
      </div>
    </div>
  );
}
