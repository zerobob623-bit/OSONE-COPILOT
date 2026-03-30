import { useState, useEffect, useCallback, useRef } from 'react';
import { geminiApi } from '../api/gemini-live';
import { startAudioCapture } from '../api/audio-handler';

export const useGeminiLive = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Função para conectar ao WebSocket
  const connect = useCallback(async (url: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      geminiApi.connect(url);
      setIsConnected(true);
    } catch (err) {
      setError("Falha ao conectar com o servidor Gemini.");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Função para desconectar
  const disconnect = useCallback(() => {
    geminiApi.disconnect();
    stopListening();
    setIsConnected(false);
  }, []);

  // Iniciar captura de áudio (Usando o novo AudioWorklet)
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Inicializa o processador de áudio moderno
      await startAudioCapture(stream, (audioData) => {
        // Envia o áudio via WebSocket apenas se estiver conectado
        geminiApi.sendAudioChunk(audioData);
      });

      setIsListening(true);
    } catch (err) {
      setError("Não foi possível acessar o microfone.");
      console.error(err);
    }
  }, []);

  // Parar captura de áudio
  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  }, []);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isListening,
    error,
    connect,
    disconnect,
    startListening,
    stopListening
  };
};
