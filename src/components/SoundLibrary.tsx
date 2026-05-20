import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Plus, Trash2, Play, Volume2, X, Search, Upload, Link, Square, Edit2, Sparkles, Wand2, Music2, Brain } from 'lucide-react';
import { cn, safeJsonParse } from '../lib/utils';
import { SoundEffect } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SoundLibraryProps {
  sounds: SoundEffect[];
  playingUrl: string | null;
  apiKeys: { gemini: string };
  onAddSound: (sound: Partial<SoundEffect>) => void;
  onUpdateSound: (id: string, sound: Partial<SoundEffect>) => void;
  onRemoveSound: (id: string) => void;
  onRestoreDefaults: () => void;
  onPlaySound: (url: string) => void;
  onStopSound: () => void;
  onClose: () => void;
}

export const SoundLibrary = ({ sounds, playingUrl, apiKeys, onAddSound, onUpdateSound, onRemoveSound, onRestoreDefaults, onPlaySound, onStopSound, onClose }: SoundLibraryProps) => {
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<SoundEffect | null>(null);
  const [newSound, setNewSound] = useState({ name: '', category: 'funny', url: '' });
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = ['all', ...Array.from(new Set(sounds.map(s => s.category)))];

  const filteredSounds = sounds.filter(s => {
    const matchesFilter = s.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
    return matchesFilter && matchesCategory;
  });

  const handleAdd = () => {
    if (newSound.name && newSound.url) {
      if (editingSound) {
        onUpdateSound(editingSound.id, newSound);
      } else {
        onAddSound(newSound);
      }
      resetForm();
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    const apiKey = apiKeys.gemini;
    if (!apiKey || apiKey.trim() === '') {
      alert("Por favor, vincule sua própria chave API Gemini nas configurações para gerar sons.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um gerador de efeitos sonoros e músicas via IA para o sistema operacional OSONE.
      O usuário quer o seguinte som: "${aiPrompt}"
      
      Retorne um JSON com:
      {
        "name": "Nome curto e criativo em Português",
        "category": "Uma destas: funny, comico, horror, suspense, halloween, sneaky, epic, synth, ambient",
        "url": "Escolha a URL mais adequada da lista abaixo baseada na descrição",
        "rationale": "Breve explicação por que este som foi escolhido/gerado"
      }

      LISTA DE SONS DISPONÍVEIS (URLs):
      - https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3 (Epic cinematic whoosh)
      - https://assets.mixkit.co/active_storage/sfx/2103/2103-preview.mp3 (Funny bounce)
      - https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3 (Horror screech)
      - https://assets.mixkit.co/active_storage/sfx/543/543-preview.mp3 (Sneaky footsteps)
      - https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3 (Ambient nature)
      - https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3 (Suspense drone)
      - https://assets.mixkit.co/active_storage/sfx/619/619-preview.mp3 (Synth sequence)
      - https://assets.mixkit.co/active_storage/sfx/2345/2345-preview.mp3 (Portal magic)
      - https://assets.mixkit.co/active_storage/sfx/3001/3001-preview.mp3 (Retro game jump)
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      const data = safeJsonParse(result.text || "", { name: "Som", category: "funny", url: "" });
      
      onAddSound({
        name: `[AI] ${data.name}`,
        category: data.category,
        url: data.url
      });

      setAiPrompt('');
      setIsAiModalOpen(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Erro ao gerar som com IA. Verifique sua chave API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setNewSound({ name: '', category: 'funny', url: '' });
    setUploadType('url');
    setIsAddModalOpen(false);
    setEditingSound(null);
  };

  const openEdit = (sound: SoundEffect) => {
    setEditingSound(sound);
    setNewSound({ name: sound.name, category: sound.category, url: sound.url });
    setUploadType(sound.url.startsWith('data:') ? 'file' : 'url');
    setIsAddModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) { // 2.5MB limit for localStorage safety
        alert('Este arquivo é muito grande. Tente um arquivo MP3/WAV abaixo de 2.5MB para garantir que seja salvo corretamente.');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewSound({ ...newSound, url: result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-her-bg/50 backdrop-blur-xl overflow-hidden w-full">
      {/* Header */}
      <div className="p-4 md:p-10 flex items-center justify-between border-b border-white/[0.05] bg-black/20 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-her-accent/10 text-her-accent">
            <Music size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-serif italic">Biblioteca de Sons</h2>
            <p className="text-[8px] md:text-[10px] text-her-muted uppercase tracking-[0.2em] font-light">Efeitos sonoros para o OSONE</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="p-3 md:px-6 md:py-4 bg-gradient-to-r from-purple-500/20 to-her-accent/20 text-purple-200 border border-purple-500/30 hover:from-purple-500/30 hover:to-her-accent/30 transition-all uppercase tracking-widest rounded-lg"
          >
            <Sparkles size={16} className="text-purple-400" />
            <span className="hidden md:inline ml-2 text-xs font-light">Gerar com IA</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-3 md:px-6 md:py-4 bg-her-accent text-white hover:bg-her-accent/90 transition-all uppercase tracking-widest rounded-lg"
          >
            <Plus size={16} />
            <span className="hidden md:inline ml-2 text-xs font-light">Adicionar</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-10 gap-6 md:gap-10 pb-[100px] md:pb-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-her-muted" size={16} />
            <input 
              type="text" 
              placeholder="Buscar sons..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.05] py-4 pl-12 pr-6 text-base font-light focus:outline-none focus:border-her-accent/30 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-3 text-[11px] uppercase tracking-widest font-light transition-all whitespace-nowrap border",
                  activeCategory === cat 
                    ? "bg-her-accent/10 text-her-accent border-her-accent/20" 
                    : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSounds.map((sound) => (
              <motion.div
                layout
                key={sound.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative p-6 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-her-accent/5 text-her-accent">
                    <Volume2 size={16} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEdit(sound)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-her-muted hover:text-her-accent transition-all"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemoveSound(sound.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-her-muted hover:text-red-400 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/80 group-hover:text-her-accent transition-colors">{sound.name}</h3>
                <p className="text-[10px] text-her-muted uppercase tracking-widest mt-1">{sound.category}</p>
                
                <button
                  onClick={() => playingUrl === sound.url ? onStopSound() : onPlaySound(sound.url)}
                  className={cn(
                    "mt-4 w-full flex items-center justify-center gap-3 py-3 text-[11px] uppercase tracking-widest transition-all",
                    playingUrl === sound.url 
                      ? "bg-her-accent text-white" 
                      : "bg-white/[0.05] hover:bg-her-accent hover:text-white"
                  )}
                >
                  {playingUrl === sound.url ? (
                    <>
                      <Square size={12} fill="currentColor" />
                      <span>Parar</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} fill="currentColor" />
                      <span>Testar</span>
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
          
          {filteredSounds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-her-muted">
              <Music size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-light">Nenhum som encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-her-bg w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white/[0.1] relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-her-accent/10 blur-[80px] rounded-full" />

              <div className="relative">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-her-accent/20 rounded-2xl text-purple-400 border border-purple-500/20">
                      <Wand2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif italic">AI Sound Lab</h3>
                      <p className="text-[9px] text-her-muted uppercase tracking-[0.2em] font-light">Geração de áudio neural</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-white/[0.03] rounded-full">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-her-muted mb-3 font-light">O que você deseja ouvir?</label>
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Descreva o som... (ex: 'Uma batida de synthwave futurista', 'Efeito de magia sombria', 'Risada robótica maléfica')"
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 px-5 text-sm font-light focus:outline-none focus:border-purple-500/30 min-h-[120px] resize-none leading-relaxed transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setAiPrompt("Batida futurista de ficção científica")}
                      className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] text-her-muted hover:text-white hover:bg-white/[0.06] transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Music2 size={12} className="text-purple-400" />
                        <span className="font-medium text-white/60">Sugerido</span>
                      </div>
                      Ambiental Sci-Fi
                    </button>
                    <button 
                      onClick={() => setAiPrompt("Efeito sonoro épico de impacto cinematográfico")}
                      className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] text-her-muted hover:text-white hover:bg-white/[0.06] transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Square size={12} className="text-her-accent" />
                        <span className="font-medium text-white/60">Sugerido</span>
                      </div>
                      Impacto Épico
                    </button>
                  </div>

                  <button 
                    onClick={handleAiGenerate}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-her-accent text-white rounded-2xl text-xs font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span className="tracking-widest uppercase text-[10px]">Sintonizando IA...</span>
                      </>
                    ) : (
                      <>
                        <Brain size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="tracking-widest uppercase text-[10px]">Gerar Áudio com IA</span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-[9px] text-her-muted text-center italic opacity-60">
                    A IA levará alguns segundos para processar os parâmetros e encontrar a frequência ideal.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-her-bg w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-white/[0.1]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-serif italic">{editingSound ? 'Editar Som' : 'Novo Som'}</h3>
                <button onClick={resetForm} className="p-2 hover:bg-white/[0.03] rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
              <div className="flex bg-white/[0.03] p-1 mb-2">
                <button 
                  onClick={() => setUploadType('url')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-wider transition-all",
                    uploadType === 'url' ? "bg-white/10 text-white" : "text-her-muted hover:text-white/60"
                  )}
                >
                  <Link size={12} />
                  Link
                </button>
                <button 
                  onClick={() => setUploadType('file')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-wider transition-all",
                    uploadType === 'file' ? "bg-white/10 text-white" : "text-her-muted hover:text-white/60"
                  )}
                >
                  <Upload size={12} />
                  Arquivo
                </button>
              </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-her-muted mb-2 font-light">Nome do Som</label>
                  <input 
                    type="text" 
                    value={newSound.name}
                    onChange={(e) => setNewSound({ ...newSound, name: e.target.value })}
                    placeholder="Ex: Risada Comica"
                    className="w-full bg-white/[0.03] border border-white/[0.05] py-3 px-4 text-sm font-light focus:outline-none focus:border-her-accent/30"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-her-muted mb-2 font-light">Categoria</label>
                  <select 
                    value={newSound.category}
                    onChange={(e) => setNewSound({ ...newSound, category: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.05] py-3 px-4 text-sm font-light focus:outline-none focus:border-her-accent/30 appearance-none"
                  >
                    <option value="funny">Funny</option>
                    <option value="comico">Comico</option>
                    <option value="horror">Terror</option>
                    <option value="suspense">Suspense</option>
                    <option value="halloween">Halloween</option>
                    <option value="sneaky">Sneaky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-her-muted mb-2 font-light">
                    {uploadType === 'url' ? 'URL do Som (MP3/WAV)' : 'Upload de Arquivo (MP3/WAV)'}
                  </label>
                  {uploadType === 'url' ? (
                    <input 
                      type="text" 
                      value={newSound.url}
                      onChange={(e) => setNewSound({ ...newSound, url: e.target.value })}
                      placeholder="https://exemplo.com/som.mp3"
                      className="w-full bg-white/[0.03] border border-white/[0.05] py-3 px-4 text-sm font-light focus:outline-none focus:border-her-accent/30"
                    />
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="audio-upload"
                      />
                      <label 
                        htmlFor="audio-upload"
                        className={cn(
                          "w-full flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.03] border-2 border-dashed border-white/[0.05] rounded-2xl cursor-pointer hover:bg-white/[0.05] hover:border-her-accent/30 transition-all",
                          newSound.url && "border-her-accent/50 bg-her-accent/5"
                        )}
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-her-accent border-t-transparent" />
                        ) : newSound.url ? (
                          <>
                            <div className="p-3 bg-her-accent/20 rounded-full text-her-accent">
                              <Volume2 size={24} />
                            </div>
                            <span className="text-[10px] text-her-accent uppercase tracking-widest">Arquivo Carregado</span>
                          </>
                        ) : (
                          <>
                            <Upload className="text-her-muted" size={24} />
                            <span className="text-[10px] text-her-muted uppercase tracking-widest">Clique para selecionar</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAdd}
                  disabled={!newSound.name || !newSound.url || isUploading}
                  className="w-full py-5 bg-her-accent text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-her-accent/90 transition-all disabled:opacity-30 disabled:grayscale mt-4"
                >
                  {isUploading ? 'Processando...' : editingSound ? 'Salvar Alterações' : 'Adicionar à Biblioteca'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
