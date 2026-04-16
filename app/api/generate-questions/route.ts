import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jobTitle, jobDescription, candidateName, resumeText } = await req.json();

    const systemPrompt = `You are a Senior Technical Interviewer preparing to interview a candidate.
Your goal is to generate exactly 3 highly technical, elite-level interview questions that bridge the gap between the Candidate's past experience (Resume) and the company's needs (Job Description).

Do NOT ask generic questions. Ask specific, scenario-based questions that test their actual depth in the technologies mentioned in BOTH their resume and the JD.

OUTPUT JSON FORMAT:
{
  "questions": [
    {
      "id": "DYN-1",
      "title": "<Short Technical Title>",
      "prompt": "<The actual deep-dive question>",
      "difficulty": "Expert",
      "weightage": 30
    }
  ]
}
`;

    const userPrompt = `
JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

CANDIDATE NAME: ${candidateName}
RESUME:
${resumeText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    const raw = response.text || '{}';
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '');
    return NextResponse.json(JSON.parse(cleanRaw));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
