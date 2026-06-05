'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronDown, RotateCcw, Loader2, CheckCircle2, XCircle, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TestCase { id: string; input: string; expected: string; description?: string; }
interface CodeReview {
  verdict: string; score: number; timeComplexity: string; spaceComplexity: string;
  isOptimal: boolean; strengths: string[]; improvements: string[];
  interviewFeedback: string; optimalApproach: string;
}
interface CodeIDEProps {
  problem: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  testCases?: TestCase[];
  initialCode?: string;
  language?: string;
  tags?: string[];
  onSubmit?: (code: string, language: string, review: CodeReview | null) => void;
  theme?: Record<string, string>;
}

// ─── Language Config ──────────────────────────────────────────────────────────
const LANGS = [
  { id: 'python',     label: 'Python (3.11.5)', monaco: 'python'     },
  { id: 'javascript', label: 'JavaScript (Node 18)', monaco: 'javascript' },
  { id: 'typescript', label: 'TypeScript (5.0)',  monaco: 'typescript' },
  { id: 'java',       label: 'Java (OpenJDK 17)', monaco: 'java'       },
  { id: 'cpp',        label: 'C++ (GCC 12)',      monaco: 'cpp'        },
  { id: 'go',         label: 'Go (1.21)',         monaco: 'go'         },
];

const STARTERS: Record<string, string> = {
  python: `# Your code here
def solution(n, nums):
    # implement your solution
    pass

import sys
data = sys.stdin.read().split()
`,
  javascript: `// Your code here
process.stdin.resume();
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  const lines = input.trim().split('\\n');
  // parse input and write your solution
  console.log(lines[0]);
});`,
  typescript: `// Your code here
import * as readline from 'readline';
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
  // parse lines[] and write your solution
  console.log(lines[0]);
});`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Read input
        String line = br.readLine();
        // Write your solution
        System.out.println(line);
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input
    int n;
    cin >> n;
    
    // Write your solution
    cout << n << endl;
    return 0;
}`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    // Read input
    var n int
    fmt.Fscan(reader, &n)
    // Write your solution
    fmt.Println(n)
}`,
};

