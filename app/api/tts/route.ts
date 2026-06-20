import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── TTS Route — Cartesia AI (Primary) + ElevenLabs (Fallback) ───────────────
// Cartesia: ~80ms latency, ~5x cheaper than ElevenLabs, production-grade
// Model: sonic-2 (stable, broadly supported)
// ElevenLabs: fallback if Cartesia fails or key missing

// personality → Cartesia voice ID mapping
// Voices selected from Cartesia's public voice library for personality-matched audio
const CARTESIA_PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'a0e99841-438c-4a64-b679-ae501e7d6091', // Strong authoritative male
  micromanager:           '97f4b8fb-f2fe-444b-bb9a-c109783a857a', // Controlled, precise tone
  passive_aggressive:     '5c42302c-194b-4d0c-ba1a-8cb485c84ab9', // Neutral-cold female
  credit_stealer:         'bf991597-6c13-47e4-8411-91ec2de5c466', // Smooth, polished
  lazy_contributor:       'd46abd1d-2d02-43e8-819f-51fb652c1c61', // Laid-back male
  difficult_client:       'daf747c6-6bc5-4ede-8f8e-0de7df2a9ecf', // Impatient, firm
  political_manager:      'c45bc1d3-47a4-4bf8-a2a3-f8e1d6547ab9', // Strategic, evasive
  supportive_colleague:   '41534e16-2966-4c6b-9670-111411def906', // Warm, friendly
};

// Default Cartesia voice (neutral professional)
const CARTESIA_DEFAULT_VOICE = 'a0e99841-438c-4a64-b679-ae501e7d6091';

// ElevenLabs fallback map (if Cartesia unavailable)
const ELEVEN_PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'pNInz6obpgDQGcFmaJgB',
  micromanager:           'XrExE9yKIg1WjnnlVkGX',
  passive_aggressive:     'SAz9YHcvj6GT2YYXdXww',
  credit_stealer:         'cjVigY5qzO86Huf0OWal',
  lazy_contributor:       'bIHbv24MWmeRgasZH58o',
  difficult_client:       'hpp4J3VqNfWAUOO0d1Us',
  political_manager:      'cjVigY5qzO86Huf0OWal',
  supportive_colleague:   'EXAVITQu4vr4xnSDxMaL',
};

// Azure TTS fallback map
const AZURE_PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'en-US-ChristopherNeural',
  micromanager:           'en-US-GuyNeural',
  passive_aggressive:     'en-US-AriaNeural',
  credit_stealer:         'en-US-JennyNeural',
  lazy_contributor:       'en-US-EricNeural',
  difficult_client:       'en-US-GuyNeural',
  political_manager:      'en-US-ChristopherNeural',
  supportive_colleague:   'en-US-SaraNeural',
};

