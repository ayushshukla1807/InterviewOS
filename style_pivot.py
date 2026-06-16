import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Colors
    content = content.replace('bg-[#050508]', 'bg-[#0A0A0A]')
    content = content.replace('bg-[#0a0f0d]', 'bg-[#0A0A0A]')
    content = content.replace('bg-[#050b14]', 'bg-[#0A0A0A]')
    content = content.replace('bg-slate-900', 'bg-zinc-950')
    content = content.replace('border-white/10', 'border-zinc-800')
    content = content.replace('border-white/5', 'border-zinc-800/50')
    content = content.replace('bg-white/5', 'bg-zinc-900/50')
    content = content.replace('bg-[var(--theme-bg)]/80', 'bg-zinc-900/50')
    
    # Text colors
    content = re.sub(r'\btext-slate-200\b', 'text-zinc-300', content)
    content = re.sub(r'\btext-slate-300\b', 'text-zinc-400', content)
    content = re.sub(r'\btext-slate-400\b', 'text-zinc-400', content)
    content = re.sub(r'\btext-slate-500\b', 'text-zinc-500', content)
    content = re.sub(r'\btext-slate-600\b', 'text-zinc-600', content)
    
    content = re.sub(r'\btext-emerald-300\b', 'text-zinc-200', content)
    content = re.sub(r'\btext-emerald-400\b', 'text-zinc-100', content)
    content = re.sub(r'\btext-emerald-500\b', 'text-white', content)
    content = re.sub(r'\btext-emerald-600\b', 'text-white', content)
    
    content = re.sub(r'\btext-indigo-400\b', 'text-zinc-300', content)
    content = re.sub(r'\btext-indigo-500\b', 'text-zinc-400', content)
    content = re.sub(r'\btext-cyan-300\b', 'text-zinc-100', content)
    content = re.sub(r'\btext-blue-400\b', 'text-zinc-300', content)
    
    # Borders & BGs
    content = content.replace('bg-emerald-500/10', 'bg-zinc-800/50')
    content = content.replace('bg-emerald-500/5', 'bg-zinc-900/50')
    content = content.replace('border-emerald-500/20', 'border-zinc-700')
    content = content.replace('border-emerald-500/30', 'border-zinc-700')
    content = content.replace('border-emerald-500/50', 'border-zinc-600')
    
    content = re.sub(r'\bbg-emerald-500\b', 'bg-white', content)
    content = re.sub(r'\bhover:bg-emerald-400\b', 'hover:bg-zinc-200', content)
    content = re.sub(r'\bbg-emerald-400\b', 'bg-zinc-200', content)
    
    # Text-black explicitly replacing cases where we had text-black on emerald
    # Actually we can keep text-black on bg-white
    
    # Shadows & Glows
    content = re.sub(r'shadow-\[0_0_[a-zA-Z0-9_,().]*\]', 'shadow-sm', content)
    content = content.replace('shadow-emerald-500/20', '')
    content = content.replace('sci-fi-glow', '')
    content = re.sub(r'\banimate-pulse\b', '', content)
    
    # Typography
    content = re.sub(r'\bfont-black\b', 'font-medium', content)
    # Don't replace literal "uppercase" text, only the class. Often it's preceded/followed by space or quotes
    content = re.sub(r'(?<=\s)uppercase(?=[\s"\'`])', '', content)
    content = re.sub(r'\btracking-widest\b', 'tracking-tight', content)
    content = re.sub(r'\btracking-wider\b', 'tracking-tight', content)
    content = re.sub(r'\btracking-\[0\.2em\]\b', 'tracking-tight', content)
    content = re.sub(r'\btracking-\[0\.3em\]\b', 'tracking-tight', content)
    
    # Gradients
    content = content.replace('bg-gradient-to-r from-cyan-300 to-emerald-500', 'text-white')
    content = content.replace('bg-gradient-to-r from-emerald-400 to-emerald-600', 'bg-zinc-800')
    content = content.replace('bg-gradient-to-br from-emerald-400 to-emerald-600', 'bg-zinc-800')
    content = content.replace('text-transparent bg-clip-text', '')
    content = content.replace('bg-gradient-to-r from-zinc-100 to-zinc-500', 'text-white')

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

print("Style pivot executed globally.")
