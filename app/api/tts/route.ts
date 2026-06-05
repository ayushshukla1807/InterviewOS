import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── TTS route upgraded with personality-matched voice selection ──────────────
// personality → Azure Neural Voice mapping

const PERSONALITY_VOICE_MAP: Record<string, string> = {
  overbearing_executive:  'en-US-DavisNeural',       // authoritative male
  micromanager:           'en-US-ChristopherNeural',  // precise, clipped
  passive_aggressive:     'en-US-JennyNeural',        // calm but terse
  credit_stealer:         'en-US-GuyNeural',          // smooth, confident
  lazy_contributor:       'en-US-TonyNeural',         // relaxed, slow
  difficult_client:       'en-US-AriaNeural',         // professional, firm
  political_manager:      'en-US-AndrewMultilingualNeural', // polished
  supportive_colleague:   'en-US-AvaMultilingualNeural',    // warm, friendly
};

// Rate/pitch/style per personality for SSML expressiveness
const PERSONALITY_SSML: Record<string, { rate: string; pitch: string; style?: string }> = {
  overbearing_executive:  { rate: '105%', pitch: '-2st',  style: 'authoritative' },
  micromanager:           { rate: '110%', pitch: '-1st',  style: 'serious' },
  passive_aggressive:     { rate: '95%',  pitch: '+0st',  style: 'disgruntled' },
  credit_stealer:         { rate: '100%', pitch: '+0st',  style: 'friendly' },
  lazy_contributor:       { rate: '88%',  pitch: '-1st',  style: 'cheerful' },
  difficult_client:       { rate: '108%', pitch: '+1st',  style: 'angry' },
  political_manager:      { rate: '98%',  pitch: '+0st',  style: 'hopeful' },
  supportive_colleague:   { rate: '95%',  pitch: '+1st',  style: 'excited' },
};

export async function POST(req: Request) {
  try {
    const {
      text,
      personality,
      voice = 'alloy',
      eventType,
    }: {
      text: string;
      personality?: string;
      voice?: string;
      eventType?: string;
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!apiKey || !region) {
      console.error('Missing Azure Speech API Key or Region');
      return NextResponse.json({ error: 'TTS Configuration Error' }, { status: 500 });
    }

    // Pick voice based on personality if provided
    const azureVoiceName = personality
      ? PERSONALITY_VOICE_MAP[personality] ?? 'en-US-JennyNeural'
      : voice === 'nova' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';

    const ssmlConfig = personality ? PERSONALITY_SSML[personality] : null;

    const safeText = text
      .slice(0, 500) // cap at 500 chars for TTS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Build SSML — add style/prosody for personality expressiveness if supported
    let speechContent = safeText;
    if (ssmlConfig?.style && azureVoiceName.includes('Neural') && !azureVoiceName.includes('Multilingual')) {
      speechContent = `<mstts:express-as style="${ssmlConfig.style}" styledegree="1.2">${safeText}</mstts:express-as>`;
    }

    const ssml = `<speak version='1.0' xml:lang='en-US' xmlns:mstts='http://www.w3.org/2001/mstts'>
  <voice xml:lang='en-US' name='${azureVoiceName}'>
    <prosody rate='${ssmlConfig?.rate ?? '100%'}' pitch='${ssmlConfig?.pitch ?? '+0st'}'>
      ${speechContent}
    </prosody>
  </voice>
</speak>`;

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'InterviewOS-HYRTE-TTS',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure TTS Error:', response.status, errorText);
      throw new Error(`Azure TTS failed: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, max-age=0',
        'X-Voice-Used': azureVoiceName,
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
