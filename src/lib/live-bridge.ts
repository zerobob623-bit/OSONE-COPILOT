import { GoogleGenAI } from "@google/genai";

/**
 * Direct client-side connection to Gemini Live Multimodal API
 */
export async function connectToLiveBridge(options: {
  model: string;
  config: any;
  callbacks: {
    onopen?: () => void;
    onmessage?: (message: any) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  };
  apiKey: string;
}) {
  console.log("OSONE 4 Client: Estabelecendo conexão direta com os canais neurais do Gemini...");

  try {
    const ai = new GoogleGenAI({
      apiKey: options.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-client',
        }
      }
    });

    // Start direct client-side bi-directional stream using the isomorphic SDK
    const bidiSession = await ai.live.connect({
      model: options.model || "gemini-3.1-flash-live-preview",
      config: options.config,
      callbacks: {
        onopen: () => {
          console.log("OSONE 4 Direct: Conectado com sucesso à API do Gemini!");
          if (options.callbacks?.onopen) {
            options.callbacks.onopen();
          }
        },
        onmessage: (liveResponse: any) => {
          // Check for any GoAway signal / message indicating the session limit has been reached
          const isGoAway = liveResponse?.goAway || 
                           liveResponse?.goaway || 
                           liveResponse?.serverContent?.goAway || 
                           liveResponse?.serverContent?.goaway ||
                           (liveResponse?.serverContent?.modelTurn?.parts?.some((p: any) => p.text && p.text.toLowerCase().includes("goaway")));
          
          if (isGoAway) {
            console.warn("OSONE 4 Direct: GoAway signal received. Closing session gracefully to respect session limits.");
            try {
              bidiSession.close();
            } catch (err) {
              console.error("OSONE 4 Direct: Error while closing session after GoAway:", err);
            }
            if (options.callbacks?.onclose) {
              options.callbacks.onclose();
            }
            return;
          }

          if (options.callbacks?.onmessage) {
            options.callbacks.onmessage(liveResponse);
          }
        },
        onclose: () => {
          console.log("OSONE 4 Direct: Conexão encerrada.");
          if (options.callbacks?.onclose) {
            options.callbacks.onclose();
          }
        },
        onerror: (err: any) => {
          const errString = String(err?.message || err || "");
          if (errString.includes("GoAway") || errString.includes("session duration limit reached") || errString.includes("close the connection after receiving")) {
            console.warn("OSONE 4 Direct: Intercepted and handled GoAway signal / session duration limit gracefully:", errString);
            try {
              bidiSession.close();
            } catch (_) {}
            if (options.callbacks?.onclose) {
              options.callbacks.onclose();
            }
            return;
          }

          console.error("OSONE 4 Direct: Erro na conexão neural:", err);
          if (options.callbacks?.onerror) {
            options.callbacks.onerror(err);
          }
        }
      }
    });

    return {
      sendRealtimeInput: (input: any) => {
        bidiSession.sendRealtimeInput(input);
      },
      sendToolResponse: (payload: any) => {
        bidiSession.sendToolResponse(payload);
      },
      close: () => {
        bidiSession.close();
      }
    };
  } catch (err) {
    console.error("OSONE 4 Direct: Falha ao estabelecer conexão direta com a API do Gemini:", err);
    throw err;
  }
}
