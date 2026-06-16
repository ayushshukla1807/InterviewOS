'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, Mic, Sparkles, AlertCircle, ChevronLeft, LayoutDashboard, TrendingUp } from 'lucide-react';
import { TRACKS } from '@/lib/ai/prompts';
import Link from 'next/link';

type Message = {
  role: 'assistant' | 'user';
  content: string;
  signals?: string[];
};

export default function InterviewPage() {
  const [track, setTrack] = useState<keyof typeof TRACKS | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [signals, setSignals] = useState<string[]>(['Initializing Neural Engine...']);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const startInterview = async (selectedTrack: keyof typeof TRACKS) => {
    setIsUploading(true);
    setSignals(['Parsing Resume...', 'Extracting Technical Stack...', 'Aligning track difficulty...']);
    
    // Simulate professional parsing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsUploading(false);
    setTrack(selectedTrack);
    setMessages([
      { role: 'assistant', content: TRACKS[selectedTrack].initial_question }
    ]);
    setSignals(['Track Locked: ' + TRACKS[selectedTrack].title, 'Ready for signal analysis...']);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);
    setSignals(prev => [...prev, 'Analyzing response complexity...', 'Detecting behavioral signals...']);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          track: track 
        })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      if (data.signals) setSignals(data.signals);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  if (!track) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-medium text-white tracking-tighter ">Select Your Evaluation Track</h1>
            <p className="text-zinc-500 text-sm font-bold  tracking-tight">Logic will adapt based on your responses.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(Object.keys(TRACKS) as Array<keyof typeof TRACKS>).map((key) => (
              <button 
                key={key}
                disabled={isUploading}
                onClick={() => startInterview(key)}
                className={`glass-card p-10 rounded-[40px] text-left hover:border-zinc-500 transition-all group relative overflow-hidden ${isUploading ? 'opacity-50 grayscale' : ''}`}
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-white text-black/20 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-zinc-500 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] font-medium  tracking-tight text-white">Neural Parsing...</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:text-zinc-300 transition-all">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-white mb-4 leading-tight">{TRACKS[key].title}</h3>
                <div className="flex flex-wrap gap-2">
                  {TRACKS[key].focus.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-[9px] font-medium  tracking-tight text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--theme-bg)] flex flex-col">
      {/* Header */}
      <header className="px-10 py-6 border-b border-zinc-800/50 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-sm font-medium text-white  tracking-tight">{TRACKS[track].title}</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full " />
              <span className="text-[10px] font-medium text-zinc-500  tracking-tight">Neural Sync Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/report" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium text-[10px]  tracking-tight hover:bg-white transition-all">
            End & Generate Report
          </Link>
          <div className="px-4 py-2 bg-white text-black/10 border border-white/10 rounded-xl">
            <span className="text-[10px] font-medium text-zinc-300  tracking-tight">Depth: Senior</span>
          </div>
          <button className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-all">
            <LayoutDashboard className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col relative bg-white/[0.01]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-2xl p-6 rounded-3xl ${m.role === 'assistant' ? 'glass-card text-zinc-300' : 'bg-white text-black text-white shadow-xl shadow-white/5'}`}>
                  <div className="flex items-center gap-3 mb-3 opacity-50">
                    {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-[9px] font-medium  tracking-tight">{m.role === 'assistant' ? 'InterviewOS AI' : 'Candidate'}</span>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isThinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="glass-card p-6 rounded-3xl flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white text-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white text-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white text-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500  tracking-tight">Neural Processing</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-10 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
            <form onSubmit={handleSend} className="relative group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-[32px] px-8 py-6 pr-40 text-sm text-white focus:ring-4 focus:ring-white/20/20 focus:border-white/10 outline-none transition-all placeholder:text-zinc-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button type="button" className="p-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="bg-white text-black text-white px-6 py-3 rounded-2xl font-medium text-[10px]  tracking-tight hover:bg-white text-black transition-all disabled:opacity-50 disabled:bg-slate-800"
                >
                  Analyze
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Neural Signal Sidebar */}
        <div className="w-[400px] border-l border-zinc-800/50 bg-slate-950/50 p-10 space-y-10 hidden xl:block">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-medium text-zinc-500  tracking-tight">Neural Signals</h3>
               <Sparkles className="text-zinc-300 w-4 h-4 " />
             </div>
             <div className="space-y-3">
               <AnimatePresence mode="popLayout">
                 {signals.slice(-6).map((s, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 10 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -10 }}
                     key={s + i} 
                     className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"
                   >
                     <div className="w-1.5 h-1.5 bg-white text-black rounded-full mt-1.5 shrink-0" />
                     <p className="text-[11px] font-semibold text-zinc-400 leading-relaxed">{s}</p>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-zinc-800/50">
             <h3 className="text-[10px] font-medium text-zinc-500  tracking-tight">Neural Proctoring</h3>
             <div className="space-y-4">
                {[
                  { label: "Face Detection", status: "Locked", color: "text-zinc-100" },
                  { label: "Eye Tracking", status: "Active", color: "text-zinc-100" },
                  { label: "Ambient Noise", status: "Filtered", color: "text-zinc-300" }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                    <span className="text-[9px] font-medium text-zinc-500  tracking-tight">{p.label}</span>
                    <span className={`text-[9px] font-medium  tracking-tight ${p.color}`}>{p.status}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-zinc-800/50">
             <h3 className="text-[10px] font-medium text-zinc-500  tracking-tight">Live Metrics</h3>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-800/50">
                 <p className="text-[9px] font-medium text-zinc-600  tracking-tight mb-1">Clarity</p>
                 <p className="text-lg font-medium text-white tracking-tighter">High</p>
               </div>
               <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-800/50">
                 <p className="text-[9px] font-medium text-zinc-600  tracking-tight mb-1">Integrity</p>
                 <p className="text-lg font-medium text-zinc-100 tracking-tighter">98%</p>
               </div>
             </div>
          </div>

          <div className="p-6 bg-white text-black/5 border border-white/10 rounded-3xl mt-auto">
             <div className="flex items-center gap-3 mb-3">
               <TrendingUp className="text-zinc-300 w-4 h-4" />
               <span className="text-[10px] font-medium text-zinc-300  tracking-tight">Adaptive Insight</span>
             </div>
             <p className="text-[11px] text-zinc-400 leading-relaxed font-medium italic">
               "Candidate shows high conceptual clarity but needs probing on execution details."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
