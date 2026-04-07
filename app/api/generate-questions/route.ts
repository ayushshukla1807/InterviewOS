import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    },
    ...
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    const raw = completion.choices[0].message.content || '{}';
    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
