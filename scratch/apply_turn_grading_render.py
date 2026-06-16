filepath = "/Users/ayushshukla/Projects/gsoc/Internship Work /aicruter_bot/app/session/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Let's use a simpler target string to make sure we match it robustly
target = """                        <div className={`p-5 rounded-2xl text-[12px] font-medium leading-relaxed tracking-tight shadow-xl ${
                         m.role === 'assistant' ? 'bg-white/[0.02] border-none text-slate-300 rounded-tl-sm backdrop-blur-md' : 'bg-blue-700 border border-emerald-600 text-white shadow-[0_5px_20px_rgba(79,70,229,0.3)] rounded-tr-sm'
                       }`}>
                          {m.content}
                       </div>"""

replacement = """                        <div className={`p-5 rounded-2xl text-[12px] font-medium leading-relaxed tracking-tight shadow-xl ${
                         m.role === 'assistant' ? 'bg-white/[0.02] border-none text-slate-300 rounded-tl-sm backdrop-blur-md' : 'bg-blue-700 border border-emerald-600 text-white shadow-[0_5px_20px_rgba(79,70,229,0.3)] rounded-tr-sm'
                       }`}>
                          {m.content}
                       </div>
                       {m.role === 'user' && (m.evaluationQuality || m.feedback) && (
                         <div className="mt-3 flex flex-col gap-2 items-end max-w-sm self-end">
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Evaluation:</span>
                             <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                               m.evaluationQuality === 'STRONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                               m.evaluationQuality === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                               m.evaluationQuality === 'VAGUE' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                               'bg-rose-500/10 text-rose-400 border-rose-500/20'
                             }`}>
                               {m.evaluationQuality}
                             </span>
                             {m.score !== undefined && (
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                 Score: {m.score}%
                                </span>
                             )}
                           </div>
                           {m.feedback && (
                             <div className="text-[10px] text-slate-400 italic bg-black/25 px-3 py-2 rounded-xl border border-white/5 text-right">
                               "{m.feedback}"
                             </div>
                           )}
                         </div>
                       )}"""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Content replaced successfully.")
else:
    # Let's try matching via lines
    lines = content.splitlines()
    found = -1
    for i, line in enumerate(lines):
        if "bg-blue-700 border border-emerald-600 text-white shadow-[0_5px_20px_rgba(79,70,229,0.3)] rounded-tr-sm" in line:
            found = i
            break
    
    if found != -1:
        # Reconstruct targeting lines
        lines_before = lines[:found-1]
        target_lines = lines[found-1:found+3]
        lines_after = lines[found+3:]
        
        target_str = "\\n".join(target_lines)
        print("Found matching line at index", found)
        print("Target lines look like:", repr(target_str))
        
        replacement_block = target_lines.copy()
        # Add the evaluation section
        eval_lines = [
            '                       {m.role === \'user\' && (m.evaluationQuality || m.feedback) && (',
            '                         <div className="mt-3 flex flex-col gap-2 items-end max-w-sm self-end">',
            '                           <div className="flex items-center gap-2">',
            '                             <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Evaluation:</span>',
            '                             <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${',
            '                               m.evaluationQuality === \'STRONG\' ? \'bg-emerald-500/10 text-emerald-400 border-emerald-500/20\' :',
            '                               m.evaluationQuality === \'PARTIAL\' ? \'bg-amber-500/10 text-amber-400 border-amber-500/20\' :',
            '                               m.evaluationQuality === \'VAGUE\' ? \'bg-orange-500/10 text-orange-400 border-orange-500/20\' :',
            '                               \'bg-rose-500/10 text-rose-400 border-rose-500/20\'',
            '                             }`}>',
            '                               {m.evaluationQuality}',
            '                             </span>',
            '                             {m.score !== undefined && (',
            '                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">',
            '                                 Score: {m.score}%',
            '                                </span>',
            '                             )}',
            '                           </div>',
            '                           {m.feedback && (',
            '                             <div className="text-[10px] text-slate-400 italic bg-black/25 px-3 py-2 rounded-xl border border-white/5 text-right">',
            '                               "{m.feedback}"',
            '                             </div>',
            '                           )}',
            '                         </div>',
            '                       )}'
        ]
        
        new_content = "\\n".join(lines_before + target_lines + eval_lines + lines_after)
        # Note: splitlines / join can normalize newlines
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("SUCCESS: Normalizing replacement applied.")
    else:
        print("ERROR: Fallback line search failed too.")
