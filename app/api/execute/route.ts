import { NextRequest, NextResponse } from 'next/server';

// Judge0 CE language IDs
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 93,  // Node.js 12.14.0
  typescript: 94,  // TypeScript 3.7.4
  python: 71,      // Python 3.8.1
  java: 62,        // OpenJDK 13.0.1
  cpp: 54,         // GCC 9.2.0 (C++17)
  go: 60,          // Go 1.13.5
};

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Fallback: use public Judge0 CE instance (no key, rate-limited)
const PUBLIC_JUDGE0 = 'https://api.judge0.com';

function toBase64(str: string) {
  return Buffer.from(str).toString('base64');
}
function fromBase64(str: string) {
  try { return Buffer.from(str, 'base64').toString('utf-8'); } catch { return str; }
}

async function submitToJudge0(
  sourceCode: string,
  languageId: number,
  stdin: string,
  useRapidAPI: boolean
): Promise<{ stdout: string; stderr: string; status: string; time: string; memory: string }> {
  const base = useRapidAPI ? JUDGE0_URL : PUBLIC_JUDGE0;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (useRapidAPI && RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  // Submit
  const submitRes = await fetch(`${base}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: toBase64(sourceCode),
      language_id: languageId,
      stdin: toBase64(stdin),
    }),
  });

  if (!submitRes.ok) throw new Error(`Judge0 submit failed: ${submitRes.status}`);
  const { token } = await submitRes.json();

  // Poll for result (max 8s)
  for (let i = 0; i < 16; i++) {
    await new Promise(r => setTimeout(r, 500));
    const resultRes = await fetch(
      `${base}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,time,memory`,
      { headers }
    );
    if (!resultRes.ok) continue;
    const result = await resultRes.json();

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=TLE, 6=CE, etc.
    if (result.status?.id <= 2) continue; // still running

    return {
      stdout: result.stdout ? fromBase64(result.stdout) : '',
      stderr: result.stderr ? fromBase64(result.stderr) : '',
      status: result.status?.description || 'Unknown',
      time: result.time || '0',
      memory: result.memory ? `${Math.round(result.memory / 1024)}KB` : '0KB',
    };
  }
  throw new Error('Execution timeout');
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, stdin = '' } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: 'code and language required' }, { status: 400 });
    }

    const langId = LANGUAGE_IDS[language.toLowerCase()];
    if (!langId) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // Wrap JS/TS code so it prints output properly for test execution
    let finalCode = code;
    if (language === 'javascript' || language === 'typescript') {
      // If code doesn't have console.log at top level, add basic test runner
      if (!code.includes('console.log(') && code.includes('function solution')) {
        finalCode = code + `\n\ntry {\n  const input = JSON.parse(\`${stdin || 'null'}\`);\n  const result = solution(input);\n  console.log(JSON.stringify(result));\n} catch(e) { console.error(e.message); }`;
      }
    }

    // Try RapidAPI first if key available, else public instance
    const useRapidAPI = Boolean(RAPIDAPI_KEY);
    const result = await submitToJudge0(finalCode, langId, stdin, useRapidAPI);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Execution failed';
    return NextResponse.json({ error: msg, stdout: '', stderr: msg, status: 'Error', time: '0', memory: '0KB' }, { status: 200 });
  }
}
