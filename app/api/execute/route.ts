import { NextResponse } from 'next/server';
import vm from 'vm';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Local storage for temporary compilation files (must be within workspace)
const TEMP_DIR = path.join(process.cwd(), 'scratch', 'run_temp');

// Helper to guarantee temp directory exists
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// ─── JavaScript Execution (Real, via Node.js vm module) ─────────────────────
function executeJavaScript(code: string, stdin: string): { stdout: string; stderr: string; success: boolean; runtime_ms: number } {
  const start = Date.now();
  const logs: string[] = [];
  let error = '';

  const sandbox = {
    console: {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
      warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
      info: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
      table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
    },
    __stdin__: stdin,
    Math, JSON, parseInt, parseFloat, isNaN, isFinite,
    Array, Object, String, Number, Boolean, Map, Set, Date, RegExp, Error, TypeError, RangeError, Promise,
    setTimeout: undefined,
    setInterval: undefined,
    fetch: undefined,
    require: undefined,
    process: undefined,
  };

  try {
    const context = vm.createContext(sandbox);
    const wrappedCode = `(function() {\n${code}\n})();`;
    const script = new vm.Script(wrappedCode, { filename: 'solution.js' });
    const result = script.runInContext(context, { timeout: 5000 });

    if (result !== undefined) {
      logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    }
  } catch (err: any) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      error = 'Error: Execution timed out (5 second limit exceeded)';
    } else {
      error = `${err.name || 'Error'}: ${err.message}`;
      if (err.stack) {
        const stackLines = err.stack.split('\n');
        const relevantLine = stackLines.find((l: string) => l.includes('solution.js'));
        if (relevantLine) {
          error += '\n' + relevantLine.trim();
        }
      }
    }
  }

  const runtime_ms = Date.now() - start;
  return {
    stdout: logs.join('\n'),
    stderr: error,
    success: !error,
    runtime_ms,
  };
}

// ─── Local Process Runner with Timeout and Stdin ────────────────────────────
function runLocalProcess(
  cmd: string,
  args: string[],
  stdin: string,
  timeoutMs = 5000
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args);

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.kill('SIGKILL');
        resolve({
          stdout,
          stderr: stderr + `\nError: Execution timed out (${timeoutMs / 1000} second limit exceeded)`,
          success: false,
        });
      }
    }, timeoutMs);

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve({
          stdout,
          stderr,
          success: code === 0,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve({
          stdout,
          stderr: stderr + `\nSystem Error: ${err.message}`,
          success: false,
        });
      }
    });
  });
}

// ─── Native Python Execution ────────────────────────────────────────────────
async function executePython(code: string, stdin: string) {
  ensureTempDir();
  const fileId = Math.random().toString(36).substring(7);
  const filePath = path.join(TEMP_DIR, `run_${fileId}.py`);

  fs.writeFileSync(filePath, code);

  const start = Date.now();
  const res = await runLocalProcess('python3', [filePath], stdin);
  const runtime_ms = Date.now() - start;

  // Cleanup temp file safely
  try { fs.unlinkSync(filePath); } catch {}

  return { ...res, runtime_ms };
}

// ─── Native C++ Execution ───────────────────────────────────────────────────
async function executeCpp(code: string, stdin: string) {
  ensureTempDir();
  const fileId = Math.random().toString(36).substring(7);
  const sourcePath = path.join(TEMP_DIR, `run_${fileId}.cpp`);
  const binPath = path.join(TEMP_DIR, `run_${fileId}.out`);

  fs.writeFileSync(sourcePath, code);

  const start = Date.now();

  // Compile
  const compileRes = await runLocalProcess('g++', ['-O2', '-std=c++17', sourcePath, '-o', binPath], '', 8000);
  if (!compileRes.success) {
    try { fs.unlinkSync(sourcePath); } catch {}
    return {
      stdout: '',
      stderr: `Compilation Error:\n${compileRes.stderr}`,
      success: false,
      runtime_ms: Date.now() - start,
    };
  }

  // Execute binary
  const execRes = await runLocalProcess(binPath, [], stdin);
  const runtime_ms = Date.now() - start;

  // Cleanup files safely
  try { fs.unlinkSync(sourcePath); } catch {}
  try { fs.unlinkSync(binPath); } catch {}

  return { ...execRes, runtime_ms };
}

