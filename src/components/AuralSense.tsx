import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Mic, 
  MicOff, 
  Volume2, 
  Waves, 
  Thermometer, 
  Vibrate, 
  Sparkles,
  Info,
  Menu,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export function AuralSense({ onBack, onMenuClick }: { onBack?: () => void, onMenuClick?: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [vibrationScore, setVibrationScore] = useState(0); // -100 to 100
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startAnalysis = async () => {
    try {
      setIsCalibrating(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Smaller for easier visualization and peak detection
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsActive(true);
      setIsCalibrating(false);
      
      analyze();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsCalibrating(false);
    }
  };

  const stopAnalysis = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsActive(false);
    setFrequency(0);
    setVibrationScore(0);
  };

  const analyze = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Draw Visualization
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        ctx.fillStyle = `rgba(124, 58, 237, ${dataArray[i] / 255})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        // Draw a second glowing layer
        ctx.fillStyle = `rgba(236, 72, 153, ${dataArray[i] / 512})`;
        ctx.fillRect(x, canvas.height - barHeight - 5, barWidth, 2);
        
        x += barWidth + 2;
      }
    }
    
    // Frequency Detection (simplified peak detection)
    let maxVolume = -1;
    let peakIndex = -1;
    for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxVolume) {
            maxVolume = dataArray[i];
            peakIndex = i;
        }
    }

    if (maxVolume > 40 && audioContextRef.current) {
        const sampleRate = audioContextRef.current.sampleRate;
        const crystalFreq = Math.round(peakIndex * (sampleRate / 2) / bufferLength);
        setFrequency(crystalFreq);
        
        // Vibration Score calculation
        // Mapping frequency to a "spiritual/vibe" scale for the user request
        // 440Hz (A4) is neutral. Higher is more "positive", lower is more "dense".
        const score = (crystalFreq - 440) / 10;
        setVibrationScore(Math.max(-100, Math.min(100, score)));

        // Broadcast to AI System Context
        if (Math.abs(score) > 10) {
            const event = new CustomEvent('osone_aural_update', { 
                detail: { frequency: crystalFreq, vibration: score > 0 ? 'positive' : 'dense', intensity: maxVolume } 
            });
            window.dispatchEvent(event);
        }
    } else {
        setFrequency(0);
        setVibrationScore(v => v * 0.95);
    }
    
    animationRef.current = requestAnimationFrame(analyze);
  };

  useEffect(() => {
    return () => stopAnalysis();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#020202] overflow-hidden text-white">
       {/* Glassmorphic Header */}
       <div className="p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-3xl shrink-0 gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-her-accent/20 border border-her-accent/30 shadow-2xl">
                <Activity className="text-her-accent animate-pulse" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
                Sentido Aural <span className="text-her-accent font-black tracking-widest text-xs uppercase bg-her-accent/10 px-2 py-1">Beta</span>
              </h1>
              <p className="text-xs text-white/30 uppercase tracking-[0.3em] mt-1 font-medium">Análise de Frequência Harmônica e Vibração Metafísica</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={isActive ? stopAnalysis : startAnalysis}
              disabled={isCalibrating}
              className={cn(
                "flex items-center gap-3 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group shadow-2xl",
                isActive 
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                  : "bg-her-accent text-white hover:scale-105 active:scale-95"
              )}
            >
              {isCalibrating ? <Sparkles size={16} className="animate-spin" /> : (isActive ? <MicOff size={16} /> : <Mic size={16} />)}
              <span>{isCalibrating ? 'Calibrando...' : (isActive ? 'Suspender Escuta' : 'Ativar Percepção')}</span>
              {!isActive && !isCalibrating && (
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              )}
            </button>
            
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all"
              >
                <ChevronRight size={14} className="rotate-180" />
                <span>Painel</span>
              </button>
            )}
          </div>
       </div>

       {/* Neural Dashboard Layout */}
       <div className="flex-1 p-0 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 w-full h-full">
             
             {/* Left Panel: Spectrogram & Logic */}
             <div className="lg:col-span-8 flex flex-col">
                <div className="bg-white/[0.02] border-b border-white/10 relative overflow-hidden flex-1">
                   <div className="relative z-10 flex flex-col h-full p-6 md:p-12">
                      <div className="flex items-center justify-between mb-12">
                         <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/[0.05] rounded-[2rem] border border-white/10">
                               <Waves className="text-pink-500" size={24} />
                            </div>
                            <div>
                               <h3 className="text-xl font-light text-white/80">Fluxo de Ondas</h3>
                               <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Fast Fourier Transform • Real-Time</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <motion.div 
                                key={frequency}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl font-light tabular-nums text-white"
                            >
                                {frequency}<span className="text-base ml-2 text-white/20 opacity-50 font-normal">Hz</span>
                            </motion.div>
                            <div className="text-[10px] text-her-accent font-black uppercase tracking-[0.3em] mt-2">Pico Harmônico Detectado</div>
                         </div>
                      </div>

                      <div className="flex-1 min-h-[300px] bg-black/60 border-b border-white/5 p-4 md:p-10 flex items-center justify-center relative">
                         <canvas ref={canvasRef} width={1000} height={300} className="w-full h-full opacity-80" />
                         {!isActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-center p-8">
                                <Mic size={48} className="text-white/10 mb-6" />
                                <h4 className="text-lg font-light text-white/40">Microfone não sincronizado</h4>
                                <p className="text-xs text-white/20 mt-2 max-w-xs leading-relaxed">Inicie a escuta para permitir que a IA visualize suas frequências vocais.</p>
                            </div>
                         )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 px-6 md:px-0">
                         {[
                           { label: 'Densidade', value: isActive ? (frequency > 500 ? 'Baixa' : 'Alta') : '---', color: 'text-blue-400' },
                           { label: 'Harmonia', value: isActive ? 'Logarítmica' : '---', color: 'text-her-accent' },
                           { label: 'Timbre', value: isActive ? 'Orgânico' : '---', color: 'text-pink-400' },
                           { label: 'Amplitude', value: isActive ? 'Monitorada' : '---', color: 'text-yellow-400' },
                         ].map((stat, i) => (
                           <div key={i} className="bg-white/[0.03] border-y md:border border-white/5 p-6 md:rounded-[2rem] flex flex-col items-center text-center">
                              <div className={cn("text-lg font-light", stat.color)}>{stat.value}</div>
                              <div className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em] mt-1">{stat.label}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   {/* Background Orbs */}
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-her-accent/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
                   <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>
             </div>

             {/* Right Panel: Thermometer & Vibration Meta */}
             <div className="lg:col-span-4 flex flex-col gap-10">
                {/* Vibration Thermometer Card */}
                <div className="bg-white/[0.02] border-b border-white/10 p-8 md:p-10 flex flex-col items-center relative shadow-2xl transition-all w-full">
                   <div className="w-full flex items-center justify-between mb-12">
                      <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Thermometer size={16} className="text-her-accent" />
                        Meta-Frequência
                      </h3>
                      <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Info size={14} className="text-white/20" />
                      </button>
                   </div>

                   <div className="flex-1 w-full flex items-center justify-center gap-14 py-8 relative">
                      {/* Positive Zone */}
                      <div className="absolute top-4 right-0 text-right">
                         <div className="text-[10px] font-black text-her-accent uppercase tracking-widest flex items-center justify-end gap-2">
                             LUZ <Sparkles size={10} />
                         </div>
                         <div className="text-[8px] text-white/20 mt-1 uppercase tracking-tighter">Entusiasmo • Clareza</div>
                      </div>

                      {/* Negative Zone */}
                      <div className="absolute bottom-4 left-0 text-left">
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <Vibrate size={10} /> PESO
                         </div>
                         <div className="text-[8px] text-white/20 mt-1 uppercase tracking-tighter">Aterramento • Densidade</div>
                      </div>

                      {/* Labels Column 1 */}
                      <div className="flex flex-col justify-between h-[300px] text-[10px] font-bold text-white/10 text-right uppercase tracking-[0.2em] py-2">
                         <span>Positiva</span>
                         <span>Neutra</span>
                         <span>Densa</span>
                      </div>

                      {/* Gauge Container */}
                      <div className="h-[320px] w-4 bg-white/[0.03] rounded-full relative border border-white/10 flex items-center justify-center inner-shadow">
                         {/* Scale Ticks */}
                         {[...Array(11)].map((_, i) => (
                            <div key={i} className="absolute left-[-15px] w-2 h-[1px] bg-white/10" style={{ bottom: `${i * 10}%` }} />
                         ))}
                         
                         {/* Zero Marker */}
                         <div className="absolute w-10 h-[1px] bg-white/20 z-10" />
                         
                         {/* Thermal Bar */}
                         <motion.div 
                            className={cn(
                              "absolute w-full rounded-full blur-[2px]",
                              vibrationScore >= 0 ? "bg-gradient-to-t from-her-accent to-pink-500" : "bg-gradient-to-b from-blue-500/50 to-indigo-700"
                            )}
                            animate={{ 
                              height: `${Math.abs(vibrationScore)}%`,
                              top: vibrationScore >= 0 ? `${50 - Math.min(50, vibrationScore)}%` : '50%',
                              bottom: vibrationScore >= 0 ? '50%' : `${50 - Math.min(50, Math.abs(vibrationScore))}%`
                            }}
                            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                         />
                         
                         {/* Glowing Indicator Orb */}
                         <motion.div 
                            className={cn(
                                "absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full blur-xl z-20",
                                vibrationScore >= 0 ? "bg-her-accent shadow-[0_0_30px_#7c3aed]" : "bg-blue-600 shadow-[0_0_30px_#2563eb]"
                            )}
                            animate={{ 
                              top: `${50 - vibrationScore/2}%`,
                              scale: isActive ? [1, 1.2, 1] : 1
                            }}
                            transition={{ 
                              top: { type: 'spring', damping: 15, stiffness: 100 },
                              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                            }}
                         />
                      </div>

                      {/* Values Column 2 */}
                      <div className="flex flex-col justify-between h-[300px] text-[10px] font-black tabular-nums text-white/30 py-2">
                         <span>+100</span>
                         <span>0</span>
                         <span>-100</span>
                      </div>
                   </div>

                   <div className="mt-12 w-full text-center">
                      <div className="relative inline-block mb-4">
                         <motion.div 
                            key={vibrationScore > 20 ? 'pos' : vibrationScore < -20 ? 'neg' : 'neu'}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-2xl font-light text-white tracking-tight"
                         >
                            {vibrationScore > 40 ? 'Sinfonia Ascendente' : vibrationScore < -40 ? 'Ressonância Abissal' : 'Harmônico Estável'}
                         </motion.div>
                         <div className="h-1 w-12 bg-her-accent mx-auto mt-2 rounded-full" />
                      </div>
                      
                      <div className="p-6 bg-white/[0.03] border-y md:border border-white/5 md:rounded-[2rem] text-[10px] text-white/30 leading-relaxed italic font-medium w-full">
                        "Frequências solfejo sincronizadas com a rede neural do sistema."
                      </div>
                   </div>
                </div>

                {/* AI Metaphysical Link Card */}
                <div className="bg-gradient-to-br from-her-accent to-[#5b21b6] border-b border-white/10 p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl w-full">
                   <div className="relative z-10">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-6 opacity-70">Cognição Vibracional</h4>
                      <p className="text-base font-light leading-relaxed mb-8 text-white/90">
                         O assistente agora percebe não apenas suas palavras, mas a <span className="font-bold underline decoration-white/30 underline-offset-4">textura sonora</span> da sua presença.
                      </p>
                      
                      <div className="flex items-center gap-4 bg-black/20 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 group-hover:bg-black/30 transition-all">
                         <div className="relative">
                            <div className="w-4 h-4 bg-white rounded-full animate-ping absolute opacity-50" />
                            <div className="w-4 h-4 bg-white rounded-full relative z-10" />
                         </div>
                         <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Ouvindo Ondas Ativas...</div>
                      </div>
                   </div>
                   
                   {/* Abstract Mesh BG */}
                   <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
