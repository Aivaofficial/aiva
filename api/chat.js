module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ reply: 'ERROR: No API key found' });

  try {
    const message = req.body?.message || 'Say hello';
    const history = req.body?.history || [];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are Afghan AI. Answer any question. Reply in the same language as the user.' },
          ...history.slice(-6),
          { role: 'user', content: message }
        ],
        max_tokens: 500
      })
    });

    const text = await groqRes.text();
    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content;
    
    if (reply) return res.status(200).json({ reply });
    return res.status(200).json({ reply: 'Groq said: ' + text.slice(0, 200) });
  } catch(e) {
    return res.status(200).json({ reply: 'Exception: ' + e.message });
  }
};
