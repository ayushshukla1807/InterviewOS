'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Send, Terminal, CheckCircle2, XCircle, Clock,
  Zap, MemoryStick, Lightbulb, Code2, ChevronDown,
  RotateCcw, Loader2, Award, AlertTriangle, TrendingUp,
  RefreshCw, Plus, ChevronRight, Copy, Check,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface TestCase {
  id: string;
  input: string;
  expected: string;
  description?: string;
}
interface TestResult {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  runtimeMs: number;
  memory?: string;
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
    bg: string; surface: string; surfaceAlt: string; border: string;
    textPrimary: string; textSecondary: string; textMuted: string;
    accent: string; accentText: string; accentBg: string; accentBorder: string;
    fontFamily?: string;
  };
}

// ─── Language Config ─────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', icon: 'JS' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript', icon: 'TS' },
  { id: 'python',     label: 'Python 3',   monaco: 'python',     icon: 'PY' },
  { id: 'java',       label: 'Java',       monaco: 'java',       icon: 'JV' },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp',        icon: 'C+' },
  { id: 'go',         label: 'Go',         monaco: 'go',         icon: 'GO' },
];

const BOILERPLATES: Record<string, string> = {
  javascript: `/**
 * @param {any} input - parsed JSON input
 * @return {any}
 */
function solution(input) {
  // Write your solution here
  
}

// Test your solution
const input = JSON.parse(process.argv[2] || 'null');
const result = solution(input);
console.log(JSON.stringify(result));`,

  typescript: `function solution(input: unknown): unknown {
  // Write your solution here
  return input;
}

const input = JSON.parse(process.argv[2] || 'null');
const result = solution(input);
console.log(JSON.stringify(result));`,

  python: `import sys
import json

def solution(input_data):
    # Write your solution here
    return input_data

if __name__ == "__main__":
    raw = sys.argv[1] if len(sys.argv) > 1 else "null"
    data = json.loads(raw)
    result = solution(data)
    print(json.dumps(result))`,

  java: `import java.util.*;

public class Solution {
    public static Object solve(Object input) {
        // Write your solution here
        return input;
    }
    
    public static void main(String[] args) {
        // Test your solution here
        System.out.println(solve(args.length > 0 ? args[0] : null));
    }
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

// Write your solution here
string solution(string input) {
    return input;
}

int main() {
    string input;
    if (cin >> input) {
        cout << solution(input) << endl;
    }
    return 0;
}`,

  go: `package main

import (
    "encoding/json"
    "fmt"
    "os"
)

func solution(input interface{}) interface{} {
    // Write your solution here
    return input
}

func main() {
    var input interface{}
    if len(os.Args) > 1 {
        json.Unmarshal([]byte(os.Args[1]), &input)
    }
    result := solution(input)
    out, _ := json.Marshal(result)
    fmt.Println(string(out))
}`,
};

const DIFFICULTY_COLOR = {
  Easy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  Hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
};

