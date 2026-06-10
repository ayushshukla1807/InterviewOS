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
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black text-white">{error}</h1>
          <p className="text-slate-500">Please check the link or contact the recruiter.</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans flex flex-col">
      <header className="px-8 py-5 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl flex items-center gap-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-widest">InterviewOS Candidate Portal</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Job Requisition: {job.id}</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 lg:p-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Job Details */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter">{job.title}</h1>
            <p className="text-slate-400 leading-relaxed text-sm">{job.description}</p>
          </div>
          <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl space-y-3">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">The Process</h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-500" /> Upload Resume</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-500" /> Dynamic Technical Interview</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-500" /> Recruiter Review</li>
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-8 shadow-2xl">
          <div>
            <h2 className="text-xl font-black text-white">Apply Now</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Submit your details to start the interview</p>
          </div>

          <form onSubmit={handleApply} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input 
                  type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Resume (PDF)
                </label>
                <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 bg-[#0a0a0c] hover:border-white/20'}`}>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} required />
                  <Upload className={`w-6 h-6 mb-3 ${file ? 'text-indigo-500' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-300">{file ? file.name : 'Click to upload PDF resume'}</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !name || !email || !file} 
              className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSubmitting ? 'bg-indigo-600/50 text-white/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}>
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>Proceed to Interview <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
