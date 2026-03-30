// src/api/audio-handler.ts

export const startAudioCapture = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    
    // O próximo passo aqui é registrar o AudioWorklet 
    // para substituir o ScriptProcessorNode que deu erro.
    
    return { stream, audioContext };
  } catch (err) {
    console.error("Erro ao acessar microfone:", err);
  }
};
