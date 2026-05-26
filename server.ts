import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Create a WebSocket Server connected to the HTTP Server, responding on specifically /api/live-ws path
  const wss = new WebSocketServer({ noServer: true });

  const PORT = 3000;

  app.use(express.json());

  // ====== WHATSAPP EVOLUTION INTEGRATION STATE ======
  let whatsappConfig = {
    apiUrl: "https://demo.evolution-api.com",
    apiKey: "",
    instanceName: "osone_assistant",
    enabled: false,
    geminiApiKey: ""
  };

  interface WhatsappLog {
    id: string;
    timestamp: number;
    type: "received" | "sent" | "error" | "info";
    sender: string;
    message: string;
    response?: string;
  }

  let whatsappLogs: WhatsappLog[] = [
    {
      id: "init",
      timestamp: Date.now(),
      type: "info",
      sender: "Sistema",
      message: "Canal do WhatsApp OSONE de pé. Pronto para evolução de fluxos."
    }
  ];

  // API Endpoints for WhatsApp Frontend configuration
  app.get("/api/whatsapp/config", (req, res) => {
    res.json(whatsappConfig);
  });

  app.post("/api/whatsapp/config", (req, res) => {
    const { apiUrl, apiKey, instanceName, enabled, geminiApiKey } = req.body;
    
    if (apiUrl !== undefined) whatsappConfig.apiUrl = apiUrl;
    if (apiKey !== undefined) whatsappConfig.apiKey = apiKey;
    if (instanceName !== undefined) whatsappConfig.instanceName = instanceName;
    if (enabled !== undefined) whatsappConfig.enabled = enabled;
    if (geminiApiKey !== undefined) whatsappConfig.geminiApiKey = geminiApiKey;

    whatsappLogs.unshift({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      type: "info",
      sender: "Sistema",
      message: `Configurações salvas: Chatbot ${whatsappConfig.enabled ? "Ativado" : "Desativado"}. Instância: ${whatsappConfig.instanceName}`
    });
    
    res.json({ status: "success", config: whatsappConfig });
  });

  app.get("/api/whatsapp/logs", (req, res) => {
    res.json(whatsappLogs);
  });

  app.post("/api/whatsapp/clear-logs", (req, res) => {
    whatsappLogs = [
      {
        id: "clear-" + Date.now(),
        timestamp: Date.now(),
        type: "info",
        sender: "Sistema",
        message: "Histórico de logs do chatbot limpo com sucesso."
      }
    ];
    res.json({ status: "success" });
  });

  // Webhook Receiver from Evolution API (e.g. listening to messages.upsert)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body;
      const eventType = body.event || body.type;

      // Log webhook ping or payload received
      console.log("Evolution API Webhook received:", eventType || "ping/raw");

      // Verify if it's indeed message creation
      if (eventType && eventType !== "messages.upsert" && eventType !== "values.upsert" && eventType !== "messages.create") {
         return res.json({ status: "ignored", reason: "Unmanaged webhook event types: " + eventType });
      }

      const data = body.data;
      if (!data) {
        return res.json({ status: "ignored", reason: "No data payload inside webhook" });
      }

      // Evitar loop infinito do bot respondendo a si mesmo
      const fromMe = data.key?.fromMe;
      if (fromMe === true) {
        return res.json({ status: "ignored", reason: "Self message (fromMe: true)" });
      }

      const remoteJid = data.key?.remoteJid;
      const senderName = data.pushName || "Usuário WhatsApp";
      const originalMessage = data.message;
      
      // Extract clean textual incoming string
      const text = originalMessage?.conversation || 
                   originalMessage?.extendedTextMessage?.text || 
                   originalMessage?.imageMessage?.caption || 
                   body.text || "";

      if (!text || !remoteJid) {
        return res.json({ status: "ignored", reason: "Missing remoteJid or content text" });
      }

      // Check if Chatbot autoresponder is enabled
      if (!whatsappConfig.enabled) {
        whatsappLogs.unshift({
          id: Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
          type: "received",
          sender: `${senderName} (${remoteJid})`,
          message: text,
          response: "[Auto-resposta inativa no painel]"
        });
        if (whatsappLogs.length > 100) whatsappLogs.pop();
        return res.json({ status: "ignored", reason: "Autoresponder is disabled" });
      }

      const geminiApiKeyToUse = whatsappConfig.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKeyToUse) {
        whatsappLogs.unshift({
          id: Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
          type: "error",
          sender: "Sistema",
          message: `Mensagem de ${senderName} recebida, mas a chave API do Gemini não foi encontrada no OSONE.`
        });
        if (whatsappLogs.length > 100) whatsappLogs.pop();
        return res.json({ status: "error", error: "Gemini API key is not configured" });
      }

      // Use modern GoogleGenAI SDK to speak with Gemini 3.5-flash
      const ai = new GoogleGenAI({ apiKey: geminiApiKeyToUse });
      const systemPrompt = `Você é o OSONE 4, o cérebro eletrônico central de inteligência artificial de elite, hiperfocado em ajudar o usuário com uma clareza deslumbrante, respostas estruturadas, elegantes e um toque futurista e polido.
Você está atendendo o usuário pelo WhatsApp em nome do proprietário deste dispositivo OSONE. Responda diretamente e com muita inteligência, clareza, formatação impecável de parágrafos breves e emojis adequados.
Nome do interlocutor: ${senderName}`;

      const gResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: text,
        config: {
          systemInstruction: systemPrompt
        }
      });
      
      const replyText = gResult.text || "Ops! Meu cérebro digital oscilou, por favor tente novamente.";

      // Dispatch to Evolution API
      const cleanApiUrl = whatsappConfig.apiUrl.endsWith('/') ? whatsappConfig.apiUrl.slice(0, -1) : whatsappConfig.apiUrl;
      const sendUrl = `${cleanApiUrl}/message/sendText/${whatsappConfig.instanceName}`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (whatsappConfig.apiKey) {
        headers["apikey"] = whatsappConfig.apiKey;
      }

      const response = await fetch(sendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          number: remoteJid,
          text: replyText,
          textMessage: {
            text: replyText
          }
        })
      });

      if (!response.ok) {
        const errVal = await response.text();
        throw new Error(`Evolution API HTTP ${response.status}: ${errVal}`);
      }

      whatsappLogs.unshift({
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        type: "sent",
        sender: `${senderName} (${remoteJid})`,
        message: text,
        response: replyText
      });
      if (whatsappLogs.length > 100) whatsappLogs.pop();

      return res.json({ status: "success", senderName, replied: true });
    } catch (e: any) {
      console.error("Critical error inside WhatsApp webhook receiver:", e);
      whatsappLogs.unshift({
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        type: "error",
        sender: "Webhook OSONE",
        message: `Falha ao processar mensagem recebida: ${e?.message || e}`
      });
      if (whatsappLogs.length > 100) whatsappLogs.pop();
      return res.status(500).json({ status: "error", error: e?.message || e });
    }
  });

  // POST endpoint for generating step-by-step simple integration plans
  app.post("/api/integrations/plan", async (req, res) => {
    try {
      const { targetIntegration, clientApiKey } = req.body;
      
      if (!targetIntegration || typeof targetIntegration !== "string") {
        return res.status(400).json({ error: "O nome da integração é obrigatório." });
      }

      const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: "A chave API do Gemini não está definida no OSONE ou nos segredos. Por favor, configure sua chave nos Ajustes." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Gere um guia de plano de integração extremamente simples, didático e prático, estruturado em passos numerados fáceis (de 3 a 5 passos), explicando detalhadamente o que o usuário precisa preparar, configurar e programar em seu app para conseguir integrar o sistema desejado.
      
      Algumas pessoas não sabem por onde começar ou o que precisam (como Chave de API, URLs de retorno, webhook, bibliotecas). Explique de forma amigável, acolhedora e encorajadora para que qualquer pessoa (mesmo leigos) consiga entender o que precisa fazer e o que precisa obter nos painéis parceiros.

      Sistema que o usuário deseja integrar: "${targetIntegration}"

      Siga exatamente esta estrutura no seu resultado Markdown:
      1. **Introdução**: Uma introdução breve, encorajadora e amigável em português explicando o que é o sistema e confirmando que é super viável integrá-lo.
      2. **Passo a Passo**: Divida em passos claramente numerados (ex: # 1, # 2, etc.), usando palavras simples e destacando termos técnicos essenciais em negrito (ex: **Token de Acesso**, **Painel de Desenvolvedor**, **Webhooks**, **Servidor**).
      3. **Dica Pro**: Uma dica rápida para manter as senhas protegidas ou sobre como testar de forma simulada.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um Engenheiro de API de Software experiente, empático e de linguagem extremamente clara e acessível."
        }
      });

      res.json({ plan: response.text || "Ops! Não foi possível gerar o plano. Tente novamente." });
    } catch (error: any) {
      console.error("Erro no endpoint de planejador de integrações:", error);
      res.status(500).json({ error: error?.message || "Erro interno ao gerar o plano de integração." });
    }
  });

  // Handle upgrade event manually to route to the /api/live-ws or /api/blender-ws websocket bridge
  server.on("upgrade", (request, socket, head) => {
    try {
      const urlObj = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      const pathname = urlObj.pathname;
      
      if (pathname === "/api/live-ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    } catch (e) {
      console.error("Upgrade routing failed:", e);
      socket.destroy();
    }
  });

  // Handle incoming websocket connections
  wss.on("connection", async (clientWs, req) => {
    console.log("Client connected to the server-side OSONE 4 Live Bridge WS");
    
    const urlObj = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const clientApiKey = urlObj.searchParams.get("apiKey");
    
    // Fallback to server's loaded GEMINI_API_KEY if the client key is empty/not configured
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Error: GEMINI_API_KEY is not defined");
      clientWs.send(JSON.stringify({ 
        type: "error", 
        error: "Chave API do Gemini não definida. Insira uma chave válida nos ajustes." 
      }));
      clientWs.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let bidiSession: any = null;

    clientWs.on("message", async (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());
        
        if (message.type === "setup") {
          const { model, config } = message;
          const targetModel = model || "gemini-3.1-flash-live-preview";
          console.log(`Connecting Live API on server mode: ${targetModel}`);
          
          try {
            bidiSession = await ai.live.connect({
              model: targetModel,
              config: config,
              callbacks: {
                onmessage: (liveResponse: any) => {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify(liveResponse));
                  }
                },
                onclose: () => {
                  console.log("Gemini Live connection closed by Google endpoint");
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.close();
                  }
                },
                onerror: (err: any) => {
                  console.error("Gemini Live server API error callback:", err);
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ 
                      type: "error", 
                      error: err?.message || "Ops, ocorreu um erro interno na conexão Neural." 
                    }));
                  }
                }
              }
            });
            console.log("Server successfully connected to Google Gemini Live endpoint!");
          } catch (connectError: any) {
            console.error("Failed to connect to Gemini Live:", connectError);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ 
                type: "error", 
                error: `Falha na conexão Neural do Servidor: ${connectError?.message || connectError}` 
              }));
              clientWs.close();
            }
          }
        } else if (message.type === "realtime_input") {
          if (bidiSession) {
            bidiSession.sendRealtimeInput(message.input);
          }
        } else if (message.type === "tool_response") {
          if (bidiSession) {
            bidiSession.sendToolResponse(message.payload);
          }
        }
      } catch (parseError: any) {
        console.error("WS Message processing error:", parseError);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected from websocket bridge, cleaning up");
      if (bidiSession) {
        try {
          bidiSession.close();
        } catch (e) {
          console.error("Failed to cleanly close bidi session on client departure:", e);
        }
      }
    });

    clientWs.on("error", (e) => {
      console.error("Client WS error:", e);
      if (bidiSession) {
        try { bidiSession.close(); } catch (_) {}
      }
    });
  });

  // Integration with Vite dev middleware for hot loading frontend assets in dev, serve statically in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted on Express middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from ${distPath}`);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Server connected and running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server execution crashed:", error);
});
