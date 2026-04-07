import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { JD_TRANSLATOR_SYSTEM_PROMPT } from '../../../../lib/ai/test-engine-prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jd } = await req.json();

    if (!jd) {
      return NextResponse.json({ error: 'JD is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Here is the Job Description:\n\n${jd}` }] }],
      config: {
        systemInstruction: JD_TRANSLATOR_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      }
    });

    const raw = response.text || '{}';
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let blueprint;
    try {
      blueprint = JSON.parse(cleanRaw);
    } catch (parseErr) {
      return NextResponse.json({ error: 'Failed to parse AI response into JSON' }, { status: 500 });
    }

    return NextResponse.json({ blueprint });
  } catch (err: any) {
    console.warn("API Error in JD Translation Engine (falling back to mock blueprint):", err.message);
    
    // Fallback blueprint so the UI can still be tested even if the Gemini API is overloaded (503)
    const mockBlueprint = {
      role: "Senior Software Engineer (Simulated)",
      weights: { cognitive: 40, behavioral: 40, communication: 10, integrity: 10 },
      modules: [
        {
          type: "cognitive",
          title: "Technical Aptitude",
          questions: [
            {
              q: "How would you optimize a slow database query causing timeouts in a production microservice?",
              options: ["Add an index", "Rewrite the query", "Scale the DB instances", "Implement a caching layer (Redis)"],
              answer: "Implement a caching layer (Redis)",
              difficulty: "medium"
            }
          ]
        },
        {
          type: "behavioral",
          title: "Workplace Scenario (SJT)",
          questions: [
            {
              scenario: "A critical production deployment fails 10 minutes before an investor demo. Your junior engineer pushed the breaking code. What do you do?",
              options: [
                "Immediately rollback the deployment and inform stakeholders calmly.",
                "Publicly reprimand the junior engineer so investors know it wasn't your fault.",
                "Try to patch the code live on production before the demo starts.",
                "Panic and cancel the demo entirely."
              ],
              idealBehavior: "Rollbacks ensure stability quickly without shifting blame unprofessionally.",
              riskFlag: "Blaming others or panicking indicates low emotional control and poor leadership."
            }
          ]
        }
      ]
    };

    return NextResponse.json({ blueprint: mockBlueprint });
  }
}
