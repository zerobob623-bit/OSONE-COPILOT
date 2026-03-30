// src/api/gemini-live.ts

export class GeminiLiveService {
  private socket: WebSocket | null = null;

  connect(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("Conexão Neural Ativa");
    };

    this.socket.onclose = () => {
      console.warn("Conexão encerrada. Tentando reconectar...");
      // Aqui você pode implementar uma lógica de retry
    };

    this.socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };
  }

  sendMessage(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error("Não foi possível enviar: WebSocket não está aberto.");
    }
  }

  disconnect() {
    this.socket?.close();
  }
}

export const geminiApi = new GeminiLiveService();
