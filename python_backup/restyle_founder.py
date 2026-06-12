import re

with open('app/founder/page.tsx', 'r') as f:
    content = f.read()

# Add a vibrant background to the founder page
old_bg = '<div className="min-h-screen text-[var(--text)] font-sans selection:bg-cyan-500/30 transition-colors duration-500 relative">'
new_bg = '''<div className="min-h-screen text-[var(--text)] font-sans selection:bg-rose-500/30 transition-colors duration-500 relative bg-[#020617] overflow-hidden">
      {/* Natural Vibrant Orbs for Founder */}
      <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />'''

content = content.replace(old_bg, new_bg)

with open('app/founder/page.tsx', 'w') as f:
    f.write(content)
print("Updated founder UI")
