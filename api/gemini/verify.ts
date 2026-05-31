import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { geminiApiKey } = req.body;
  if (!geminiApiKey) return res.status(400).json({ success: false, message: 'Chave obrigatória.' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ok' }] }] })
      }
    );
    if (!r.ok) {
      const err = await r.json();
      return res.status(400).json({ success: false, message: err.error?.message || 'Chave inválida.' });
    }
    return res.json({ success: true, message: 'Conexão bem-sucedida!' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
