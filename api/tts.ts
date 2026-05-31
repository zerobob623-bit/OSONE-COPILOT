import type { VercelRequest, VercelResponse } from '@vercel/node';

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function splitIntoChunks(text: string, maxLength = 700): string[] {
  const chunks: string[] = [];
  let current = '';
  const sentences = text.match(/[^.!?\n\r]+[.!?\n\r]+|[^.!?\n\r]+/g) || [text];
  for (const s of sentences) {
    if ((current + ' ' + s).length <= maxLength) {
      current += (current ? ' ' : '') + s;
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = s.length > maxLength ? s.slice(0, maxLength) : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const {
    text, engine, clientApiKey, voice,
    elevenLabsApiKey, elevenLabsVoiceId,
    elevenLabsStability, elevenLabsSimilarityBoost,
    elevenLabsStyle, elevenLabsSpeakerBoost, elevenLabsModel
  } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: 'Texto obrigatório.' });

  if (engine === 'elevenlabs') {
    const elKey = elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
    if (!elKey) return res.status(400).json({ error: 'Chave ElevenLabs não configurada.' });

    const voiceId = elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const modelId = elevenLabsModel || 'eleven_multilingual_v2';

    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: text.trim(),
        model_id: modelId,
        voice_settings: {
          stability: elevenLabsStability ?? 0.5,
          similarity_boost: elevenLabsSimilarityBoost ?? 0.75,
          style: elevenLabsStyle ?? 0.0,
          use_speaker_boost: elevenLabsSpeakerBoost ?? true
        }
      })
    });

    if (!elRes.ok) {
      const errText = await elRes.text().catch(() => '');
      return res.status(elRes.status).json({ error: `ElevenLabs: ${errText}` });
    }

    const buf = Buffer.from(await elRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Mode', 'elevenlabs');
    return res.send(buf);
  }

  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'Chave Gemini não configurada.' });

  const supportedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
  const selectedVoice = supportedVoices.includes(voice) ? voice : 'Kore';
  const chunks = splitIntoChunks(text.trim(), 700);
  const buffers: Buffer[] = [];
  let usedFallback = false;

  for (const chunk of chunks) {
    let chunkBuffer: Buffer | null = null;

    for (const modelName of ['gemini-2.5-flash-preview-tts', 'gemini-2.0-flash-exp']) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Leia com naturalidade:\n\n${chunk}` }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                }
              }
            })
          }
        );
        if (!r.ok) continue;
        const data = await r.json();
        const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) { chunkBuffer = Buffer.from(b64, 'base64'); break; }
      } catch (_) {}
    }

    if (chunkBuffer) {
      buffers.push(chunkBuffer);
    } else {
      usedFallback = true;
      const smallChunks = chunk.match(/.{1,180}/g) || [chunk];
      for (const sc of smallChunks) {
        try {
          const fbRes = await fetch(
            `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(sc)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (fbRes.ok) buffers.push(Buffer.from(await fbRes.arrayBuffer()));
        } catch (_) {}
      }
    }
  }

  if (buffers.length === 0) return res.status(500).json({ error: 'Nenhum áudio gerado.' });

  const combined = Buffer.concat(buffers);
  if (usedFallback) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Mode', 'fallback');
    return res.send(combined);
  }

  const wav = pcmToWav(combined);
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('X-TTS-Mode', 'premium');
  return res.send(wav);
}
