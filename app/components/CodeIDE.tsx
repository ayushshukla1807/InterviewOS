'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Send, RefreshCw, Terminal, ChevronRight, CheckCircle2,
  XCircle, Clock, Zap, MemoryStick, Lightbulb, Code2,
  ChevronDown, RotateCcw, Loader2, Award, AlertTriangle, TrendingUp
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface TestCase {
  id: string;
  input: string;
  expected: string;
  description: string;
}

interface TestResult {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  runtimeMs: number;
}

interface CodeReview {
  verdict: string;
  score: number;
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  strengths: string[];
  improvements: string[];
  interviewFeedback: string;
  optimalApproach: string;
}

interface CodeIDEProps {
  problem: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  testCases?: TestCase[];
  initialCode?: string;
  language?: string;
  tags?: string[];
  onSubmit?: (code: string, language: string, review: CodeReview | null) => void;
  theme?: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    fontFamily?: string;
  };
}

// ─── Language Boilerplates ──────────────────────────────────────────────────
const BOILERPLATES: Record<string, string> = {
  javascript: `/**
 * @param {any} input
 * @return {any}
 */
function solution(input) {
  // Write your solution here
  
}

// Test runner (do not modify)
module.exports = solution;`,

  typescript: `function solution(input: unknown): unknown {
  // Write your solution here
  
}

export default solution;`,

  python: `def solution(input):
    # Write your solution here
    pass`,

  java: `public class Solution {
    public Object solve(Object input) {
        // Write your solution here
        return null;
    }
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

// Write your solution here
auto solution(auto input) {
    
}`,

  go: `package main

func solution(input interface{}) interface{} {
    // Write your solution here
    return nil
}`,
};

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
];

const DIFFICULTY_STYLES = {
  Easy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  Hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
};

