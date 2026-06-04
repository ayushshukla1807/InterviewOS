import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRoleById } from '../../../lib/ai/roles';
import { buildQuestionGenPrompt } from '../../../lib/ai/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Simulation-Aware Question Generator ─────────────────────────────────────
// Generates 4 targeted job-skill questions that reference the candidate's
// actual simulation choices: ignored emails, escalations, crisis recovery, etc.
function buildSimulationAwarePrompt(params: {
  jobTitle: string;
  jobDescription?: string;
  candidateName?: string;
  resumeText?: string;
  simulationSummary?: string;
}): { system: string; user: string } {
  const { jobTitle, jobDescription, candidateName, resumeText, simulationSummary } = params;

  const system = `You are the InterviewOS Technical Question Intelligence Engine.

Your task: Generate exactly 4 job-skill interview questions for the candidate based on their job description, resume, AND their workplace simulation performance data.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown fences, no extra text.
2. The "questions" array must contain exactly 4 objects.
3. Every question MUST be scenario-based — no pure theory MCQs.
4. If a simulation summary is provided, weave specific simulation events into at least 2 questions (e.g., reference an ignored email, a crisis they mishandled, a stakeholder they neglected).
5. Vary difficulty: at least 1 "Hard" and 1 "Medium" question.
6. Include trap options that catch guessing and social desirability bias.

OUTPUT FORMAT (strict):
{
  "questions": [
    {
      "id": "Q-1",
      "title": "<Short skill-focused title>",
      "prompt": "<Scenario-based question — may reference simulation events>",
      "options": ["A. <option>", "B. <option>", "C. <option>", "D. <option>"],
      "answer": "A",
      "difficulty": "Hard",
      "skillTag": "<Specific skill or competency being tested>",
      "trapLogic": "<Why the wrong options are tempting to a weak candidate>",
      "pressureSimulation": true,
      "followUpTrigger": "<What to probe if the candidate picks this correctly or incorrectly>"
    }
  ]
}`;

  const user = `CANDIDATE NAME: ${candidateName || 'Candidate'}
JOB TITLE: ${jobTitle || 'Software Engineer'}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
${resumeText ? `CANDIDATE RESUME:\n${resumeText}\n` : ''}
${simulationSummary ? `WORKPLACE SIMULATION PERFORMANCE (use this to personalize questions):\n${simulationSummary}\n` : ''}

Generate 4 deep-dive technical and behavioral questions for this candidate. If simulation data is present, reference specific decisions they made in the simulation in at least 2 questions.`;

  return { system, user };
}

export async function POST(req: Request) {
  try {
    const {
      jobTitle,
      jobDescription,
      candidateName,
      resumeText,
      roleId,
      simulationSummary,
    } = await req.json();

    let systemPrompt: string;
    let userPrompt: string;

    const role = roleId ? getRoleById(roleId) : null;

    if (role) {
      // Role-specific question generation (tryout / role-select flow)
      systemPrompt = buildQuestionGenPrompt(role, {
        name: candidateName || 'Candidate',
        resumeText,
        jobDescription,
        jobTitle: jobTitle || role.title,
      });
      userPrompt = `Generate 4 deep-dive questions for this candidate targeting the ${role.title} role.`;
    } else {
      // DYNAMIC / simulation-aware flow — JD + Resume + Simulation Summary
      const { system, user } = buildSimulationAwarePrompt({
        jobTitle: jobTitle || 'Software Engineer',
        jobDescription,
        candidateName,
        resumeText,
        simulationSummary,
      });
      systemPrompt = system;
      userPrompt = user;
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
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanRaw);

    // Ensure questions array always exists to prevent frontend crash
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return NextResponse.json({ questions: [] });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[generate-questions]', err);
    return NextResponse.json({ questions: [] }, { status: 500 });
  }
}

