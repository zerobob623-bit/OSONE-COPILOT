/**
 * Audio processing utilities for Gemini Live API
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async startRecording(onAudioData: (base64Data: string) => void) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Seu navegador não suporta a API de Áudio.");
      }

      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!this.audioContext || !this.stream) {
        return; 
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.processor) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        onAudioData(base64Data);
      };
  
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Erro ao iniciar gravação de áudio:", error);
      this.stopRecording();
      throw error;
    }
  }

  stopRecording() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioContext = null;
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private onActivityChange?: (active: boolean) => void;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  constructor(onActivityChange?: (active: boolean) => void) {
    this.onActivityChange = onActivityChange;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    }
  }

  playChunk(base64Data: string) {
    if (!this.audioContext || this.audioContext.state === 'closed') return;

    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const pcmData = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 0x7FFF;
      }
  
      const buffer = this.audioContext.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);
  
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
  
      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }
  
      const startTime = this.nextStartTime;
      source.start(startTime);
      this.nextStartTime += buffer.duration;

      this.activeSources.add(source);
      if (this.activeSources.size === 1) {
        this.onActivityChange?.(true);
      }

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // Double check if nextStartTime is significantly ahead
          if (this.audioContext && this.nextStartTime <= this.audioContext.currentTime + 0.1) {
            this.onActivityChange?.(false);
          }
        }
      };
    } catch (err) {
      console.error("Erro ao reproduzir chunk de áudio:", err);
    }
  }

  stop() {
    this.activeSources.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    this.activeSources.clear();
    this.audioContext?.close();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    }
    this.nextStartTime = 0;
    this.onActivityChange?.(false);
  }
}
