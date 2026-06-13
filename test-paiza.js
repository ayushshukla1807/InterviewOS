async function runCode() {
  const submitRes = await fetch('https://api.paiza.io/runners/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: 'console.log("Hello Paiza");',
      language: 'javascript',
      api_key: 'guest'
    })
  });
  const submitData = await submitRes.json();
  const id = submitData.id;
  
  await new Promise(r => setTimeout(r, 2000));
  
  const statusRes = await fetch(`https://api.paiza.io/runners/get_details?id=${id}&api_key=guest`);
  const statusData = await statusRes.json();
  console.log(statusData);
}
runCode().catch(console.error);
