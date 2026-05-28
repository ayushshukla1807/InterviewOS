import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert organizational psychologist and behavioral ML model.
Analyze the following interview transcript and extract scores (1-100) for the following soft skills:
- Leadership
- Problem Solving
- Empathy & Communication
- Resilience

Output ONLY a valid JSON object matching this schema exactly (no markdown formatting, just JSON):
{
  "leadership": 85,
  "problemSolving": 90,
  "communication": 88,
  "resilience": 82,
  "analysisSummary": "A brief 2-sentence summary of their behavioral profile."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast model for real-time parallel analysis
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n${transcript}` }
      ],
      temperature: 0.1, // Low temp for consistent scoring
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    if (!result) throw new Error("No analysis returned");

    return NextResponse.json(JSON.parse(result));

  } catch (error: any) {
    console.error('Behavioral ML Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
