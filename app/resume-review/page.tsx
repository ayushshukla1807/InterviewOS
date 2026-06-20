'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Upload, FileText, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ArrowRight, Zap, Target, Shield,
  TrendingUp, BarChart2, BookOpen, Award, RefreshCw, Download,
  Info, Check, X, Clock, Star, BrainCircuit, Layers
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SectionData {
  present: boolean;
  score: number;
  feedback: string;
  improvements: string[];
  bulletAnalysis?: { original: string; issue: string; rewritten: string }[];
}

interface EvaluationResult {
  overallScore: number;
  atsScore: number;
  pageCount: number;
  sections: {
    summary: SectionData;
    experience: SectionData;
    skills: SectionData;
    education: SectionData;
    projects: SectionData;
  };
  atsAnalysis: {
    score: number;
    passedChecks: string[];
    failedChecks: string[];
    warnings: string[];
  };
  keywordAnalysis: {
    presentKeywords: string[];
    missingCriticalKeywords: string[];
    keywordDensityScore: number;
    keywordDensityLabel: string;
  };
  quantificationAnalysis: {
    score: number;
    totalBullets: number;
    quantifiedBullets: number;
    feedback: string;
    examples: { good: string[]; needsWork: string[] };
  };
  actionVerbAudit: {
    score: number;
    weakVerbs: string[];
    strongVerbsFound: string[];
    suggestions: { weak: string; strong: string }[];
  };
  impactLanguageScore: number;
  impactLanguageFeedback: string;
  formatAnalysis: {
    estimatedLength: string;
    recommendation: string;
    issues: string[];
    positives: string[];
  };
  buzzwordsAndCliches?: {
    found: string[];
    feedback: string;
  };
  repetitionCheck?: {
    repeatedWords: string[];
    feedback: string;
  };
  activeVoiceScore?: number;
  aiGeneratedSummary?: string;
  topStrengths: string[];
  topWeaknesses: string[];
  fastImprovementPlan: { priority: string; action: string; timeEstimate: string }[];
  recruiterFirstImpression: string;
}

// ─── Score Ring ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120, strokeWidth = 8, label, color }: {
  score: number; size?: number; strokeWidth?: number; label?: string; color?: string;
}) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  const ringColor = color || getColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white" style={{ fontSize: size > 100 ? 28 : 18 }}>{score}</span>
          <span className="text-[9px] text-zinc-500 font-medium">/100</span>
        </div>
      </div>
      {label && <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase text-center">{label}</span>}
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
  const [width, setWidth] = useState(0);
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444';

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 400);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────────

function SectionCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: SectionData }) {
  const [open, setOpen] = useState(false);
  const color = data.score >= 80 ? '#10B981' : data.score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="glass-card overflow-hidden hover:border-blue-500/25 transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between gap-4 text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              {data.present ? (
                <span className="text-[10px] text-emerald-400 font-medium">Present</span>
              ) : (
                <span className="text-[10px] text-red-400 font-medium">Missing</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xl font-bold" style={{ color }}>{data.score}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-5 space-y-5">
              <p className="text-sm text-zinc-400 leading-relaxed">{data.feedback}</p>

              {data.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Improvements</h4>
                  <div className="space-y-2">
                    {data.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.bulletAnalysis && data.bulletAnalysis.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bullet Rewrites</h4>
                  {data.bulletAnalysis.map((b, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-white/5">
                      <div className="p-3 bg-red-500/5 border-b border-white/5">
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 block">Original · {b.issue}</span>
                        <p className="text-xs text-zinc-400 italic">"{b.original}"</p>
                      </div>
                      <div className="p-3 bg-emerald-500/5">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 block">Rewritten</span>
                        <p className="text-xs text-zinc-200">"{b.rewritten}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────

export default function ResumeReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState('');
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    setError('');
    setAnalyzeProgress(0);

    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => prev < 85 ? prev + Math.random() * 12 : prev);
    }, 600);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription.trim()) formData.append('jobDescription', jobDescription.trim());

      const res = await fetch('/api/resume-evaluate', { method: 'POST', body: formData });

      // Guard: if Render returns HTML (cold-start 502/504 or missing env var), don't try to JSON.parse it
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          res.status === 502 || res.status === 504
            ? 'Server is warming up — please wait 30 seconds and try again.'
            : `Server error (${res.status}). The GEMINI_API_KEY environment variable may not be set on Render.`
        );
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      clearInterval(progressInterval);
      setAnalyzeProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = (s: number) => s >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const pillars = result ? [
    { label: 'ATS', score: result.atsScore },
    { label: 'Keywords', score: result.keywordAnalysis.keywordDensityScore },
    { label: 'Quantification', score: result.quantificationAnalysis.score },
    { label: 'Active Voice', score: result.activeVoiceScore || result.actionVerbAudit.score },
    { label: 'Impact Language', score: result.impactLanguageScore },
    { label: 'Experience', score: result.sections.experience.score },
  ] : [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter',system-ui,sans-serif] relative overflow-x-hidden">

      {/* Exact same background as InterviewOS landing page */}
      <div className="mesh-bg" />
      <div className="noise-overlay" />

      <div className="relative z-10">
        {/* Nav */}
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">InterviewOS</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-up"
                className="px-4 py-2 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Sign up free
              </Link>
              <Link
                href="/instructions?track=JS"
                className="px-4 py-2 bg-white text-black text-[11px] font-bold rounded-xl hover:bg-zinc-100 transition-all"
              >
                Start Interview →
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full text-[9px] text-zinc-100 font-medium mb-6 tracking-tight">
              <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
              Free AI Resume Evaluator — No Sign-up Required
            </div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              Get your resume scored by a senior recruiter
            </h1>
            <p className="text-zinc-300 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
              8-pillar analysis covering ATS compatibility, keyword gaps, quantification, action verbs, impact language, and section-by-section feedback with line-level rewrites.
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[11px] text-zinc-500"
          >
            {['ATS Score', 'Keyword Gap', 'Bullet Rewrites', 'Action Verb Audit', 'Impact Scoring', 'Fast Fix Plan'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {f}
              </div>
            ))}
          </motion.div>
        </section>

        {/* Upload Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl"
          >
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`
                  relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                  flex flex-col items-center justify-center gap-4 min-h-[200px]
                  ${isDragging ? 'border-zinc-500 bg-zinc-800/50' : file ? 'border-zinc-600 bg-zinc-800/30' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                      className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Drop your resume here</p>
                      <p className="text-xs text-zinc-500 mt-1">or click to browse · PDF only · Max 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional JD */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Job Description
                  <span className="text-zinc-600 font-normal">(optional — enables keyword gap analysis)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for targeted keyword analysis and fit scoring..."
                  rows={4}
                  className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Progress bar during analysis */}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Analyzing your resume with AI...
                    </span>
                    <span>{Math.round(analyzeProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${analyzeProgress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-600">
                    {['Extracting text', 'Scoring sections', 'Generating rewrites'].map((s, i) => (
                      <div key={s} className={`flex items-center gap-1 ${analyzeProgress > i * 30 + 15 ? 'text-zinc-400' : ''}`}>
                        {analyzeProgress > i * 30 + 15 ? <Check className="w-3 h-3 text-emerald-400" /> : <div className="w-3 h-3 border border-zinc-700 rounded-full" />}
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className={`
                  w-full py-4 rounded-2xl font-medium tracking-tight text-sm flex items-center justify-center gap-3 transition-all
                  ${!file || isAnalyzing
                    ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-md'
                  }
                `}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Evaluate My Resume
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.section
              ref={resultsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto px-6 pb-20 space-y-8"
            >
              {/* Score Header */}
              <div className="glass-card overflow-hidden">
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
                    {/* Main score ring */}
                    <div className="flex flex-col items-center gap-4">
                      <ScoreRing score={result.overallScore} size={160} strokeWidth={12} label="Overall Score" />
                      <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${scoreBg(result.overallScore)} ${scoreColor(result.overallScore)}`}>
                        {result.overallScore >= 80 ? '🏆 Excellent' : result.overallScore >= 65 ? '⚡ Good — Improvable' : result.overallScore >= 45 ? '⚠️ Needs Work' : '🔴 Major Revisions Needed'}
                      </div>
                    </div>

                    {/* Pillar bars */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Performance Pillars</h2>
                      {pillars.map(p => (
                        <ScoreBar key={p.label} score={p.score} label={p.label} />
                      ))}
                    </div>
                  </div>

                  {/* Recruiter first impression */}
                  {result.recruiterFirstImpression && (
                    <div className="mt-6 p-5 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                          <Star className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Recruiter First Impression</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">{result.recruiterFirstImpression}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="space-y-6">

                  {/* ATS Card */}
                  <div className="glass-card p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" /> ATS Report
                      </h2>
                      <div className={`text-lg font-bold ${scoreColor(result.atsScore)}`}>{result.atsScore}/100</div>
                    </div>

                    <div className="space-y-2">
                      {result.atsAnalysis.passedChecks.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {c}
                        </div>
                      ))}
                      {result.atsAnalysis.failedChecks.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          {c}
                        </div>
                      ))}
                      {result.atsAnalysis.warnings.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantification */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-400" /> Quantification
                      </h2>
                      <div className={`text-lg font-bold ${scoreColor(result.quantificationAnalysis.score)}`}>
                        {result.quantificationAnalysis.score}/100
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">
                          {result.quantificationAnalysis.quantifiedBullets}
                          <span className="text-zinc-600">/{result.quantificationAnalysis.totalBullets}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">bullets with metrics</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">{result.quantificationAnalysis.feedback}</p>

                    {result.quantificationAnalysis.examples.needsWork.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Needs metrics</p>
                        {result.quantificationAnalysis.examples.needsWork.slice(0, 2).map((ex, i) => (
                          <p key={i} className="text-xs text-zinc-500 italic truncate">"{ex}"</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Format */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" /> Format Analysis
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border
                        ${result.formatAnalysis.estimatedLength === 'Ideal'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                        {result.formatAnalysis.estimatedLength} Length
                      </div>
                      <div className="text-xs text-zinc-500">{result.pageCount} page{result.pageCount !== 1 ? 's' : ''}</div>
                    </div>
                    <p className="text-xs text-zinc-400">{result.formatAnalysis.recommendation}</p>
                    {result.formatAnalysis.issues.map((iss, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                        <X className="w-3 h-3 text-red-400 shrink-0" /> {iss}
                      </div>
                    ))}
                    {result.formatAnalysis.positives.map((pos, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" /> {pos}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center column — sections */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Section Analysis</h2>

                  <SectionCard title="Professional Summary" icon={<FileText className="w-4 h-4" />} data={result.sections.summary} />
                  <SectionCard title="Work Experience" icon={<TrendingUp className="w-4 h-4" />} data={result.sections.experience} />
                  <SectionCard title="Skills" icon={<Zap className="w-4 h-4" />} data={result.sections.skills} />
                  <SectionCard title="Education" icon={<BookOpen className="w-4 h-4" />} data={result.sections.education} />
                  <SectionCard title="Projects" icon={<Award className="w-4 h-4" />} data={result.sections.projects} />

                  {/* Action Verb Audit */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-fuchsia-400" /> Action Verb Audit
                      </h2>
                      <div className={`text-lg font-bold ${scoreColor(result.actionVerbAudit.score)}`}>{result.actionVerbAudit.score}/100</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Weak Verbs Found</p>
                        {result.actionVerbAudit.weakVerbs.map((v, i) => (
                          <span key={i} className="inline-flex mr-1.5 mb-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] rounded-md">{v}</span>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Strong Verbs Found</p>
                        {result.actionVerbAudit.strongVerbsFound.map((v, i) => (
                          <span key={i} className="inline-flex mr-1.5 mb-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-md">{v}</span>
                        ))}
                      </div>
                    </div>

                    {result.actionVerbAudit.suggestions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Replacements</p>
                        {result.actionVerbAudit.suggestions.slice(0, 3).map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-red-400 line-through">{s.weak}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                            <span className="text-emerald-400 font-semibold">{s.strong}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">

                  {/* Buzzwords & Repetition (ResumeWorded feature) */}
                  {(result.buzzwordsAndCliches || result.repetitionCheck) && (
                    <div className="glass-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" /> Fluff & Repetition
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.buzzwordsAndCliches && result.buzzwordsAndCliches.found.length > 0 && (
                          <div className="space-y-2 border border-rose-500/10 bg-rose-500/5 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Buzzwords Found</span>
                            <div className="flex flex-wrap gap-1.5">
                              {result.buzzwordsAndCliches.found.map(w => (
                                <span key={w} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-md">{w}</span>
                              ))}
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">{result.buzzwordsAndCliches.feedback}</p>
                          </div>
                        )}
                        
                        {result.repetitionCheck && result.repetitionCheck.repeatedWords.length > 0 && (
                          <div className="space-y-2 border border-amber-500/10 bg-amber-500/5 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Overused Words</span>
                            <div className="flex flex-wrap gap-1.5">
                              {result.repetitionCheck.repeatedWords.map(w => (
                                <span key={w} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] rounded-md">{w}</span>
                              ))}
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">{result.repetitionCheck.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Generated Summary (Resumify feature) */}
                  {result.aiGeneratedSummary && (
                    <div className="glass-card border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h2 className="text-sm font-bold text-white">AI-Optimized Summary</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">We rewrote your summary to be more ATS-friendly and impactful. Feel free to copy this:</p>
                      <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-sm text-zinc-200 leading-relaxed italic">
                        "{result.aiGeneratedSummary}"
                      </div>
                    </div>
                  )}

                  {/* Keyword Analysis */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" /> Keyword Gap
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${scoreBg(result.keywordAnalysis.keywordDensityScore)} ${scoreColor(result.keywordAnalysis.keywordDensityScore)}`}>
                        {result.keywordAnalysis.keywordDensityLabel}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Present Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.keywordAnalysis.presentKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium rounded-lg">{kw}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Missing Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.keywordAnalysis.missingCriticalKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-medium rounded-lg">{kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-white">Strengths & Weaknesses</h2>

                    <div className="space-y-2">
                      {result.topStrengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {result.topWeaknesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fast Improvement Plan */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Fast Fix Plan
                    </h2>
                    <div className="space-y-3">
                      {result.fastImprovementPlan.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                            ${step.priority === 'High' ? 'bg-red-500/20 text-red-400' : step.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}
                          `}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-zinc-200 leading-relaxed">{step.action}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="w-3 h-3 text-zinc-600" />
                              <span className="text-[10px] text-zinc-600">{step.timeEstimate}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                                ${step.priority === 'High' ? 'bg-red-500/10 text-red-400' : step.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}
                              `}>{step.priority}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA card */}
                  <div className="glass-card border-purple-500/20 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Practice what you fixed</h3>
                        <p className="text-xs text-zinc-400">Run a mock interview tuned to your resume</p>
                      </div>
                    </div>
                    <Link
                      href="/sign-up"
                      className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-xl text-center hover:opacity-90 transition-all"
                    >
                      Start Free Mock Interview →
                    </Link>
                    <p className="text-[10px] text-zinc-600 text-center">No credit card required</p>
                  </div>
                </div>
              </div>

              {/* Analyze another */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => { setFile(null); setResult(null); setJobDescription(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/8 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Evaluate Another Resume
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* No-result footer features (only show when not analyzing/not showing results) */}
        {!result && !isAnalyzing && (
          <section className="max-w-4xl mx-auto px-6 pb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Shield className="w-5 h-5 text-purple-400" />, title: 'ATS Score', desc: 'See if your resume passes automated screening' },
                { icon: <Target className="w-5 h-5 text-blue-400" />, title: 'Keyword Gap', desc: 'Find missing keywords vs. your target role' },
                { icon: <BarChart2 className="w-5 h-5 text-amber-400" />, title: 'Quantification', desc: 'How many bullets have measurable impact?' },
                { icon: <Zap className="w-5 h-5 text-emerald-400" />, title: 'Bullet Rewrites', desc: 'Get AI-rewritten versions of weak bullets' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="glass-card p-5 space-y-2 hover:border-blue-500/20 transition-all"
                >
                  <div className="p-2 rounded-xl bg-white/5 w-fit">{f.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
