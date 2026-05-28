import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Palette, Key, Smartphone, Info, Power, Activity, CheckCircle2, AlertCircle, Loader2, Home, UserCircle, Pin, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiKeys, OrbStyle, AppTheme, AIProfile, VoiceModulation } from '../types';
import { googleHomeService } from '../services/googleHomeService';

type TabId = 'general' | 'interface' | 'profile' | 'automation';
type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';

export const SettingsModal = ({ 
  isOpen, 
  onClose, 
  keys, 
  setKeys, 
  selectedVoice, 
  setSelectedVoice,
  voiceEngine,
  setVoiceEngine,
  isChatAutoSpeakActive = false,
  setIsChatAutoSpeakActive,
  voiceModulation,
  setVoiceModulation,
  orbStyle,
  setOrbStyle,
  appTheme,
  setAppTheme,
  aiProfile,
  setAiProfile,
  onAddNotification
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  keys: ApiKeys;
  setKeys: (keys: ApiKeys) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  voiceEngine: 'gemini' | 'elevenlabs';
  setVoiceEngine: (engine: 'gemini' | 'elevenlabs') => void;
  isChatAutoSpeakActive?: boolean;
  setIsChatAutoSpeakActive?: (active: boolean) => void;
  voiceModulation: VoiceModulation;
  setVoiceModulation: (mod: VoiceModulation) => void;
  orbStyle: OrbStyle;
  setOrbStyle: (style: OrbStyle) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  aiProfile: AIProfile;
  setAiProfile: (profile: AIProfile) => void;
  onAddNotification?: (msg: string, type: 'success' | 'info' | 'error') => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Iniciando handshake com Google Home Graph...');
    
    try {
      const result = await googleHomeService.verifyConnection(keys);
      if (result.success) {
        setConnectionStatus('connected');
        setConnectionMessage(result.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('Falha crítica na rede. Tente novamente.');
    }
  };

  const tabs = [
    { id: 'general', label: 'Chaves', icon: Key },
    { id: 'interface', label: 'Interface', icon: Palette },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
    { id: 'automation', label: 'Automação', icon: Cpu },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-her-bg w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/[0.05] backdrop-blur-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-center bg-white/[0.02] border-b border-white/[0.05]">
              <div className="space-y-1">
                <h2 className="text-xl font-serif italic font-light">Configurações</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-her-accent animate-pulse" />
                  <span className="text-[10px] text-her-muted uppercase tracking-[0.2em] font-medium">Osone System v3.0</span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-white/[0.03] rounded-full transition-all text-her-muted active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex px-4 pt-2 bg-white/[0.01]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-4 transition-all relative border-b-2",
                      isActive 
                        ? "text-her-accent border-her-accent" 
                        : "text-her-muted opacity-40 hover:opacity-100 border-transparent"
                    )}
                  >
                    <Icon size={18} className={isActive ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-her-accent/5 -z-10"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Key size={12} className="text-her-accent" />
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted font-bold">Gemini API Key</label>
                      </div>
                      <input 
                        type="password"
                        value={keys.gemini}
                        onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 focus:outline-none focus:border-her-accent/30 transition-all text-base md:text-sm font-light text-her-ink/80 placeholder:text-her-muted/20"
                        placeholder="Insira sua chave Gemini..."
                      />
                      <p className="mt-3 text-[10px] text-her-muted/40 italic leading-relaxed">
                        Chave necessária para o processamento de linguagem natural e visão computacional.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Cpu size={12} className="text-her-accent" />
                          <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted font-bold">Elevenlabs API Key</label>
                        </div>
                        <input 
                          type="password"
                          value={keys.elevenLabsApiKey || ''}
                          onChange={(e) => setKeys({ ...keys, elevenLabsApiKey: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 focus:outline-none focus:border-her-accent/30 transition-all text-base md:text-sm font-light text-her-ink/80 placeholder:text-her-muted/20"
                          placeholder="Insira sua chave ElevenLabs..."
                        />
                        <p className="mt-3 text-[10px] text-her-muted/40 italic leading-relaxed">
                          Chave opcional para sintetizar narrativas ultrarrealistas utilizando ElevenLabs.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <UserCircle size={12} className="text-her-accent" />
                          <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted font-bold">ID da Voz ElevenLabs</label>
                        </div>
                        <input 
                          type="text"
                          value={keys.elevenLabsVoiceId || ''}
                          onChange={(e) => setKeys({ ...keys, elevenLabsVoiceId: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 focus:outline-none focus:border-her-accent/30 transition-all text-base md:text-sm font-light text-her-ink/80 placeholder:text-her-muted/20 text-xs font-mono"
                          placeholder="Ex: 21m00Tcm4TlvDq8ikWAM..."
                        />
                        <p className="mt-3 text-[10px] text-her-muted/40 italic leading-relaxed">
                          Insira o ID de voz ElevenLabs customizado que deseja usar para as leituras e narrativas.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'interface' && (
                  <motion.div
                    key="interface"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-4 font-bold">Motor de Voz (Tecnologia)</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {[
                            { id: 'gemini', label: 'Gemini 3.1 TTS', desc: 'Voz Inteligente por IA' },
                            { id: 'elevenlabs', label: 'ElevenLabs', desc: 'Voz Customizada Ultrarrealista' }
                          ].map((eng) => (
                            <button
                              key={eng.id}
                              onClick={() => setVoiceEngine(eng.id as 'gemini' | 'elevenlabs')}
                              className={cn(
                                "px-4 py-3 rounded-2xl text-[10px] sm:text-xs font-light transition-all border text-left flex flex-col gap-1",
                                voiceEngine === eng.id 
                                  ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                                  : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{eng.label}</span>
                                {voiceEngine === eng.id && <div className="w-1.5 h-1.5 rounded-full bg-her-accent shadow-[0_0_8px_rgba(var(--her-accent),0.5)]" />}
                              </div>
                              <span className="text-[8px] opacity-60 font-light">{eng.desc}</span>
                            </button>
                          ))}
                        </div>

                        {voiceEngine === 'gemini' ? (
                          <>
                            <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-3 font-bold">Voz do Sistema (Frequência)</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Puck', 'Charon', 'Kore', 'Fenrir', 'Scarlet'].map((voice) => (
                                <button
                                  key={voice}
                                  onClick={() => setSelectedVoice(voice)}
                                  className={cn(
                                    "px-4 py-3 rounded-2xl text-[10px] sm:text-xs font-light transition-all border text-left flex items-center justify-between group",
                                    selectedVoice === voice 
                                      ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                                      : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]",
                                    voice === 'Scarlet' && "border-red-900/20 hover:border-red-500/30"
                                  )}
                                >
                                  <span className={cn(voice === 'Scarlet' && "text-red-500/80 font-medium")}>{voice}</span>
                                  {selectedVoice === voice && <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--her-accent),0.5)]",
                                    voice === 'Scarlet' ? "bg-red-600 shadow-red-600/50" : "bg-her-accent"
                                  )} />}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-her-accent uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <Cpu size={12} className="text-her-accent" />
                                Customização ElevenLabs
                              </span>
                              {keys.elevenLabsVoiceId && keys.elevenLabsApiKey ? (
                                <span className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[8.5px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1 flex-row">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Ativa
                                </span>
                              ) : (
                                <span className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full text-[8.5px] text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1 flex-row">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  Pendente
                                </span>
                              )}
                            </div>

                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider text-her-muted/60 mb-1.5 font-bold">Chave de API ElevenLabs</label>
                                <input 
                                  type="password"
                                  value={keys.elevenLabsApiKey || ''}
                                  onChange={(e) => setKeys({ ...keys, elevenLabsApiKey: e.target.value })}
                                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-4 py-2.5 focus:outline-none focus:border-her-accent/30 transition-all text-xs text-her-ink/80 placeholder:text-her-muted/20"
                                  placeholder="Suas chaves da Elevenlabs..."
                                />
                              </div>

                              <div>
                                <label className="block text-[8px] uppercase tracking-wider text-her-muted/60 mb-1.5 font-bold">ID da Voz Primária (Voice ID)</label>
                                <input 
                                  type="text"
                                  value={keys.elevenLabsVoiceId || ''}
                                  onChange={(e) => setKeys({ ...keys, elevenLabsVoiceId: e.target.value })}
                                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-4 py-2.5 focus:outline-none focus:border-her-accent/30 transition-all text-xs font-mono text-zinc-300 placeholder:text-her-muted/20"
                                  placeholder="Ex: 21m00Tcm4TlvDq8ikWAM"
                                />
                              </div>

                              <button
                                onClick={() => {
                                  // Lock & save model
                                  setVoiceEngine('elevenlabs');
                                  
                                  // Trigger the storage/API sync
                                  setKeys({ ...keys });
                                  
                                  if (onAddNotification) {
                                    onAddNotification("Voz e modelo ElevenLabs ativados e fixados!", "success");
                                  }
                                }}
                                className={cn(
                                  "w-full py-3.5 px-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]",
                                  voiceEngine === 'elevenlabs' && keys.elevenLabsVoiceId
                                    ? "bg-her-accent text-white shadow-lg shadow-her-accent/20 hover:bg-her-accent/90"
                                    : "bg-her-accent/10 hover:bg-her-accent/20 text-her-accent border border-her-accent/20"
                                )}
                              >
                                <Pin size={11} className={cn("rotate-45 transition-transform", voiceEngine === 'elevenlabs' && "animate-bounce")} />
                                {voiceEngine === 'elevenlabs' ? "Fixado e Ativado" : "Fixar e Ativar Modelo ElevenLabs"}
                              </button>
                            </div>

                            <p className="text-[9px] text-her-muted/40 leading-relaxed font-light italic">
                              Fixar este modelo substitui o sintetizador neural Gemini para todas as transcrições e narrativas do painel.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Chat Auto Speak Option */}
                      <div className="flex items-center justify-between bg-white/[0.01]/10 p-4 rounded-3xl border border-white/5">
                        <div className="flex flex-col text-left space-y-0.5">
                          <span className="text-xs text-zinc-300 font-medium select-none flex items-center gap-1.5 align-middle">
                            <Volume2 size={13} className="text-her-accent" />
                            Auto-Leitura de Mensagens
                          </span>
                          <span className="text-[10px] text-her-muted select-none leading-normal">
                            Fala respostas da IA automaticamente no chat principal usando o motor atual
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (setIsChatAutoSpeakActive) {
                              const newState = !isChatAutoSpeakActive;
                              setIsChatAutoSpeakActive(newState);
                              if (onAddNotification) {
                                onAddNotification(newState ? "Auto-leitura do chat ativada" : "Auto-leitura do chat desativada", "info");
                              }
                            }
                          }}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer",
                            isChatAutoSpeakActive ? "bg-her-accent" : "bg-white/10"
                          )}
                        >
                          <span className={cn(
                            "w-4 h-4 rounded-full bg-white transition-transform block shadow-sm",
                            isChatAutoSpeakActive ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-4 font-bold">Estilo do Orb de IA</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'classic', name: 'Clássico (Esfera)' },
                            { id: 'wave', name: 'Fluidos (Alabastro)' },
                            { id: 'neural', name: 'Constelação Neural' },
                            { id: 'jarvis', name: 'Jarvis (HUD 3D)' },
                            { id: 'superintelligence', name: 'Superinteligência' },
                            { id: 'shadow', name: 'Escarlate (Shadow)' },
                          ].map((styleOption) => (
                            <button
                              key={styleOption.id}
                              onClick={() => setOrbStyle(styleOption.id as OrbStyle)}
                              className={cn(
                                "px-4 py-3 rounded-2xl text-[10px] sm:text-xs font-light transition-all border text-left flex items-center justify-between group",
                                orbStyle === styleOption.id 
                                  ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                                  : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]"
                              )}
                            >
                              <span>{styleOption.name}</span>
                              {orbStyle === styleOption.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-her-accent shadow-[0_0_8px_rgba(var(--her-accent),0.5)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted font-bold">Modulador de Voz</label>
                        <button 
                          onClick={() => setVoiceModulation({ pitch: 1.0, rate: 1.0, distortion: 0 })}
                          className="text-[8px] uppercase tracking-widest text-her-accent hover:underline"
                        >
                          Resetar
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] text-her-muted/60 uppercase font-medium">
                            <span>Tonalidade (Pitch)</span>
                            <span className="text-her-accent">{voiceModulation.pitch.toFixed(2)}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2.0" step="0.05"
                            value={voiceModulation.pitch}
                            onChange={(e) => setVoiceModulation({ ...voiceModulation, pitch: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-her-accent"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] text-her-muted/60 uppercase font-medium">
                            <span>Velocidade (Rate)</span>
                            <span className="text-her-accent">{voiceModulation.rate.toFixed(2)}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2.0" step="0.05"
                            value={voiceModulation.rate}
                            onChange={(e) => setVoiceModulation({ ...voiceModulation, rate: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-her-accent"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] text-her-muted/60 uppercase font-medium">
                            <span>Distorção / Ruído</span>
                            <span className="text-her-accent">{Math.round(voiceModulation.distortion * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.01"
                            value={voiceModulation.distortion}
                            onChange={(e) => setVoiceModulation({ ...voiceModulation, distortion: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-her-accent"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <UserCircle size={12} className="text-her-accent" />
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted font-bold">Identidade da Inteligência</label>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-her-muted/60 mb-2 ml-1">Nome da IA</label>
                          <input 
                            type="text"
                            value={aiProfile.name}
                            onChange={(e) => setAiProfile({ ...aiProfile, name: e.target.value })}
                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-all text-sm font-light text-her-ink/80"
                            placeholder="Ex: OSONE, EREBUS, JARVIS..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-her-muted/60 mb-2 ml-1">Personalidade e Essência</label>
                          <textarea 
                            value={aiProfile.personality}
                            onChange={(e) => setAiProfile({ ...aiProfile, personality: e.target.value })}
                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-all text-sm font-light text-her-ink/80 min-h-[100px] resize-none"
                            placeholder="Descreva como a IA deve se comportar..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-her-muted/60 mb-2 ml-1">Jeito de Escrever / Tom de Voz</label>
                          <textarea 
                            value={aiProfile.writingStyle}
                            onChange={(e) => setAiProfile({ ...aiProfile, writingStyle: e.target.value })}
                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-all text-sm font-light text-her-ink/80 min-h-[80px] resize-none"
                            placeholder="Ex: Respostas curtas, uso de gírias, tom acadêmico..."
                          />
                        </div>

                        {/* Obsidian Integration */}
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded bg-[#7C3AED]/20 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#7C3AED]" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 0L2.5 4.5V19.5L12 24L21.5 19.5V4.5L12 0ZM19.5 18.25L12 21.75L4.5 18.25V5.75L12 2.25L19.5 5.75V18.25Z" />
                                <path d="M12 5.5L7.5 8V16L12 18.5L16.5 16V8L12 5.5ZM15 15.25L12 17L9 15.25V8.75L12 7L15 8.75V15.25Z" />
                              </svg>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-her-accent font-bold">Obsidian Local Sync</span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] text-her-muted/50 mb-1 ml-1 uppercase">API Url (Local REST API)</label>
                              <input 
                                type="text"
                                value={aiProfile.obsidianConfig?.baseUrl || ''}
                                onChange={(e) => setAiProfile({ 
                                  ...aiProfile, 
                                  obsidianConfig: { ...(aiProfile.obsidianConfig || { apiKey: '' }), baseUrl: e.target.value } 
                                })}
                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2 focus:outline-none focus:border-her-accent/20 transition-all text-[11px] font-mono"
                                placeholder="http://127.0.0.1:27123"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-her-muted/50 mb-1 ml-1 uppercase">API Key</label>
                              <input 
                                type="password"
                                value={aiProfile.obsidianConfig?.apiKey || ''}
                                onChange={(e) => setAiProfile({ 
                                  ...aiProfile, 
                                  obsidianConfig: { ...(aiProfile.obsidianConfig || { baseUrl: '' }), apiKey: e.target.value } 
                                })}
                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2 focus:outline-none focus:border-her-accent/20 transition-all text-[11px] font-mono"
                                placeholder="Sua chave secreta..."
                              />
                            </div>
                            <p className="text-[9px] text-her-muted/40 italic">
                              Habilite o plugin "Local REST API" no Obsidian para obter estes dados.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'automation' && (
                  <motion.div
                    key="automation"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="p-6 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-her-accent/10 rounded-2xl">
                          <Home className="text-her-accent" size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-her-ink">Google Home</h3>
                          <p className="text-[10px] text-her-muted uppercase tracking-widest">Sincronização Cloud-to-Cloud</p>
                        </div>
                      </div>
                      <p className="text-xs text-her-muted leading-relaxed font-light">
                        Integre o OSONE à sua infraestrutura Google Home. Controle dispositivos, execute rotinas e monitore sua casa via comandos neurais.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted pl-1 font-bold">Google Project ID</label>
                        <input 
                          type="text"
                          value={keys.googleHomeId || ''}
                          onChange={(e) => setKeys({ ...keys, googleHomeId: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-all text-sm font-light text-her-ink/80"
                          placeholder="osone-home-automation"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted pl-1 font-bold">OAuth Access Token</label>
                        <input 
                          type="password"
                          value={keys.googleHomeToken || ''}
                          onChange={(e) => setKeys({ ...keys, googleHomeToken: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-all text-sm font-light text-her-ink/80"
                          placeholder="ya29.a0AfH6S..."
                        />
                      </div>
                      
                      <button
                        onClick={handleTestConnection}
                        disabled={connectionStatus === 'testing'}
                        className={cn(
                          "w-full py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2",
                          connectionStatus === 'testing' ? "bg-white/5 text-her-muted" :
                          connectionStatus === 'connected' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          connectionStatus === 'error' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-her-accent/10 text-her-accent border border-her-accent/20 hover:bg-her-accent/20"
                        )}
                      >
                        {connectionStatus === 'testing' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Verificando...
                          </>
                        ) : connectionStatus === 'connected' ? (
                          <>
                            <CheckCircle2 size={14} />
                            Conta Vinculada
                          </>
                        ) : (
                          <>
                            <Activity size={14} />
                            Verificar Credenciais
                          </>
                        )}
                      </button>

                      {connectionStatus !== 'idle' && (
                      <div className={cn(
                        "px-4 py-3 rounded-xl text-[10px] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1",
                        connectionStatus === 'connected' ? "bg-green-500/5 text-green-400" :
                        connectionStatus === 'error' ? "bg-red-500/5 text-red-400" :
                        "bg-white/5 text-her-muted"
                      )}>
                        <div className="flex items-start gap-2">
                          {connectionStatus === 'error' ? <AlertCircle size={12} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={12} className="shrink-0 mt-0.5" />}
                          <span className="leading-relaxed font-medium uppercase tracking-wider">{connectionMessage}</span>
                        </div>
                        {connectionStatus === 'error' && (
                          <button 
                            onClick={() => {
                              setKeys({ ...keys, googleHomeToken: '' });
                              setConnectionStatus('idle');
                            }}
                            className="text-[8px] uppercase tracking-[0.2em] font-bold text-her-accent hover:underline text-left mt-1"
                          >
                            Recuperar Conta / Limpar Cache
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 p-5 rounded-2xl space-y-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-her-accent" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-her-ink">Guia de Recuperação</span>
                      </div>
                      <ul className="space-y-2 text-[10px] text-her-muted/60 leading-relaxed list-none pl-1">
                        <li className="flex gap-2 border-l border-white/10 pl-3">
                          <span className="text-her-accent font-bold">01</span>
                          Verifique se o seu Token OAuth está ativo no Google Cloud Console.
                        </li>
                        <li className="flex gap-2 border-l border-white/10 pl-3">
                          <span className="text-her-accent font-bold">02</span>
                          Certifique-se de que o "Home Graph API" está habilitado no seu projeto.
                        </li>
                        <li className="flex gap-2 border-l border-white/10 pl-3">
                          <span className="text-her-accent font-bold">03</span>
                          Se o login persistir bloqueado, limpe o token acima e gere um novo.
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-8 pt-4 bg-white/[0.02] border-t border-white/[0.05]">
              <button 
                onClick={onClose}
                className="group relative w-full bg-her-accent text-white rounded-2xl py-4 font-bold text-xs uppercase tracking-[0.2em] overflow-hidden shadow-lg shadow-her-accent/20 active:scale-95 transition-all"
              >
                <span className="relative z-10">Consolidar Parâmetros</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <div className="mt-4 text-center">
                <span className="text-[8px] text-her-muted opacity-30 uppercase tracking-[0.3em]">Quantum Encrypted Tunnel Active</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


