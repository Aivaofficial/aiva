const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ reply: 'NO KEY' });

  try {
    // Parse body manually since Vercel doesn't always auto-parse
    let bodyData = req.body;
    if (typeof bodyData === 'string') bodyData = JSON.parse(bodyData);
    if (!bodyData) {
      const rawBody = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
      bodyData = JSON.parse(rawBody || '{}');
    }

    const message = bodyData.message || 'hello';
    const history = bodyData.history || [];

    const body = JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are Afghan AI. Answer ANY question on any topic. Reply in the same language the user writes in (Dari, Pashto, Uzbek, or English). Be helpful and accurate.' },
        ...history.slice(-6),
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
      const r = https.request(options, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => resolve({ status: resp.statusCode, body: data }));
      });
      r.on('error', reject);
      r.write(body);
      r.end();
    });

    const data = JSON.parse(response.body);
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(200).json({ reply: 'No reply: ' + response.body.slice(0,100) });
    return res.status(200).json({ reply });
  } catch(e) {
    return res.status(200).json({ reply: 'Error: ' + e.message });
  }
};
