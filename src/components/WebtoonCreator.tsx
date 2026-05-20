import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon, 
  Languages, 
  Palette, 
  Type as TypeIcon,
  UserPlus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn, safeJsonParse } from '../lib/utils';
import { WebtoonProject, Character, WebtoonPanel } from '../types';

interface WebtoonCreatorProps {
  apiKeys: { gemini: string };
}

const STYLES = [
  { id: 'comic', name: 'Quadrinhos (Comic)', description: 'Estilo clássico de HQ ocidental' },
  { id: 'webtoon', name: 'Webtoon (Manhwa)', description: 'Estilo digital coreano moderno' },
  { id: 'manga', name: 'Manga', description: 'Estilo clássico japonês P&B ou colorido' },
  { id: '3d', name: '3D / Pixar', description: 'Renderização 3D estilizada' },
  { id: '2d', name: '2D / Anime', description: 'Estilo tradicional de animação' },
  { id: 'realistic', name: 'Realista', description: 'Fotorealismo cinematográfico' },
  { id: 'sketch', name: 'Esboço (Sketch)', description: 'Arte conceitual feita à mão' },
];

const LANGUAGES = [
  { id: 'pt', name: 'Português' },
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'jp', name: '日本語 (Japonês)' },
  { id: 'kr', name: '한국어 (Coreano)' },
];

