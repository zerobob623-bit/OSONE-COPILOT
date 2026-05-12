import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, FileText, Folder, Music, Video, Gamepad2, Zap, Activity, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceMode } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

export const Sidebar = ({ isOpen, onClose, mode, setMode, user, onLogout, onLogin }: { 
  isOpen: boolean; 
  onClose: () => void;
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  user: FirebaseUser | null;
  onLogout: () => void;
  onLogin: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
        />
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 left-0 z-50 w-72 bg-her-bg border-r border-white/[0.03] shadow-2xl p-8 flex flex-col"
        >
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-2xl font-serif italic tracking-tight font-light text-her-ink/40">OSONE 3</h1>
            <button onClick={onClose} className="p-2 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-her-muted mb-6 font-light">Navegação</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => { setMode('home'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'home' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Volume2 size={18} />
                  <span>Início</span>
                </button>
                <button 
                  onClick={() => { setMode('sounds'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'sounds' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Music size={18} />
                  <span>Biblioteca</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-her-muted mb-6 font-light">Workspace</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => { setMode('writing'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'writing' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <FileText size={18} />
                  <span>Escrita</span>
                </button>
                <button 
                  onClick={() => { setMode('webtoon'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'webtoon' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Folder size={18} />
                  <span>Criação de Webtoon</span>
                </button>
                <button 
                  onClick={() => { setMode('viralflow'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'viralflow' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Zap size={18} />
                  <span>Fluxo Viral</span>
                </button>
                <button 
                  onClick={() => { setMode('wellness'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'wellness' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Activity size={18} />
                  <span>Saúde & Estilo</span>
                </button>
                <button 
                  onClick={() => { setMode('canvas'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'canvas' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Gamepad2 size={18} />
                  <span>Interativo</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-white/[0.03]">
            {user ? (
              <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-her-accent/20" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-her-accent/10 flex items-center justify-center text-her-accent font-bold text-xs">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-her-ink/80 truncate leading-tight">{user.displayName}</p>
                  <p className="text-[8px] text-her-accent flex items-center gap-1 mt-0.5 font-medium tracking-wide uppercase">
                    <span className="w-1 h-1 rounded-full bg-her-accent animate-pulse" />
                    Cérebro Conectado
                  </p>
                  <button 
                    onClick={onLogout}
                    className="text-[9px] text-her-muted hover:text-red-400 transition-colors flex items-center gap-1 uppercase tracking-wider mt-1.5"
                  >
                    <LogOut size={10} />
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                 <button 
                  onClick={() => {
                    onLogin();
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-her-accent text-her-bg text-xs font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all uppercase tracking-widest shadow-xl shadow-her-accent/20"
                >
                  <Zap size={14} fill="currentColor" />
                  Conectar ao Cérebro
                </button>

                <div className="flex items-center justify-between px-2 opacity-40 text-her-ink">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-her-muted" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Modo Visitante</span>
                  </div>
                  <span className="text-[8px] opacity-60 uppercase tracking-tighter">Memória Local</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 px-2">
              <p className="text-[8px] text-her-muted/30 leading-relaxed italic font-light">
                {user 
                  ? 'Sua consciência agora está eternizada na rede neural OSONE.' 
                  : 'Sem conexão, seus pensamentos são como sombras ao amanhecer.'}
              </p>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
