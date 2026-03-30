// src/api/gemini-live.ts

export class GeminiLiveService {
  private socket: WebSocket | null = null;
  private url: string = "";

  connect(url: string) {
    this.url = url;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("🟢 Conexão Neural Estabelecida");
    };

    this.socket.onmessage = (event) => {
      // Aqui você trata a resposta da IA
      const data = JSON.parse(event.data);
      console.log("📩 Resposta recebida:", data);
    };

    this.socket.onclose = (event) => {
      console.warn(`🔴 Conexão fechada (Código: ${event.code}). Tentando reconectar em 3s...`);
      setTimeout(() => this.connect(this.url), 3000); // Reconexão automática
    };
  }

  // No arquivo gemini-live.ts

connect(url: string) {
  this.socket = new WebSocket(url);

  this.socket.onopen = () => {
    console.log("Conectado ao Gemini!");

    // ESTA É A PARTE QUE FALTAVA:
    const setupMessage = {
      setup: {
        model: "models/gemini-3.1-flash-live-preview", // O modelo Live Preview
        generation_config: {
          response_modalities: ["audio"], // Força a resposta em áudio
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Puck" // Opções: Puck, Charon, Kore, Fenrir, Aoede
              }
            }
          }
        }
      }
    };

    // Envia a configuração inicial obrigatoriamente
    this.socket.send(JSON.stringify(setupMessage));
  };

  this.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // O Gemini 2.0 responde os áudios aqui:
    if (data.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
      const audioBase64 = data.serverContent.modelTurn.parts[0].inlineData.data;
      // Chame seu AudioPlayer aqui
      this.playAudio(audioBase64);
    }
  };
}

  sendMessage(data: any) {
    // CHECAGEM CRÍTICA: Só envia se o estado for exatamente 1 (OPEN)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ Tentativa de envio bloqueada: Socket fechado ou fechando.");
    }
  }
}

export const geminiApi = new GeminiLiveService();
