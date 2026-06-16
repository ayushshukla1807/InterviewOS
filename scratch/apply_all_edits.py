import os

filepath = "/Users/ayushshukla/Projects/gsoc/Internship Work /aicruter_bot/app/session/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Edit 1: Message type definition
target_type = "type Message = { role: 'assistant' | 'user'; content: string; };"
replacement_type = """type Message = { 
  role: 'assistant' | 'user'; 
  content: string; 
  evaluationQuality?: 'STRONG' | 'PARTIAL' | 'VAGUE' | 'INCORRECT';
  feedback?: string;
  score?: number;
};"""

if target_type in content:
    content = content.replace(target_type, replacement_type)
    print("Edit 1 applied successfully.")
else:
    print("Edit 1 target NOT found.")

# Edit 2: setMessages state updater on API chat response
target_state = "      setMessages(p => [...p, { role: 'assistant', content: spokenContent }]);"
replacement_state = """      setMessages(p => {
        const copy = [...p];
        const lastUserIdx = copy.map(m => m.role).lastIndexOf('user');
        if (lastUserIdx !== -1) {
          copy[lastUserIdx] = {
            ...copy[lastUserIdx],
            evaluationQuality: data.evaluationQuality || 'STRONG',
            feedback: data.feedback || '',
            score: data.score
          };
        }
        return [...copy, { role: 'assistant', content: spokenContent }];
      });"""

if target_state in content:
    content = content.replace(target_state, replacement_state)
    print("Edit 2 applied successfully.")
else:
    print("Edit 2 target NOT found.")

# Edit 3: JSX Message render block using line search
lines = content.splitlines()
found = -1
for i, line in enumerate(lines):
    if "bg-blue-700 border border-emerald-600 text-white shadow-[0_5px_20px_rgba(79,70,229,0.3)]" in line:
        found = i
        break

if found != -1:
    print(f"Edit 3: Found matching line at index {found}")
    # We want to insert the evaluation block after the closing </div> of that container.
    # The container starts at found-1 and ends at found+2 (which is </div>).
    # Let's verify:
    # found-1: <div className={`p-5 rounded-2xl...
    # found:   m.role === 'assistant' ? ...
    # found+1: }`}>
    # found+2:    {m.content}
    # found+3: </div>
    
    # Let's verify line found+3 content
    print(f"Line {found+3}: {repr(lines[found+2])}")
    print(f"Line {found+4}: {repr(lines[found+3])}")
    
    # We will insert the block after found+3 (the </div>)
    lines_before = lines[:found+4]
    lines_after = lines[found+4:]
    
    eval_lines = [
        "                        {m.role === 'user' && (m.evaluationQuality || m.feedback) && (",
        '                          <div className="mt-3 flex flex-col gap-2 items-end max-w-sm self-end">',
        '                            <div className="flex items-center gap-2">',
        '                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Evaluation:</span>',
        '                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${',
        "                                m.evaluationQuality === 'STRONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :",
        "                                m.evaluationQuality === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :",
        "                                m.evaluationQuality === 'VAGUE' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :",
        "                                'bg-rose-500/10 text-rose-400 border-rose-500/20'",
        '                              }`}>',
        '                                {m.evaluationQuality}',
        '                              </span>',
        '                              {m.score !== undefined && (',
        '                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">',
        '                                  Score: {m.score}%',
        '                                </span>',
        '                              )}',
        '                            </div>',
        '                            {m.feedback && (',
        '                              <div className="text-[10px] text-slate-400 italic bg-black/25 px-3 py-2 rounded-xl border border-white/5 text-right">',
        '                                "{m.feedback}"',
        '                              </div>',
        '                            )}',
        '                          </div>',
        '                        )}'
    ]
    
    new_content = "\n".join(lines_before + eval_lines + lines_after)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Edit 3 applied successfully.")
else:
    print("Edit 3 target NOT found.")