// ─── Cartesia TTS (Primary) ───────────────────────────────────────────────────
async function generateCartesiaTTS(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const response = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Cartesia-Version': '2024-06-10',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: 'sonic-2',
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId,
      },
      output_format: {
        container: 'mp3',
        bit_rate: 128000,
        sample_rate: 44100,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cartesia TTS failed (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

// ─── ElevenLabs TTS (Fallback) ────────────────────────────────────────────────
async function generateElevenLabsTTS(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        speed: 1.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

// ─── Azure TTS (Fallback 1) ───────────────────────────────────────────────────
async function generateAzureTTS(
  text: string,
  voiceName: string,
  apiKey: string,
  region: string
): Promise<ArrayBuffer> {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${voiceName}'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</voice></speak>`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'InterviewOS',
    },
    body: ssml,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure TTS failed (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const {
      text,
      personality,
      voice,
      interviewerName,
    }: {
      text: string;
      personality?: string;
      voice?: string;
      interviewerName?: string;
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Cap text at 400 chars for TTS latency (Cartesia is fast but let's keep it tight)
    const safeText = text.slice(0, 400);

    const cartesiaKey = process.env.CARTESIA_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION;
    
    // Map specific interviewer names to unique Cartesia voices
    const CARTESIA_NAME_MAP: Record<string, string> = {
      'Syed': 'a0e99841-438c-4a64-b679-ae501e7d6091', // Professional Male
      'Zara': '5c42302c-194b-4d0c-ba1a-8cb485c84ab9', // Professional Female
      'Ava': '41534e16-2966-4c6b-9670-111411def906',  // Warm Female
      'Sathvik': 'd46abd1d-2d02-43e8-819f-51fb652c1c61', // Calm Male
      'Zoe': 'bf991597-6c13-47e4-8411-91ec2de5c466',   // Bright Female
    };

    // ElevenLabs Name Map
    const ELEVEN_NAME_MAP: Record<string, string> = {
      'Syed': 'pNInz6obpgDQGcFmaJgB',
      'Zara': 'SAz9YHcvj6GT2YYXdXww',
      'Ava': 'EXAVITQu4vr4xnSDxMaL',
      'Sathvik': 'bIHbv24MWmeRgasZH58o',
      'Zoe': 'cjVigY5qzO86Huf0OWal',
    };

    // Azure Name Map
    const AZURE_NAME_MAP: Record<string, string> = {
      'Syed': 'en-US-GuyNeural',
      'Zara': 'en-US-AriaNeural',
      'Ava': 'en-US-SaraNeural',
      'Sathvik': 'en-IN-PrabhatNeural',
      'Zoe': 'en-US-JaneNeural',
    };

    // ── Attempt Cartesia first ────────────────────────────────────────────────
    if (cartesiaKey) {
      try {
        let cartesiaVoiceId = CARTESIA_DEFAULT_VOICE;
        if (personality && CARTESIA_PERSONALITY_VOICE_MAP[personality]) {
          cartesiaVoiceId = CARTESIA_PERSONALITY_VOICE_MAP[personality];
        } else if (interviewerName && CARTESIA_NAME_MAP[interviewerName]) {
          cartesiaVoiceId = CARTESIA_NAME_MAP[interviewerName];
        } else if (voice === 'nova') {
          cartesiaVoiceId = '41534e16-2966-4c6b-9670-111411def906'; // fallback female
        }

        const audioBuffer = await generateCartesiaTTS(safeText, cartesiaVoiceId, cartesiaKey);

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-store, max-age=0',
            'X-TTS-Provider': 'cartesia',
            'X-Voice-Used': cartesiaVoiceId,
          },
        });
      } catch (cartesiaErr: unknown) {
        const msg = cartesiaErr instanceof Error ? cartesiaErr.message : 'Cartesia error';
        console.warn('Cartesia TTS failed, falling back:', msg);
        // Fall through to Azure/ElevenLabs
      }
    }

    // ── Azure TTS Fallback ────────────────────────────────────────────────────
    if (azureKey && azureRegion) {
      try {
        let azureVoiceId = voice === 'alloy' ? 'en-US-GuyNeural' : 'en-US-AriaNeural';
        if (personality && AZURE_PERSONALITY_VOICE_MAP[personality]) {
          azureVoiceId = AZURE_PERSONALITY_VOICE_MAP[personality];
        } else if (interviewerName && AZURE_NAME_MAP[interviewerName]) {
          azureVoiceId = AZURE_NAME_MAP[interviewerName];
        } else if (voice === 'nova') {
          azureVoiceId = 'en-US-SaraNeural';
        }

        const audioBuffer = await generateAzureTTS(safeText, azureVoiceId, azureKey, azureRegion);

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-store, max-age=0',
            'X-TTS-Provider': 'azure-fallback',
            'X-Voice-Used': azureVoiceId,
          },
        });
      } catch (azureErr: unknown) {
        const msg = azureErr instanceof Error ? azureErr.message : 'Azure error';
        console.warn('Azure TTS failed, falling back to ElevenLabs:', msg);
        // Fall through to ElevenLabs
      }
    }

    // ── ElevenLabs Fallback ───────────────────────────────────────────────────
    if (!elevenLabsKey) {
      console.error('No TTS API key available (neither CARTESIA_API_KEY nor ELEVENLABS_API_KEY)');
      return NextResponse.json({ error: 'TTS Configuration Error' }, { status: 500 });
    }

    let elevenVoiceId = voice === 'alloy' ? 'cjVigY5qzO86Huf0OWal' : 'hpp4J3VqNfWAUOO0d1Us';
    if (personality && ELEVEN_PERSONALITY_VOICE_MAP[personality]) {
      elevenVoiceId = ELEVEN_PERSONALITY_VOICE_MAP[personality];
    } else if (interviewerName && ELEVEN_NAME_MAP[interviewerName]) {
      elevenVoiceId = ELEVEN_NAME_MAP[interviewerName];
    } else if (voice === 'nova') {
      elevenVoiceId = 'SAz9YHcvj6GT2YYXdXww';
    }

    const audioBuffer = await generateElevenLabsTTS(safeText, elevenVoiceId, elevenLabsKey);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, max-age=0',
        'X-TTS-Provider': 'elevenlabs-fallback',
        'X-Voice-Used': elevenVoiceId,
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown TTS error';
    console.error('TTS Route Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