const DIFF_COLOR: Record<string, string> = { Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ff375f' };

async function runCode(code: string, language: string, stdin: string) {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, stdin }),
  });
  return res.json() as Promise<{ stdout: string; stderr: string; status: string; time: string; memory: string; error?: string }>;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CodeIDE({ problem, difficulty = 'Medium', testCases = [], initialCode = '', language = 'python', tags = [], onSubmit }: CodeIDEProps) {
  const [lang, setLang] = useState(language);
  const [code, setCode] = useState(initialCode || STARTERS[language] || '');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [customInput, setCustomInput] = useState(testCases[0]?.input || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'INPUT' | 'OUTPUT' | 'ERROR'>('INPUT');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<{ status: string; time: string; memory: string } | null>(null);
  const [verdict, setVerdict] = useState<'AC' | 'WA' | 'TLE' | 'CE' | 'RE' | null>(null);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [bottomH, setBottomH] = useState(220);
  const [isDraggingRow, setIsDraggingRow] = useState(false);
  const [leftW, setLeftW] = useState(320);
  const [isDraggingCol, setIsDraggingCol] = useState(false);
  const [fullEditor, setFullEditor] = useState(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);

  useEffect(() => {
    if (!initialCode) setCode(STARTERS[lang] || '# Write your code here\n');
  }, [lang, initialCode]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Drag to resize bottom panel (vertical)
  const onRowDragStart = (e: React.MouseEvent) => {
    setIsDraggingRow(true);
    dragStartY.current = e.clientY;
    dragStartH.current = bottomH;
  };
  useEffect(() => {
    if (!isDraggingRow) return;
    const move = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY;
      setBottomH(Math.max(80, Math.min(520, dragStartH.current + delta)));
    };
    const up = () => setIsDraggingRow(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDraggingRow]);

  // Drag to resize left/right columns (horizontal)
  const onColDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCol(true);
    dragStartX.current = e.clientX;
    dragStartW.current = leftW;
  };
  useEffect(() => {
    if (!isDraggingCol) return;
    const move = (e: MouseEvent) => {
      const containerW = containerRef.current?.offsetWidth || 1200;
      const newW = dragStartW.current + (e.clientX - dragStartX.current);
      setLeftW(Math.max(200, Math.min(containerW * 0.65, newW)));
    };
    const up = () => setIsDraggingCol(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDraggingCol]);

  // Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, customInput]);

  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setOutput(''); setError(''); setRunResult(null); setVerdict(null);
    setActiveTab('OUTPUT');
    try {
      const res = await runCode(code, lang, customInput);
      setRunResult({ status: res.status, time: res.time, memory: res.memory });
      if (res.stderr || res.error) {
        setError(res.stderr || res.error || '');
        setActiveTab('ERROR');
      } else {
        setOutput(res.stdout || '(no output)');
        setActiveTab('OUTPUT');
      }
    } catch (e) {
      setError(String(e));
      setActiveTab('ERROR');
    } finally {
      setIsRunning(false);
    }
  }, [code, lang, customInput, isRunning]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !code.trim()) return;
    setIsSubmitting(true);
    setOutput(''); setError(''); setVerdict(null);

    try {
      // Run against all test cases
      let allPassed = true;
      const results = [];
      for (const tc of testCases) {
        const res = await runCode(code, lang, tc.input);
        const actual = (res.stdout || '').trim();
        const expected = tc.expected.trim();
        const passed = actual === expected;
        if (!passed) allPassed = false;
        results.push({ id: tc.id, input: tc.input, expected, actual, passed, runtimeMs: res.time ? Math.round(parseFloat(res.time) * 1000) : 0 });
      }

      setVerdict(allPassed ? 'AC' : 'WA');
      setOutput(results.map((r, i) => `Case ${i + 1}: ${r.passed ? '✓ PASSED' : '✗ FAILED'}\n  Input:    ${r.input}\n  Expected: ${r.expected}\n  Got:      ${r.actual}`).join('\n\n') || 'No test cases to run');
      setActiveTab('OUTPUT');

      // AI Review
      const reviewRes = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: lang, problem, testResults: results }),
      });
      const reviewData = await reviewRes.json();
      setReview(reviewData);
      onSubmit?.(code, lang, reviewData);
    } catch (e) {
      setError(String(e));
      setActiveTab('ERROR');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, lang, testCases, problem, isSubmitting, onSubmit]);

  const currentLang = LANGS.find(l => l.id === lang) || LANGS[0];
  const diffColor = DIFF_COLOR[difficulty] || '#ffc01e';

  return (
    <div style={S.root}>
      {/* ══ TOP NAV ══════════════════════════════════════════════ */}
      <div style={S.topNav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={S.problemTitle}>{problem.split('\n')[0].slice(0, 40) || 'Coding Challenge'}</span>
          <span style={{ ...S.diffBadge, color: diffColor, borderColor: diffColor + '40', background: diffColor + '15' }}>{difficulty}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {verdict && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: verdict === 'AC' ? 'rgba(0,184,163,0.15)' : 'rgba(255,55,95,0.15)', color: verdict === 'AC' ? '#00b8a3' : '#ff375f', border: `1px solid ${verdict === 'AC' ? '#00b8a330' : '#ff375f30'}` }}>
              {verdict === 'AC' ? 'Accepted' : verdict === 'WA' ? 'Wrong Answer' : verdict}
            </span>
          )}
          <button onClick={handleRun} disabled={isRunning} style={S.runBtn}>
            {isRunning ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Play size={13} />}
            Run
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} style={S.submitBtn}>
            {isSubmitting ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={13} />}
            Submit
          </button>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════ */}
      <div ref={containerRef} style={S.body}>

        {/* ─── LEFT: Question Panel ─── */}
        <div style={{ ...S.leftPanel, width: leftW }}>
          {/* Question header */}
          <div style={S.qHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3' }}>
                {problem.split('\n')[0] || 'Problem Statement'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ ...S.diffBadge, color: diffColor, borderColor: diffColor + '40', background: diffColor + '15' }}>{difficulty}</span>
              {tags.map(t => <span key={t} style={S.tag}>{t}</span>)}
            </div>
          </div>

          {/* Scrollable body */}
          <div style={S.qBody}>
            {/* Problem text */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: '#8b949e', whiteSpace: 'pre-wrap' }}>
                {problem}
              </p>
            </div>

            {/* Examples */}
            {testCases.slice(0, 2).map((tc, i) => (
              <div key={tc.id} style={S.exampleBox}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#58a6ff', marginBottom: 10 }}>Example {i + 1}</div>
                <div style={{ fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: 12, lineHeight: 2 }}>
                  <div><span style={{ color: '#6e7681' }}>Input:    </span><span style={{ color: '#e6edf3' }}>{tc.input}</span></div>
                  <div><span style={{ color: '#6e7681' }}>Output:   </span><span style={{ color: '#00b8a3' }}>{tc.expected}</span></div>
                  {tc.description && <div style={{ marginTop: 6, color: '#6e7681', fontSize: 11 }}>{tc.description}</div>}
                </div>
              </div>
            ))}

            {/* AI Review (after submit) */}
            {review && (
              <div style={{ marginTop: 20, padding: 14, background: '#0d1117', borderRadius: 10, border: '1px solid #21262d' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#58a6ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>AI Review — Gemini</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: review.verdict === 'Accepted' ? '#00b8a3' : '#ff375f' }}>{review.verdict}</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#58a6ff' }}>{review.score}<span style={{ fontSize: 11, color: '#6e7681' }}>/100</span></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['Time', review.timeComplexity], ['Space', review.spaceComplexity]].map(([l, v]) => (
                    <div key={l} style={{ padding: '8px 10px', background: '#161b22', borderRadius: 8, border: '1px solid #21262d' }}>
                      <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase' }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: '#8b949e', marginBottom: 10 }}>{review.interviewFeedback}</p>
                {review.improvements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#ffc01e', marginBottom: 6 }}>To Improve</div>
                    {review.improvements.slice(0, 2).map((imp, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#8b949e', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid #ffc01e40' }}>{imp}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── COLUMN DRAG DIVIDER ─── */}
        <div
          onMouseDown={onColDragStart}
          title="Drag to resize"
          style={{
            width: 6, flexShrink: 0, cursor: 'col-resize', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 10,
            transition: isDraggingCol ? 'none' : 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(88,166,255,0.15)')}
          onMouseLeave={e => { if (!isDraggingCol) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ width: 2, height: '100%', background: isDraggingCol ? '#58a6ff' : '#21262d', transition: 'background 0.15s' }} />
          {/* Grab handle dots */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: isDraggingCol ? '#58a6ff' : '#484f58' }} />)}
          </div>
        </div>

        {/* ─── RIGHT: Editor + Bottom ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Editor top bar */}
          <div style={S.editorTopBar}>
            {/* Language selector */}
            <div ref={langMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLangMenu(p => !p)}
                style={S.langBtn}
              >
                {currentLang.label}
                <ChevronDown size={12} />
              </button>
              {showLangMenu && (
                <div style={S.langMenu}>
                  {LANGS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setLang(l.id); setShowLangMenu(false); }}
                      style={{ ...S.langOption, background: lang === l.id ? '#1f2937' : 'transparent', color: lang === l.id ? '#58a6ff' : '#8b949e' }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setCode(STARTERS[lang] || '')} title="Reset" style={S.iconBtn}><RotateCcw size={13} /></button>
              <button onClick={() => setFullEditor(p => !p)} title="Toggle fullscreen" style={S.iconBtn}>
                {fullEditor ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={currentLang.monaco}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              onMount={editor => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                padding: { top: 20, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                tabSize: 4,
                quickSuggestions: { other: true, comments: false, strings: false },
                suggestOnTriggerCharacters: true,
                formatOnType: false,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                lineDecorationsWidth: 8,
                glyphMargin: false,
              }}
            />
          </div>

          {/* ── Bottom I/O Panel ── */}
          {!fullEditor && (
            <div style={{ height: bottomH, flexShrink: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid #21262d' }}>
              {/* Drag handle */}
              <div
                onMouseDown={onRowDragStart}
                style={{ height: 6, cursor: 'ns-resize', background: 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ width: 36, height: 3, borderRadius: 2, background: '#30363d' }} />
              </div>

              {/* Tabs */}
              <div style={S.ioTabBar}>
                {(['INPUT', 'OUTPUT', 'ERROR'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ ...S.ioTab, borderBottom: `2px solid ${activeTab === tab ? '#58a6ff' : 'transparent'}`, color: activeTab === tab ? '#e6edf3' : '#6e7681' }}
                  >
                    {tab === 'ERROR' && error && <AlertCircle size={11} style={{ color: '#ff375f', marginRight: 4 }} />}
                    {tab === 'OUTPUT' && runResult && !error && (
                      runResult.status === 'Accepted' || output
                        ? <CheckCircle2 size={11} style={{ color: '#00b8a3', marginRight: 4 }} />
                        : <XCircle size={11} style={{ color: '#ff375f', marginRight: 4 }} />
                    )}
                    {tab}
                  </button>
                ))}
                {runResult && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, paddingRight: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#6e7681' }}>Time: <span style={{ color: '#8b949e', fontFamily: 'JetBrains Mono, monospace' }}>{runResult.time ? `${Math.round(parseFloat(runResult.time) * 1000)}ms` : '--'}</span></span>
                    <span style={{ fontSize: 10, color: '#6e7681' }}>Memory: <span style={{ color: '#8b949e', fontFamily: 'JetBrains Mono, monospace' }}>{runResult.memory || '--'}</span></span>
                  </div>
                )}
              </div>

              {/* Panel body */}
              <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', background: '#0d1117' }}>
                {activeTab === 'INPUT' && (
                  <textarea
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    placeholder="Enter input here..."
                    spellCheck={false}
                    style={S.ioTextarea}
                  />
                )}
                {activeTab === 'OUTPUT' && (
                  <pre style={S.ioOutput}>
                    {output || <span style={{ color: '#4d565e' }}>// Run your code to see output</span>}
                  </pre>
                )}
                {activeTab === 'ERROR' && (
                  <pre style={{ ...S.ioOutput, color: '#ff7b7b' }}>
                    {error || <span style={{ color: '#4d565e' }}>// No errors</span>}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
        body { ${isDraggingCol ? 'cursor: col-resize !important; user-select: none;' : ''} ${isDraggingRow ? 'cursor: ns-resize !important; user-select: none;' : ''} }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#010409', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
    color: '#e6edf3', overflow: 'hidden',
  },
  topNav: {
    height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', borderBottom: '1px solid #21262d', background: '#0d1117', flexShrink: 0,
  },
  problemTitle: { fontSize: 13, fontWeight: 600, color: '#e6edf3', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  diffBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, border: '1px solid', letterSpacing: '0.3px' },
  tag: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.2)', color: '#58a6ff' },
  runBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
    borderRadius: 6, border: '1px solid #30363d', background: '#21262d',
    color: '#e6edf3', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
    borderRadius: 6, border: 'none', background: '#238636',
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  body: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' },
  leftPanel: {
    flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #21262d', background: '#0d1117', overflow: 'hidden',
  },
  qHeader: { padding: '16px 18px', borderBottom: '1px solid #21262d', flexShrink: 0 },
  qBody: { flex: 1, overflowY: 'auto', padding: '16px 18px' },
  exampleBox: {
    marginBottom: 14, padding: '12px 14px', background: '#161b22',
    borderRadius: 8, border: '1px solid #21262d',
  },
  colResizer: { width: 4, background: '#21262d', cursor: 'col-resize', flexShrink: 0 },
  editorTopBar: {
    height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 12px', borderBottom: '1px solid #21262d', background: '#0d1117', flexShrink: 0,
  },
  langBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 6, border: '1px solid #30363d',
    background: '#161b22', color: '#8b949e', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  langMenu: {
    position: 'absolute', top: 36, left: 0, width: 220,
    background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 200, overflow: 'hidden',
  },
  langOption: {
    display: 'block', width: '100%', padding: '9px 14px',
    border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid #30363d',
    background: '#161b22', color: '#6e7681', cursor: 'pointer',
  },
  ioTabBar: {
    display: 'flex', alignItems: 'center', borderBottom: '1px solid #21262d',
    background: '#0d1117', flexShrink: 0, height: 36,
  },
  ioTab: {
    display: 'flex', alignItems: 'center',
    padding: '0 14px', height: '100%', fontSize: 11, fontWeight: 700,
    border: 'none', background: 'transparent', cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  ioTextarea: {
    width: '100%', height: '100%', minHeight: 80, background: 'transparent',
    border: 'none', outline: 'none', resize: 'none',
    color: '#e6edf3', fontSize: 13, fontFamily: '"JetBrains Mono", Consolas, monospace',
    lineHeight: 1.7,
  },
  ioOutput: {
    margin: 0, padding: 0, background: 'transparent',
    color: '#e6edf3', fontSize: 13, fontFamily: '"JetBrains Mono", Consolas, monospace',
    lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
};
