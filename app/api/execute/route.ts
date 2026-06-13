import { NextRequest, NextResponse } from 'next/server';

const PAIZA_CREATE_URL = 'https://api.paiza.io/runners/create';
const PAIZA_DETAILS_URL = 'https://api.paiza.io/runners/get_details';

// Map IDE languages to Paiza.io languages
const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python3',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
};

async function submitToPaiza(
  sourceCode: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; status: string; time: string; memory: string }> {
  const paizaLang = LANGUAGE_MAP[language.toLowerCase()];
  
  if (!paizaLang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // 1. Create Runner
  const createRes = await fetch(PAIZA_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: sourceCode,
      language: paizaLang,
      input: stdin || '',
      api_key: 'guest' // Paiza allows 'guest' for free unauthenticated access
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Paiza API failed: ${createRes.status}`);
  }

  const { id, error } = await createRes.json();
  if (error) throw new Error(`Paiza Error: ${error}`);

  // 2. Poll for Result (max 15 seconds)
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    
    const statusRes = await fetch(`${PAIZA_DETAILS_URL}?id=${id}&api_key=guest`);
    if (!statusRes.ok) continue;
    
    const result = await statusRes.json();
    
    if (result.status === 'completed') {
      let finalStatus = 'Accepted';
      if (result.build_result === 'failure' || result.build_result === 'error') finalStatus = 'Compilation Error';
      else if (result.result !== 'success') finalStatus = result.result === 'timeout' ? 'Time Limit Exceeded' : 'Runtime Error';
      
      return {
        stdout: result.stdout || result.build_stdout || '',
        stderr: result.stderr || result.build_stderr || '',
        status: finalStatus,
        time: result.time ? `${result.time}s` : '0s',
        memory: result.memory ? `${Math.round(result.memory / 1024)}KB` : '0KB',
      };
    }
  }

  throw new Error('Execution timeout');
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, stdin = '' } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: 'code and language required' }, { status: 400 });
    }

    // Wrap JS/TS code so it prints output properly for test execution
    let finalCode = code;
    if (language === 'javascript' || language === 'typescript') {
      // If code doesn't have console.log at top level, add basic test runner
      if (!code.includes('console.log(') && code.includes('function solution')) {
        finalCode = code + `\n\ntry {\n  const input = JSON.parse(\`${stdin || 'null'}\`);\n  const result = solution(input);\n  console.log(JSON.stringify(result));\n} catch(e) { console.error(e.message); }`;
      }
    }

    const result = await submitToPaiza(finalCode, language, stdin);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Execution failed';
    return NextResponse.json({ error: msg, stdout: '', stderr: msg, status: 'Error', time: '0', memory: '0KB' }, { status: 200 });
  }
}
