async function runCode() {
  const submitRes = await fetch('https://api.paiza.io/runners/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: 'const x: number = 5; console.log(x);',
      language: 'typescript',
      api_key: 'guest'
    })
  });
  const submitData = await submitRes.json();
  if (submitData.error) {
    console.log("Error:", submitData.error);
    return;
  }
  await new Promise(r => setTimeout(r, 2000));
  const statusRes = await fetch(`https://api.paiza.io/runners/get_details?id=${submitData.id}&api_key=guest`);
  console.log(await statusRes.json());
}
runCode().catch(console.error);
