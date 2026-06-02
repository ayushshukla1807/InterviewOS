import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const {
      role,
      companyCultureProfile,
      currentAct,
      stakeholders, // Stakeholders to involve in the ambiguity
    } = await req.json();

    const ambiguityPrompt = `You are the InterviewOS Ambiguity Engine.
Generate an ambiguous workplace situation for a ${role} candidate in a ${companyCultureProfile} culture during Act ${currentAct}.

An ambiguous situation means:
1. Information is missing or contradictory.
2. Two stakeholders want opposite things, OR
3. A critical piece of data is missing, and the candidate must ask for clarification before acting.

Stakeholders available:
${stakeholders.map((s: any) => `- ${s.name} (${s.role}, ${s.personality})`).join('\n')}

Generate 2 simultaneous messages from 2 different stakeholders that contradict each other or create a confusing situation that requires the candidate to investigate.

Return exactly this JSON:
{
  "events": [
    {
      "id": "ambig-\${Date.now()}-1",
      "type": "slack" | "email",
      "fromStakeholderId": "stakeholder id",
      "subject": "email subject if applicable",
      "message": "The message",
      "priority": "HIGH",
      "requiresResponse": true,
      "revealAt": 0,
      "isRead": false,
      "isAnswered": false
    },
    {
      "id": "ambig-\${Date.now()}-2",
      "type": "slack" | "email",
      "fromStakeholderId": "stakeholder id",
      "subject": "email subject if applicable",
      "message": "The contradictory or confusing message",
      "priority": "HIGH",
      "requiresResponse": true,
      "revealAt": 5,
      "isRead": false,
      "isAnswered": false
    }
  ],
  "clarificationCriteria": "What specific question must the candidate ask to resolve this ambiguity?"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: ambiguityPrompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = { events: [], clarificationCriteria: '' };
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Ambiguity Engine API error:', err);
    return NextResponse.json({ events: [], clarificationCriteria: '' });
  }
}
