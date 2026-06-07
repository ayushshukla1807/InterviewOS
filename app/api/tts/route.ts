import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── TTS route upgraded with ElevenLabs Flash v2.5 ──────────────

// personality → ElevenLabs Voice ID mapping
const PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'pNInz6obpgDQGcFmaJcg', // Adam (Deep, authoritative)
  micromanager:           '29vD33N1CtxCmqQRPOHJ', // Drew (Precise, articulate)
  passive_aggressive:     '21m00Tcm4TlvDq8ikWAM', // Rachel (Calm but terse)
  credit_stealer:         'TxGEqnHWrfWFTfGW9XjX', // Josh (Smooth, confident)
  lazy_contributor:       'yoZ06aMxZJJ28mfd3POQ', // Sam (Relaxed, slow)
  difficult_client:       'EXAVITQu4vr4xnSDxMaL', // Bella (Firm, professional)
  political_manager:      'VR6AewLTigWG4xSOukaG', // (Polished)
  supportive_colleague:   'EXAVITQu4vr4xnSDxMaL', // Bella (Warm, friendly)
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
    let voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    if (personality && PERSONALITY_VOICE_MAP[personality]) {
      voiceId = PERSONALITY_VOICE_MAP[personality];
    } else if (voice === 'alloy') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Default male (Josh)
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

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
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
