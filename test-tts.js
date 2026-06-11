const apiKey = process.env.ELEVENLABS_API_KEY;
const text = "Hello world";
const voiceId = 'cjVigY5qzO86Huf0OWal'; // Eric
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

fetch(url, {
  method: 'POST',
  headers: {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: text,
    model_id: 'eleven_flash_v2_5',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.85,
      speed: 1.0
    }
  }),
})
.then(async res => {
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
  } else {
    console.log('Success!', res.headers.get('content-type'));
  }
})
.catch(err => console.error(err));
