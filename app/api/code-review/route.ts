import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { code, language, problem, testResults } = await req.json();

    const passCount = testResults?.filter((t: { passed: boolean }) => t.passed).length ?? 0;
    const totalCount = testResults?.length ?? 0;

    const system = `You are an elite code review engine for technical interviews.
Analyze the candidate's code submission and return ONLY valid JSON — no markdown, no extra text.

OUTPUT FORMAT:
{
  "verdict": "Accepted" | "Wrong Answer" | "Partial" | "Time Limit Exceeded" | "Runtime Error",
  "score": <0-100 integer>,
  "timeComplexity": "<e.g. O(n log n)>",
  "spaceComplexity": "<e.g. O(n)>",
  "isOptimal": true | false,
  "strengths": ["<point>", "<point>"],
  "improvements": ["<point>", "<point>"],
  "interviewFeedback": "<2-3 sentence interviewer-style feedback on approach and communication>",
  "optimalApproach": "<1-2 sentence hint toward the best solution if not already optimal>"
}`;

    const user = `PROBLEM:\n${problem}\n\nLANGUAGE: ${language}\n\nCANDIDATE CODE:\n${code}\n\nTEST RESULTS: ${passCount}/${totalCount} test cases passed.\n\nAnalyze the code and return the JSON review.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: user }] }],
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
      }
    });

    const raw = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error('[code-review]', err);
    return NextResponse.json({
      verdict: 'Runtime Error',
      score: 0,
      timeComplexity: 'Unknown',
      spaceComplexity: 'Unknown',
      isOptimal: false,
      strengths: [],
      improvements: ['Unable to analyze submission at this time.'],
      interviewFeedback: 'Code review unavailable.',
      optimalApproach: ''
    }, { status: 500 });
  }
}
