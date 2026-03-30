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
