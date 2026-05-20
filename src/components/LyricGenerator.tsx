import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Wand2, Copy, Trash2, Download, Sparkles, BookOpen, Quote, PenTool, Hash, Mic2, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn, safeJsonParse } from '../lib/utils';
import { InfinityLogo } from './InfinityLogo';

export function LyricGenerator({ apiKeys }: { apiKeys: { gemini: string } }) {
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);
  const [vocalizedAudioUrl, setVocalizedAudioUrl] = useState<string | null>(null);
  const [style, setStyle] = useState('Poesia');
  const [mood, setMood] = useState('Melancólico');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const styles = ['Trap', 'Poesia', 'Sertanejo', 'MPB', 'Rock', 'Rap', 'Pop'];
  const moods = ['Melancólico', 'Eufórico', 'Sombrio', 'Romântico', 'Revoltado'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const apiKey = apiKeys.gemini;
    if (!apiKey || apiKey.trim() === '') {
      alert("Por favor, vincule sua própria chave API Gemini nas configurações para compor letras.");
      return;
    }
    
    setIsGenerating(true);
    setVocalizedAudioUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey });

      const finalPrompt = `Aja como um compositor e poeta premiado. Escreva uma letra de música/poesia com as seguintes características:
      - TEMA/ASSUNTO: "${prompt}"
      - ESTILO: "${style}"
      - SENTIMENTO: "${mood}"
      
      A estrutura deve incluir:
      1. Título Criativo
      2. Versos bem estruturados
      3. Refrão impactante
      4. Ponte (se aplicável ao estilo)
      
      Retorne APENAS a letra, sem comentários adicionais.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: finalPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setLyrics(result.text || "");
    } catch (error) {
      console.error("Erro ao gerar letra:", error);
      alert("Falha na conexão neural. Verifique sua chave API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVocalize = async () => {
    // Disabled due to API stability issues
    alert("Funcionalidade de vocalização temporariamente desativada para manutenção.");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(lyrics);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#080808] overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-[90px] md:pb-0">
        {/* Painel de Controle - Sidebar Estilizada */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col gap-6 bg-black/40 backdrop-blur-sm overflow-y-auto shrink-0 md:shrink custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Sparkles size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-xs font-serif italic text-white/90">Diretrizes Criativas</h3>
                <p className="text-[9px] text-her-muted uppercase tracking-tighter">Molde sua inspiração</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-her-muted mb-3 block font-medium opacity-50">Estilo Musical</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] transition-all border duration-300",
                        style === s 
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                          : "bg-white/[0.02] border-white/5 text-her-muted hover:bg-white/[0.05] hover:text-white/70"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-her-muted mb-3 block font-medium opacity-50">Vibe / Sentimento</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] transition-all border duration-300",
                        mood === m 
                          ? "bg-her-accent/20 border-her-accent/40 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]" 
                          : "bg-white/[0.02] border-white/5 text-her-muted hover:bg-white/[0.05] hover:text-white/70"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-her-muted mb-3 block font-medium opacity-50">Semente da Inspiração</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma carta de despedida sob a chuva de neon..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.04] transition-all min-h-[120px] resize-none leading-relaxed text-white/80 placeholder:text-white/10"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-her-accent text-white rounded-2xl text-[10px] uppercase tracking-[0.3em] font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-500 disabled:opacity-30 disabled:hover:shadow-none flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <PenTool size={14} className="opacity-70" />
                  Manifestar Texto
                </>
              )}
            </button>
          </div>
        </div>

        {/* Área da Letra - Manuscrito Digital */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03)_0%,transparent_100%)]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-20 flex flex-col">
            <AnimatePresence mode="wait">
              {lyrics ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="max-w-3xl mx-auto w-full flex flex-col"
                >
                  <div className="flex justify-between items-center mb-10 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white/5">
                        <BookOpen size={16} className="text-purple-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-her-muted">Manuscrito Gerado</span>
                    </div>
                    
                    <div className="flex gap-4">
                      {vocalizedAudioUrl && (
                        <button 
                          onClick={togglePlay}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] uppercase tracking-[0.1em]"
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          {isPlaying ? 'Silenciar' : 'Escutar'}
                        </button>
                      )}
                      <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                      <button onClick={copyToClipboard} className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-her-muted hover:text-white transition-all border border-white/5 group relative">
                        <Copy size={16} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Copiar</span>
                      </button>
                      <button onClick={() => { setLyrics(''); setVocalizedAudioUrl(null); }} className="p-3 bg-white/[0.03] hover:bg-red-500/10 rounded-2xl text-her-muted hover:text-red-400 transition-all border border-white/5 group relative">
                        <Trash2 size={16} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Limpar</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Digital Paper Surface */}
                  <div className="relative mb-20">
                    <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/5 to-transparent blur-2xl rounded-[3rem] opacity-50"></div>
                    
                    <div className="relative bg-[#0d0d0d] border border-white/10 p-12 md:p-20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group min-h-[600px] flex flex-col">
                      {/* Paper lines decoration */}
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '100% 2rem' }}></div>
                      
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500/20 via-transparent to-transparent"></div>
                      <Quote className="absolute top-10 right-10 text-white/[0.02]" size={120} />
                      
                      <div className="relative z-10 whitespace-pre-wrap font-serif italic text-xl md:text-2xl leading-[1.8] text-white/70 selection:bg-purple-500/30">
                        {lyrics}
                      </div>

                      <div className="mt-auto pt-20 flex justify-center opacity-20 hover:opacity-100 transition-opacity duration-700">
                        <div className="scale-50">
                          <InfinityLogo active={false} speaking={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full"></div>
                    <BookOpen size={64} className="relative mb-8 text-white/20 mx-auto" strokeWidth={1} />
                  </motion.div>
                  <h4 className="font-serif italic text-2xl text-white/50 mb-4">A tela em branco...</h4>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-her-muted leading-relaxed opacity-40">
                    Toda grande obra começou como um sussurro solitário. <br/>
                    Dê-me uma semente de ideia e eu manifestarei o mundo.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Audio Element hidden */}
      <audio 
        ref={audioRef} 
        src={vocalizedAudioUrl || undefined} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
