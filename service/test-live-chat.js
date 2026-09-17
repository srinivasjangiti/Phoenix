async function testLiveEndpoints() {
  console.log('--- Testing GET /health ---');
  const healthRes = await fetch('http://127.0.0.1:7777/health');
  const healthData = await healthRes.json();
  console.log('Health status:', healthRes.status, healthData);

  console.log('\n--- Testing GET /api/v1/readiness ---');
  const readRes = await fetch('http://127.0.0.1:7777/api/v1/readiness');
  const readData = await readRes.json();
  console.log('Overall readiness:', readData.overall);
  console.log('Local AI component:', readData.components?.local_ai);
  console.log('Selected Model component:', readData.components?.selected_model);

  console.log('\n--- Testing POST /api/v1/chat (Production Chat Pipeline) ---');
  const t0 = Date.now();
  const chatRes = await fetch('http://127.0.0.1:7777/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Who are you in 5 words?', source: 'dashboard' })
  });

  const chatData = await chatRes.json();
  const duration = Date.now() - t0;
  console.log(`Chat HTTP Status: ${chatRes.status} in ${duration}ms`);
  console.log('Chat Response:', chatData.response);
  console.log('Served by:', chatData.served_by || chatData._debug?.served_by);
  console.log('Is local:', chatData.is_local ?? chatData._debug?.is_local);
  console.log('Debug info:', {
    served_by: chatData._debug?.served_by,
    is_local: chatData._debug?.is_local,
    ai_latency_ms: chatData._debug?.ai_latency_ms,
    fallback_attempts: chatData._debug?.fallback_attempts
  });
}

testLiveEndpoints().catch(console.error);
