import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const {
      role,
      simulationContext,     // brief summary of what's happened in the simulation
      stakeholderStates,     // current trust/frustration of all stakeholders
      currentChallenge,      // the challenge the candidate is currently in
      question,              // user's question to the assistant
      hintNumber,            // how many hints they've already asked for
    } = await req.json();

    const systemPrompt = `You are a senior colleague helping a ${role} candidate during a workplace simulation.

STRICT RULES:
1. NEVER give the full answer or complete solution.
2. Give only a single directional nudge — one sentence or two at most.
3. If they ask for the answer directly, redirect them to think about it themselves.
4. Your hints should get progressively more specific as hint count increases.
5. Hint #1: Very general directional nudge. Hint #2: Slightly more specific. Hint #3+: Point to a specific framework or consideration.
6. Always maintain the urgency of the simulation — don't break immersion.
7. Sound like a real busy colleague, not a tutor.

Current simulation context: ${simulationContext}
Candidate's current challenge: ${currentChallenge}
This is hint #${hintNumber + 1} they've asked for.

Stakeholder summary:
${Object.entries(stakeholderStates || {}).map(([id, s]: [string, any]) => `- ${s.name}: trust ${s.trust}/100, frustration ${s.frustration}/100`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: question }] }
      ],
    });

    return NextResponse.json({ hint: response.text ?? "Think about what matters most to each stakeholder right now." });

  } catch (err: any) {
    console.error('Simulation Assistant error:', err);
    return NextResponse.json({ hint: "Focus on the highest priority stakeholder first." });
  }
}
