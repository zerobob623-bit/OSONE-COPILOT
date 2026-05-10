import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Palette, Key, Smartphone, Info, Power, Activity, CheckCircle2, AlertCircle, Loader2, Home, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiKeys, OrbStyle, AppTheme, AIProfile } from '../types';
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
  orbStyle,
  setOrbStyle,
  appTheme,
  setAppTheme,
  aiProfile,
  setAiProfile
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  keys: ApiKeys;
  setKeys: (keys: ApiKeys) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  orbStyle: OrbStyle;
  setOrbStyle: (style: OrbStyle) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  aiProfile: AIProfile;
  setAiProfile: (profile: AIProfile) => void;
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
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-4 font-bold">Voz do Sistema (Frequência)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Puck', 'Charon', 'Kore', 'Fenrir', 'Erebus'].map((voice) => (
                          <button
                            key={voice}
                            onClick={() => setSelectedVoice(voice)}
                            className={cn(
                              "px-4 py-3 rounded-2xl text-[10px] sm:text-xs font-light transition-all border text-left flex items-center justify-between group",
                              selectedVoice === voice 
                                ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                                : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]",
                              voice === 'Erebus' && "border-red-900/20 hover:border-red-500/30"
                            )}
                          >
                            <span className={cn(voice === 'Erebus' && "text-red-500/80 font-medium")}>{voice}</span>
                            {selectedVoice === voice && <div className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--her-accent),0.5)]",
                              voice === 'Erebus' ? "bg-red-600 shadow-red-600/50" : "bg-her-accent"
                            )} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-4 font-bold">Núcleo Manifestação (Orb)</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'classic', label: 'Classic Architecture', desc: 'Versão minimalista e fluida' },
                          { id: 'superintelligence', label: 'Super AI Matrix', desc: 'Explosão binária e complexidade' },
                          { id: 'neural', label: 'Neural Network', desc: 'Processamento orgânico e suave' },
                          { id: 'shadow', label: 'The Eye of Erebus', desc: 'Protocolo de Observação Sombra' }
                        ].map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setOrbStyle(style.id as OrbStyle)}
                            className={cn(
                              "px-5 py-4 rounded-2xl transition-all border text-left group",
                              orbStyle === style.id 
                                ? style.id === 'shadow' 
                                  ? "bg-red-950/20 border-red-900/40"
                                  : "bg-her-accent/10 border-her-accent/30" 
                                : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                            )}
                          >
                            <div className={cn(
                              "text-xs font-bold uppercase tracking-tight",
                              orbStyle === style.id 
                                ? style.id === 'shadow' ? "text-red-500" : "text-her-accent" 
                                : "text-her-ink/70"
                            )}>{style.label}</div>
                            <div className="text-[9px] text-her-muted/50 uppercase tracking-widest mt-1">{style.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-4 font-bold">Espectro Visual (Tema)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'her', label: 'OSONE (Padrão)' },
                          { id: 'cyberpunk', label: 'Cyberpunk' },
                          { id: 'monochrome', label: 'Monochrome' },
                          { id: 'nature', label: 'Natureza' }
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setAppTheme(theme.id as AppTheme)}
                            className={cn(
                              "px-3 py-3 rounded-2xl text-[10px] sm:text-xs font-light transition-all border",
                              appTheme === theme.id 
                                ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                                : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]"
                            )}
                          >
                            {theme.label}
                          </button>
                        ))}
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


