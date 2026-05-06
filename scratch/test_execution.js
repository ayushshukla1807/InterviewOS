// Test script to run the server in a subprocess and test local process code execution
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Next.js development server to test Code Execution...');

const server = spawn('npm', ['run', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false
});

let serverOutput = '';
let started = false;

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  if (!started && (serverOutput.includes('Ready in') || serverOutput.includes('localhost:3000'))) {
    started = true;
    runTests();
  }
});

server.stderr.on('data', (data) => {
  console.error(`Server Stderr: ${data}`);
});

const testCases = [
  {
    name: 'JavaScript - Basic Arithmetic',
    payload: {
      code: 'const a = 12;\nconst b = 30;\nconsole.log("Sum is:", a + b);',
      language: 'javascript',
      stdin: ''
    },
    verify: (res) => {
      return res.success === true && res.stdout.includes('Sum is: 42');
    }
  },
  {
    name: 'Python - Standard Math & Output',
    payload: {
      code: 'import math\nprint(f"PI is: {math.pi:.2f}")',
      language: 'python',
      stdin: ''
    },
    verify: (res) => {
      return res.success === true && res.stdout.includes('PI is: 3.14');
    }
  },
  {
    name: 'Python - Stdin Handling',
    payload: {
      code: 'import sys\nline = sys.stdin.readline().strip()\nprint(f"Python received: {line}")',
      language: 'python',
      stdin: 'Hyrte Engine test'
    },
    verify: (res) => {
      return res.success === true && res.stdout.includes('Python received: Hyrte Engine test');
    }
  },
  {
    name: 'C++ - Native Compiler Run',
    payload: {
      code: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}',
      language: 'cpp',
      stdin: ''
    },
    verify: (res) => {
      return res.success === true && res.stdout.includes('Hello C++!');
    }
  },
  {
    name: 'Java - Native Class Run',
    payload: {
      code: 'import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner s = new Scanner(System.in);\n        if(s.hasNext()) {\n            System.out.println("Java Stdin: " + s.next());\n        }\n    }\n}',
      language: 'java',
      stdin: 'TestingLocalJava'
    },
    verify: (res) => {
      return res.success === true && res.stdout.includes('Java Stdin: TestingLocalJava');
    }
  }
];

async function runTests() {
  console.log('\nServer is ready. Starting tests...\n');
  let passed = 0;

  for (const tc of testCases) {
    console.log(`Running: ${tc.name}...`);
    try {
      const response = await postJson('http://localhost:3000/api/execute', tc.payload);
      const isOk = tc.verify(response);
      if (isOk) {
        console.log(`   Passed. Engine: ${response.engine}, Runtime: ${response.runtime_ms}ms`);
        passed++;
      } else {
        console.error(`   Failed! Output was:`, JSON.stringify(response, null, 2));
      }
    } catch (err) {
      console.error(`   Failed to request API:`, err.message);
    }
  }

  console.log(`\nTests completed: ${passed}/${testCases.length} Passed`);
  
  // Cleanup dev server
  server.kill('SIGINT');
  process.exit(passed === testCases.length ? 0 : 1);
}

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}
