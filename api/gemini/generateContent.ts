import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { contents, model, config, clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Chave API do Gemini não definida.' });
  }

  try {
    const selectedModel = model || 'gemini-2.5-flash';
    const body: any = { contents };
    if (config) {
      const { tools, toolConfig, systemInstruction, ...rest } = config;
      body.generationConfig = rest;
      if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
      if (tools) body.tools = tools;
      if (toolConfig) body.toolConfig = toolConfig;
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
      return res.status(r.status).json({ error: err.error?.message || 'Erro ao conectar com o Gemini.' });
    }

    const data = await r.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => ({
      name: p.functionCall.name,
      args: p.functionCall.args
    }));

    return res.json({
      text: textPart?.text || '',
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      candidates: data.candidates,
      groundingMetadata: candidate?.groundingMetadata
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erro interno ao processar.' });
  }
}