// ─── JS Code Executor (client-side sandbox) ─────────────────────────────────
function runJSSandbox(code: string, testCases: TestCase[]): TestResult[] {
  return testCases.map(tc => {
    const start = performance.now();
    try {
      const logs: string[] = [];
      const fakeConsole = { log: (...args: unknown[]) => logs.push(args.join(' ')) };

      // eslint-disable-next-line no-new-func
      const fn = new Function('console', `
        ${code}
        const __fn = typeof solution !== 'undefined' ? solution : (typeof module !== 'undefined' && module.exports) || null;
        return __fn;
      `)(fakeConsole);

      const result = fn ? JSON.stringify(fn(JSON.parse(tc.input))) : 'No solution() function found';
      const runtimeMs = Math.round(performance.now() - start);
      const passed = result === tc.expected;

      return { id: tc.id, input: tc.input, expected: tc.expected, actual: result, passed, runtimeMs };
    } catch (err: unknown) {
      return {
        id: tc.id, input: tc.input, expected: tc.expected,
        actual: 'Runtime Error', passed: false,
        error: err instanceof Error ? err.message : String(err),
        runtimeMs: Math.round(performance.now() - start),
      };
    }
  });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function CodeIDE({
  problem, difficulty = 'Medium', testCases = [], initialCode = '', language = 'javascript',
  tags = [], onSubmit, theme
}: CodeIDEProps) {
  const t = theme ?? {
    bg: '#0e0e10', surface: '#111113', surfaceAlt: '#1a1a1c',
    border: 'rgba(255,255,255,0.06)', textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8', textMuted: '#475569',
    accent: '#6366f1', accentText: '#a5b4fc',
    accentBg: 'rgba(99,102,241,0.12)', accentBorder: 'rgba(99,102,241,0.3)',
    fontFamily: 'Outfit, sans-serif',
  };

  const [lang, setLang] = useState(language);
  const [code, setCode] = useState(initialCode || BOILERPLATES[language] || '');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activePanel, setActivePanel] = useState<'console' | 'tests' | 'review'>('tests');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const editorRef = useRef<unknown>(null);
  const langDropRef = useRef<HTMLDivElement>(null);

  const diffStyle = DIFFICULTY_STYLES[difficulty];

  // Sync language boilerplate when lang changes
  useEffect(() => {
    if (!initialCode) setCode(BOILERPLATES[lang] || '// Write your solution here\n');
  }, [lang, initialCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang]);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRun = useCallback(() => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setActivePanel('tests');
    setConsoleOutput([]);

    setTimeout(() => {
      const casesToRun = testCases.length > 0 ? testCases : [{
        id: 'default', input: '"test"', expected: '"test"', description: 'Default test'
      }];

      const results = lang === 'javascript' || lang === 'typescript'
        ? runJSSandbox(code, casesToRun)
        : casesToRun.map(tc => ({
            id: tc.id, input: tc.input, expected: tc.expected,
            actual: '(Server-side execution not available in browser)',
            passed: false, runtimeMs: 0,
          }));

      setTestResults(results);
      setIsRunning(false);
    }, 400);
  }, [code, lang, testCases, isRunning]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !code.trim()) return;
    setIsSubmitting(true);
    setActivePanel('review');
    setSubmissionCount(c => c + 1);

    // Run test cases first
    const casesToRun = testCases.length > 0 ? testCases : [];
    const results = lang === 'javascript' || lang === 'typescript'
      ? runJSSandbox(code, casesToRun)
      : [];
    setTestResults(results);

    try {
      const res = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: lang, problem, testResults: results }),
      });
      const data = await res.json();
      setReview(data);
      onSubmit?.(code, lang, data);
    } catch {
      setReview(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, lang, problem, testCases, isSubmitting, onSubmit]);

  const passedCount = testResults.filter(r => r.passed).length;
  const allPassed = testResults.length > 0 && passedCount === testResults.length;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: t.bg, fontFamily: t.fontFamily }}
    >
      {/* ─── Topbar ─── */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ backgroundColor: t.surface, borderColor: t.border }}
      >
        {/* Difficulty + Tags */}
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4" style={{ color: t.textMuted }} />
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full border"
            style={{ color: diffStyle.color, backgroundColor: diffStyle.bg, borderColor: diffStyle.border }}
          >
            {difficulty}
          </span>
          {tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color: t.textMuted, borderColor: t.border, backgroundColor: t.surfaceAlt }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative" ref={langDropRef}>
            <button
              onClick={() => setShowLangDropdown(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{ backgroundColor: t.surfaceAlt, borderColor: t.border, color: t.textSecondary }}
            >
              {LANGUAGES.find(l => l.id === lang)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showLangDropdown && (
              <div
                className="absolute right-0 top-9 w-40 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ backgroundColor: t.surface, borderColor: t.border }}
              >
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLang(l.id); setShowLangDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all"
                    style={{
                      color: lang === l.id ? t.accent : t.textSecondary,
                      backgroundColor: lang === l.id ? t.accentBg : 'transparent',
                    }}
                  >
                    {l.label}
                    {lang === l.id && <ChevronRight className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={() => setCode(BOILERPLATES[lang] || '')}
            className="p-1.5 rounded-lg border transition-all"
            title="Reset to boilerplate"
            style={{ backgroundColor: t.surfaceAlt, borderColor: t.border, color: t.textMuted }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white transition-all"
            style={{ backgroundColor: t.accent }}
            title="Submit & Review (Ctrl+Shift+Enter)"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* ─── Main Split Pane ─── */}
      <div className="flex flex-1 min-h-0">

        {/* Left: Problem Description */}
        <div
          className="w-[38%] border-r flex flex-col overflow-y-auto shrink-0"
          style={{ borderColor: t.border, backgroundColor: t.surface }}
        >
          {/* Problem Header */}
          <div className="p-5 border-b" style={{ borderColor: t.border }}>
            <h2 className="text-sm font-black mb-1" style={{ color: t.textPrimary }}>Problem Statement</h2>
          </div>

          {/* Problem Body */}
          <div className="p-5 flex-1">
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap mb-6"
              style={{ color: t.textSecondary }}
            >
              {problem}
            </p>

            {/* Test Case Examples */}
            {testCases.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>
                  Examples
                </p>
                {testCases.slice(0, 3).map((tc, i) => (
                  <div
                    key={tc.id}
                    className="rounded-xl p-3 border text-xs space-y-1.5"
                    style={{ backgroundColor: t.surfaceAlt, borderColor: t.border }}
                  >
                    <p className="font-bold" style={{ color: t.accent }}>Example {i + 1}</p>
                    <div style={{ color: t.textSecondary }}>
                      <span style={{ color: t.textMuted }}>Input:  </span>
                      <code style={{ color: t.textPrimary }}>{tc.input}</code>
                    </div>
                    <div style={{ color: t.textSecondary }}>
                      <span style={{ color: t.textMuted }}>Output: </span>
                      <code style={{ color: t.textPrimary }}>{tc.expected}</code>
                    </div>
                    {tc.description && (
                      <p style={{ color: t.textMuted }}>{tc.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: t.border }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Shortcuts</p>
              <div className="space-y-1">
                {[
                  ['Ctrl + Enter', 'Run code'],
                  ['Ctrl + Shift + Enter', 'Submit & Review'],
                ].map(([key, label]) => (
                  <div key={key} className="flex justify-between items-center text-[10px]">
                    <span style={{ color: t.textMuted }}>{label}</span>
                    <code
                      className="px-1.5 py-0.5 rounded border text-[9px]"
                      style={{ backgroundColor: t.surfaceAlt, borderColor: t.border, color: t.textSecondary }}
                    >
                      {key}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Monaco Editor */}
          <div
            className="flex-1 relative min-h-0"
            style={{ minHeight: '240px' }}
            onPaste={e => { e.preventDefault(); }}
          >
            <Editor
              height="100%"
              language={lang}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              onMount={editor => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                formatOnPaste: false,
                suggestOnTriggerCharacters: true,
                tabSize: 2,
              }}
            />

            {/* Anti-paste warning overlay */}
            <div
              className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[9px] font-bold border"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              No Paste
            </div>
          </div>

          {/* ─── Output Panels ─── */}
          <div
            className="border-t shrink-0"
            style={{ borderColor: t.border, minHeight: '200px', maxHeight: '280px' }}
          >
            {/* Panel Tabs */}
            <div
              className="flex items-center border-b px-3"
              style={{ backgroundColor: t.surface, borderColor: t.border }}
            >
              {[
                { key: 'tests', label: `Tests ${testResults.length > 0 ? `(${passedCount}/${testResults.length})` : ''}`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { key: 'console', label: 'Console', icon: <Terminal className="w-3.5 h-3.5" /> },
                { key: 'review', label: `AI Review ${review ? `(${review.score}/100)` : ''}`, icon: <Zap className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActivePanel(tab.key as typeof activePanel)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold border-b-2 transition-all"
                  style={{
                    borderBottomColor: activePanel === tab.key ? t.accent : 'transparent',
                    color: activePanel === tab.key ? t.accent : t.textMuted,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}

              {/* Pass/fail summary badge */}
              {testResults.length > 0 && (
                <div
                  className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full border"
                  style={allPassed
                    ? { color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.25)' }
                    : { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }
                  }
                >
                  {allPassed ? 'All Passed' : `${passedCount}/${testResults.length} Passed`}
                </div>
              )}
            </div>

            {/* Panel Body */}
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 36px)', backgroundColor: t.bg }}>

              {/* Tests Panel */}
              {activePanel === 'tests' && (
                <div className="p-3 space-y-2">
                  {testResults.length === 0 && testCases.length > 0 && (
                    <div>
                      {/* Test case selector */}
                      <div className="flex gap-2 mb-3">
                        {testCases.map((tc, i) => (
                          <button
                            key={tc.id}
                            onClick={() => setActiveTestCase(i)}
                            className="px-3 py-1 rounded-lg text-[10px] font-bold border transition-all"
                            style={activeTestCase === i
                              ? { backgroundColor: t.accentBg, borderColor: t.accentBorder, color: t.accentText }
                              : { backgroundColor: t.surface, borderColor: t.border, color: t.textMuted }
                            }
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      {testCases[activeTestCase] && (
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>Input</p>
                            <pre
                              className="p-3 rounded-lg border"
                              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textSecondary }}
                            >{testCases[activeTestCase].input}</pre>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>Expected Output</p>
                            <pre
                              className="p-3 rounded-lg border"
                              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textSecondary }}
                            >{testCases[activeTestCase].expected}</pre>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-center mt-3" style={{ color: t.textMuted }}>
                        Press Run (Ctrl+Enter) to execute against test cases
                      </p>
                    </div>
                  )}

                  {testResults.map(r => (
                    <div
                      key={r.id}
                      className="rounded-xl border p-3 text-xs"
                      style={{
                        backgroundColor: r.passed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                        borderColor: r.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {r.passed
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-rose-400" />
                          }
                          <span className="font-bold" style={{ color: r.passed ? '#22c55e' : '#ef4444' }}>
                            {r.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px]" style={{ color: t.textMuted }}>
                          <Clock className="w-3 h-3" />
                          {r.runtimeMs}ms
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <p className="font-bold mb-1" style={{ color: t.textMuted }}>Input</p>
                          <code style={{ color: t.textSecondary }}>{r.input}</code>
                        </div>
                        <div>
                          <p className="font-bold mb-1" style={{ color: t.textMuted }}>Expected</p>
                          <code className="text-emerald-400">{r.expected}</code>
                        </div>
                        <div>
                          <p className="font-bold mb-1" style={{ color: t.textMuted }}>Got</p>
                          <code className={r.passed ? 'text-emerald-400' : 'text-rose-400'}>{r.actual}</code>
                        </div>
                      </div>
                      {r.error && (
                        <p className="mt-2 text-[10px] text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/20">
                          {r.error}
                        </p>
                      )}
                    </div>
                  ))}

                  {testResults.length === 0 && testCases.length === 0 && (
                    <p className="text-[11px] text-center py-6" style={{ color: t.textMuted }}>
                      No test cases configured. Press Submit to get AI code review.
                    </p>
                  )}
                </div>
              )}

              {/* Console Panel */}
              {activePanel === 'console' && (
                <div className="p-3">
                  <div
                    className="rounded-xl p-3 font-mono text-xs min-h-[100px] border"
                    style={{ backgroundColor: '#020202', borderColor: t.border, color: '#22c55e' }}
                  >
                    {consoleOutput.length === 0
                      ? <span style={{ color: t.textMuted }}>// Console output will appear here after Run</span>
                      : consoleOutput.map((line, i) => <div key={i}>{line}</div>)
                    }
                  </div>
                </div>
              )}

              {/* AI Review Panel */}
              {activePanel === 'review' && (
                <div className="p-3 space-y-3">
                  {isSubmitting && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} />
                      <p className="text-xs" style={{ color: t.textMuted }}>AI is analyzing your code...</p>
                    </div>
                  )}

                  {!isSubmitting && !review && submissionCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Zap className="w-8 h-8" style={{ color: t.textMuted }} />
                      <p className="text-xs" style={{ color: t.textMuted }}>
                        Submit your code to get an AI code review
                      </p>
                    </div>
                  )}

                  {review && !isSubmitting && (
                    <div className="space-y-3">
                      {/* Verdict Header */}
                      <div
                        className="flex items-center justify-between p-3 rounded-xl border"
                        style={{
                          backgroundColor: review.verdict === 'Accepted' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          borderColor: review.verdict === 'Accepted' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {review.verdict === 'Accepted'
                            ? <Award className="w-5 h-5 text-emerald-400" />
                            : <AlertTriangle className="w-5 h-5 text-rose-400" />
                          }
                          <div>
                            <p
                              className="text-sm font-black"
                              style={{ color: review.verdict === 'Accepted' ? '#22c55e' : '#ef4444' }}
                            >
                              {review.verdict}
                            </p>
                            <p className="text-[9px]" style={{ color: t.textMuted }}>Submission #{submissionCount}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black" style={{ color: t.accent }}>{review.score}</p>
                          <p className="text-[9px]" style={{ color: t.textMuted }}>/ 100</p>
                        </div>
                      </div>

                      {/* Complexity */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Time', value: review.timeComplexity, icon: <Clock className="w-3.5 h-3.5" /> },
                          { label: 'Space', value: review.spaceComplexity, icon: <MemoryStick className="w-3.5 h-3.5" /> },
                          { label: 'Optimal', value: review.isOptimal ? 'Yes' : 'No', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                        ].map(item => (
                          <div
                            key={item.label}
                            className="p-2.5 rounded-xl border text-center"
                            style={{ backgroundColor: t.surface, borderColor: t.border }}
                          >
                            <div className="flex justify-center mb-1" style={{ color: t.accent }}>{item.icon}</div>
                            <p className="text-[10px] font-black" style={{ color: t.textPrimary }}>{item.value}</p>
                            <p className="text-[8px] uppercase tracking-wider" style={{ color: t.textMuted }}>{item.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Feedback */}
                      <div
                        className="p-3 rounded-xl border"
                        style={{ backgroundColor: t.surface, borderColor: t.border }}
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>
                          Interviewer Feedback
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: t.textSecondary }}>
                          {review.interviewFeedback}
                        </p>
                      </div>

                      {/* Strengths */}
                      {review.strengths?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
                            Strengths
                          </p>
                          {review.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-xs" style={{ color: t.textSecondary }}>{s}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Improvements */}
                      {review.improvements?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>
                            Improvements
                          </p>
                          {review.improvements.map((imp, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-xs" style={{ color: t.textSecondary }}>{imp}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Optimal Approach Hint */}
                      {review.optimalApproach && !review.isOptimal && (
                        <div
                          className="flex items-start gap-2 p-3 rounded-xl border"
                          style={{ backgroundColor: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}
                        >
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: t.accent }} />
                          <p className="text-xs" style={{ color: t.textSecondary }}>{review.optimalApproach}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
