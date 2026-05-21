import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRoleById } from '../../../lib/ai/roles';
import { buildQuestionGenPrompt } from '../../../lib/ai/prompts';
import { JD_TRANSLATOR_SYSTEM_PROMPT } from '../../../lib/ai/test-engine-prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jobTitle, jobDescription, candidateName, resumeText, roleId } = await req.json();

    // Build role-aware or JD-aware prompt
    let systemPrompt: string;
    let userPrompt: string;

    const role = roleId ? getRoleById(roleId) : null;

    if (role) {
      // Role-specific question generation (tryout flow)
      systemPrompt = buildQuestionGenPrompt(role, {
        name: candidateName || 'Candidate',
        resumeText,
        jobDescription,
        jobTitle: jobTitle || role.title,
      });
      userPrompt = `Generate 4 deep-dive questions for this candidate targeting the ${role.title} role.`;
    } else {
      // Legacy / DYNAMIC flow — JD + Resume based
      systemPrompt = JD_TRANSLATOR_SYSTEM_PROMPT;
      userPrompt = `
JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

CANDIDATE NAME: ${candidateName}
RESUME:
${resumeText}
`;
    }

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
