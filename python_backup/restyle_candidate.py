import re

with open('app/candidate/page.tsx', 'r') as f:
    content = f.read()

# Make the header icons and glows more vibrant and natural
content = content.replace("bg-gradient-to-br from-blue-500 to-indigo-600", "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-600")
content = content.replace("shadow-[0_0_40px_rgba(59,130,246,0.4)]", "shadow-[0_0_40px_rgba(217,70,239,0.4)]")

# Add a vibrant natural background to the dashboard
old_main = '<div className="min-h-screen text-[var(--text)] font-sans transition-colors duration-500 relative bg-[#050508]">'
new_main = '''<div className="min-h-screen text-[var(--text)] font-sans transition-colors duration-500 relative bg-[#020617] overflow-hidden">
      {/* Natural Vibrant Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />'''
content = content.replace(old_main, new_main)

# Enhance stats boxes with bright accents
content = content.replace('<div className="p-5 bg-black/20 border border-white/5 rounded-2xl">', '<div className="p-5 bg-black/40 border border-white/10 rounded-2xl shadow-xl hover:border-fuchsia-500/30 transition-colors">')

# Enhance the start simulation button
old_btn = 'className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"'
new_btn = 'className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"'
content = content.replace(old_btn, new_btn)

# Make "Share Verified Profile" button pop
old_share = 'className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"'
new_share = 'className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"'
content = content.replace(old_share, new_share)
content = content.replace('<Star className="w-4 h-4 text-blue-400" /> Account Profile', '<Star className="w-4 h-4 text-amber-400" /> Account Profile')

with open('app/candidate/page.tsx', 'w') as f:
    f.write(content)
print("Updated candidate UI")