export function WebtoonCreator({ apiKeys }: WebtoonCreatorProps) {
  const [project, setProject] = useState<WebtoonProject>({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    idea: '',
    characters: [],
    style: 'webtoon',
    language: 'pt',
    panels: [],
    createdAt: Date.now(),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'idle' | 'script' | 'panels'>('idle');
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);

  const addCharacter = () => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      characteristics: '',
    };
    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }));
  };

  const removeCharacter = (id: string) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setProject(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const generateFullWebtoon = async () => {
    if (!project.title || !project.idea) {
      alert('Por favor, preencha o título e a ideia da história.');
      return;
    }

    const effectiveApiKey = apiKeys.gemini;
    if (!effectiveApiKey || effectiveApiKey.trim() === '') {
      alert("Por favor, vincule sua própria chave API Gemini nas configurações para gerar histórias.");
      return;
    }

    setIsGenerating(true);
    setGenerationStep('script');
    
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const scriptPrompt = `Crie um roteiro de 4 painéis para um Webtoon intitulado "${project.title}".
      Ideia central: ${project.idea}
      Personagens: ${project.characters.map(c => `${c.name} (${c.characteristics})`).join(', ')}
      Idioma: ${project.language}
      Estilo visual: ${project.style}

      Responda EXCLUSIVAMENTE em formato JSON seguindo este esquema:
      {
        "panels": [
          {
            "panelNumber": 1,
            "dialogue": "fala do personagem",
            "narration": "descrição da cena para narração",
            "imagePrompt": "prompt detalhado em INGLÊS para gerar a imagem deste painel, descrevendo o cenário, os personagens presentes e a ação"
          }
        ]
      }`;

      const scriptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: scriptPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const scriptData = safeJsonParse(scriptResponse.text, { panels: [] });
      const initialPanels: WebtoonPanel[] = scriptData.panels.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        panelNumber: p.panelNumber,
        dialogue: p.dialogue,
        narration: p.narration,
        imagePrompt: p.imagePrompt
      }));

      setProject(prev => ({ ...prev, panels: initialPanels }));
      setGenerationStep('panels');

      const updatedPanels = [...initialPanels];
      for (let i = 0; i < updatedPanels.length; i++) {
        setCurrentPanelIndex(i);
        const panel = updatedPanels[i];
        
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `${panel.imagePrompt}. Style: ${project.style}. High quality, consistent characters.` }]
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4"
            }
          }
        });

        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            updatedPanels[i] = {
              ...updatedPanels[i],
              imageUrl: `data:image/png;base64,${part.inlineData.data}`
            };
            setProject(prev => ({
              ...prev,
              panels: [...updatedPanels]
            }));
            break;
          }
        }
      }

    } catch (error) {
      console.error("Erro na geração do Webtoon:", error);
      alert("Houve um erro ao gerar sua história. Verifique sua conexão e tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('idle');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full flex-1 flex flex-col min-h-0 bg-transparent"
    >
      {/* Refined Artistic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pb-12 border-b border-her-ink/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-her-accent/10 rounded-lg">
              <Sparkles size={18} className="text-her-accent" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-her-accent uppercase">Creative Engine v3.0</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-her-ink">
              Canvas <span className="text-her-accent">Criativo</span>
            </h2>
            <p className="text-sm font-sans text-her-muted w-full leading-relaxed">
              Transforme ideias em sequências visuais cinematográficas. Nossa IA traduz conceitos abstratos em narrativas sequenciais de tirar o fôlego.
            </p>
          </div>
        </div>

        <button 
          onClick={generateFullWebtoon}
          disabled={isGenerating}
          className={cn(
            "group relative px-8 py-5 bg-her-accent text-white overflow-hidden transition-all duration-500 rounded-2xl active:scale-95 disabled:opacity-50 shadow-lg shadow-her-accent/20",
            "flex items-center justify-center gap-4"
          )}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="relative flex items-center gap-3">
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span className="text-lg font-medium tracking-tight">
                  {generationStep === 'script' ? 'Criando Roteiro...' : 'Renderizando Arte...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span className="text-lg font-medium tracking-tight uppercase">Manifestar Obra</span>
              </>
            )}
          </div>
        </button>
      </div>
      
      <div className="flex flex-col gap-20">
        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Creative Inputs - 7 Columns */}
          <div className="xl:col-span-7 space-y-12">
            {/* Project Premise Card */}
            <section className="bg-white/[0.03] backdrop-blur-md border-y md:border border-white/5 p-6 md:p-10 md:rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TypeIcon size={120} />
              </div>
              
              <div className="space-y-10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-her-accent rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-her-ink/60">Premissa Narrativa</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-her-muted uppercase tracking-widest pl-1">Título do Projeto</label>
                    <input 
                      type="text"
                      placeholder="Ex: O Último Guardião de Vidro"
                      value={project.title}
                      onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-2xl font-serif italic text-her-ink placeholder:text-white/10 focus:bg-white/10 focus:border-her-accent/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-her-muted uppercase tracking-widest pl-1">O Coração da História</label>
                    <textarea 
                      placeholder="Descreva o conflito central, a atmosfera e o que torna esta história única..."
                      value={project.idea}
                      onChange={(e) => setProject(prev => ({ ...prev, idea: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-6 text-lg text-her-ink/80 placeholder:text-white/10 min-h-[180px] resize-none focus:bg-white/10 focus:border-her-accent/20 transition-all outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Character Forge */}
            <section className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-her-accent rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-her-ink/60">Casting de Personagens</h3>
                </div>
                <button 
                  onClick={addCharacter}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-her-ink transition-all active:scale-95"
                >
                  <Plus size={14} /> Novo Arquétipo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {project.characters.map((char) => (
                    <motion.div 
                      key={char.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative hover:border-her-accent/20 transition-all duration-300 shadow-lg"
                    >
                      <button 
                        onClick={() => removeCharacter(char.id)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all"
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-her-accent uppercase tracking-widest pl-1">Identidade</label>
                          <input 
                            type="text"
                            placeholder="Nome da Entidade"
                            value={char.name}
                            onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-xl font-serif italic text-her-ink p-0 placeholder:text-white/5"
                          />
                        </div>
                        <div className="h-[1px] w-full bg-white/5" />
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-her-muted uppercase tracking-widest pl-1">Arquitetura Visual</label>
                          <textarea 
                            placeholder="Características, roupas, aura..."
                            value={char.characteristics}
                            onChange={(e) => updateCharacter(char.id, { characteristics: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-xs text-her-muted p-0 placeholder:text-white/5 h-24 resize-none leading-relaxed italic"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {project.characters.length === 0 && (
                  <button 
                    onClick={addCharacter}
                    className="md:col-span-2 py-16 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 text-her-muted hover:text-her-accent hover:border-her-accent/20 transition-all group"
                  >
                    <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                      <UserPlus size={32} />
                    </div>
                    <span className="font-serif italic text-lg opacity-40">Seu elenco aguarda manifestação...</span>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Settings Sidebar - 5 Columns */}
          <div className="xl:col-span-5 space-y-12">
            <section className="bg-white/[0.03] backdrop-blur-md border-y md:border border-white/5 p-6 md:p-10 md:rounded-[2.5rem] shadow-xl space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-her-accent rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-her-ink/60">Configurações Base</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-her-muted uppercase tracking-widest font-bold">
                  <Palette size={14} className="text-her-accent" />
                  Visual Spectrum
                </div>
              </div>

              {/* Style Grid */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-her-muted uppercase tracking-[0.15em] pl-1">Estética Matriz</span>
                <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setProject(prev => ({ ...prev, style: style.id }))}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl transition-all duration-300 border flex flex-col gap-1.5 group",
                        project.style === style.id 
                          ? "bg-her-ink text-her-bg border-transparent shadow-xl translate-x-2" 
                          : "bg-white/[0.02] border-white/5 text-her-ink/60 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div className="text-sm font-bold uppercase tracking-tight flex items-center justify-between">
                        {style.name}
                        {project.style === style.id && <ChevronRight size={16} />}
                      </div>
                      <div className={cn(
                        "text-[10px] uppercase tracking-tighter transition-colors",
                        project.style === style.id ? "text-her-bg/50" : "text-her-muted group-hover:text-her-ink/40"
                      )}>{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-4 pt-10 border-t border-white/5">
                <span className="text-[10px] font-bold text-her-muted uppercase tracking-[0.15em] pl-1">Linguagem de Saída</span>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setProject(prev => ({ ...prev, language: lang.id }))}
                      className={cn(
                        "px-4 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                        project.language === lang.id 
                          ? "bg-her-accent text-white border-transparent shadow-lg shadow-her-accent/20 scale-[1.02]" 
                          : "bg-white/5 text-her-muted border-white/5 hover:bg-white/10"
                      )}
                    >
                      <Languages size={14} className={project.language === lang.id ? "text-white" : "text-her-accent"} />
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sequential Manifestation Section */}
        {project.panels.some(p => p.imageUrl || p.dialogue) && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-24 py-32 border-t border-white/5"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-her-accent" />
                <span className="text-[10px] font-bold tracking-[0.5em] text-her-accent uppercase">Manifestação Sequencial</span>
                <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-her-accent" />
              </div>
              <h3 className="text-6xl md:text-9xl font-serif italic text-her-ink tracking-tighter leading-none px-4">
                {project.title}
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] text-her-muted uppercase bg-white/5 px-6 py-2 rounded-full border border-white/5">
                <span>Estilo: {STYLES.find(s => s.id === project.style)?.name}</span>
                <span className="w-1 h-1 bg-her-accent rounded-full" />
                <span>Episódio 01</span>
              </div>
            </div>

            <div className="flex flex-col gap-32 w-full">
              {project.panels.map((panel, idx) => (
                <motion.div 
                  key={panel.id} 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "flex flex-col gap-12",
                    idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  )}
                >
                  {/* Cinematic Frame */}
                  <div className="lg:w-2/3 group">
                    <div className="relative aspect-[4/5] bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 group-hover:rounded-[2rem] group-hover:scale-[1.02]">
                      {panel.imageUrl ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={panel.imageUrl} 
                            alt={`Frame ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <div className="space-y-4 w-full text-center">
                              <p className="text-white text-3xl font-serif italic leading-tight drop-shadow-lg">
                                "{panel.dialogue}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-white/[0.01]">
                          <div className="relative">
                            <Loader2 className="animate-spin text-her-accent opacity-20" size={64} />
                            <div className="absolute inset-0 bg-her-accent/5 blur-3xl animate-pulse" />
                          </div>
                          <div className="space-y-2 text-center">
                            <span className="text-[10px] font-bold tracking-[0.4em] text-her-accent uppercase animate-pulse">Materializando Painel {idx + 1}</span>
                            <p className="text-[8px] text-her-muted uppercase tracking-widest opacity-40">Processando Rede Neural...</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute top-10 left-10 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white font-serif italic text-xl select-none">
                        {idx + 1}
                      </div>

                      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                        <span className="text-[8px] font-bold tracking-[0.4em] text-white/40 uppercase">Neural Context Matrix</span>
                        <div className="h-[1px] w-12 bg-white/10" />
                      </div>
                    </div>
                  </div>

                  {/* Script Details */}
                  <div className="lg:w-1/3 flex flex-col justify-center gap-10 py-8 px-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-her-accent" />
                        <span className="text-[10px] font-bold tracking-[0.3em] text-her-accent uppercase">Roteiro</span>
                      </div>
                      <p className="text-her-ink text-3xl font-serif italic leading-[1.2] tracking-tight">
                        {panel.dialogue}
                      </p>
                    </div>

                    <div className="h-[1px] w-12 bg-white/10" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-her-muted opacity-30" />
                        <span className="text-[10px] font-bold tracking-[0.3em] text-her-muted opacity-40 uppercase">Narração / Direção</span>
                      </div>
                      <p className="text-base text-her-muted font-sans leading-relaxed tracking-tight italic opacity-80">
                        {panel.narration}
                      </p>
                    </div>
                    
                    <div className="pt-6">
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group/tip">
                        <Palette size={16} className="text-her-accent opacity-40 group-hover/tip:opacity-100 transition-opacity" />
                        <span className="text-[9px] text-her-muted uppercase tracking-widest leading-tight">Prompt gerado otimizado para o estilo {STYLES.find(s => s.id === project.style)?.name}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-8 py-24">
              <div className="w-px h-32 bg-gradient-to-b from-her-accent to-transparent" />
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold tracking-[0.5em] text-her-accent uppercase">Fim da Sequência</span>
                <p className="text-[8px] text-her-muted uppercase tracking-widest opacity-40">Canvas Creativo Studio 2026</p>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}