// ─── Execute via Judge0 ──────────────────────────────────────────────────────
async function executeCode(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; status: string; time: string; memory: string }> {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, stdin }),
  });
  return res.json();
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CodeIDE({
  problem, difficulty = 'Medium', testCases = [], initialCode = '',
  language = 'javascript', tags = [], onSubmit, theme,
}: CodeIDEProps) {
  const t = theme ?? {
    bg: '#0d0d0f', surface: '#111113', surfaceAlt: '#18181b',
    border: 'rgba(255,255,255,0.07)', textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8', textMuted: '#475569',
    accent: '#6366f1', accentText: '#a5b4fc',
    accentBg: 'rgba(99,102,241,0.1)', accentBorder: 'rgba(99,102,241,0.3)',
    fontFamily: 'Inter, sans-serif',
  };

  const [lang, setLang] = useState(language);
  const [code, setCode] = useState(initialCode || BOILERPLATES[language] || '');
  const [activePanel, setActivePanel] = useState<'tests' | 'console' | 'review'>('tests');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState<'testcase' | 'custom'>('testcase');
  const langMenuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);

  const diffStyle = DIFFICULTY_COLOR[difficulty];
  const currentLang = LANGUAGES.find(l => l.id === lang) || LANGUAGES[0];

  // Reset code on lang change
  useEffect(() => {
    if (!initialCode) setCode(BOILERPLATES[lang] || '// Write your solution here\n');
  }, [lang, initialCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault(); handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault(); handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang]);

  // Close lang menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Run: execute against test cases via Judge0 ──
  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setActivePanel('tests');
    setConsoleLines([]);

    const cases = testCases.length > 0 ? testCases : [{
      id: 'custom', input: customInput || 'null', expected: '', description: 'Custom input',
    }];

    const results: TestResult[] = [];
    for (const tc of cases) {
      const start = performance.now();
      try {
        const exec = await executeCode(code, lang, tc.input);
        const runtimeMs = Math.round(performance.now() - start);
        const actual = (exec.stdout || '').trim();
        const expected = tc.expected.trim();
        const passed = expected ? actual === expected : exec.status === 'Accepted';
        const errorMsg = exec.stderr || (exec.status !== 'Accepted' && exec.status !== 'Wrong Answer' ? exec.status : '');

        results.push({
          id: tc.id, input: tc.input, expected: tc.expected,
          actual: actual || exec.status,
          passed, error: errorMsg || undefined,
          runtimeMs: exec.time ? Math.round(parseFloat(exec.time) * 1000) : runtimeMs,
          memory: exec.memory,
        });

        if (exec.stdout) {
          exec.stdout.split('\n').filter(Boolean).forEach(l => setConsoleLines(p => [...p, l]));
        }
        if (exec.stderr) {
          exec.stderr.split('\n').filter(Boolean).forEach(l => setConsoleLines(p => [...p, `[ERR] ${l}`]));
        }
      } catch {
        results.push({ id: tc.id, input: tc.input, expected: tc.expected, actual: 'Execution Error', passed: false, runtimeMs: 0 });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  }, [code, lang, testCases, customInput, isRunning]);

  // ── Submit: run + AI review ──
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !code.trim()) return;
    setIsSubmitting(true);
    setActivePanel('review');
    setSubmissionCount(c => c + 1);

    // Run test cases first
    const cases = testCases.length > 0 ? testCases : [];
    const results: TestResult[] = [];
    for (const tc of cases) {
      try {
        const exec = await executeCode(code, lang, tc.input);
        const actual = (exec.stdout || '').trim();
        results.push({
          id: tc.id, input: tc.input, expected: tc.expected,
          actual, passed: actual === tc.expected.trim(),
          runtimeMs: exec.time ? Math.round(parseFloat(exec.time) * 1000) : 0,
        });
      } catch { /* skip */ }
    }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const allPassed = testResults.length > 0 && passedCount === testResults.length;
  const hasErrors = testResults.some(r => !r.passed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, fontFamily: t.fontFamily, overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 44, borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        {/* Left: difficulty + tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={14} style={{ color: t.textMuted }} />
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, color: diffStyle.color, background: diffStyle.bg, border: `1px solid ${diffStyle.border}` }}>
            {difficulty}
          </span>
          {tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: t.textMuted, background: t.surfaceAlt, border: `1px solid ${t.border}` }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Language selector */}
          <div ref={langMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.textSecondary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.accent }}>{currentLang.icon}</span>
              {currentLang.label}
              <ChevronDown size={11} />
            </button>
            {showLangMenu && (
              <div style={{ position: 'absolute', right: 0, top: 36, width: 160, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden' }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLang(l.id); setShowLangMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', border: 'none', background: lang === l.id ? t.accentBg : 'transparent', color: lang === l.id ? t.accentText : t.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span>{l.label}</span>
                    {lang === l.id && <ChevronRight size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copy */}
          <button onClick={handleCopy} title="Copy code" style={{ padding: '5px 8px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {copied ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
          </button>

          {/* Reset */}
          <button onClick={() => setCode(BOILERPLATES[lang] || '')} title="Reset code" style={{ padding: '5px 8px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RotateCcw size={13} />
          </button>

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            title="Run Code (Ctrl+Enter)"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.6 : 1 }}
          >
            {isRunning ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={13} />}
            Run
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            title="Submit & AI Review (Ctrl+Shift+Enter)"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: 'none', background: t.accent, color: '#fff', fontSize: 11, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            {isSubmitting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={13} />}
            Submit
          </button>
        </div>
      </div>

      {/* ── Body: Split Left + Right ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Left: Problem Panel */}
        <div style={{ width: '38%', flexShrink: 0, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.surface }}>
          {/* Problem header */}
          <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Problem Statement</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accentText, fontWeight: 700 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: t.textSecondary, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
              {problem}
            </p>

            {/* Examples */}
            {testCases.slice(0, 3).map((tc, i) => (
              <div key={tc.id} style={{ marginBottom: 14, padding: 14, background: t.surfaceAlt, borderRadius: 12, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: t.accent, marginBottom: 8 }}>Example {i + 1}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: t.textMuted, marginRight: 6 }}>Input:</span><code style={{ color: t.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{tc.input}</code></div>
                  <div><span style={{ color: t.textMuted, marginRight: 6 }}>Output:</span><code style={{ color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>{tc.expected}</code></div>
                  {tc.description && <div style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{tc.description}</div>}
                </div>
              </div>
            ))}

            {/* Constraints / Shortcuts */}
            <div style={{ marginTop: 20, padding: 14, background: t.surfaceAlt, borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Shortcuts</div>
              {[['Ctrl + Enter', 'Run code'], ['Ctrl + Shift + Enter', 'Submit + AI Review']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: t.textMuted }}>{v}</span>
                  <code style={{ fontSize: 10, padding: '2px 6px', background: t.bg, border: `1px solid ${t.border}`, borderRadius: 4, color: t.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>{k}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Editor + Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: 200, position: 'relative' }}>
            <Editor
              height="100%"
              language={currentLang.monaco}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              onMount={editor => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                padding: { top: 14, bottom: 14 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                tabSize: 2,
                suggest: { showMethods: true, showFunctions: true, showVariables: true },
                quickSuggestions: true,
              }}
            />
            {/* No-paste badge */}
            <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              No Paste
            </div>
          </div>

          {/* ── Output Panel ── */}
          <div style={{ height: 240, flexShrink: 0, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', background: t.bg }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.border}`, background: t.surface, height: 38, paddingLeft: 4, flexShrink: 0 }}>
              {[
                { key: 'tests', label: testResults.length > 0 ? `Test Results  ${passedCount}/${testResults.length}` : 'Test Cases', icon: <CheckCircle2 size={13} /> },
                { key: 'console', label: 'Console', icon: <Terminal size={13} /> },
                { key: 'review', label: review ? `AI Review  ${review.score}/100` : 'AI Review', icon: <Zap size={13} /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActivePanel(tab.key as typeof activePanel)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: '100%', fontSize: 11, fontWeight: 700, border: 'none', borderBottom: `2px solid ${activePanel === tab.key ? t.accent : 'transparent'}`, background: 'transparent', color: activePanel === tab.key ? t.accent : t.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}

              {/* Status badge */}
              {testResults.length > 0 && (
                <div style={{ marginLeft: 'auto', marginRight: 12, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, color: allPassed ? '#22c55e' : '#ef4444', background: allPassed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${allPassed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                  {allPassed ? 'All Passed' : hasErrors ? `${passedCount}/${testResults.length} Passed` : 'Running...'}
                </div>
              )}
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>

              {/* ── Tests Panel ── */}
              {activePanel === 'tests' && (
                <div>
                  {/* Sub-tabs: Test Cases / Custom Input */}
                  {testResults.length === 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {['testcase', 'custom'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as typeof activeTab)}
                          style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${activeTab === tab ? t.accentBorder : t.border}`, background: activeTab === tab ? t.accentBg : t.surfaceAlt, color: activeTab === tab ? t.accentText : t.textMuted, cursor: 'pointer' }}
                        >
                          {tab === 'testcase' ? 'Test Cases' : 'Custom Input'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom input */}
                  {testResults.length === 0 && activeTab === 'custom' && (
                    <div>
                      <textarea
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        placeholder="Enter custom stdin..."
                        style={{ width: '100%', minHeight: 80, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, color: t.textPrimary, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={handleRun}
                        disabled={isRunning}
                        style={{ marginTop: 8, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isRunning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={12} />}
                        Run Custom Input
                      </button>
                    </div>
                  )}

                  {/* Test case picker (before run) */}
                  {testResults.length === 0 && activeTab === 'testcase' && testCases.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {testCases.map((tc, i) => (
                          <button
                            key={tc.id}
                            onClick={() => setActiveTestIdx(i)}
                            style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${activeTestIdx === i ? t.accentBorder : t.border}`, background: activeTestIdx === i ? t.accentBg : t.surfaceAlt, color: activeTestIdx === i ? t.accentText : t.textMuted, cursor: 'pointer' }}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                        <button style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.textMuted, cursor: 'pointer' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      {testCases[activeTestIdx] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Input</div>
                            <pre style={{ margin: 0, padding: '8px 12px', background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textPrimary, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{testCases[activeTestIdx].input}</pre>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Expected</div>
                            <pre style={{ margin: 0, padding: '8px 12px', background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8, color: '#22c55e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{testCases[activeTestIdx].expected}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test results */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {testResults.map((r, i) => (
                      <div key={r.id} style={{ padding: 12, borderRadius: 10, border: `1px solid ${r.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, background: r.passed ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            {r.passed
                              ? <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
                              : <XCircle size={15} style={{ color: '#ef4444' }} />}
                            <span style={{ fontSize: 12, fontWeight: 700, color: r.passed ? '#22c55e' : '#ef4444' }}>
                              {r.passed ? 'Accepted' : 'Wrong Answer'} — Case {i + 1}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: t.textMuted }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{r.runtimeMs}ms</span>
                            {r.memory && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MemoryStick size={10} />{r.memory}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                          {[['Input', r.input, t.textPrimary], ['Expected', r.expected, '#22c55e'], ['Output', r.actual, r.passed ? '#22c55e' : '#f87171']].map(([label, val, color]) => (
                            <div key={label as string}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label as string}</div>
                              <code style={{ fontFamily: 'JetBrains Mono, monospace', color: color as string, fontSize: 11 }}>{val as string}</code>
                            </div>
                          ))}
                        </div>
                        {r.error && (
                          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                            {r.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {testResults.length === 0 && testCases.length === 0 && activeTab === 'testcase' && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: t.textMuted, fontSize: 12 }}>
                      No test cases. Use Custom Input or Submit for AI review.
                    </div>
                  )}
                </div>
              )}

              {/* ── Console Panel ── */}
              {activePanel === 'console' && (
                <div style={{ background: '#020204', borderRadius: 10, padding: 12, minHeight: 120, border: `1px solid ${t.border}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  {consoleLines.length === 0
                    ? <span style={{ color: t.textMuted }}>{'// Output will appear here after Run'}</span>
                    : consoleLines.map((line, i) => (
                      <div key={i} style={{ color: line.startsWith('[ERR]') ? '#f87171' : '#22c55e', lineHeight: 1.6 }}>{line}</div>
                    ))
                  }
                </div>
              )}

              {/* ── AI Review Panel ── */}
              {activePanel === 'review' && (
                <div>
                  {isSubmitting && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 10 }}>
                      <Loader2 size={28} style={{ color: t.accent, animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 12, color: t.textMuted }}>Gemini is analyzing your solution...</span>
                    </div>
                  )}

                  {!isSubmitting && !review && submissionCount === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
                      <Zap size={28} style={{ color: t.textMuted }} />
                      <span style={{ fontSize: 12, color: t.textMuted }}>Submit your code to get an AI review from Gemini</span>
                    </div>
                  )}

                  {review && !isSubmitting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Verdict */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, border: `1px solid ${review.verdict === 'Accepted' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, background: review.verdict === 'Accepted' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {review.verdict === 'Accepted' ? <Award size={18} style={{ color: '#22c55e' }} /> : <AlertTriangle size={18} style={{ color: '#ef4444' }} />}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: review.verdict === 'Accepted' ? '#22c55e' : '#ef4444' }}>{review.verdict}</div>
                            <div style={{ fontSize: 10, color: t.textMuted }}>Submission #{submissionCount}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: t.accent, lineHeight: 1 }}>{review.score}</div>
                          <div style={{ fontSize: 10, color: t.textMuted }}>/100</div>
                        </div>
                      </div>

                      {/* Complexity grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Time', value: review.timeComplexity, icon: <Clock size={13} /> },
                          { label: 'Space', value: review.spaceComplexity, icon: <MemoryStick size={13} /> },
                          { label: 'Optimal', value: review.isOptimal ? 'Yes' : 'No', icon: <TrendingUp size={13} /> },
                        ].map(item => (
                          <div key={item.label} style={{ padding: 10, borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, textAlign: 'center' }}>
                            <div style={{ color: t.accent, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: t.textPrimary }}>{item.value}</div>
                            <div style={{ fontSize: 9, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Feedback */}
                      <div style={{ padding: 12, borderRadius: 10, background: t.surface, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Interviewer Feedback</div>
                        <p style={{ fontSize: 12, lineHeight: 1.65, color: t.textSecondary, margin: 0 }}>{review.interviewFeedback}</p>
                      </div>

                      {/* Strengths */}
                      {review.strengths?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Strengths</div>
                          {review.strengths.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                              <CheckCircle2 size={13} style={{ color: '#22c55e', marginTop: 1, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: t.textSecondary }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Improvements */}
                      {review.improvements?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Improvements</div>
                          {review.improvements.map((imp, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                              <RefreshCw size={13} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: t.textSecondary }}>{imp}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hint */}
                      {review.optimalApproach && !review.isOptimal && (
                        <div style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', alignItems: 'flex-start' }}>
                          <Lightbulb size={14} style={{ color: t.accent, marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: t.textSecondary }}>{review.optimalApproach}</span>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        textarea:focus { border-color: rgba(99,102,241,0.4) !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
