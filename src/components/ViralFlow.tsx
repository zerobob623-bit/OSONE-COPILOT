import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  Target, 
  Megaphone, 
  MessageSquare, 
  Zap, 
  Loader2, 
  Copy, 
  Check, 
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  Clock,
  Upload,
  FileSearch,
  FileText,
  BrainCircuit,
  ArrowRight,
  Menu,
  Edit3,
  Scissors
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn, safeJsonParse } from '../lib/utils';
import { VideoTimelineState } from '../types';

interface ScriptSection {
  title: string;
  content: string;
  visualCue: string;
}

interface ViralScript {
  id: string;
  topic: string;
  suggestedTitle: string;
  thumbnailStrategy: string;
  sections: ScriptSection[];
  imageUrl?: string;
  isReferenceBased?: boolean;
}

export function ViralFlow({ 
  apiKeys, 
  timeline, 
  setTimeline,
  onEditorClick,
  onMenuClick,
  onBack
}: { 
  apiKeys: { gemini: string };
  timeline: VideoTimelineState;
  setTimeline: React.Dispatch<React.SetStateAction<VideoTimelineState>>;
  onEditorClick?: () => void;
  onMenuClick?: () => void;
  onBack?: () => void;
}) {
  const [selectedScript, setSelectedScript] = useState<ViralScript | null>(null);
  const [isHubCollapsed, setIsHubCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'create' | 'analyze'>('create');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Common State
  const [activeTab, setActiveTab] = useState<'create' | 'analyze'>('create');
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('entertainment');
  const [tone, setTone] = useState('energetic');
  const [platform, setPlatform] = useState('tiktok');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scripts, setScripts] = useState<ViralScript[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const niches = [
    { id: 'entertainment', name: 'Entretenimento', icon: <Video size={14} /> },
    { id: 'education', name: 'Educação / Tutorial', icon: <TrendingUp size={14} /> },
    { id: 'finance', name: 'Finanças / Business', icon: <Target size={14} /> },
    { id: 'lifestyle', name: 'Lifestyle / Vlog', icon: <Clock size={14} /> },
  ];

  const tones = [
    { id: 'energetic', name: 'Energético' },
    { id: 'educational', name: 'Educativo' },
    { id: 'funny', name: 'Engraçado' },
    { id: 'emotional', name: 'Emocional' },
  ];

  const platforms = [
    { id: 'tiktok', name: 'TikTok' },
    { id: 'shorts', name: 'YouTube Shorts' },
    { id: 'reels', name: 'Instagram Reels' },
    { id: 'youtube', name: 'YouTube (Long)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setTranscription(null);
    }
  };

  const analyzeVideo = async () => {
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if (!videoFile || !effectiveApiKey) return;

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: effectiveApiKey });

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(videoFile);
      });

      const base64Data = await base64Promise;

      const prompt = "Analise este vídeo. Forneça uma transcrição completa das falas e identifique a estrutura do roteiro (Hook, Retenção, CTA).";

      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: videoFile.type
                }
              }
            ]
          }
        ]
      });

      setTranscription(result.text);
    } catch (error) {
      console.error("Erro ao analisar vídeo:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateViralScript = async (referenceContent?: string) => {
    const currentTopic = referenceContent ? "Baseado na referência analisada" : topic;
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if ((!currentTopic && !referenceContent) || !effectiveApiKey) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const prompt = referenceContent 
        ? `Use este conteúdo como REFERÊNCIA ESTRATÉGICA (vibe, estrutura, gatilhos): "${referenceContent}".
           Crie um NOVO roteiro totalmente original, mas com a mesma 'PEGADA' funcional e estilo de retenção para ${platform}.
           Nicho: ${niche}
           Tom: ${tone}`
        : `Crie um roteiro viral estratégico para ${platform}.
           Assunto: ${topic}
           Nicho: ${niche}
           Tom: ${tone}`;
      
      const viralRules = `
      REGRAS DE VIRALIDADE (Baseadas em análise de 52k canais):
      1. TÍTULO: Máximo 5 palavras (~30 caracteres). Simples e direto. NÃO use números. Use gatilhos de NEGATIVIDADE ou URGÊNCIA (ex: 'Não faça isso', 'O erro fatal').
      2. CONTEÚDO: Se for educativo, apresente como ENTRETENIMENTO. Foco total em retenção.
      3. DURACÃO: Se for YouTube Long, sugira estrutura para 18-24 minutos.
      4. THUMBNAIL: SEM TEXTO. Deve usar cores vibrantes (Ciano é recomendado).
      `;

      const finalPrompt = `${prompt}
      ${viralRules}
      O roteiro deve ter 3 partes: GANCHO (Hook), CORPO (Body) e CHAMADA (CTA).
      Responda em formato JSON:
      {
        "suggestedTitle": "Title here (max 5 words, simple, no numbers, negative/urgent)",
        "thumbnailStrategy": "Explanations of the thumbnail visual strategy following the rules (cyan colors, no text)",
        "sections": [
          { "title": "GANCHO", "content": "texto...", "visualCue": "sugestão visual em português" },
          { "title": "CORPO", "content": "texto...", "visualCue": "sugestão visual em português" },
          { "title": "CTA", "content": "texto...", "visualCue": "sugestão visual em português" }
        ],
        "imagePrompt": "A highly detailed image prompt in ENGLISH for AI generation. Must follow: NO TEXT in image, use vibrant cyan and bright lighting, simple composition."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = safeJsonParse(response.text || "{}", {
        suggestedTitle: "Título",
        thumbnailStrategy: "",
        sections: [],
        imagePrompt: ""
      });
      
      const newScript: ViralScript = {
        id: Math.random().toString(36).substr(2, 9),
        topic: referenceContent ? "Roteiro via Inteligência de Referência" : topic,
        suggestedTitle: data.suggestedTitle,
        thumbnailStrategy: data.thumbnailStrategy,
        sections: data.sections,
        imageUrl: '', // We'll skip image gen for now to speed up
        isReferenceBased: !!referenceContent
      };

      setScripts(prev => [newScript, ...prev]);
      setActiveTab('create');
      setSelectedScript(newScript);
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-black text-white">
       {/* Background Effects */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(var(--her-accent),0.05)_0%,_transparent_50%)] pointer-events-none" />
       
       {/* Header */}
        <div className="h-16 md:h-20 px-10 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0 z-20">
           <div className="flex items-center gap-6">
              <button onClick={onBack} className="p-4 hover:bg-white/5 transition-all border-r border-white/5">
                 <Menu size={20} className="md:hidden" onClick={onMenuClick} />
                 <ArrowRight size={24} className="hidden md:block rotate-180" />
              </button>
              <div>
                 <h1 className="text-xl md:text-2xl font-bold tracking-tight">Fluxo Viral</h1>
                 <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em] font-medium">Inteligência de Conteúdo</p>
              </div>
           </div>

          <button 
             onClick={onEditorClick}
             className="px-8 py-0 h-full bg-her-accent text-white flex items-center gap-3 hover:bg-her-accent/90 transition-all font-black uppercase tracking-[0.2em] text-xs md:text-sm active:scale-95 group shadow-2xl border-l border-white/10"
          >
             <Scissors size={18} className="group-hover:rotate-12 transition-transform" />
             <span className="hidden sm:inline">Abrir Editor de Vídeo</span>
             <span className="sm:hidden">Editor</span>
          </button>
       </div>

       <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main Controls - Create/Analyze */}
          <div className="w-full md:w-[450px] border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar bg-black/20 p-4 md:p-8 shrink-0">
             <div className="flex bg-white/5 p-1 mb-8 shrink-0">
                <button 
                  onClick={() => setActiveTab('create')}
                  className={cn(
                    "flex-1 py-4 px-6 text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2",
                    activeTab === 'create' ? "bg-white text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <Sparkles size={16} />
                  Criar Roteiro
                </button>
                <button 
                  onClick={() => setActiveTab('analyze')}
                  className={cn(
                    "flex-1 py-4 px-6 text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2",
                    activeTab === 'analyze' ? "bg-white text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <BrainCircuit size={16} />
                  IA Analytics
                </button>
             </div>

             {activeTab === 'create' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Sobre o que é o vídeo?</label>
                      <textarea 
                         value={topic}
                         onChange={(e) => setTopic(e.target.value)}
                         placeholder="Ex: Como economizar R$1.000 por mês ou Tutorial de maquiagem rápida..."
                         className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-her-accent/50 focus:ring-1 focus:ring-her-accent/20 transition-all placeholder:text-white/10 resize-none leading-relaxed"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Nicho</label>
                         <div className="relative">
                            <select 
                               value={niche}
                               onChange={(e) => setNiche(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs appearance-none focus:outline-none focus:border-her-accent/50"
                            >
                               {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                            </select>
                            <TrendingUp size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Tom</label>
                         <div className="relative">
                            <select 
                               value={tone}
                               onChange={(e) => setTone(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs appearance-none focus:outline-none focus:border-her-accent/50"
                            >
                               {tones.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <Sparkles size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Plataforma Principal</label>
                      <div className="grid grid-cols-2 gap-2">
                         {platforms.map(p => (
                            <button 
                               key={p.id}
                               onClick={() => setPlatform(p.id)}
                               className={cn(
                                 "px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                                 platform === p.id 
                                    ? "bg-her-accent/10 border-her-accent/40 text-her-accent" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                               )}
                            >
                               {p.name}
                            </button>
                         ))}
                      </div>
                   </div>

                   <button 
                      onClick={() => generateViralScript()}
                      disabled={!topic || isGenerating}
                      className="w-full py-5 bg-white text-black rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-her-accent hover:text-white transition-all disabled:opacity-20 disabled:grayscale relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                   >
                      {isGenerating ? (
                         <div className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin" size={20} />
                            <span>Calculando Algoritmo...</span>
                         </div>
                      ) : (
                         <div className="flex items-center justify-center gap-3">
                            <Zap size={20} fill="currentColor" />
                            <span>Gerar Script Viral</span>
                         </div>
                      )}
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none" />
                   </button>
                </div>
             ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video md:aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-white/[0.08] hover:border-her-accent/30 transition-all group"
                   >
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFileChange} 
                         accept="video/*" 
                         className="hidden" 
                      />
                      {videoPreview ? (
                         <video src={videoPreview} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                         <>
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                               <Upload size={28} className="text-white/40 group-hover:text-her-accent transition-colors" />
                            </div>
                            <h3 className="font-bold mb-2">Análise Estratégica</h3>
                            <p className="text-xs text-white/30 leading-relaxed">Arraste um vídeo de referência para que a IA extraia o roteiro, hooks e CTAs.</p>
                         </>
                      )}
                   </div>

                   {videoFile && !transcription && (
                      <button 
                         onClick={analyzeVideo}
                         disabled={isAnalyzing}
                         className="w-full py-5 bg-her-accent text-white rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_30px_rgba(var(--her-accent),0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                         {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                         {isAnalyzing ? "Mapeando Padrões..." : "Iniciar Engenharia Reversa"}
                      </button>
                   )}

                   {transcription && (
                      <div className="space-y-6">
                         <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                            <h4 className="text-[10px] uppercase font-bold text-her-accent mb-4 tracking-widest flex items-center gap-2">
                               <FileText size={14} />
                               Inteligência Extraída
                            </h4>
                            <p className="text-sm leading-relaxed text-white/60 line-clamp-6">{transcription}</p>
                         </div>
                         <button 
                            onClick={() => generateViralScript(transcription)}
                            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-her-accent hover:text-white transition-all flex items-center justify-center gap-2"
                         >
                            <TrendingUp size={16} />
                            Criar Novo Baseado nesta Ref
                         </button>
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* Results Area */}
          <div className="flex-1 bg-black/40 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
             {!selectedScript && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                   <Target size={64} className="mb-6" />
                   <h2 className="text-2xl font-light italic mb-2 tracking-widest">SINAL NÃO DETECTADO</h2>
                   <p className="text-sm">Inicie a criação para manifestar o script no hub.</p>
                </div>
             )}

             <AnimatePresence mode="wait">
                {selectedScript && (
                   <motion.div 
                      key={selectedScript.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full space-y-8 pb-20"
                   >
                       {/* Script Card Header */}
                       <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden p-6 md:p-10 relative">
                          <div className="absolute top-0 right-0 p-8">
                             <div className="w-12 h-12 bg-her-accent/20 rounded-full flex items-center justify-center text-her-accent animate-pulse">
                                <Zap size={24} />
                             </div>
                          </div>
                          
                          <div className="w-full">
                             <h2 className="text-2xl md:text-4xl font-black italic mb-4 leading-tight">"{selectedScript.suggestedTitle}"</h2>
                             <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold text-white/40 border border-white/5">Nicho: {niche}</span>
                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold text-white/40 border border-white/5">Tom: {tone}</span>
                                <span className="px-3 py-1 bg-her-accent/10 rounded-full text-[10px] uppercase font-bold text-her-accent border border-her-accent/10">{platform} Optimized</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                             <div className="space-y-4">
                                <h3 className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Estratégia de Capa (Thumbnail)</h3>
                                <p className="text-sm leading-relaxed text-white/60 bg-black/40 p-5 rounded-2xl border border-white/5 italic">
                                   {selectedScript.thumbnailStrategy}
                                </p>
                             </div>
                          </div>
                       </div>

                       {/* Script Content */}
                       <div className="space-y-4">
                          <h3 className="text-[10px] uppercase font-bold text-white/30 tracking-widest px-4">Estrutura do Roteiro</h3>
                          <div className="space-y-4">
                             {selectedScript.sections.map((section, idx) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex gap-6 md:gap-8 group hover:bg-white/[0.04] transition-all">
                                   <div className="shrink-0 flex flex-col items-center">
                                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black italic text-white/20 group-hover:text-her-accent transition-colors">
                                         0{idx + 1}
                                      </div>
                                      <div className="w-px flex-1 bg-white/5 my-4" />
                                   </div>
                                   <div className="flex-1 space-y-6">
                                      <div className="flex items-center justify-between">
                                         <span className="text-[10px] uppercase font-black text-her-accent tracking-[0.2em]">{section.title}</span>
                                         <button 
                                            onClick={() => copyToClipboard(`${selectedScript.id}-${idx}`, section.content)}
                                            className="p-2 hover:bg-white/5 rounded-full transition-all text-white/20 hover:text-white"
                                         >
                                            {copiedId === `${selectedScript.id}-${idx}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                         </button>
                                      </div>
                                      <p className="text-lg md:text-xl font-light italic leading-relaxed text-white/90">
                                         {section.content}
                                      </p>
                                      <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                         <ImageIcon size={14} className="text-white/20" />
                                         <span className="text-[10px] text-white/40 italic">{section.visualCue}</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Action Footer */}
                       <div className="flex items-center justify-center gap-4 pt-8">
                          <button 
                             onClick={() => copyToClipboard(selectedScript.id, selectedScript.sections.map(s => `${s.title}: ${s.content}`).join('\n\n'))}
                             className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3"
                          >
                             {copiedId === selectedScript.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                             Copiar Roteiro Completo
                          </button>
                          <button 
                             onClick={onEditorClick}
                             className="px-8 py-4 bg-her-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_20px_50px_rgba(var(--her-accent),0.3)] transition-all flex items-center gap-3"
                          >
                             <Scissors size={18} />
                             Iniciar Edição
                          </button>
                       </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
       </div>
    </div>
  );
}
