import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, track, system } = await req.json();

    const systemPrompt = system || `You are Ava, a Sentient AI Interviewer for Hyrte Intelligence.
Always respond in JSON: {"content": "your message", "signals": ["signal1"], "adaptation": "action"}
Be concise, professional, and probe technical depth. Detect: hesitation, evasion, weak understanding.
Provide micro-encouragements when candidates struggle. Never hallucinate facts.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const raw = completion.choices[0].message.content || '{}';
    const data = JSON.parse(raw);
    return NextResponse.json({
      content: data.content || "Let's move to the next topic.",
      signals: data.signals || [],
      adaptation: data.adaptation || "Maintaining difficulty."
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ content: "I see. Let's continue — can you elaborate on that approach?", signals: [], adaptation: "Recovery mode" });
  }
}
