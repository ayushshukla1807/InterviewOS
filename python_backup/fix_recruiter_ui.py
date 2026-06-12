import re

with open('app/recruiter/page.tsx', 'r') as f:
    content = f.read()

# 1. Add background glowing blobs
old_bg = '<div className="min-h-screen text-[var(--text)] font-sans selection:bg-cyan-500/30 transition-colors duration-500 relative">'
new_bg = '''<div className="min-h-screen text-[var(--text)] font-sans selection:bg-cyan-500/30 transition-colors duration-500 relative bg-[#020617] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />'''

content = content.replace(old_bg, new_bg)

# 2. Upgrade the "No Active Simulations" box
old_box = '''                {liveSessions.length === 0 ? (
                  <div className="col-span-full py-24 text-center border-none rounded-xl glass-card shadow-sm flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
                      <Activity className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Active Simulations</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Candidates taking a test right now will appear here instantly.</p>
                  </div>
                ) : ('''

new_box = '''                {liveSessions.length === 0 ? (
                  <div className="col-span-full py-32 text-center rounded-[40px] border border-cyan-500/10 bg-[#020617]/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.05)] flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Scanning Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                    
                    {/* Radar Sweep Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent w-[200%] h-[200%] origin-center -ml-[50%] -mt-[50%]"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      style={{ transformOrigin: 'center' }}
                    />

                    {/* Central Icon Hologram */}
                    <div className="relative mb-8 z-10">
                      {/* Pulse Rings */}
                      <motion.div className="absolute -inset-8 border border-cyan-500/30 rounded-full" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
                      <motion.div className="absolute -inset-16 border border-blue-500/20 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 4, delay: 1, repeat: Infinity }} />
                      
                      <div className="w-24 h-24 bg-[#050b14] rounded-full flex items-center justify-center border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.4)] relative z-10">
                        <Activity className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                      </div>
                    </div>

                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 uppercase tracking-[0.2em] mb-4 z-10 drop-shadow-lg">Awaiting Neural Link</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] z-10 max-w-sm leading-relaxed text-center">System is actively scanning for incoming candidate simulation streams. Live feeds will materialize here instantaneously.</p>
                    
                    <div className="mt-10 flex items-center gap-3 z-10 bg-cyan-500/10 border border-cyan-500/20 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <div className="flex gap-1.5 items-center">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.2em]">Scanning Sector Alpha</span>
                    </div>
                  </div>
                ) : ('''

content = content.replace(old_box, new_box)

with open('app/recruiter/page.tsx', 'w') as f:
    f.write(content)
print("Updated recruiter page visual!")
