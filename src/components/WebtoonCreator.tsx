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
import { cn } from '../lib/utils';
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

    setIsGenerating(true);
    setGenerationStep('script');
    
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
      
      // Step 1: Generate Script (Panels structure)
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
        model: "gemini-2.5-flash",
        contents: scriptPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const scriptData = JSON.parse(scriptResponse.text);
      const initialPanels: WebtoonPanel[] = scriptData.panels.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        panelNumber: p.panelNumber,
        dialogue: p.dialogue,
        narration: p.narration,
        imagePrompt: p.imagePrompt // Temporary storage for prompt
      }));

      setProject(prev => ({ ...prev, panels: initialPanels }));
      setGenerationStep('panels');

      // Step 2: Generate Images for each panel
      const updatedPanels = [...initialPanels];
      for (let i = 0; i < updatedPanels.length; i++) {
        setCurrentPanelIndex(i);
        const panel = updatedPanels[i];
        
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-7xl flex-1 px-4 md:px-8 pb-4 md:pb-8 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-her-accent/20 flex items-center justify-center text-her-accent">
            <Palette size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-serif italic text-her-ink">Webtoon Creator 3</h2>
            <p className="text-xs text-her-muted opacity-60">Transforme suas ideias em histórias visuais</p>
          </div>
        </div>
        <button 
          onClick={generateFullWebtoon}
          disabled={isGenerating}
          className={cn(
            "px-6 py-2.5 bg-her-ink text-her-bg rounded-2xl text-sm font-medium transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-her-ink/20 disabled:opacity-50",
            isGenerating && "animate-pulse"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              {generationStep === 'script' ? 'Escrevendo...' : `Gerando Painel ${currentPanelIndex + 1}/4...`}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Gerar História Completa
            </>
          )}
        </button>
      </div>
      
      <div className="flex flex-col gap-8 pb-12">
        {/* Input Sections */}
        <div className="space-y-8">
          {/* Title & Idea */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-2 text-her-ink/60 mb-2">
              <TypeIcon size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">A História</span>
            </div>
            <input 
              type="text"
              placeholder="Dê um título para sua obra-prima..."
              value={project.title}
              onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-transparent border-none focus:ring-0 text-3xl font-serif italic text-her-ink placeholder:text-her-ink/10"
            />
            <textarea 
              placeholder="Qual é a premissa? Descreva o universo e o conflito principal..."
              value={project.idea}
              onChange={(e) => setProject(prev => ({ ...prev, idea: e.target.value }))}
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-base text-her-ink placeholder:text-her-ink/20 min-h-[120px] resize-none focus:bg-white/10 transition-colors"
            />
          </section>

          {/* Configs: Style & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-2 text-her-ink/60 mb-6">
                <Palette size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Estilo Visual</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setProject(prev => ({ ...prev, style: style.id }))}
                    className={cn(
                      "text-left p-4 rounded-2xl transition-all border",
                      project.style === style.id 
                        ? "bg-her-accent/10 border-her-accent/40 text-her-accent shadow-lg shadow-her-accent/5" 
                        : "bg-white/5 border-transparent text-her-ink/60 hover:bg-white/10"
                    )}
                  >
                    <div className="text-sm font-semibold">{style.name}</div>
                    <div className="text-[10px] opacity-50 mt-1">{style.description}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-2 text-her-ink/60 mb-6">
                <Languages size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Idioma de Saída</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setProject(prev => ({ ...prev, language: lang.id }))}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-sm font-medium transition-all border",
                      project.language === lang.id 
                        ? "bg-her-accent/10 border-her-accent/40 text-her-accent" 
                        : "bg-white/5 border-transparent text-her-ink/60 hover:bg-white/10"
                    )}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Characters */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-her-ink/60">
                <UserPlus size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Elenco de Personagens</span>
              </div>
              <button 
                onClick={addCharacter}
                className="px-4 py-2 rounded-xl bg-her-ink text-her-bg flex items-center gap-2 hover:scale-105 transition-transform text-xs font-bold"
              >
                <Plus size={16} />
                Novo Personagem
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {project.characters.map((char) => (
                  <motion.div 
                    key={char.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-6 bg-white/5 border border-white/5 rounded-[2rem] relative group hover:border-white/20 transition-colors"
                  >
                    <button 
                      onClick={() => removeCharacter(char.id)}
                      className="absolute top-6 right-6 text-her-ink/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        type="text"
                        placeholder="Nome do Personagem"
                        value={char.name}
                        onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-serif italic p-0 placeholder:text-her-ink/10"
                      />
                      <input 
                        type="text"
                        placeholder="Características: visual, temperamento, trajes..."
                        value={char.characteristics}
                        onChange={(e) => updateCharacter(char.id, { characteristics: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-her-ink/60 p-0 placeholder:text-her-ink/10"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {project.characters.length === 0 && (
              <div className="text-center py-12 italic text-her-muted/20 text-sm border-2 border-dashed border-white/5 rounded-[2rem]">
                Seu elenco ainda está vazio.
              </div>
            )}
          </section>
        </div>

        {/* Action Button - Centered */}
        <div className="flex justify-center py-8">
          <button 
            onClick={generateFullWebtoon}
            disabled={isGenerating || !project.title || !project.idea}
            className={cn(
              "px-12 py-5 bg-her-ink text-her-bg rounded-[2rem] text-lg font-serif italic transition-all flex items-center gap-3 hover:shadow-2xl hover:shadow-her-ink/20 disabled:opacity-30",
              isGenerating && "animate-pulse"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                {generationStep === 'script' ? 'Tecendo o roteiro...' : `Criando arte do painel ${currentPanelIndex + 1}...`}
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Dar vida à história
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {project.panels.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 mt-12"
          >
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-serif italic text-her-ink">{project.title}</h3>
              <div className="h-[1px] w-24 bg-her-accent/20 mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {project.panels.map((panel, idx) => (
                <div key={panel.id} className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col group">
                  <div className="aspect-[3/4] relative bg-her-ink/5 overflow-hidden">
                    {panel.imageUrl ? (
                      <img 
                        src={panel.imageUrl} 
                        alt={`Painel ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-her-accent opacity-40" size={32} />
                        <span className="text-xs font-bold tracking-widest text-her-accent/40 uppercase">Renderizando...</span>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white font-serif italic text-lg border border-white/20">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <p className="text-her-ink text-xl font-serif italic leading-relaxed">
                      "{panel.dialogue}"
                    </p>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-her-muted opacity-50 mb-2 font-bold">Direção da Narrativa</p>
                      <p className="text-sm text-her-ink/60 leading-relaxed italic">
                        {panel.narration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}
