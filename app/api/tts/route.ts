import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── TTS route upgraded with ElevenLabs Flash v2.5 ──────────────

// personality → ElevenLabs Voice ID mapping
const PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'pNInz6obpgDQGcFmaJgB', // Adam (Dominant, Firm)
  micromanager:           'XrExE9yKIg1WjnnlVkGX', // Matilda (Knowledgeable)
  passive_aggressive:     'SAz9YHcvj6GT2YYXdXww', // River (Relaxed, Neutral)
  credit_stealer:         'cjVigY5qzO86Huf0OWal', // Eric (Smooth)
  lazy_contributor:       'bIHbv24MWmeRgasZH58o', // Will (Relaxed)
  difficult_client:       'hpp4J3VqNfWAUOO0d1Us', // Bella (Firm)
  political_manager:      'cjVigY5qzO86Huf0OWal', // Eric (Polished)
  supportive_colleague:   'EXAVITQu4vr4xnSDxMaL', // Sarah (Warm, friendly)
};

export async function POST(req: Request) {
  try {
    const {
      text,
      personality,
      voice,
    }: {
      text: string;
      personality?: string;
      voice?: string;
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error('Missing ELEVENLABS_API_KEY');
      return NextResponse.json({ error: 'TTS Configuration Error' }, { status: 500 });
    }

    // Pick voice based on personality if provided
    let voiceId = 'hpp4J3VqNfWAUOO0d1Us'; // Default: Bella
    if (personality && PERSONALITY_VOICE_MAP[personality]) {
      voiceId = PERSONALITY_VOICE_MAP[personality];
    } else if (voice === 'alloy') {
      voiceId = 'cjVigY5qzO86Huf0OWal'; // Default male (Eric)
    }

    const safeText = text.slice(0, 500); // cap at 500 chars for TTS

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: safeText,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          speed: 1.0
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS Error:', response.status, errorText);
      throw new Error(`ElevenLabs TTS failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, max-age=0',
        'X-Voice-Used': voiceId,
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
