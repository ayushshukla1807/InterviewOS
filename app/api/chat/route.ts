import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRoleById } from '../../../lib/ai/roles';
import { buildRoleInterviewPrompt, INTERVIEWER_PERSONA } from '../../../lib/ai/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, track, system, candidateProfile } = await req.json();

    let systemPrompt: string;

    // Build a role-aware system prompt if we have a roleId and candidate profile
    const roleId = candidateProfile?.roleId || track;
    const role = roleId ? getRoleById(roleId) : null;

    if (role && candidateProfile) {
      systemPrompt = buildRoleInterviewPrompt(role, {
        name: candidateProfile.candidateName || candidateProfile.name || 'Candidate',
        projects: candidateProfile.projects,
        experience: candidateProfile.experience,
        certifications: candidateProfile.certifications,
        education: candidateProfile.education,
        skills: candidateProfile.skills,
        resumeText: candidateProfile.resumeText,
      });
    } else if (system) {
      systemPrompt = system;
    } else {
      // Fallback default persona
      systemPrompt = INTERVIEWER_PERSONA;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'aura' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    const raw = response.text || '{}';
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '');
    const data = JSON.parse(cleanRaw);

    return NextResponse.json({
      content: data.content || "Let's move to the next topic.",
      signals: data.signals || [],
      adaptation: data.adaptation || "Maintaining difficulty."
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      content: "I see. Let's continue — can you elaborate on that approach?",
      signals: [],
      adaptation: "Recovery mode"
    });
  }
}
