import re

with open('app/recruiter/page.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports_search = r"import { Shield, Target, Users, Search, Filter, Layers, BarChart as BarChartIcon, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus } from 'lucide-react';"
imports_replace = r"import { Shield, Target, Users, Search, Filter, Layers, BarChart as BarChartIcon, FileText, ArrowRight, Activity, Zap, PlayCircle, Plus, X, Terminal, Cpu, CheckCircle2, Sparkles } from 'lucide-react';"
content = content.replace(imports_search, imports_replace)

# 2. State variables
state_search = r"const [generatedLink, setGeneratedLink] = useState('');"
state_replace = r"""const [generatedLink, setGeneratedLink] = useState('');
  const [showLiveModal, setShowLiveModal] = useState<ActiveSession | null>(null);
  const [jdInput, setJdInput] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [generatedJd, setGeneratedJd] = useState<{title: string, content: string, rubric: string[]} | null>(null);"""
content = content.replace(state_search, state_replace)

# 3. Live Tab link to button
link_search = r"""<Link href={`/report?sessionId=${session.sessionId}&name=${encodeURIComponent(session.name)}&role=${encodeURIComponent(session.role)}&company=InterviewOS`} className="mt-auto">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-blue-400 border border-emerald-500/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        >
                          <Zap className="w-4 h-4" /> Live Spectate
                        </motion.button>
                      </Link>"""
link_replace = r"""<motion.button 
                          onClick={() => setShowLiveModal(session)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full mt-auto py-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-blue-400 border border-emerald-500/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        >
                          <Zap className="w-4 h-4" /> Live Spectate
                        </motion.button>"""
content = content.replace(link_search, link_replace)

# 4. Templates Tab Extension
templates_search = r"""<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { role: 'Product Manager', type: 'Tech & Strategy', focus: 'Prioritization & Stakeholders', color: 'from-emerald-500 to-emerald-600', trackId: 'it_pm' },"""
templates_replace = r"""<div className="bg-slate-900 border border-white/10 p-6 rounded-2xl mb-8 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500" />
                <h3 className="text-xl font-black text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-400" /> AI Blueprint Generator</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Describe the role, tech stack, and evaluation focus to auto-generate a custom rubric.</p>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <input type="text" value={jdInput} onChange={e => setJdInput(e.target.value)} placeholder="e.g. Senior Rust Backend Dev focusing on latency and WebSockets..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" />
                  <button onClick={() => {
                    setIsGeneratingJd(true);
                    setGeneratedJd(null);
                    setTimeout(() => {
                      setGeneratedJd({
                        title: "Custom AI Track: " + jdInput.substring(0, 20) + "...",
                        content: "This candidate will be evaluated on high-performance concurrency, memory safety, and architectural design under simulated load spikes.",
                        rubric: ["Memory Profiling", "Thread Safety", "Architecture Scalability", "Stress Response"]
                      });
                      setIsGeneratingJd(false);
                      setJdInput('');
                    }, 2500);
                  }} disabled={!jdInput || isGeneratingJd} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all">
                    {isGeneratingJd ? <><Activity className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Blueprint</>}
                  </button>
                </div>
                {generatedJd && (
                  <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-4 p-5 bg-black/30 border border-emerald-500/30 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black text-emerald-400">{generatedJd.title}</h4>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10">Save to Library</button>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{generatedJd.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedJd.rubric.map((r, i) => <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {r}</span>)}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { role: 'Product Manager', type: 'Tech & Strategy', focus: 'Prioritization & Stakeholders', color: 'from-emerald-500 to-emerald-600', trackId: 'it_pm' },"""
content = content.replace(templates_search, templates_replace)

# 5. LiveProctoringModal
modal_search = r"""{/* ── INVITE MODAL ──────────────────────────────────────────────── */}"""
modal_replace = r"""{/* ── LIVE PROCTORING MODAL ──────────────────────────────────────── */}
          {showLiveModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#050508] border border-emerald-500/30 p-8 rounded-[2rem] w-full max-w-5xl shadow-2xl relative flex flex-col h-[80vh] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
                <button onClick={() => setShowLiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full border border-white/10"><X className="w-4 h-4" /></button>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      Live Feed: {showLiveModal.name}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Session: {showLiveModal.sessionId} | Role: {showLiveModal.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                  {/* Left: Terminal Output */}
                  <div className="lg:col-span-2 bg-black border border-white/10 rounded-2xl flex flex-col relative overflow-hidden">
                    <div className="bg-slate-900/50 px-4 py-2 border-b border-white/10 text-[9px] font-mono text-emerald-500 flex justify-between items-center">
                      <span>terminal/tty1 - tail -f live_keystrokes.log</span>
                      <Terminal className="w-3 h-3" />
                    </div>
                    <div className="p-4 flex-1 overflow-hidden font-mono text-[11px] text-emerald-400 space-y-1 relative">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>> CONNECTED TO SANDBOX ENV</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>> Candidate started typing in index.js...</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>const handleRequest = async (req) =&gt; &#123;</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }}>  // Need to add error boundary here</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 }} className="text-yellow-400">> STAKEHOLDER_MSG: "Why is the API slow???" (Injected)</motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5.5 }}>> Candidate switching to Slack.app...</motion.div>
                      <div className="animate-pulse mt-2">_</div>
                    </div>
                  </div>

                  {/* Right: Biometric & Logs */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex-1 relative overflow-hidden flex flex-col items-center justify-center group">
                      <div className="absolute inset-0 bg-emerald-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="w-24 h-24 rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative mb-4">
                        <motion.div className="absolute inset-0 border-2 border-emerald-500 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
                        <Activity className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-white">{showLiveModal.trust}%</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live Trust Metric</div>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex-1 overflow-hidden flex flex-col">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Shield className="w-3 h-3 text-rose-400" /> Proctoring Log</div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        <div className="text-[10px] flex gap-2"><span className="text-slate-500">10:41</span> <span className="text-emerald-400">Eye contact stable</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-slate-500">10:42</span> <span className="text-emerald-400">Speech pace optimal</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-slate-500">10:44</span> <span className="text-rose-400 font-bold">Tab switch detected! (-5 trust)</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-slate-500">10:45</span> <span className="text-yellow-400">Stress vocal markers detected</span></div>
                        <div className="text-[10px] flex gap-2"><span className="text-slate-500">10:46</span> <span className="text-emerald-400">Returned to focus</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ── INVITE MODAL ──────────────────────────────────────────────── */}"""
content = content.replace(modal_search, modal_replace)

with open('app/recruiter/page.tsx', 'w') as f:
    f.write(content)

print("Updated app/recruiter/page.tsx")
