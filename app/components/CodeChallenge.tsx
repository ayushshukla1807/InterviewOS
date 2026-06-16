'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodeChallengeProps {
  question: string;
  initialCode?: string;
  language?: string;
  onSubmit: (code: string, language: string) => void;
}

export default function CodeChallenge({ question, initialCode = '', language = 'javascript', onSubmit }: CodeChallengeProps) {
  const [code, setCode] = useState(initialCode);
  const [lang, setLang] = useState(language);

  // Sync language selection from parent configurations
  useEffect(() => {
    setLang(language);
  }, [language]);

  // Sync initial code layout when loading new tracks or scenarios
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border-l border-gray-800">
      <div className="p-6 bg-[#111113] border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-sky-400  tracking-tight">Live Coding Challenge</h2>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-[#1a1a1c] border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{question}</p>
      </div>
      
      <div 
        className="flex-1 relative"
        onPaste={(e) => {
          e.preventDefault();
          alert("Warning: Pasting code is strictly prohibited during this proctored assessment.");
        }}
        onCopy={(e) => {
          e.preventDefault();
          alert("Warning: Copying code is disabled.");
        }}
        onCut={(e) => {
          e.preventDefault();
        }}
      >
        <Editor
          height="100%"
          language={lang}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            wordWrap: 'on'
          }}
        />
      </div>
      
      <div className="p-4 bg-[#111113] border-t border-gray-800 flex justify-end">
        <button
          onClick={() => onSubmit(code, lang)}
          className="px-6 py-2 bg-sky-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Submit & Discuss
        </button>
      </div>
    </div>
  );
}