// ─── Native Java Execution ──────────────────────────────────────────────────
async function executeJava(code: string, stdin: string) {
  ensureTempDir();
  
  // Java requires the class name to match the file name.
  // We parse the code to locate the public class name, defaulting to "Solution".
  let className = 'Solution';
  const match = code.match(/public\s+class\s+(\w+)/);
  if (match && match[1]) {
    className = match[1];
  }

  const runId = Math.random().toString(36).substring(7);
  // We isolate Java compiles by putting them in their own directory
  const javaDir = path.join(TEMP_DIR, `java_${runId}`);
  fs.mkdirSync(javaDir, { recursive: true });

  const sourcePath = path.join(javaDir, `${className}.java`);
  fs.writeFileSync(sourcePath, code);

  const start = Date.now();

  // Compile
  const compileRes = await runLocalProcess('javac', [sourcePath], '', 8000);
  if (!compileRes.success) {
    try { fs.rmSync(javaDir, { recursive: true, force: true }); } catch {}
    return {
      stdout: '',
      stderr: `Compilation Error:\n${compileRes.stderr}`,
      success: false,
      runtime_ms: Date.now() - start,
    };
  }

  // Execute Class
  const execRes = await runLocalProcess('java', ['-cp', javaDir, className], stdin);
  const runtime_ms = Date.now() - start;

  // Cleanup
  try { fs.rmSync(javaDir, { recursive: true, force: true }); } catch {}

  return { ...execRes, runtime_ms };
}

// ─── Native TypeScript Execution (Transpiled) ────────────────────────────────
async function executeTypeScript(code: string, stdin: string) {
  ensureTempDir();
  const fileId = Math.random().toString(36).substring(7);
  const tsPath = path.join(TEMP_DIR, `run_${fileId}.ts`);
  const jsPath = path.join(TEMP_DIR, `run_${fileId}.js`);

  fs.writeFileSync(tsPath, code);

  const start = Date.now();
  // Compile using npx tsc
  const compileRes = await runLocalProcess('npx', ['tsc', tsPath, '--outFile', jsPath, '--target', 'es2020', '--module', 'commonjs', '--noEmitOnError', 'false', '--skipLibCheck', 'true'], '', 10000);
  
  if (!fs.existsSync(jsPath)) {
    try { fs.unlinkSync(tsPath); } catch {}
    return {
      stdout: '',
      stderr: `TypeScript Compilation Error:\n${compileRes.stderr || 'Failed to transpile code. Ensure syntax is correct.'}`,
      success: false,
      runtime_ms: Date.now() - start,
    };
  }

  // Read compiled JS and execute it in VM
  const compiledJs = fs.readFileSync(jsPath, 'utf8');
  const vmRes = executeJavaScript(compiledJs, stdin);
  const runtime_ms = Date.now() - start;

  // Cleanup
  try { fs.unlinkSync(tsPath); } catch {}
  try { fs.unlinkSync(jsPath); } catch {}

  return { ...vmRes, runtime_ms };
}

