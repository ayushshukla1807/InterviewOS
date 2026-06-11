'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Upload, FileText, User, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const defaultJobs = [
      {
        id: 'REQ-101',
        title: 'Senior Staff Engineer (React & AI Integration)',
        description: 'Design and deploy state-of-the-art interactive user interfaces. Deep knowledge of React internals, Next.js page lifecycles, and large language model APIs is required. You will collaborate on core AI workflows.'
      },
      {
        id: 'REQ-102',
        title: 'Lead Fullstack & Distributed Systems Architect',
        description: 'Architect scalable distributed data networks, microservices, database schemas, and load balancer structures. Proficiency in system modeling, caching strategies, and queue streaming is highly desired.'
      },
      {
        id: 'REQ-103',
        title: 'Algorithms & Competitive Programmer Intern',
        description: 'Write highly optimized algorithms, data structures (graphs, segment trees, dynamic programming), and solve scale complexities. Optimize memory usage and code execution performance.'
      }
    ];

    const savedJobs = localStorage.getItem('interviewos_jobs');
    let parsed = savedJobs ? JSON.parse(savedJobs) : [];
    
    // Merge default jobs if not already exists in saved jobs
    const merged = [...parsed];
    defaultJobs.forEach(dj => {
      if (!merged.some(j => j.id === dj.id)) {
        merged.push(dj);
      }
    });
    localStorage.setItem('interviewos_jobs', JSON.stringify(merged));

    const found = merged.find((j: any) => j.id === jobId);
    if (found) {
      setJob(found);
    } else {
      setError('Job not found.');
    }
  }, [jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !file) return;
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to parse resume');

      const context = {
        jobId: job.id,
        jobTitle: job.title,
        jobDescription: job.description,
        blueprint: job.blueprint,
        candidateName: name,
        candidateEmail: email,
        resumeText: data.text
      };

      localStorage.setItem('interviewos_candidate_context', JSON.stringify(context));
      
      // Redirect to the instructions page, passing the track as 'DYNAMIC'
      router.push(`/instructions?name=${encodeURIComponent(name)}&track=DYNAMIC`);

    } catch (err: any) {
      setError(err.message || 'An error occurred during application submission.');
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-8 text-center transition-colors duration-500">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black text-[var(--text)]">{error}</h1>
          <p className="text-slate-500">Please check the link or contact the recruiter.</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center transition-colors duration-500">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col transition-colors duration-500 selection:bg-blue-600/30 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      <header className="relative z-10 px-8 py-5 border-b backdrop-blur-xl flex items-center gap-4" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-700/20">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text)' }}>InterviewOS Candidate Portal</p>
          <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Job Requisition: {job.id}</p>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-8 lg:p-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        {/* Job Details */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-blue-600/10 border-blue-600/20 w-max">
             <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
             <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Actively Hiring</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>{job.title}</h1>
            <p className="leading-relaxed text-sm" style={{ color: 'color-mix(in srgb, var(--text) 70%, transparent)' }}>{job.description}</p>
          </div>
          <div className="p-6 rounded-2xl space-y-4 border shadow-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--card-bg) 50%, transparent)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Application Process</h3>
            <ul className="space-y-4 text-xs font-medium" style={{ color: 'color-mix(in srgb, var(--text) 80%, transparent)' }}>
              <li className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                 </div>
                 <span>Upload Resume (PDF format)</span>
              </li>
              <li className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                 </div>
                 <span>AI-Driven Technical Interview</span>
              </li>
              <li className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                 </div>
                 <span>Recruiter Review & Decision</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Application Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
           <div className="border p-8 rounded-[32px] space-y-8 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--card-bg) 80%, transparent)', borderColor: 'var(--border-color)' }}>
             <div>
               <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Apply Now</h2>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>Submit your details to begin</p>
             </div>

             <form onSubmit={handleApply} className="space-y-6">
               <div className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'color-mix(in srgb, var(--text) 60%, transparent)' }}>
                     <User className="w-3.5 h-3.5" /> Full Name
                   </label>
                   <input 
                     value={name} onChange={e => setName(e.target.value)}
                     className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none transition-all"
                     style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderColor: 'var(--border-color)', color: 'var(--text)' }}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'color-mix(in srgb, var(--text) 60%, transparent)' }}>
                     <Mail className="w-3.5 h-3.5" /> Email Address
                   </label>
                   <input 
                     type="email"
                     value={email} onChange={e => setEmail(e.target.value)}
                     className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none transition-all"
                     style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderColor: 'var(--border-color)', color: 'var(--text)' }}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'color-mix(in srgb, var(--text) 60%, transparent)' }}>
                     <FileText className="w-3.5 h-3.5" /> Resume (PDF)
                   </label>
                   <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-blue-600 bg-blue-600/5' : 'hover:border-blue-600/50'}`} style={{ borderColor: file ? undefined : 'var(--border-color)', backgroundColor: file ? undefined : 'color-mix(in srgb, var(--bg) 50%, transparent)' }}>
                     <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} required />
                     <Upload className={`w-6 h-6 mb-3 transition-colors ${file ? 'text-blue-600' : 'text-slate-400'}`} />
                     <span className="text-xs font-bold" style={{ color: file ? 'var(--primary)' : 'color-mix(in srgb, var(--text) 70%, transparent)' }}>
                        {file ? file.name : 'Click to upload PDF resume'}
                     </span>
                   </label>
                 </div>
               </div>

               <button type="submit" disabled={isSubmitting || !name || !email || !file} 
                 className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                   isSubmitting ? 'bg-blue-700/50 text-white/50 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-600 text-white shadow-blue-700/20'
                 }`}>
                 {isSubmitting ? (
                   <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Processing...</>
                 ) : (
                   <>Proceed to Interview <ArrowRight className="w-4 h-4" /></>
                 )}
               </button>
             </form>
           </div>
        </motion.div>
      </main>
    </div>
  );
}
