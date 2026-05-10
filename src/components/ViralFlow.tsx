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
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

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

export function ViralFlow({ apiKeys }: { apiKeys: { gemini: string } }) {
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
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
        model: "gemini-2.5-flash",
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
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text);
      
      // Generate individual visual reference
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [{ text: `${data.imagePrompt}. Cinematic, modern, 8k, viral energy.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

      let imageUrl = '';
      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      const newScript: ViralScript = {
        id: Math.random().toString(36).substr(2, 9),
        topic: referenceContent ? "Roteiro via Inteligência de Referência" : topic,
        suggestedTitle: data.suggestedTitle,
        thumbnailStrategy: data.thumbnailStrategy,
        sections: data.sections,
        imageUrl,
        isReferenceBased: !!referenceContent
      };

      setScripts(prev => [newScript, ...prev]);
      setActiveTab('create');
      if (referenceContent) {
        // Notification logic should be handled by App.tsx, but UI feedback is good
      }
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-7xl flex-1 px-4 md:px-8 pb-4 md:pb-8 flex flex-col gap-6"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-her-accent/20 flex items-center justify-center text-her-accent shadow-lg shadow-her-accent/5">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-serif italic text-her-ink">ViralFlow Hub</h2>
            <p className="text-xs text-her-muted opacity-60 uppercase tracking-widest font-bold">Criação & Análise Estratégica</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'create' ? "bg-her-ink text-her-bg shadow-lg" : "text-her-ink/40 hover:text-her-ink"
            )}
          >
            <Sparkles size={14} />
            Gerar Roteiro
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'analyze' ? "bg-her-ink text-her-bg shadow-lg" : "text-her-ink/40 hover:text-her-ink"
            )}
          >
            <FileSearch size={14} />
            Analisar Referência
          </button>
        </div>
      </div>
      
      {/* Viral Intelligence Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Otimização de Cliques', value: 'Máximo 5 palavras, zero números.', icon: <Target size={14} />, color: 'text-her-accent' },
          { label: 'Efeito Viral', value: 'Quebrar padrões: 10x views habituais.', icon: <TrendingUp size={14} />, color: 'text-green-400' },
          { label: 'Duração Ideal', value: '18-24 minutos (YouTube Long).', icon: <Clock size={14} />, color: 'text-blue-400' },
          { label: 'Gatilho Psicológico', value: 'Negatividade gera +22% cliques.', icon: <Zap size={14} />, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-[2rem] flex flex-col gap-2">
            <div className={cn("flex items-center gap-2 font-bold uppercase tracking-widest text-[9px]", stat.color)}>
              {stat.icon}
              {stat.label}
            </div>
            <p className="text-xs text-her-ink/80 font-medium italic font-serif">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8 pb-12 flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Configuration Area */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-inner">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-her-ink/60 mb-2">
                    <Megaphone size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Tema ou Conceito</span>
                  </div>
                  <textarea 
                    placeholder="Sobre o que será o seu próximo vídeo viral?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-lg text-her-ink placeholder:text-her-ink/10 min-h-[120px] resize-none focus:ring-1 focus:ring-her-accent/20 transition-all font-serif italic"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-her-muted/60 block px-1">Plataforma</span>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                            platform === p.id 
                              ? "bg-her-accent/10 text-her-accent border border-her-accent/20 shadow-md" 
                              : "bg-white/5 text-her-ink/40 border border-transparent hover:bg-white/10"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-her-muted/60 block px-1">Nicho</span>
                    <div className="grid grid-cols-2 gap-2">
                      {niches.map(n => (
                        <button
                          key={n.id}
                          onClick={() => setNiche(n.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border shrink-0",
                            niche === n.id 
                              ? "bg-her-accent/10 border-her-accent/30 text-her-accent" 
                              : "bg-white/5 border-transparent text-her-ink/40 hover:bg-white/10"
                          )}
                        >
                          {n.icon}
                          <span className="truncate">{n.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-her-muted/60 block px-1">Tom de Voz</span>
                    <div className="flex flex-wrap gap-2">
                      {tones.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            tone === t.id 
                              ? "bg-her-ink text-her-bg border-her-ink shadow-lg" 
                              : "bg-white/5 text-her-ink/40 border-transparent hover:bg-white/10"
                          )}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => generateViralScript()}
                  disabled={isGenerating || !topic}
                  className={cn(
                    "w-full py-6 bg-her-accent text-white rounded-[2rem] font-serif italic text-xl flex items-center justify-center gap-3 transition-all hover:shadow-2xl hover:shadow-her-accent/20 disabled:opacity-30",
                    isGenerating && "animate-pulse"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Orquestrando Viralidade...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Gerar Roteiro Inédito
                    </>
                  )}
                </button>
              </div>

              {/* Results Stream */}
              <div className="space-y-12">
                <AnimatePresence mode="popLayout">
                  {scripts.map((script) => (
                    <motion.div
                      key={script.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl group hover:border-white/20 transition-colors"
                    >
                      {/* Visual Preview */}
                      <div className="w-full md:w-80 aspect-[9/16] md:aspect-auto bg-her-ink/10 relative shrink-0">
                        {script.imageUrl ? (
                          <img 
                            src={script.imageUrl} 
                            alt="Referência Visual" 
                            className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-20">
                            <ImageIcon size={48} />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Visualizando...</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/95 to-transparent">
                          <div className="flex items-center gap-2 text-her-accent mb-2">
                             {script.isReferenceBased ? <BrainCircuit size={12} /> : <Sparkles size={12} />}
                             <p className="text-[10px] font-bold uppercase tracking-widest">{script.isReferenceBased ? "IA de Referência" : "Gerado por IA"}</p>
                          </div>
                          <p className="text-white text-xs italic opacity-80 leading-relaxed font-serif">Referência visual baseada em tendências de alta retenção.</p>
                        </div>
                      </div>

                      {/* Script Content */}
                      <div className="flex-1 p-8 md:p-12 flex flex-col gap-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-her-accent mb-2">Título Estratégico (Master-Hack)</p>
                            <h3 className="font-serif italic text-3xl text-her-ink mb-1">{script.suggestedTitle}</h3>
                            <div className="h-[1px] w-16 bg-her-accent/20" />
                          </div>
                          <button 
                            onClick={() => copyToClipboard(script.id, `TÍTULO: ${script.suggestedTitle}\n\n${script.sections.map(s => `${s.title.toUpperCase()}:\n${s.content}`).join('\n\n')}\n\nESTRATÉGIA THUMB: ${script.thumbnailStrategy}`)}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-her-muted hover:text-her-ink h-fit"
                          >
                            {copiedId === script.id ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                          </button>
                        </div>

                        {/* Viral Insights Badges */}
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col gap-1.5 p-4 bg-her-accent/5 border border-her-accent/10 rounded-2xl flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 text-her-accent">
                               <ImageIcon size={14} />
                               <span className="text-[9px] font-bold uppercase tracking-widest">Estratégia de Thumbnail</span>
                            </div>
                            <p className="text-[11px] text-her-ink/70 leading-relaxed italic">{script.thumbnailStrategy}</p>
                          </div>
                          <div className="flex flex-col gap-1.5 p-4 bg-white/5 border border-white/10 rounded-2xl flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 text-her-muted">
                               <Zap size={14} />
                               <span className="text-[9px] font-bold uppercase tracking-widest">Algoritmo (52k Study)</span>
                            </div>
                            <p className="text-[11px] text-her-ink/70 leading-relaxed italic">Foco em Negatividade/Curiosidade. Zero números no título. Brilho alto.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                          {script.sections.map((section, idx) => (
                            <div key={idx} className="relative pl-10">
                              <div className="absolute left-0 top-0 text-her-accent opacity-20 font-serif italic text-4xl">
                                0{idx + 1}
                              </div>
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-her-accent mb-4 border-b border-her-accent/10 pb-2 flex items-center justify-between">
                                {section.title}
                                <span className="opacity-40 text-[8px]">{section.visualCue}</span>
                              </h4>
                              <p className="text-lg text-her-ink/90 leading-relaxed font-medium">
                                {section.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {scripts.length === 0 && !isGenerating && (
                  <div className="py-24 flex flex-col items-center justify-center text-center opacity-20">
                    <TrendingUp size={64} className="mb-6" />
                    <h3 className="text-2xl font-serif italic">Fluxo Viral</h3>
                    <p className="text-sm max-w-sm mt-2">Escolha um tema ou analise uma referência para começar a criar.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8 flex-1"
            >
              <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <div 
                  className={cn(
                    "flex-1 bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-8 transition-all relative overflow-hidden min-h-[300px]",
                    !videoPreview && "hover:bg-white/10 hover:border-her-accent/30 cursor-pointer"
                  )}
                  onClick={() => !videoPreview && fileInputRef.current?.click()}
                >
                  {videoPreview ? (
                    <video 
                      src={videoPreview} 
                      controls 
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-her-accent/10 flex items-center justify-center text-her-accent">
                        <Upload size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif italic text-her-ink">Referência de Vídeo</h3>
                        <p className="text-sm text-her-muted mt-2 max-w-xs">Análise técnica de vídeos validados para replicar o sucesso.</p>
                      </div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                  
                  {videoPreview && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setVideoPreview(null); setVideoFile(null); setTranscription(null); }}
                      className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <button
                  onClick={analyzeVideo}
                  disabled={!videoFile || isAnalyzing}
                  className={cn(
                    "w-full py-5 bg-her-ink text-her-bg rounded-[2rem] font-serif italic text-lg flex items-center justify-center gap-3 transition-all hover:shadow-2xl hover:shadow-her-ink/20 disabled:opacity-30",
                    isAnalyzing && "animate-pulse"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Extraindo Inteligência...
                    </>
                  ) : (
                    <>
                      <FileSearch size={20} />
                      Analisar Script & Retenção
                    </>
                  )}
                </button>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={18} className="text-her-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-her-ink/60">Análise Estratégica</span>
                  </div>
                  {transcription && (
                    <button 
                      onClick={() => generateViralScript(transcription)}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-1.5 bg-her-accent text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-her-accent/20"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      Usar como Referência
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {!transcription && !isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                      <FileText size={48} className="mb-4" />
                      <h3 className="text-lg font-serif italic">Aguardando vídeo</h3>
                      <p className="text-xs mt-2">A transcrição e análise aparecerão aqui.</p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center gap-6 py-12">
                      <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="w-3 h-3 rounded-full bg-her-accent"
                          />
                        ))}
                      </div>
                      <p className="text-sm font-serif italic text-her-muted">Desconstruindo o vídeo em dados...</p>
                    </div>
                  )}

                  {transcription && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="bg-her-accent/5 border border-her-accent/10 p-5 rounded-2xl mb-6">
                        <div className="flex items-center gap-2 text-her-accent mb-2">
                          <Check size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Sucesso</span>
                        </div>
                        <p className="text-xs text-her-ink/70 leading-relaxed italic font-serif">
                          "DICA: Clique no botão acima para criar um roteiro inédito usando esta estrutura como base validada."
                        </p>
                      </div>
                      <div className="prose prose-invert prose-her max-w-none">
                        <div className="whitespace-pre-wrap text-her-ink/80 leading-relaxed text-sm font-medium">
                          {transcription}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
