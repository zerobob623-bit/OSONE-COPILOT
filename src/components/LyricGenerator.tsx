import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Wand2, Copy, Trash2, Download, Sparkles, BookOpen, Quote, PenTool, Hash, Mic2, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn } from '../lib/utils';

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
    <div className="h-full flex flex-col bg-her-bg/50 overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Painel de Controle */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/[0.05] p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h3 className="text-sm font-serif italic mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              Diretrizes Criativas
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-her-muted mb-2 block font-light">Estilo Musical</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] transition-all border",
                        style === s 
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-200" 
                          : "bg-white/[0.03] border-transparent text-her-muted hover:bg-white/[0.06]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-her-muted mb-2 block font-light">Vibe / Sentimento</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] transition-all border",
                        mood === m 
                          ? "bg-her-accent/20 border-her-accent/40 text-white" 
                          : "bg-white/[0.03] border-transparent text-her-muted hover:bg-white/[0.06]"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <label className="text-[10px] uppercase tracking-widest text-her-muted mb-2 block font-light">Inspiração</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Sobre o que você quer escrever?"
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500/30 min-h-[100px] resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-her-accent text-white rounded-xl text-[10px] uppercase tracking-[0.2em] font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Wand2 size={14} />
                  Compor Letra
                </>
              )}
            </button>

            {/* Vocalize button removed to prevent API errors */}
          </div>
        </div>

        {/* Área da Letra */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-gradient-to-br from-transparent to-purple-900/5">
          <AnimatePresence mode="wait">
            {lyrics ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    {vocalizedAudioUrl && (
                      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl">
                        <button 
                          onClick={togglePlay}
                          className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white hover:scale-105 transition-transform"
                        >
                          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-purple-300 font-medium">Voz Gerada</span>
                          <div className="flex items-center gap-1">
                            <Volume2 size={10} className="text-purple-400" />
                            <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-purple-500"
                                animate={{ 
                                  width: isPlaying ? ["0%", "100%"] : "0%"
                                }}
                                transition={{ 
                                  duration: 30, // 30s is roughly the length of the clip
                                  ease: "linear",
                                  repeat: isPlaying ? Infinity : 0
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <audio 
                          ref={audioRef} 
                          src={vocalizedAudioUrl} 
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={copyToClipboard} className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-her-muted hover:text-white transition-all border border-white/[0.05]">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => { setLyrics(''); setVocalizedAudioUrl(null); }} className="p-2.5 bg-white/[0.03] hover:bg-red-500/20 rounded-xl text-her-muted hover:text-red-400 transition-all border border-white/[0.05]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] border border-white/[0.05] p-10 rounded-[2rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <Quote className="absolute top-8 left-8 text-purple-500/10" size={64} />
                  <div className="relative z-10 whitespace-pre-wrap font-serif italic text-lg leading-relaxed text-her-muted group-hover:text-white transition-colors duration-700">
                    {lyrics}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <BookOpen size={48} className="mb-4" />
                <p className="font-serif italic text-lg">Inicie sua composição...</p>
                <p className="text-[10px] uppercase tracking-widest mt-2">O papel em branco espera por sua alma.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
