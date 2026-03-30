import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiKeys } from '../types';

export const SettingsModal = ({ isOpen, onClose, keys, setKeys, selectedVoice, setSelectedVoice }: { 
  isOpen: boolean; 
  onClose: () => void; 
  keys: ApiKeys;
  setKeys: (keys: ApiKeys) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'ia' | 'integrations'>('ia');
  const [newNumber, setNewNumber] = useState('');

  const addNumber = () => {
    if (newNumber.trim() && !keys.whatsappNumbers.includes(newNumber.trim())) {
      setKeys({ ...keys, whatsappNumbers: [...(keys.whatsappNumbers || []), newNumber.trim()] });
      setNewNumber('');
    }
  };

  const removeNumber = (num: string) => {
    setKeys({ ...keys, whatsappNumbers: (keys.whatsappNumbers || []).filter(n => n !== num) });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-her-bg w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white/[0.05] backdrop-blur-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-serif italic font-light">Configurações</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-8 border-b border-white/[0.05]">
              <button 
                onClick={() => setActiveTab('ia')}
                className={cn(
                  "pb-4 text-[10px] uppercase tracking-[0.2em] font-light transition-all border-b-2",
                  activeTab === 'ia' ? "border-her-accent text-her-accent" : "border-transparent text-her-muted hover:text-her-ink/60"
                )}
              >
                Modelos IA
              </button>
              <button 
                onClick={() => setActiveTab('integrations')}
                className={cn(
                  "pb-4 text-[10px] uppercase tracking-[0.2em] font-light transition-all border-b-2",
                  activeTab === 'integrations' ? "border-her-accent text-her-accent" : "border-transparent text-her-muted hover:text-her-ink/60"
                )}
              >
                Integrações
              </button>
            </div>
            
            <div className="space-y-6 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
              {activeTab === 'ia' ? (
                <>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Gemini API</label>
                    <input 
                      type="password"
                      value={keys.gemini}
                      onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                      placeholder="Insira sua chave..."
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">OpenAI API</label>
                    <input 
                      type="password"
                      value={keys.openai}
                      onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                      placeholder="Insira sua chave..."
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Groq API</label>
                    <input 
                      type="password"
                      value={keys.groq}
                      onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                      placeholder="Insira sua chave..."
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Voz do OSONE</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((voice) => (
                        <button
                          key={voice}
                          onClick={() => setSelectedVoice(voice)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-light transition-all border",
                            selectedVoice === voice 
                              ? "bg-her-accent/10 text-her-accent border-her-accent/30" 
                              : "bg-white/[0.02] text-her-muted border-white/[0.05] hover:bg-white/[0.05]"
                          )}
                        >
                          {voice}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-her-accent font-medium">Evolution API (WhatsApp)</h3>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">API URL</label>
                      <input 
                        type="text"
                        value={keys.evolutionApiUrl}
                        onChange={(e) => setKeys({ ...keys, evolutionApiUrl: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                        placeholder="https://api.evolution.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">API Key</label>
                      <input 
                        type="password"
                        value={keys.evolutionApiKey}
                        onChange={(e) => setKeys({ ...keys, evolutionApiKey: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                        placeholder="Insira sua chave..."
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Nome da Instância</label>
                      <input 
                        type="text"
                        value={keys.evolutionInstanceName}
                        onChange={(e) => setKeys({ ...keys, evolutionInstanceName: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                        placeholder="Ex: minha_instancia"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Números de WhatsApp</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                        placeholder="Ex: 5511999999999"
                      />
                      <button 
                        onClick={addNumber}
                        className="p-3 bg-her-accent/10 text-her-accent border border-her-accent/20 rounded-2xl hover:bg-her-accent/20 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(keys.whatsappNumbers || []).map((num) => (
                        <div key={num} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-2">
                          <span className="text-sm font-light text-her-ink/80">{num}</span>
                          <button onClick={() => removeNumber(num)} className="text-her-muted hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-her-accent font-medium">Alexa</h3>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.2em] text-her-muted mb-2 font-light">Alexa Skill ID</label>
                      <input 
                        type="text"
                        value={keys.alexaSkillId}
                        onChange={(e) => setKeys({ ...keys, alexaSkillId: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 focus:outline-none focus:border-her-accent/30 transition-colors text-sm font-light text-her-ink/80"
                        placeholder="amzn1.ask.skill.xxx..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={onClose}
              className="w-full mt-10 bg-her-accent/10 text-her-accent border border-her-accent/20 rounded-2xl py-4 font-light text-sm hover:bg-her-accent/20 transition-all"
            >
              Confirmar Alterações
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
