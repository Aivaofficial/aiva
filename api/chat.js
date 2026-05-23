const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ reply: 'NO KEY' });

  try {
    const { message, history } = req.body;
    const body = JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are Afghan AI. Answer ANY question. Reply in the same language the user writes in. Never mention sources.' },
        ...(history || []).slice(-6),
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'Content-Length': Buffer.byteLength(body)
        }
      };
      const req2 = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body: data }));
      });
      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    const data = JSON.parse(response.body);
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(200).json({ reply: 'No reply: ' + response.body.slice(0, 100) });
    return res.status(200).json({ reply });
  } catch(e) {
    return res.status(200).json({ reply: 'Error: ' + e.message });
  }
};
