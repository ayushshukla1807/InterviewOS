import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, track, system } = await req.json();

    const systemPrompt = system || `You are Ava, a Sentient AI Interviewer for Hyrte Intelligence.
Always respond in JSON: {"content": "your message", "signals": ["signal1"], "adaptation": "action"}
Be concise, professional, and probe technical depth. Detect: hesitation, evasion, weak understanding.
Provide micro-encouragements when candidates struggle. Never hallucinate facts.`;

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
    return NextResponse.json({ content: "I see. Let's continue — can you elaborate on that approach?", signals: [], adaptation: "Recovery mode" });
  }
}
