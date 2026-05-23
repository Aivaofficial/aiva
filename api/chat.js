module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const message = req.body?.message || 'hello';
    const history = req.body?.history || [];
    const key = process.env.GROQ_API_KEY;

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are Afghan AI. Answer ANY question. Reply in the same language the user writes in.' },
          ...history.slice(-6),
          { role: 'user', content: message }
        ],
        max_tokens: 500
      })
    });

    const d = await r.json();
    const reply = d?.choices?.[0]?.message?.content;
    res.status(200).json({ reply: reply || null });
  } catch(e) {
    res.status(200).json({ reply: null });
  }
};