// ─── Native Rust Execution ───────────────────────────────────────────────────
async function executeRust(code: string, stdin: string) {
  ensureTempDir();
  const fileId = Math.random().toString(36).substring(7);
  const sourcePath = path.join(TEMP_DIR, `run_${fileId}.rs`);
  const binPath = path.join(TEMP_DIR, `run_${fileId}.out`);

  fs.writeFileSync(sourcePath, code);

  const start = Date.now();

  // Compile using rustc
  const rustcPath = '/Users/ayushshukla/.cargo/bin/rustc';
  const compileRes = await runLocalProcess(rustcPath, [sourcePath, '-o', binPath], '', 8000);
  if (!compileRes.success) {
    try { fs.unlinkSync(sourcePath); } catch {}
    return {
      stdout: '',
      stderr: `Rust Compilation Error:\n${compileRes.stderr}`,
      success: false,
      runtime_ms: Date.now() - start,
    };
  }

  // Execute binary
  const execRes = await runLocalProcess(binPath, [], stdin);
  const runtime_ms = Date.now() - start;

  // Cleanup
  try { fs.unlinkSync(sourcePath); } catch {}
  try { fs.unlinkSync(binPath); } catch {}

  return { ...execRes, runtime_ms };
}

// ─── Native Go Execution (Fallback to local warning if binary not present) ────
async function executeGo(code: string, stdin: string) {
  ensureTempDir();
  const fileId = Math.random().toString(36).substring(7);
  const sourcePath = path.join(TEMP_DIR, `run_${fileId}.go`);

  fs.writeFileSync(sourcePath, code);

  const start = Date.now();
  const res = await runLocalProcess('go', ['run', sourcePath], stdin, 6000);
  const runtime_ms = Date.now() - start;

  try { fs.unlinkSync(sourcePath); } catch {}

  // If go is not found, show helpful instructions
  if (res.stderr.includes('spawn go ENOENT') || res.stderr.includes('not found') || res.stderr.includes('go: not found')) {
    return {
      stdout: '',
      stderr: 'Language "Go" is not installed on the local runner. Please install the Go compiler (Golang) on your machine to execute Go code in this sandbox.',
      success: false,
      runtime_ms: 0
    };
  }

  return { ...res, runtime_ms };
}

// ─── Language details ────────────────────────────────────────────────────────
const LANG_DISPLAY: Record<string, string> = {
  javascript: 'JavaScript (Node.js VM)',
  typescript: 'TypeScript (Transpiled Node VM)',
  python: 'Python (Local 3.14)',
  cpp: 'C++ (Local Apple Clang)',
  java: 'Java (Local OpenJDK 22)',
  rust: 'Rust (Local Cargo compiler)',
  go: 'Go (Local compiler)',
};

export async function POST(req: Request) {
  try {
    const { code, language, stdin } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({
        success: false,
        stdout: '',
        stderr: 'No code provided.',
        exit_code: 1,
        runtime_ms: 0,
        language: language || 'javascript',
        version: LANG_DISPLAY[language] || language,
      });
    }

    let result: { stdout: string; stderr: string; success: boolean; runtime_ms: number };

    if (language === 'javascript') {
      result = executeJavaScript(code, stdin || '');
    } else if (language === 'typescript') {
      result = await executeTypeScript(code, stdin || '');
    } else if (language === 'python') {
      result = await executePython(code, stdin || '');
    } else if (language === 'cpp') {
      result = await executeCpp(code, stdin || '');
    } else if (language === 'java') {
      result = await executeJava(code, stdin || '');
    } else if (language === 'rust') {
      result = await executeRust(code, stdin || '');
    } else if (language === 'go') {
      result = await executeGo(code, stdin || '');
    } else {
      return NextResponse.json({
        success: false,
        stdout: '',
        stderr: `Language "${language}" is not supported locally. Supported: JavaScript, TypeScript, Python, C++, Java, Rust, Go.`,
        exit_code: 1,
        runtime_ms: 0,
        language,
        version: language,
      });
    }

    return NextResponse.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.success ? 0 : 1,
      runtime_ms: result.runtime_ms,
      language: language,
      version: LANG_DISPLAY[language] || language,
      engine: 'local-native',
    });

  } catch (err: any) {
    console.error('[/api/execute] error:', err);
    return NextResponse.json({
      success: false,
      stdout: '',
      stderr: err.message || 'Execution failed',
      exit_code: 1,
      runtime_ms: 0,
      language: 'unknown',
      version: '',
      engine: 'error',
    });
  }
}
