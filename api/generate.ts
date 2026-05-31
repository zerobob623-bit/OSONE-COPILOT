import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, systemInstruction, clientApiKey, model, responseMimeType } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Chave API do Gemini não definida.' });
  }

  try {
    const selectedModel = model || 'gemini-2.5-flash';

    const contents = typeof prompt === 'string'
      ? [{ role: 'user', parts: [{ text: prompt }] }]
      : prompt;

    const body: any = { contents };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (responseMimeType) {
      body.generationConfig = { responseMimeType };
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: err.error?.message || 'Erro ao gerar conteúdo.' });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ text });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erro interno.' });
  }
}
