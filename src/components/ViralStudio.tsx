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
  TrendingUp
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
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
}

export function ViralStudio({ initialScript, timeline, setTimeline, videoFile, apiKeys }: ViralStudioProps) {
  const [activeTab, setActiveTab] = useState<'clips' | 'subtitles' | 'audio' | 'effects'>('clips');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(60); // px per second
  const [volume, setVolume] = useState(100);
  const [scriptText, setScriptText] = useState('');
  
  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('entertainment');
  const [tone, setTone] = useState('energetic');
  const [platform, setPlatform] = useState('tiktok');

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

  const [activeSideTab, setActiveSideTab] = useState<'media' | 'script' | 'analyze'>('media');

  const generateViralScript = async (referenceContent?: string) => {
    const currentTopic = referenceContent ? "Baseado na referência analisada" : topic;
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if ((!currentTopic && !referenceContent) || !effectiveApiKey) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const prompt = referenceContent 
        ? `Use este conteúdo como REFERÊNCIA ESTRATÉGICA: "${referenceContent}". Crie um NOVO roteiro para ${platform}.`
        : `Crie um roteiro viral estratégico para ${platform}. Assunto: ${topic}. Nicho: ${niche}. Tom: ${tone}`;
      
      const finalPrompt = `${prompt} Responda em formato JSON com campos 'suggestedTitle' e 'sections' (array de {title, content, visualCue}).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      const fullText = data.sections.map((s: any) => `${s.title}: ${s.content}`).join('\n\n');
      setScriptText(fullText);
      setActiveSideTab('script');
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeVideo = async (file: File) => {
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if (!file || !effectiveApiKey) return;

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: effectiveApiKey });
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: "Analise este vídeo e identifique a estrutura do roteiro." }, { inlineData: { data: base64Data, mimeType: file.type } }] }]
      });
      setTranscription(result.text);
      setActiveSideTab('analyze');
    } catch (error) {
      console.error("Erro ao analisar vídeo:", error);
    } finally {
      setIsAnalyzing(false);
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
      <div className="absolute top-6 right-6 flex items-center gap-3 z-[60]">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <Save size={14} />
          <span className="hidden md:inline">Salvar Projeto</span>
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-her-accent text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-her-accent/20">
          <Download size={14} />
          <span>Exportar Final</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row-reverse overflow-hidden relative">
        {/* Right Side: Unified Tools Panel */}
        <div className="w-full xl:w-[420px] bg-[#050505]/50 backdrop-blur-3xl flex flex-col shrink-0 z-40 max-h-[400px] xl:max-h-none overflow-hidden relative">
           <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent hidden xl:block" />
           {/* Sidebar Tabs */}
           <div className="flex border-b border-white/5 p-4 gap-3">
              {[
                { id: 'media', icon: <Plus size={18} />, label: 'Mídia' },
                { id: 'script', icon: <Sparkles size={18} />, label: 'Roteiro' },
                { id: 'analyze', icon: <Zap size={18} />, label: 'Analise' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveSideTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-4 rounded-2xl transition-all gap-2",
                    activeSideTab === tab.id ? "bg-her-accent/20 text-her-accent shadow-[0_0_30px_rgba(var(--her-accent),0.1)] border border-her-accent/20" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tab.icon}
                  <span className="text-[11px] font-bold uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeSideTab === 'media' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} key="media" className="space-y-6">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-her-accent/50 hover:bg-her-accent/5 transition-all group"
                    >
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-her-accent transition-all group-hover:scale-110">
                        <Plus size={28} />
                      </div>
                      <div className="text-center">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">SUBIR VÍDEO</span>
                        <span className="block text-[9px] text-white/20 mt-1 uppercase tracking-widest font-mono">Formatos: MP4, MOV, WebM</span>
                      </div>
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="video/*" onChange={handleFileChange} />
                    
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-1 border-l-2 border-her-accent pl-3">Arquivos do Projeto</h5>
                       {videoUrl && (
                         <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
                            <div className="w-16 h-16 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
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
                       )}
                    </div>
                  </motion.div>
                )}

                {activeSideTab === 'script' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key="script" className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-white/20">Gerador Viral</h5>
                       <button 
                         onClick={() => generateViralScript()}
                         disabled={isGenerating || !topic}
                         className="text-[10px] font-bold text-her-accent uppercase hover:underline flex items-center gap-2"
                       >
                         {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                         Gerar
                       </button>
                    </div>
                    
                    <div className="space-y-3">
                       <p className="text-[9px] uppercase font-bold text-white/20 px-1">Seu Conceito</p>
                       <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: 3 erros ao investir no Reels..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] text-white h-24 resize-none focus:ring-1 focus:ring-her-accent/20 transition-all font-serif italic leading-relaxed"
                       />
                    </div>

                    <div className="h-[1px] bg-white/5 mx-1" />

                    <div className="flex flex-col gap-3">
                       <p className="text-[9px] uppercase font-bold text-white/20 px-1">Script Resultante</p>
                       <textarea 
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        placeholder="O roteiro aparecerá aqui..."
                        className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] text-white/80 font-serif italic leading-relaxed resize-none focus:ring-1 focus:ring-her-accent/20"
                       />
                    </div>
                  </motion.div>
                )}

                {activeSideTab === 'analyze' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key="analyze" className="space-y-4">
                    <div className="p-6 border border-dashed border-white/10 rounded-[2rem] text-center space-y-3 bg-white/[0.02]">
                       <Zap size={24} className="mx-auto text-her-accent" />
                       <p className="text-[9px] font-bold uppercase tracking-widest text-white">Inteligência Competitiva</p>
                       <p className="text-[8px] text-white/40 italic">Entenda o segredo dos vídeos que dominam o feed.</p>
                       
                       {transcription ? (
                         <div className="text-left p-3 bg-black rounded-xl border border-white/5 text-[9px] text-white/60 max-h-40 overflow-y-auto">
                            {transcription}
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             if (videoFile) analyzeVideo(videoFile);
                           }}
                           className="w-full py-2 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                         >
                            {isAnalyzing ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Analisar Vídeo Atual"}
                         </button>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Center Area: Player & Tools */}
        <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden relative">
          
          {/* Quick Tools Floating Panel */}
          <div className="absolute left-8 top-8 flex flex-col gap-4 z-40">
             {[
               { icon: <Maximize2 size={20} />, label: 'Ajustar Tela' },
               { icon: <Layout size={20} />, label: 'Formato (9:16)' },
               { icon: <Settings size={20} />, label: 'Configurações' }
             ].map((tool, i) => (
               <button key={i} className="p-4 bg-black/40 backdrop-blur-3xl border border-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all group relative shadow-2xl">
                 {tool.icon}
                 <span className="absolute left-full ml-4 px-5 py-2.5 bg-black/90 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap pointer-events-none uppercase tracking-widest font-bold border border-white/10 backdrop-blur-md">
                    {tool.label}
                 </span>
               </button>
             ))}
          </div>
          
          {/* Player Area */}
          <div className="flex-1 flex flex-col p-0 relative group">
             {/* Main Canvas Context */}
             <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--her-accent)_0%,_transparent_70%)] opacity-[0.06] pointer-events-none" />
                
                {/* Virtual Video Canvas / Real Video Element */}
                <div 
                  ref={playerRef}
                  className="aspect-[9/16] h-full max-h-full bg-white/[0.02] rounded-[2rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 hover:border-white/20"
                >
                   {videoUrl ? (
                     <video 
                       ref={videoRef}
                       src={videoUrl}
                       className="w-full h-full object-contain"
                       playsInline
                     />
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
               {/* Dynamic Float Controls */}
             <div className="flex flex-wrap items-center justify-between gap-6 px-4 py-8">
                <div className="flex items-center gap-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 px-10 py-5 rounded-[2.5rem] shadow-2xl mx-auto">
                   <div className="flex items-center gap-4 border-r border-white/5 pr-10">
                      <Volume2 size={18} className="text-white/20" />
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-her-accent" 
                      />
                   </div>
                   <div className="flex items-center gap-10">
                      <button className="text-white/20 hover:text-white transition-colors"><SkipBack size={28} /></button>
                      <button 
                        onClick={togglePlay}
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative group active:scale-90",
                          timeline.isPlaying ? "bg-white text-black" : "bg-her-accent text-white shadow-[0_0_50px_rgba(var(--her-accent),0.4)]"
                        )}
                      >
                         {timeline.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                      </button>
                      <button className="text-white/20 hover:text-white transition-colors"><SkipForward size={28} /></button>
                   </div>
                   <div className="flex items-center gap-4 border-l border-white/5 pl-10">
                      <div className="text-[16px] font-mono text-her-accent font-bold tracking-[0.2em] min-w-[85px]">
                        {Math.floor(timeline.currentTime / 60)}:{(timeline.currentTime % 60).toFixed(1).padStart(4, '0')}
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 absolute right-12 bottom-12">
                   <button onClick={handleSplit} className="w-16 h-16 bg-white/[0.03] hover:bg-her-accent/20 rounded-full text-white/40 hover:text-her-accent border border-white/5 hover:border-her-accent/30 transition-all flex items-center justify-center group shadow-2xl" title="Dividir Timeline">
                      <Scissors size={24} className="group-hover:rotate-12 transition-transform" />
                   </button>
                   <button onClick={addSubtitleAtCurrentTime} className="w-16 h-16 bg-white/[0.03] hover:bg-yellow-400/20 rounded-full text-white/40 hover:text-yellow-400 border border-white/5 hover:border-yellow-400/30 transition-all flex items-center justify-center group shadow-2xl" title="Adicionar Legenda">
                      <Type size={24} className="group-hover:scale-110 transition-transform" />
                   </button>
                </div>
             </div>
          </div>


          {/* Timeline Panel */}
          <div className="h-[300px] md:h-[400px] border-t border-white/10 bg-[#050505] flex flex-col shrink-0 z-40">
             {/* Toolbar */}
             <div className="h-16 border-b border-white/5 px-6 md:px-8 flex items-center justify-between shrink-0 bg-black/40">
                <div className="flex bg-white/5 p-1.5 rounded-2xl">
                   {['Vídeo', 'Áudio', 'Legendas', 'Efeitos'].map((tab) => (
                      <button 
                         key={tab}
                         className={cn(
                           "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                           activeTab.toLowerCase() === tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-her-muted hover:text-white"
                         )}
                      >
                        {tab}
                      </button>
                   ))}
                </div>
                
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] text-her-muted uppercase font-bold tracking-widest">Zoom da Linha do Tempo</span>
                      <input 
                        type="range" 
                        min="20" max="150" 
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(Number(e.target.value))}
                        className="w-48 h-1.5 bg-white/10 rounded-full appearance-none accent-her-accent cursor-pointer"
                      />
                   </div>
                   <div className="h-4 w-[1px] bg-white/10" />
                   <div className="flex gap-3">
                       <button className="p-3 hover:bg-white/5 rounded-xl text-her-muted transition-all"><Settings size={18} /></button>
                   </div>
                </div>
             </div>

             {/* Tracks Area */}
             <div className="flex-1 flex overflow-hidden">
                {/* Labels Column */}
                <div className="w-24 md:w-40 border-r border-white/5 bg-black/20 flex flex-col pt-12 shrink-0">
                    <div className="h-[90px] flex items-center px-6 gap-4 opacity-80">
                        <Video size={18} className="text-her-accent" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Vídeo</span>
                    </div>
                    <div className="h-[70px] flex items-center px-6 gap-4 opacity-80">
                        <Type size={18} className="text-yellow-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Texto</span>
                    </div>
                    <div className="h-[80px] flex items-center px-6 gap-4 opacity-80">
                        <Music size={18} className="text-blue-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Áudio</span>
                    </div>
                </div>

                {/* Main Scrolling Timeline */}
                <div 
                  ref={timelineRef}
                  onClick={handleTimelineClick}
                  className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative cursor-crosshair bg-black/40"
                >
                    <div className="h-full flex flex-col p-0 relative" style={{ minWidth: `${timeline.totalDuration * zoomLevel + 1000}px` }}>
                      
                      {/* Rulers */}
                      <div className="h-12 flex items-end gap-2 opacity-30 pointer-events-none sticky top-0 bg-[#050505]/95 backdrop-blur-md z-20 border-b border-white/10">
                          {Array.from({ length: Math.ceil(timeline.totalDuration) + 50 }).map((_, i) => (
                            <div key={i} className="absolute flex flex-col items-start" style={{ left: `${i * zoomLevel}px` }}>
                              <div className={cn("w-[2px] bg-white", i % 10 === 0 ? "h-4" : "h-2")} />
                              {i % 5 === 0 && (
                                <span className="text-[9px] -ml-2 mt-1 font-mono font-bold">{Math.floor(i/60)}:{(i%60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Video Track 1 */}
                      <div className="h-[90px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-16 bg-white/[0.02] border-y border-white/5" />
                          {timeline.clips.filter(c => c.type === 'video').map(clip => (
                            <div 
                              key={clip.id}
                              className="absolute h-16 bg-her-accent/20 border border-her-accent/40 rounded-2xl flex items-center px-6 overflow-hidden group/clip hover:bg-her-accent/30 transition-all cursor-pointer shadow-2xl"
                              style={{ 
                                left: `${clip.startTime * zoomLevel}px`, 
                                width: `${clip.duration * zoomLevel}px` 
                              }}
                            >
                              <div className="absolute inset-0 flex items-center gap-1 px-1 overflow-hidden pointer-events-none opacity-20">
                                  {Array.from({ length: Math.ceil((clip.duration * zoomLevel) / 80) }).map((_, i) => (
                                    <div key={i} className="min-w-[80px] h-14 bg-black/40 rounded-lg border border-white/5" />
                                  ))}
                              </div>
                              <div className="flex items-center gap-4 z-10">
                                <Video size={18} className="text-her-accent" />
                                <span className="text-[11px] font-bold text-her-accent truncate uppercase tracking-[0.15em]">{clip.title}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeClip(clip.id);
                                }}
                                className="absolute right-2 opacity-0 group-hover/clip:opacity-100 p-1.5 bg-black/40 hover:bg-red-500/80 rounded-lg text-white transition-all z-20"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Subtitles Track */}
                      <div className="h-[70px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-12 bg-white/[0.01] border-y border-white/5" />
                          {timeline.subtitles.map(sub => (
                            <div
                              key={sub.id}
                              className="absolute h-10 bg-yellow-400/20 border border-yellow-400/30 rounded-xl flex items-center px-4 overflow-hidden cursor-move group/sub hover:bg-yellow-400/30 transition-all"
                              style={{ 
                                left: `${sub.startTime * zoomLevel}px`, 
                                width: `${sub.duration * zoomLevel}px` 
                              }}
                            >
                              <span className="text-[10px] text-yellow-200/90 truncate italic font-medium">{sub.text}</span>
                              <button className="absolute right-2 opacity-0 group-hover/sub:opacity-100 text-yellow-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                            </div>
                          ))}
                      </div>

                      {/* Audio Track */}
                      <div className="h-[80px] flex items-center relative group">
                          <div className="absolute left-0 right-0 h-14 bg-blue-500/5 border-y border-white/5" />
                          <div className="absolute h-14 bg-blue-500/10 border border-blue-500/20 rounded-[1.5rem] w-full max-w-[2000px] flex items-center px-6 overflow-hidden opacity-40">
                            <div className="w-full h-full flex items-center gap-[3px]">
                              {Array.from({ length: 400 }).map((_, i) => (
                                <div key={i} className="bg-blue-400/40 w-[3px] rounded-full" style={{ height: `${Math.random() * 70 + 30}%` }} />
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
    </div>
  );
}
