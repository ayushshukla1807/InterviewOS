import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Bump text sizes for readability
content = re.sub(r'\btext-\[8px\]\b', 'text-[10px]', content)
content = re.sub(r'\btext-\[8\.5px\]\b', 'text-[10px]', content)
content = re.sub(r'\btext-\[9px\]\b', 'text-[11px]', content)
content = re.sub(r'\btext-\[9\.5px\]\b', 'text-[11px]', content)
content = re.sub(r'\btext-\[10px\]\b', 'text-xs', content)
content = re.sub(r'\btext-\[11px\]\b', 'text-sm', content)
content = re.sub(r'\btext-xs\b', 'text-sm', content)

# 2. Bump text contrast for readability
content = re.sub(r'\btext-slate-600\b', 'text-slate-400', content)
content = re.sub(r'\btext-slate-500\b', 'text-slate-300', content)
content = re.sub(r'\btext-slate-400\b', 'text-slate-200', content)
content = re.sub(r'\btext-slate-300\b', 'text-slate-100', content)
# Special case to make sure we don't wash out pure white too much
# Maybe change some dark backgrounds to be slightly lighter if text is on it.

# 3. Add details about workplace simulation
# Find the workplace simulator section
simulator_header = r"""<h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Evaluate real workplace behavior. Not just MCQs.
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mx-auto">
              Drop candidates into a simulated workplace sandbox. Watch them triage Slack bugs, handle angry CEO escalations, and prioritize Jira tickets on the fly.
            </p>
          </div>"""

# Ensure we use the replaced text sizes/colors
simulator_header_replaced = r"""<h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Evaluate real workplace behavior. Not just MCQs.
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Drop candidates into a simulated workplace sandbox. Watch them triage Slack bugs, handle angry CEO escalations, and prioritize Jira tickets on the fly.
            </p>
          </div>"""

new_details = """
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left pt-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-time Stress Testing</h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Our AI simulates production outages and dynamically injects urgent messages. We evaluate how candidates manage panic, prioritize tasks under pressure, and communicate effectively during a crisis.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Workflow className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Workflow Prioritization</h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Candidates are presented with a backlog of conflicting Jira tickets and customer support emails. The AI analyzes their decision-making logic and triage strategies.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Stakeholder Management</h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Beyond coding, we assess how candidates communicate with non-technical stakeholders. Do they blame others? Are they polite to frustrated clients? The AI grades emotional intelligence.
              </p>
            </div>
          </div>"""

# Replace the text
if simulator_header_replaced in content:
    content = content.replace(simulator_header_replaced, simulator_header_replaced + new_details)
else:
    print("Could not find the simulator header after replacement.")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("UI enhancements applied.")
