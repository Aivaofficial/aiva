export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { message, history } = req.body;
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are Afghan AI, a helpful assistant. Answer ANY question on any topic. Reply in the same language the user writes in (Dari, Pashto, Uzbek, or English). Never mention sources.' },
          ...(history || []).slice(-8),
          { role: 'user', content: message }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || null;
    return res.status(200).json({ reply });
  } catch(e) {
    return res.status(200).json({ reply: null });
  }
}
