import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, model, config, clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Chave API do Gemini não definida.' });
  }

  try {
    const selectedModel = model || 'imagen-3.0-generate-002';
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: config?.numberOfImages || 1,
            aspectRatio: config?.aspectRatio || '1:1',
            outputMimeType: config?.outputMimeType || 'image/jpeg'
          }
        })
      }
    );

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: err.error?.message || 'Erro ao gerar imagem.' });
    }

    const data = await r.json();
    const generatedImages = (data.predictions || []).map((p: any) => ({
      image: { imageBytes: p.bytesBase64Encoded }
    }));

    return res.json({ generatedImages });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erro ao gerar imagem.' });
  }
}
