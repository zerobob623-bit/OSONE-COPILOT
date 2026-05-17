import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Type, 
  Music, 
  Video, 
  Plus, 
  Trash2, 
  Download, 
  Share2,
  Clock,
  Layout,
  Maximize2,
  Volume2,
  Settings,
  Sparkles,
  Zap,
  Save,
  CheckCircle2,
  ChevronRight,
  Loader2,
  FileSearch,
  Target,
  TrendingUp,
  Menu,
  Info
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn, safeJsonParse } from '../lib/utils';
import { VideoTimelineState, VideoClip, VideoSubtitle } from '../types';

interface ViralStudioProps {
  initialScript?: {
    suggestedTitle: string;
    sections: { title: string; content: string; visualCue: string }[];
  };
  timeline: VideoTimelineState;
  setTimeline: React.Dispatch<React.SetStateAction<VideoTimelineState>>;
  videoFile?: File | null;
  apiKeys: { gemini: string };
  onMenuClick?: () => void;
  onBack?: () => void;
}

export function ViralStudio({ initialScript, timeline, setTimeline, videoFile, apiKeys, onMenuClick, onBack }: ViralStudioProps) {
  const [activeTab, setActiveTab] = useState<'clips' | 'subtitles' | 'audio' | 'effects'>('clips');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(60); // px per second
  const [volume, setVolume] = useState(100);
  const [scriptText, setScriptText] = useState('');
  
  // AI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoEditing, setIsAutoEditing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const niches = [
    { id: 'entertainment', name: 'Entretenimento', icon: <Video size={14} /> },
    { id: 'education', name: 'Educação', icon: <TrendingUp size={14} /> },
    { id: 'finance', name: 'Finanças', icon: <Target size={14} /> },
  ];

  // Default script text
  useEffect(() => {
    if (initialScript) {
      setScriptText(initialScript.sections.map(s => `${s.title}: ${s.content}`).join('\n\n'));
    }
  }, [initialScript]);

  // Handle Video File Load
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  // Sync Video Time with Timeline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setTimeline(prev => ({ ...prev, currentTime: video.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setTimeline(prev => {
        const hasClips = prev.clips.length > 0;
        return { 
          ...prev, 
          totalDuration: video.duration,
          clips: hasClips ? prev.clips : [{
            id: 'original-video',
            title: videoFile?.name || 'media_01.mp4',
            startTime: 0,
            duration: video.duration,
            sourceUrl: videoUrl || '',
            sourceOffset: 0,
            type: 'video',
            trackIndex: 0
          }]
        };
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoUrl]);

  // Toggle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (timeline.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setTimeline(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = x / zoomLevel;
    videoRef.current.currentTime = time;
  };

  // Editing Actions
  const handleSplit = () => {
    const time = timeline.currentTime;
    setTimeline(prev => {
      // Find clip at currentTime
      const clipIndex = prev.clips.findIndex(c => time > c.startTime && time < c.startTime + c.duration);
      if (clipIndex === -1) return prev;

      const clip = prev.clips[clipIndex];
      const leftDuration = time - clip.startTime;
      const rightDuration = clip.duration - leftDuration;

      // Ensure clips aren't too small
      if (leftDuration < 0.1 || rightDuration < 0.1) return prev;

      const leftClip: VideoClip = { ...clip, duration: leftDuration };
      const rightClip: VideoClip = { 
        ...clip, 
        id: Math.random().toString(36).substr(2, 9), 
        startTime: time, 
        duration: rightDuration,
        sourceOffset: clip.sourceOffset + leftDuration
      };

      const newClips = [...prev.clips];
      newClips.splice(clipIndex, 1, leftClip, rightClip);

      return { ...prev, clips: newClips };
    });
  };

  const removeClip = (id: string) => {
    setTimeline(prev => ({
      ...prev,
      clips: prev.clips.filter(c => c.id !== id)
    }));
  };

  const addSubtitleAtCurrentTime = () => {
    const newSub: VideoSubtitle = {
      id: Math.random().toString(36).substr(2, 9),
      text: "Nova Legenda",
      startTime: timeline.currentTime,
      duration: 2
    };
    setTimeline(prev => ({
      ...prev,
      subtitles: [...prev.subtitles, newSub]
    }));
  };

  const analyzeVideo = async (file: File) => {
    const effectiveApiKey = apiKeys.gemini;
    if (!file || !effectiveApiKey || effectiveApiKey.trim() === '') return;

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      showToast("Analisando vídeo de referência...", "info");
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: {
          parts: [
            { text: "Analise este vídeo e identifique a estrutura do roteiro. Extraia hooks, tópicos e CTAs." },
            { inlineData: { data: base64Data, mimeType: file.type } }
          ]
        }
      });
      const text = response.text || "";
      setTranscription(text);
      showToast("Engenharia reversa concluída!", "success");
    } catch (error) {
      console.error("Erro ao analisar vídeo:", error);
      showToast("Falha na análise do vídeo.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoEditWithAI = async () => {
    if (!videoFile) return;
    const effectiveApiKey = apiKeys.gemini;
    if (!effectiveApiKey || effectiveApiKey.trim() === '') return;

    setIsAutoEditing(true);
    showToast("Iniciando Engenharia Social do Vídeo...", "info");
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(videoFile);
      });
      const base64Data = await base64Promise;

      const prompt = `Você é um ENGENHEIRO DE EDIÇÃO AUTOMATIZADA e expert em retenção viral (TikTok/YouTube Shorts).
Seu objetivo é extrair apenas o "ouro" do vídeo bruto, removendo imperfeições humanas.

REGRAS RÍGIDAS DE ANÁLISE:
1. Delete todos os silêncios maiores que 0.3 segundos.
2. Delete gagues, repetições de palavras e erros de fala.
3. Delete vícios de linguagem (filler words) como: "é...", "tipo", "né", "hum", "tá?", "então".
4. Mantenha apenas frases completas com energia alta.
5. Crie cortes secos e rápidos (Jump Cuts) para aumentar a retenção.

RETORNE APENAS JSON.
Formato: { "segments": [{ "start": float, "end": float, "label": "fala_otimizada" }] }`;

      showToast("IA detectando silêncios e vícios de linguagem...", "info");
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: videoFile.type } }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1 
        }
      });

      const responseText = response.text || "{}";
      const data = safeJsonParse(responseText, { segments: [] });

      if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
        let currentTimelineTime = 0;
        const newClips = data.segments.map((seg: { start: number; end: number, label?: string }, index: number) => {
          const duration = seg.end - seg.start;
          const clip: VideoClip = {
            id: `ai-pro-cut-${index}-${Date.now()}`,
            title: seg.label || `Jump Cut ${index + 1}`,
            startTime: currentTimelineTime,
            duration: duration,
            sourceUrl: videoUrl || '',
            sourceOffset: seg.start,
            type: 'video',
            trackIndex: 0
          };
          currentTimelineTime += duration;
          return clip;
        });

        setTimeline(prev => ({
          ...prev,
          clips: newClips,
          totalDuration: currentTimelineTime,
          currentTime: 0
        }));
        
        if (videoRef.current) videoRef.current.currentTime = 0;
        showToast(`${newClips.length} cortes dinâmicos aplicados!`, "success");
      } else {
        showToast("Nenhum corte necessário identificado.", "info");
      }
    } catch (error) {
      console.error("Erro no Auto-Edit:", error);
      showToast("Falha na automação inteligente.", "error");
    } finally {
      setIsAutoEditing(false);
    }
  };

  // Handle Video File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden animate-in fade-in duration-700">
      {/* Floating Header Actions */}
      <div className="absolute top-4 left-4 xl:top-6 xl:left-6 z-[60] flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-black/60 transition-all"
          >
            <Menu size={20} />
          </button>
        )}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 bg-her-accent/20 backdrop-blur-xl border border-her-accent/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-her-accent hover:bg-her-accent hover:text-white transition-all shadow-2xl"
        >
          <Plus size={16} />
          <span>Enviar Arquivo</span>
        </button>
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-2xl"
          >
            <ChevronRight size={14} className="rotate-180" />
            <span className="hidden md:inline">Início</span>
          </button>
        )}
      </div>

      <div className="absolute top-4 right-4 xl:top-6 xl:right-6 flex items-center gap-2 xl:gap-3 z-[60]">
        <button className="flex items-center gap-2 px-3 xl:px-4 py-2 xl:py-2.5 rounded-xl xl:rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-xl">
          <Save size={14} />
          <span className="hidden sm:inline">Salvar</span>
        </button>
        <button className="flex items-center gap-2 px-3 xl:px-6 py-2 xl:py-2.5 rounded-xl xl:rounded-2xl bg-her-accent text-white text-[9px] xl:text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-her-accent/20 border border-white/10">
          <Download size={14} />
          <span className="hidden sm:inline">Exportar</span>
          <span className="sm:hidden">Final</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row-reverse overflow-hidden relative">
        {/* Simplified Media Panel */}
        <div className="w-full xl:w-[420px] bg-[#050505] xl:bg-[#050505]/50 backdrop-blur-3xl flex flex-col shrink-0 z-40 border-t xl:border-t-0 xl:border-l border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] h-full max-h-[50vh] xl:max-h-none">
           {/* Header for Desktop only or simplified handle for Mobile */}
           <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-2 xl:hidden shrink-0" />
           <div className="p-4 xl:p-8 shrink-0 flex items-center justify-between border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Biblioteca de Mídia</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-her-accent/20 text-her-accent rounded-lg border border-her-accent/30 hover:bg-her-accent hover:text-white transition-all"
              >
                <Plus size={16} />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 xl:p-8 custom-scrollbar">
              <div className="space-y-6">
                {!videoUrl && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video xl:h-40 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-her-accent/50 hover:bg-her-accent/5 transition-all group"
                  >
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-her-accent transition-all group-hover:scale-110">
                      <Plus size={28} />
                    </div>
                    <div className="text-center px-4">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">SUBIR VÍDEO</span>
                      <span className="block text-[9px] text-white/20 mt-1 uppercase tracking-widest font-mono">Formatos: MP4, MOV, WebM</span>
                    </div>
                  </button>
                )}
                <input type="file" ref={fileInputRef} hidden accept="video/*" onChange={handleFileChange} />
                
                {videoUrl && (
                  <div className="space-y-4">
                     <h5 className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-1 border-l-2 border-her-accent pl-3">No Projeto</h5>
                     <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center gap-4 group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                        <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                           <video src={videoUrl} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={16} className="text-white" />
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter">media_01.mp4</p>
                           <div className="flex items-center gap-3 mt-1.5">
                             <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-bold rounded-full border border-green-500/20">ATIVO</span>
                             <p className="text-[9px] text-white/30 truncate uppercase tracking-widest font-mono">0:24s</p>
                           </div>
                        </div>
                     </div>
                     <button 
                        onClick={() => autoEditWithAI()}
                        disabled={isAutoEditing}
                        className="w-full py-4 bg-her-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(var(--her-accent),0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative mt-4 shadow-2xl"
                     >
                        {isAutoEditing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Zap size={16} className="group-hover:animate-pulse" />
                        )}
                        <span>{isAutoEditing ? 'Editando...' : 'Auto-Corte Inteligente (IA)'}</span>
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 pointer-events-none" />
                     </button>
                  </div>
                )}
              </div>
           </div>
        </div>


        {/* Center Area: Player & Tools */}
        <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden relative">
          
          {/* Quick Tools Floating Panel */}
          <div className="absolute left-3 top-20 xl:left-8 xl:top-8 flex flex-col gap-2 xl:gap-4 z-40">
             {[
               { icon: <Maximize2 size={18} />, label: 'Ajustar' },
               { icon: <Layout size={18} />, label: 'Formato' },
               { icon: <Settings size={18} />, label: 'Config' }
             ].map((tool, i) => (
               <button key={i} className="p-2.5 xl:p-4 bg-black/40 backdrop-blur-3xl border border-white/5 hover:bg-white/10 rounded-xl xl:rounded-2xl text-white/50 hover:text-white transition-all group relative shadow-2xl">
                 {tool.icon}
                 <span className="absolute left-full ml-4 px-5 py-2.5 bg-black/90 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap pointer-events-none uppercase tracking-widest font-bold border border-white/10 backdrop-blur-md hidden xl:block">
                    {tool.label}
                 </span>
               </button>
             ))}
          </div>
          
          {/* Player Area */}
          <div className="flex-1 flex flex-col p-0 relative group">
             {/* Main Canvas Context */}
             <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--her-accent)_0%,_transparent_70%)] opacity-[0.04] pointer-events-none" />
                
                {/* Virtual Video Canvas / Real Video Element */}
                <div 
                  ref={playerRef}
                  className="aspect-[9/16] h-full max-h-full bg-white/[0.01] rounded-none md:rounded-[3.5rem] border-x md:border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700"
                >
                   {videoUrl ? (
                      <div className="w-full h-full relative">
                        <video 
                          ref={videoRef}
                          src={videoUrl}
                          className={cn("w-full h-full object-contain", isAutoEditing && "opacity-20")}
                          playsInline
                        />
                        {isAutoEditing && (
                          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-md">
                            <div className="w-20 h-20 bg-her-accent/20 rounded-full flex items-center justify-center mb-6 border border-her-accent/40 relative">
                               <Zap size={40} className="text-her-accent animate-pulse" />
                               <div className="absolute inset-0 rounded-full border-2 border-her-accent animate-ping opacity-20" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 uppercase tracking-[0.2em] italic">AI AUTO-EDITOR PRO</h2>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black max-w-[280px] leading-loose">
                              Detectando filler words (né, tipo, é), removendo silêncios &gt; 0.4s e otimizando retenção via Jump Cuts.
                            </p>
                            <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ x: "-100%" }}
                                 animate={{ x: "100%" }}
                                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                 className="w-full h-full bg-her-accent"
                               />
                            </div>
                          </div>
                        )}
                      </div>
                   ) : (
                      <div className="text-center space-y-6 opacity-30 max-w-[200px]">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 animate-pulse">
                          <Video size={36} className="text-white/40" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em]">CÂMBIO VAZIO</p>
                            <p className="text-[10px] italic font-serif leading-relaxed">Arraste seu vídeo de referência ou conteúdo bruto para começar a magia.</p>
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-6 px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-white/10"
                        >
                          Selecionar Mídia
                        </button>
                      </div>
                   )}

                   {/* Subtitle Overlay Rendering */}
                   {timeline.subtitles.find(s => timeline.currentTime >= s.startTime && timeline.currentTime < s.startTime + s.duration) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-12 left-4 right-4 text-center z-20"
                      >
                         <span className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-lg font-bold shadow-2xl border border-white/10 italic">
                           {timeline.subtitles.find(s => timeline.currentTime >= s.startTime && timeline.currentTime < s.startTime + s.duration)?.text}
                         </span>
                      </motion.div>
                   )}
                </div>
              </div>
           </div>

           {/* Dynamic Float Controls */}
              <div className="flex flex-col items-center justify-center gap-4 px-4 py-6 xl:py-10">
                 <div className="flex items-center gap-6 xl:gap-10 bg-black/60 xl:bg-white/[0.03] backdrop-blur-3xl border border-white/10 px-6 xl:px-10 py-3 xl:py-5 rounded-full xl:rounded-[2.5rem] shadow-2xl mx-auto ring-1 ring-white/5">
                    <div className="hidden xl:flex items-center gap-4 border-r border-white/5 pr-10">
                       <Volume2 size={18} className="text-white/20" />
                       <input 
                         type="range" 
                         min="0" max="100" 
                         value={volume}
                         onChange={(e) => setVolume(Number(e.target.value))}
                         className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-her-accent" 
                       />
                    </div>
                    <div className="flex items-center gap-6 xl:gap-10">
                       <button className="text-white/20 hover:text-white transition-colors"><SkipBack size={20} className="xl:hidden" /><SkipBack size={28} className="hidden xl:block" /></button>
                       <button 
                         onClick={togglePlay}
                         className={cn(
                           "w-10 h-10 xl:w-16 xl:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative group active:scale-90",
                           timeline.isPlaying ? "bg-white text-black" : "bg-her-accent text-white shadow-[0_0_50px_rgba(var(--her-accent),0.4)]"
                         )}
                       >
                          {timeline.isPlaying ? <Pause size={20} className="xl:hidden" fill="currentColor" /> : <Play size={20} className="xl:hidden ml-0.5" fill="currentColor" />}
                          {timeline.isPlaying ? <Pause size={32} className="hidden xl:block" fill="currentColor" /> : <Play size={32} className="hidden xl:block ml-1" fill="currentColor" />}
                       </button>
                       <button className="text-white/20 hover:text-white transition-colors"><SkipForward size={20} className="xl:hidden" /><SkipForward size={28} className="hidden xl:block" /></button>
                    </div>
                    <div className="flex items-center gap-4 xl:border-l border-white/5 xl:pl-10">
                       <div className="text-[12px] xl:text-[16px] font-mono text-her-accent font-bold tracking-[0.2em] min-w-[60px] xl:min-w-[85px] text-center">
                         {Math.floor(timeline.currentTime / 60)}:{(timeline.currentTime % 60).toFixed(1).padStart(4, '0')}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-3 xl:gap-4 xl:absolute xl:right-12 xl:bottom-12">
                    <button onClick={handleSplit} className="w-12 h-12 xl:w-16 xl:h-16 bg-white/[0.03] hover:bg-her-accent/20 rounded-full text-white/40 hover:text-her-accent border border-white/5 hover:border-her-accent/30 transition-all flex items-center justify-center group shadow-2xl" title="Dividir Timeline">
                       <Scissors size={20} className="xl:hidden group-hover:rotate-12 transition-transform" />
                       <Scissors size={24} className="hidden xl:block group-hover:rotate-12 transition-transform" />
                    </button>
                    <button onClick={addSubtitleAtCurrentTime} className="w-12 h-12 xl:w-16 xl:h-16 bg-white/[0.03] hover:bg-yellow-400/20 rounded-full text-white/40 hover:text-yellow-400 border border-white/5 hover:border-yellow-400/30 transition-all flex items-center justify-center group shadow-2xl" title="Adicionar Legenda">
                       <Type size={20} className="xl:hidden group-hover:scale-110 transition-transform" />
                       <Type size={24} className="hidden xl:block group-hover:scale-110 transition-transform" />
                    </button>
                                 </div>

           {/* Timeline Panel */}
          <div className="flex-1 md:h-[400px] border-t border-white/10 bg-[#020202] flex flex-col shrink-0 z-40 relative">
             {/* Toolbar */}
             <div className="h-10 md:h-16 border-b border-white/5 px-4 md:px-8 flex items-center justify-between shrink-0 bg-black/60 shadow-xl overflow-x-auto no-scrollbar">

                <div className="flex items-center gap-4 shrink-0">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-her-accent">Timeline Editor</h4>
                </div>
                
                <div className="flex items-center gap-4 xl:gap-8">
                   <div className="hidden xl:flex items-center gap-4">
                      <span className="text-[10px] text-her-muted uppercase font-bold tracking-widest">Zoom</span>
                      <input 
                        type="range" 
                        min="20" max="150" 
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(Number(e.target.value))}
                        className="w-48 h-1.5 bg-white/10 rounded-full appearance-none accent-her-accent cursor-pointer"
                      />
                   </div>
                   <div className="h-4 w-[1px] bg-white/10 hidden xl:block" />
                   <div className="flex gap-1 xl:gap-3">
                       <button className="p-2 xl:p-3 hover:bg-white/5 rounded-xl text-her-muted transition-all active:scale-90"><Settings size={16} className="xl:hidden" /><Settings size={18} className="hidden xl:block" /></button>
                   </div>
                </div>
             </div>

             {/* Tracks Area */}
             <div className="flex-1 flex overflow-hidden">
                {/* Labels Column */}
                <div className="w-16 md:w-40 border-r border-white/5 bg-black/40 flex flex-col pt-6 xl:pt-12 shrink-0">
                    <div className="h-[50px] xl:h-[90px] flex items-center px-4 xl:px-6 gap-2 xl:gap-4 opacity-50">
                        <Video size={14} className="xl:hidden" />
                        <Video size={18} className="hidden xl:block text-her-accent" />
                        <span className="text-[8px] xl:text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Vídeo</span>
                    </div>
                    <div className="h-[35px] xl:h-[70px] flex items-center px-4 xl:px-6 gap-2 xl:gap-4 opacity-50">
                        <Type size={14} className="xl:hidden" />
                        <Type size={18} className="hidden xl:block text-yellow-400" />
                        <span className="text-[8px] xl:text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Texto</span>
                    </div>
                    <div className="h-[40px] xl:h-[80px] flex items-center px-4 xl:px-6 gap-2 xl:gap-4 opacity-50">
                        <Music size={14} className="xl:hidden" />
                        <Music size={18} className="hidden xl:block text-blue-400" />
                        <span className="text-[8px] xl:text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Áudio</span>
                    </div>
                </div>

                {/* Main Scrolling Timeline */}
                <div 
                  ref={timelineRef}
                  onClick={handleTimelineClick}
                  className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative cursor-crosshair bg-black/60"
                >
                    <div className="h-full flex flex-col p-0 relative" style={{ minWidth: `${timeline.totalDuration * zoomLevel + 1000}px` }}>
                      
                      {/* Rulers */}
                      <div className="h-8 xl:h-12 flex items-end gap-2 opacity-30 pointer-events-none sticky top-0 bg-[#050505]/95 backdrop-blur-md z-20 border-b border-white/5">
                          {Array.from({ length: Math.ceil(timeline.totalDuration) + 50 }).map((_, i) => (
                            <div key={i} className="absolute flex flex-col items-start" style={{ left: `${i * zoomLevel}px` }}>
                              <div className={cn("w-[1.5px] bg-white", i % 10 === 0 ? "h-3 xl:h-4" : "h-1.5 xl:h-2")} />
                              {i % 5 === 0 && (
                                <span className="text-[8px] xl:text-[9px] -ml-2 mt-0.5 xl:mt-1 font-mono font-bold">{Math.floor(i/60)}:{(i%60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Video Track 1 */}
                      <div className="h-[50px] xl:h-[90px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-10 xl:h-16 bg-white/[0.01] border-y border-white/5" />
                          {timeline.clips.filter(c => c.type === 'video').map(clip => (
                            <div 
                              key={clip.id}
                              className="absolute h-10 xl:h-16 bg-her-accent/20 border border-her-accent/30 rounded-lg xl:rounded-2xl flex items-center px-3 xl:px-6 overflow-hidden group/clip hover:bg-her-accent/30 transition-all cursor-pointer shadow-xl"
                              style={{ 
                                left: `${clip.startTime * zoomLevel}px`, 
                                width: `${clip.duration * zoomLevel}px` 
                              }}
                            >
                              <div className="absolute inset-0 flex items-center gap-1 px-1 overflow-hidden pointer-events-none opacity-10">
                                  {Array.from({ length: Math.ceil((clip.duration * zoomLevel) / 40) }).map((_, i) => (
                                    <div key={i} className="min-w-[40px] xl:min-w-[80px] h-10 xl:h-14 bg-black/40 rounded-md xl:rounded-lg border border-white/5" />
                                  ))}
                              </div>
                              <div className="flex items-center gap-2 xl:gap-4 z-10">
                                <Video size={14} className="xl:hidden text-her-accent" />
                                <Video size={18} className="hidden xl:block text-her-accent" />
                                <span className="text-[9px] xl:text-[11px] font-bold text-her-accent truncate uppercase tracking-[0.1em] xl:tracking-[0.15em]">{clip.title}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeClip(clip.id);
                                }}
                                className="absolute right-1 xl:right-2 opacity-0 group-hover/clip:opacity-100 p-1.5 bg-black/40 hover:bg-red-500/80 rounded-lg text-white transition-all z-20"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Subtitles Track */}
                      <div className="h-[35px] xl:h-[70px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-7 xl:h-12 bg-white/[0.005] border-y border-white/5" />
                          {timeline.subtitles.map(sub => (
                            <div
                              key={sub.id}
                              className="absolute h-6 xl:h-10 bg-yellow-400/10 border border-yellow-400/20 rounded-md xl:rounded-xl flex items-center px-2 xl:px-4 overflow-hidden cursor-move group/sub hover:bg-yellow-400/30 transition-all"
                              style={{ 
                                left: `${sub.startTime * zoomLevel}px`, 
                                width: `${sub.duration * zoomLevel}px` 
                              }}
                            >
                              <span className="text-[8px] xl:text-[10px] text-yellow-200/70 truncate italic font-medium">{sub.text}</span>
                              <button className="absolute right-1 opacity-0 group-hover/sub:opacity-100 text-yellow-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                            </div>
                          ))}
                      </div>

                      {/* Audio Track */}
                      <div className="h-[50px] xl:h-[80px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-10 xl:h-14 bg-blue-500/5 border-y border-white/5" />
                          <div className="absolute h-10 xl:h-14 bg-blue-500/10 border border-blue-500/20 rounded-lg xl:rounded-[1.5rem] w-full max-w-[2000px] flex items-center px-4 xl:px-6 overflow-hidden opacity-30">
                            <div className="w-full h-full flex items-center gap-[2px] xl:gap-[3px]">
                              {Array.from({ length: 400 }).map((_, i) => (
                                <div key={i} className="bg-blue-400/40 w-[2px] xl:w-[3px] rounded-full" style={{ height: `${Math.random() * 70 + 30}%` }} />
                              ))}
                            </div>
                          </div>
                      </div>
                 </div>

                      {/* Playhead */}
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-her-accent shadow-[0_0_20px_rgba(var(--her-accent),1)] z-30 pointer-events-none"
                        style={{ left: `${timeline.currentTime * zoomLevel}px` }}
                      >
                          <div className="w-4 h-4 bg-her-accent rounded-sm absolute -top-2 -left-[7px] rotate-45 shadow-2xl border border-white/20" />
                          <div className="absolute top-0 bottom-0 left-[1px] w-[1px] bg-white/20" />
                      </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border border-white/10 min-w-[300px]",
              toast.type === 'success' ? "bg-green-500/20 text-green-400" : 
              toast.type === 'error' ? "bg-red-500/20 text-red-400" : 
              "bg-black/80 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : 
             toast.type === 'error' ? <Info size={20} /> : 
             <Loader2 size={20} className="animate-spin text-her-accent" />}
            <p className="text-sm font-bold tracking-tight">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
