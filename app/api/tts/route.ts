import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!apiKey || !region) {
      console.error('Missing Azure Speech API Key or Region');
      return NextResponse.json({ error: 'TTS Configuration Error' }, { status: 500 });
    }

    // Map existing OpenAI voice names to Azure Neural Voices
    // Female options: en-US-AriaNeural, en-US-JennyNeural, en-US-AvaMultilingualNeural
    // Male options: en-US-GuyNeural, en-US-ChristopherNeural, en-US-AndrewMultilingualNeural
    const azureVoiceName = voice === 'nova' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' name='${azureVoiceName}'>
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </voice>
      </speak>
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'InterviewOS-TTS'
      },
      body: ssml
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
      },
    });

  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
