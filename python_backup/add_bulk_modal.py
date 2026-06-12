import re

with open('app/recruiter/page.tsx', 'r') as f:
    content = f.read()

bulk_modal_code = """
          {/* ── BULK INVITE MODAL ──────────────────────────────────────── */}
          {showBulkInviteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border-none p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                <button onClick={() => {setShowBulkInviteModal(false); setBulkLinks([]);}} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Bulk Invite (CSV)</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Upload a CSV to generate secure assessment links for multiple candidates.</p>
                
                {!bulkLinks.length ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-950/50">
                    <Users className="w-10 h-10 text-purple-400 mb-4 opacity-50" />
                    <p className="text-sm font-bold text-slate-300 mb-4">Upload CSV (name, email, role)</p>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          if (!text) return;
                          const rows = text.split('\\n').map(r => r.split(','));
                          const newLinks: any[] = [];
                          rows.forEach((row, i) => {
                             if (i === 0 && row[0].toLowerCase().includes('name')) return; // Skip header
                             if (row.length >= 3) {
                               const name = row[0].strip ? row[0].strip() : row[0].trim();
                               const email = row[1].strip ? row[1].strip() : row[1].trim();
                               const role = row[2].strip ? row[2].strip() : row[2].trim();
                               if (name && email && role) {
                                  const token = btoa(JSON.stringify({name, email, role}));
                                  newLinks.push({name, email, role, link: `${window.location.origin}/invite/${token}`});
                               }
                             }
                          });
                          setBulkLinks(newLinks);
                        };
                        reader.readAsText(file);
                      }}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{bulkLinks.length} Links Generated</span>
                      <button 
                        onClick={() => {
                          const csvData = bulkLinks.map(l => `${l.name},${l.email},${l.role},${l.link}`).join('\\n');
                          const blob = new Blob(['Name,Email,Role,Link\\n' + csvData], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.setAttribute('href', url);
                          a.setAttribute('download', 'invite_links.csv');
                          a.click();
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-[10px] font-black uppercase text-white tracking-widest transition-colors"
                      >
                        Download as CSV
                      </button>
                    </div>
                    {bulkLinks.map((bl, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white">{bl.name}</p>
                            <p className="text-[10px] text-slate-400">{bl.email} • {bl.role}</p>
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText(bl.link).then(() => alert('Copied!'))}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] font-black text-white uppercase tracking-widest"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded break-all">{bl.link}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
"""

target = "          )}\n          \n          {/* ── LIVE MONITOR ──────────────────────────────────────────────── */}"
content = content.replace(target, "          )}\n" + bulk_modal_code + "\n          {/* ── LIVE MONITOR ──────────────────────────────────────────────── */}")

with open('app/recruiter/page.tsx', 'w') as f:
    f.write(content)
print("Added bulk invite modal")
