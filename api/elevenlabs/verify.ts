import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { elevenLabsApiKey, elevenLabsVoiceId } = req.body;
  if (!elevenLabsApiKey?.trim()) {
    return res.status(400).json({ success: false, message: 'Chave ElevenLabs obrigatória.' });
  }

  try {
    const userRes = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': elevenLabsApiKey.trim() }
    });

    if (!userRes.ok) {
      return res.status(400).json({ success: false, message: 'Chave ElevenLabs inválida ou expirada.' });
    }

    const userData = await userRes.json();
    const tier = userData.subscription?.tier || 'Free';
    const left = Math.max(0, (userData.subscription?.character_limit || 10000) - (userData.subscription?.character_count || 0));
    const subInfo = `Plano: ${tier} (${left.toLocaleString()} caracteres restantes)`;

    if (elevenLabsVoiceId?.trim()) {
      const voiceRes = await fetch(`https://api.elevenlabs.io/v1/voices/${elevenLabsVoiceId.trim()}`, {
        headers: { 'xi-api-key': elevenLabsApiKey.trim() }
      });
      if (!voiceRes.ok) {
        return res.status(400).json({ success: false, message: `Chave válida (${subInfo}), mas Voice ID não encontrado.` });
      }
      const voiceData = await voiceRes.json();
      return res.json({ success: true, message: `Conexão bem-sucedida! (${subInfo}). Voz: "${voiceData.name}".` });
    }

    return res.json({ success: true, message: `Conexão bem-sucedida! (${subInfo}).` });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
