async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "Hello", voice: "nova" })
    });
    console.log(res.status, res.headers.get('content-type'));
    const buf = await res.arrayBuffer();
    console.log('Bytes:', buf.byteLength);
  } catch (e) {
    console.error(e);
  }
}
run();
