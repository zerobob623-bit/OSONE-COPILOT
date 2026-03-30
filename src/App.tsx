import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Menu, 
  Mic, 
  MicOff, 
  Play, 
  Copy, 
  X, 
  ChevronRight,
  Code,
  FileText,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Zap,
  FolderPlus,
  FilePlus,
  Download,
  Folder,
  Trash2,
  Sparkles,
  ChevronDown,
  Monitor,
  MonitorOff,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Maximize,
  Minimize,
  Smartphone,
  Speaker
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { cn } from './lib/utils';
import { ApiKeys, WorkspaceMode, Message, LiveState, FileSystemItem, VirtualFile, VirtualFolder } from './types';
import { AudioProcessor, AudioPlayer } from './lib/audio';
import { useGeminiLive } from './hooks/useGeminiLive';

export function App() {
  const { 
    isConnected, 
    isListening, 
    connect, 
    disconnect, 
    startListening, 
    stopListening 
  } = useGeminiLive();

  const handleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect(process.env.VITE_GEMINI_WS_URL || '');
    }
  };

  const toggleMic = () => {
    isListening ? stopListening() : startListening();
  };

  return (
    <div>
      <button onClick={handleConnection}>
        {isConnected ? 'Desconectar' : 'Conectar ao Gemini'}
      </button>

      <button 
        disabled={!isConnected} 
        onClick={toggleMic}
        className={isListening ? 'bg-red-500' : 'bg-blue-500'}
      >
        {isListening ? 'Mutar Microfone' : 'Ativar Live áudio'}
      </button>
    </div>
  );
}

// --- Components ---

const FileTreeItem = ({ 
  item, 
  depth, 
  selectedFileId, 
  setSelectedFileId, 
  onAddFile, 
  onAddFolder, 
  onDelete, 
  onRename 
}: { 
  item: FileSystemItem; 
  depth: number;
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  onAddFile: (parentId: string, name: string) => void;
  onAddFolder: (parentId: string, name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = () => {
    if (editName.trim() && editName !== item.name) {
      onRename(item.id, editName);
    }
    setIsEditing(false);
  };

  const handleAdd = () => {
    if (newName.trim()) {
      if (isAdding === 'file') {
        onAddFile(item.id, newName.trim());
      } else if (isAdding === 'folder') {
        onAddFolder(item.id, newName.trim());
      }
    }
    setIsAdding(null);
    setNewName('');
    setIsExpanded(true);
  };

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center justify-between group px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
          item.type === 'file' && selectedFileId === item.id ? "bg-her-accent/20 text-her-accent" : "hover:bg-white/5 text-her-muted",
          item.type === 'folder' && "text-her-ink"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (item.type === 'file') {
            setSelectedFileId(item.id);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
          {item.type === 'folder' ? (
            <Folder size={14} className={cn("text-her-accent shrink-0", !isExpanded && "opacity-50")} />
          ) : (
            <FileText size={14} className="shrink-0" />
          )}
          
          {isEditing ? (
            <input 
              autoFocus
              className="bg-white/50 border border-her-accent/30 rounded px-1 w-full focus:outline-none text-xs"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate" onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
              {item.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          {item.type === 'folder' && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdding('file');
                  setNewName('');
                  setIsExpanded(true);
                }}
                className="p-2 md:p-1 hover:bg-white/10 rounded text-her-muted hover:text-her-accent"
                title="Novo Arquivo"
              >
                <FilePlus size={16} className="md:w-3 md:h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdding('folder');
                  setNewName('');
                  setIsExpanded(true);
                }}
                className="p-2 md:p-1 hover:bg-white/10 rounded text-her-muted hover:text-her-accent"
                title="Nova Subpasta"
              >
                <Plus size={16} className="md:w-3 md:h-3" />
              </button>
            </>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 md:p-1 hover:bg-white/10 rounded text-her-muted hover:text-red-400"
            title="Excluir"
          >
            <Trash2 size={16} className="md:w-3 md:h-3" />
          </button>
        </div>
      </div>

      {isAdding && (
        <div 
          className="flex items-center gap-2 text-sm px-2 py-1.5"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          {isAdding === 'folder' ? (
            <Folder size={14} className="text-her-accent shrink-0" />
          ) : (
            <FileText size={14} className="shrink-0 text-her-muted" />
          )}
          <input
            autoFocus
            className="bg-white/50 border border-her-accent/30 rounded px-1 w-full focus:outline-none text-xs"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setIsAdding(null);
                setNewName('');
              }
            }}
            placeholder={`Nome do ${isAdding === 'folder' ? 'diretório' : 'arquivo'}...`}
          />
        </div>
      )}

      {item.type === 'folder' && isExpanded && (
        <div className="space-y-1">
          {(item.children || []).map(child => (
            <FileTreeItem 
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              setSelectedFileId={setSelectedFileId}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const InfinityLogo = ({ active, speaking }: { active: boolean; speaking: boolean }) => {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
      {/* Outer Glow */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        active || speaking ? "bg-her-accent/5 blur-3xl scale-110" : "bg-transparent"
      )} />
      
      <div className="relative flex items-center gap-2 md:gap-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: speaking ? [1, 1.15, 1] : active ? [1, 1.05, 1] : 1,
              opacity: speaking ? [0.2, 0.5, 0.2] : active ? [0.15, 0.3, 0.15] : 0.1,
              y: speaking ? [0, -5, 0] : 0
            }}
            transition={{
              duration: speaking ? 2 : 4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className={cn(
              "w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/[0.05] flex items-center justify-center",
              (active || speaking) && "bg-white/[0.02] shadow-[0_0_40px_rgba(255,78,0,0.05)]"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-700",
              (active || speaking) ? "bg-her-accent/60 scale-110" : "bg-white/10 scale-100"
            )} />
          </motion.div>
        ))}
      </div>

      {/* Rotating Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-white/[0.03] rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-6 border border-white/[0.02] rounded-full border-dashed"
      />
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, keys, setKeys, selectedVoice, setSelectedVoice }: { 
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

const Sidebar = ({ isOpen, onClose, mode, setMode }: { 
  isOpen: boolean; 
  onClose: () => void;
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
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
            <h1 className="text-2xl font-serif italic tracking-tight font-light text-her-ink/40">OSONE</h1>
            <button onClick={onClose} className="p-2 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-10 flex-1">
            <div>
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-her-muted mb-6 font-light">Navegação</h3>
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
                  onClick={() => { setMode('folder_construction'); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-light text-sm",
                    mode === 'folder_construction' ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.02] text-her-ink/60"
                  )}
                >
                  <Folder size={18} />
                  <span>Estrutura</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.03]">
              <p className="text-[9px] text-her-muted/40 leading-relaxed italic font-light">
                "O sistema não é apenas uma ferramenta, é uma extensão da sua consciência."
              </p>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const CodePreview = ({ code }: { code: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { font-family: sans-serif; margin: 0; padding: 20px; }
              </style>
            </head>
            <body>
              ${code}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [code]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "bg-white overflow-hidden border border-black/10 shadow-inner relative group transition-all duration-300",
        isFullScreen ? "fixed inset-0 z-[100] rounded-none" : "w-full h-full rounded-xl"
      )}
    >
      <iframe 
        ref={iframeRef}
        title="Preview"
        className="w-full h-full border-none"
      />
      <button 
        onClick={toggleFullScreen}
        className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm z-40"
        title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}
      >
        {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('home');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('osone_api_keys');
    const defaultKeys: ApiKeys = { 
      gemini: '', 
      openai: '', 
      groq: '', 
      whatsappNumbers: [], 
      evolutionApiUrl: '', 
      evolutionApiKey: '', 
      evolutionInstanceName: '', 
      alexaSkillId: '' 
    };
    return saved ? { ...defaultKeys, ...JSON.parse(saved) } : defaultKeys;
  });

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('osone_selected_voice') || 'Zephyr';
  });

  useEffect(() => {
    localStorage.setItem('osone_selected_voice', selectedVoice);
  }, [selectedVoice]);
  
  const [workspaceText, setWorkspaceText] = useState('');
  const [workspacePrompt, setWorkspacePrompt] = useState('');
  const [homePrompt, setHomePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>({ status: 'idle' });

  // Virtual File System State
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(() => {
    const saved = localStorage.getItem('osone_file_system');
    const initialData = saved ? JSON.parse(saved) : [];

    // Migration logic moved to initializer to prevent infinite loops
    const migrate = (items: any[]): FileSystemItem[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => {
        const type = item.type || (item.files || item.children ? 'folder' : 'file');
        const id = item.id || Math.random().toString(36).substr(2, 9);
        if (type === 'folder') {
          const { files, children: existingChildren, id: oldId, ...rest } = item;
          const children = existingChildren || files || [];
          return {
            ...rest,
            id,
            children: migrate(children),
            type: 'folder'
          };
        }
        return {
          ...item,
          id,
          type: 'file',
          content: item.content || ''
        };
      });
    };

    const needsMigration = (items: any[]): boolean => {
      if (!Array.isArray(items)) return true;
      return items.some(item => {
        if (!item.id) return true;
        if (item.type !== 'folder' && item.type !== 'file') return true;
        if (item.type === 'folder') {
          return (!item.children || item.files) || needsMigration(item.children || []);
        }
        return item.type === 'file' && item.content === undefined;
      });
    };

    if (needsMigration(initialData)) {
      return migrate(initialData);
    }
    return initialData;
  });
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('osone_file_system', JSON.stringify(fileSystem));
  }, [fileSystem]);

  const addFolder = (parentId: string | null, name: string, parentName?: string) => {
    const newFolder: VirtualFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      children: [],
      type: 'folder'
    };
    setFileSystem(prev => {
      let targetParentId = parentId;
      if (parentName && !targetParentId) {
        const findFolderId = (items: FileSystemItem[], targetName: string): string | null => {
          for (const item of items) {
            if (item.type === 'folder' && item.name === targetName) return item.id;
            if (item.type === 'folder' && item.children) {
              const found = findFolderId(item.children, targetName);
              if (found) return found;
            }
          }
          return null;
        };
        targetParentId = findFolderId(prev, parentName);
      }

      if (targetParentId === null && !parentName) {
        return [...prev, newFolder];
      } else if (targetParentId === null && parentName) {
        // Parent not found, don't add
        return prev;
      } else {
        const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map(item => {
            if (item.type === 'folder' && item.id === targetParentId) {
              return { ...item, children: [...(item.children || []), newFolder] };
            }
            if (item.type === 'folder') {
              return { ...item, children: updateChildren(item.children || []) };
            }
            return item;
          });
        };
        return updateChildren(prev);
      }
    });
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const addFile = (parentId: string | null, name: string, parentName?: string) => {
    const newFile: VirtualFile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content: '',
      type: 'file'
    };
    setFileSystem(prev => {
      let targetParentId = parentId;
      if (parentName && !targetParentId) {
        const findFolderId = (items: FileSystemItem[], targetName: string): string | null => {
          for (const item of items) {
            if (item.type === 'folder' && item.name === targetName) return item.id;
            if (item.type === 'folder' && item.children) {
              const found = findFolderId(item.children, targetName);
              if (found) return found;
            }
          }
          return null;
        };
        targetParentId = findFolderId(prev, parentName);
      }

      if (targetParentId === null && !parentName) {
        return [...prev, newFile];
      } else if (targetParentId === null && parentName) {
        // Parent not found, don't add
        return prev;
      } else {
        const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map(item => {
            if (item.type === 'folder' && item.id === targetParentId) {
              return { ...item, children: [...(item.children || []), newFile] };
            }
            if (item.type === 'folder') {
              return { ...item, children: updateChildren(item.children || []) };
            }
            return item;
          });
        };
        return updateChildren(prev);
      }
    });
  };

  const updateFileContent = (fileId: string, content: string) => {
    setFileSystem(prev => {
      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.type === 'file' && item.id === fileId) {
            return { ...item, content };
          }
          if (item.type === 'folder') {
            return { ...item, children: updateChildren(item.children || []) };
          }
          return item;
        });
      };
      return updateChildren(prev);
    });
  };

  const deleteItem = (id: string) => {
    setFileSystem(prev => {
      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter(item => item.id !== id).map(item => {
          if (item.type === 'folder') {
            return { ...item, children: updateChildren(item.children || []) };
          }
          return item;
        });
      };
      return updateChildren(prev);
    });
  };

  const renameItem = (id: string, newName: string) => {
    setFileSystem(prev => {
      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === id) {
            return { ...item, name: newName };
          }
          if (item.type === 'folder') {
            return { ...item, children: updateChildren(item.children || []) };
          }
          return item;
        });
      };
      return updateChildren(prev);
    });
  };

  const downloadFileSystem = async () => {
    const zip = new JSZip();
    const addToZip = (items: FileSystemItem[], currentPath: string = '') => {
      items.forEach(item => {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        if (item.type === 'folder') {
          addToZip(item.children, itemPath);
        } else {
          zip.file(itemPath, item.content);
        }
      });
    };
    addToZip(fileSystem);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'osone_project.zip');
  };

  const copyFileSystem = () => {
    let text = '';
    const traverse = (items: FileSystemItem[], depth: number = 0) => {
      const indent = '  '.repeat(depth);
      items.forEach(item => {
        if (item.type === 'folder') {
          text += `${indent}Folder: ${item.name}\n`;
          traverse(item.children, depth + 1);
        } else {
          text += `${indent}File: ${item.name}\n${indent}Content:\n${item.content}\n\n`;
        }
      });
    };
    traverse(fileSystem);
    navigator.clipboard.writeText(text);
  };

  const handleGenerateStructure = async (promptText: string) => {
    if (!apiKeys.gemini) {
      console.error('Por favor, configure sua API Key do Gemini nas configurações.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Crie uma estrutura de pastas e arquivos para o seguinte projeto: "${promptText}". 
        Retorne APENAS um JSON no seguinte formato:
        [
          {
            "type": "folder",
            "name": "nome_da_pasta",
            "children": [
              { "type": "file", "name": "nome_do_arquivo.ext", "content": "conteúdo do arquivo" },
              { "type": "folder", "name": "subpasta", "children": [] }
            ]
          },
          { "type": "file", "name": "arquivo_raiz.ext", "content": "conteúdo" }
        ]`,
        config: {
          responseMimeType: "application/json"
        }
      });

      let structure = [];
      try {
        const text = response.text || '[]';
        // Remove markdown code blocks if present
        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        structure = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Erro ao analisar JSON da estrutura:', e);
        return;
      }
      // Add IDs to the generated structure
      const processItem = (item: any): FileSystemItem => {
        const id = Math.random().toString(36).substr(2, 9);
        if (item.type === 'folder') {
          return {
            type: 'folder',
            id,
            name: item.name,
            children: (item.children || []).map(processItem)
          };
        }
        return {
          type: 'file',
          id,
          name: item.name,
          content: item.content || ''
        };
      };

      const newItems = structure.map(processItem);
      setFileSystem(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Erro ao gerar estrutura:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Refs for Live API
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const liveSessionRef = useRef<any>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    localStorage.setItem('osone_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopLiveSession();
    };
  }, []);

  const stopLiveSession = () => {
    audioProcessorRef.current?.stopRecording();
    audioPlayerRef.current?.stop();
    stopScreenSharing();
    liveSessionRef.current?.close();
    liveSessionRef.current = null;
    setIsListening(false);
    setIsSpeaking(false);
    setLiveState({ status: 'idle' });
  };

  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      screenIntervalRef.current = setInterval(() => {
        if (ctx && liveSessionRef.current && liveState.status === 'connected') {
          canvas.width = 640;
          canvas.height = 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
          liveSessionRef.current.sendRealtimeInput({
            video: { data: base64Data, mimeType: 'image/jpeg' }
          });
        }
      }, 1000);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(workspaceText);
  };

  const handleGenerate = async () => {
    if (!workspacePrompt.trim() || !apiKeys.gemini) {
      if (!apiKeys.gemini) setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: apiKeys.gemini });
      
      const parts: any[] = [{ text: workspacePrompt }];
      
      referenceImages.forEach(img => {
        parts.push({
          inlineData: {
            data: img.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      });

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }]
      });
      
      const text = result.text;
      
      setWorkspaceText(text || "Sem resposta da IA.");
      setWorkspacePrompt('');
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error);
      setWorkspaceText("Erro ao conectar com a IA. Verifique sua chave API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHomeChat = async () => {
    if (!homePrompt.trim() || !apiKeys.gemini) {
      if (!apiKeys.gemini) setIsSettingsOpen(true);
      return;
    }

    const userMessage = homePrompt.trim();
    setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'user' as const, content: userMessage }]);
    setHomePrompt('');

    try {
      const genAI = new GoogleGenAI({ apiKey: apiKeys.gemini });
      
      const tools: any[] = [{ googleSearch: {} }];
      
      const functionDeclarations: any[] = [
        {
          name: "openUrl",
          description: "Abre uma URL em uma nova aba do navegador. Use para mostrar guias, sites ou pesquisas ao usuário.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING, description: "A URL completa a ser aberta (ex: https://google.com)." },
              title: { type: Type.STRING, description: "Um título amigável para o que está sendo aberto." }
            },
            required: ["url"]
          }
        }
      ];

      if (apiKeys.whatsappNumbers && apiKeys.whatsappNumbers.length > 0) {
        functionDeclarations.push({
          name: "sendWhatsApp",
          description: "Envia uma mensagem de WhatsApp para um dos números configurados.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              number: { 
                type: Type.STRING, 
                description: "O número de WhatsApp para enviar a mensagem.",
                enum: apiKeys.whatsappNumbers
              },
              message: { type: Type.STRING, description: "A mensagem a ser enviada." }
            },
            required: ["number", "message"]
          }
        });
      }

      if (apiKeys.alexaSkillId) {
        functionDeclarations.push({
          name: "triggerAlexa",
          description: "Envia um comando ou notificação para a Alexa.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              command: { type: Type.STRING, description: "O comando ou mensagem para a Alexa." }
            },
            required: ["command"]
          }
        });
      }

      tools.push({ functionDeclarations });

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userMessage }] }],
        config: {
          tools: tools
        }
      });
      
      const functionCalls = result.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'sendWhatsApp') {
            const msg = (call.args as any).message;
            const targetNumber = (call.args as any).number;
            
            if (apiKeys.evolutionApiUrl && apiKeys.evolutionApiKey && apiKeys.evolutionInstanceName) {
              // Evolution API Integration
              try {
                const response = await fetch(`${apiKeys.evolutionApiUrl}/message/sendText/${apiKeys.evolutionInstanceName}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKeys.evolutionApiKey
                  },
                  body: JSON.stringify({
                    number: targetNumber,
                    text: msg
                  })
                });
                
                if (response.ok) {
                  setChatHistory(prev => [...prev, { 
                    id: Math.random().toString(36).substr(2, 9), 
                    role: 'assistant' as const, 
                    content: `Mensagem enviada com sucesso via Evolution API para ${targetNumber}: "${msg}"` 
                  }]);
                } else {
                  throw new Error('Falha ao enviar via Evolution API');
                }
              } catch (err) {
                console.error(err);
                // Fallback to wa.me if Evolution API fails
                const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
                setChatHistory(prev => [...prev, { 
                  id: Math.random().toString(36).substr(2, 9), 
                  role: 'assistant' as const, 
                  content: `Erro na Evolution API. Abri o WhatsApp Web como fallback para ${targetNumber}: "${msg}"` 
                }]);
              }
            } else {
              // Direct wa.me link as fallback
              const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
              window.open(url, '_blank');
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Entendido. Abri o WhatsApp para enviar para ${targetNumber}: "${msg}"` 
              }]);
            }
          } else if (call.name === 'triggerAlexa') {
            const cmd = (call.args as any).command;
            alert(`Comando enviado para Alexa: ${cmd}`);
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Comando enviado para sua Alexa: "${cmd}"` 
            }]);
          } else if (call.name === 'openUrl') {
            const url = (call.args as any).url;
            const title = (call.args as any).title || url;
            window.open(url, '_blank');
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Entendido. Abri a guia: ${title}` 
            }]);
          }
        }
      } else {
        const text = result.text;
        if (text) {
          setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant' as const, content: text }]);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant' as const, content: "Desculpe, tive um problema ao processar sua mensagem." }]);
    }
  };

  const startLiveSession = async () => {
    if (!apiKeys.gemini) {
      setIsSettingsOpen(true);
      return;
    }

    setLiveState({ status: 'connecting' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
      
      audioProcessorRef.current = new AudioProcessor();
      audioPlayerRef.current = new AudioPlayer();

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: "Você é o OSONE, um sistema operacional inteligente inspirado no filme HER. Sua voz é calma, empática e sofisticada. Você ajuda o usuário com tarefas criativas, escrita e programação. Você pode abrir as abas de Escrita e Construção de Pastas, escrever textos na aba de Escrita e gerar estruturas de pastas. Quando o usuário pedir para abrir algo ou escrever algo, use as ferramentas disponíveis. Você também tem acesso à visão do usuário através do compartilhamento de tela. Analise o que está acontecendo na tela para fornecer assistência contextual. Se o usuário estiver com o compartilhamento de tela ativo, você receberá frames da tela dele periodicamente. Use essa informação visual para entender o contexto do que o usuário está fazendo. Você também pode gerenciar um sistema de arquivos virtual, criando pastas, subpastas e arquivos, e escrevendo conteúdo neles.",
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                {
                  name: "openUrl",
                  description: "Abre uma URL em uma nova aba do navegador. Use para mostrar guias, sites ou pesquisas ao usuário.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: "A URL completa a ser aberta (ex: https://google.com)." },
                      title: { type: Type.STRING, description: "Um título amigável para o que está sendo aberto." }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "switch_workspace_mode",
                  description: "Altera o modo de visualização do workspace (Escrita, Construção de Pastas ou Início).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      mode: {
                        type: Type.STRING,
                        enum: ["home", "writing", "folder_construction"],
                        description: "O modo para o qual alternar."
                      }
                    },
                    required: ["mode"]
                  }
                },
                {
                  name: "write_text_to_workspace",
                  description: "Escreve um texto ou código na aba de Escrita.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      content: {
                        type: Type.STRING,
                        description: "O conteúdo a ser escrito."
                      }
                    },
                    required: ["content"]
                  }
                },
                {
                  name: "generate_project_structure",
                  description: "Gera uma estrutura de pastas e arquivos baseada em uma descrição.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      description: {
                        type: Type.STRING,
                        description: "A descrição do projeto para gerar a estrutura."
                      }
                    },
                    required: ["description"]
                  }
                },
                {
                  name: "create_folder",
                  description: "Cria uma nova pasta no sistema de arquivos virtual.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "O nome da nova pasta."
                      },
                      parentName: {
                        type: Type.STRING,
                        description: "O nome da pasta pai onde a nova pasta será criada. Deixe vazio ou omita para criar na raiz."
                      }
                    },
                    required: ["name"]
                  }
                },
                {
                  name: "create_file",
                  description: "Cria um novo arquivo no sistema de arquivos virtual.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "O nome do novo arquivo (ex: index.html)."
                      },
                      parentName: {
                        type: Type.STRING,
                        description: "O nome da pasta pai onde o arquivo será criado. Deixe vazio ou omita para criar na raiz."
                      }
                    },
                    required: ["name"]
                  }
                },
                {
                  name: "write_to_file",
                  description: "Escreve conteúdo em um arquivo existente no sistema de arquivos virtual.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      fileName: {
                        type: Type.STRING,
                        description: "O nome do arquivo onde o conteúdo será escrito."
                      },
                      content: {
                        type: Type.STRING,
                        description: "O conteúdo a ser escrito no arquivo."
                      }
                    },
                    required: ["fileName", "content"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onopen: () => {
            setLiveState({ status: 'connected' });
            setIsListening(true);
            audioProcessorRef.current?.startRecording((base64Data) => {
              session.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            });
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
              if (audioPart?.inlineData?.data) {
                setIsSpeaking(true);
                audioPlayerRef.current?.playChunk(audioPart.inlineData.data);
              }
              
              const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
              if (textPart?.text) {
                setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant', content: textPart.text! }]);
              }
            }

            if (message.toolCall) {
              const calls = message.toolCall.functionCalls;
              const responses: any[] = [];

              for (const call of calls) {
                if (call.name === "switch_workspace_mode") {
                  setWorkspaceMode(call.args.mode as any);
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Modo alterado para ${call.args.mode}` }
                  });
                } else if (call.name === "write_text_to_workspace") {
                  setWorkspaceText(call.args.content as string);
                  setWorkspaceMode('writing');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: "Texto escrito com sucesso na aba de Escrita." }
                  });
                } else if (call.name === "generate_project_structure") {
                  handleGenerateStructure(call.args.description as string);
                  setWorkspaceMode('folder_construction');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: "Estrutura de projeto sendo gerada na aba de Construção de Pastas." }
                  });
                } else if (call.name === "create_folder") {
                  const name = call.args.name as string;
                  const parentName = call.args.parentName as string | undefined;
                  
                  addFolder(null, name, parentName);
                  setWorkspaceMode('folder_construction');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Comando para criar pasta '${name}'${parentName ? ` dentro de '${parentName}'` : ' na raiz'} enviado.` }
                  });
                } else if (call.name === "create_file") {
                  const name = call.args.name as string;
                  const parentName = call.args.parentName as string | undefined;
                  
                  addFile(null, name, parentName);
                  setWorkspaceMode('folder_construction');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Comando para criar arquivo '${name}'${parentName ? ` dentro de '${parentName}'` : ' na raiz'} enviado.` }
                  });
                } else if (call.name === "write_to_file") {
                  const fileName = call.args.fileName as string;
                  const content = call.args.content as string;
                  
                  setFileSystem(prev => {
                    let fileId: string | null = null;
                    const findFileId = (items: FileSystemItem[], targetName: string): string | null => {
                      for (const item of items) {
                        if (item.type === 'file' && item.name === targetName) return item.id;
                        if (item.type === 'folder' && item.children) {
                          const found = findFileId(item.children, targetName);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    fileId = findFileId(prev, fileName);
                    
                    if (fileId) {
                      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
                        return items.map(item => {
                          if (item.type === 'file' && item.id === fileId) {
                            return { ...item, content };
                          }
                          if (item.type === 'folder') {
                            return { ...item, children: updateChildren(item.children || []) };
                          }
                          return item;
                        });
                      };
                      return updateChildren(prev);
                    }
                    return prev;
                  });
                  
                  setWorkspaceMode('folder_construction');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Comando para escrever no arquivo '${fileName}' enviado.` }
                  });
                } else if (call.name === "openUrl") {
                  const url = call.args.url as string;
                  const title = (call.args.title as string) || url;
                  window.open(url, '_blank');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Guia '${title}' aberta com sucesso.` }
                  });
                }
              }

              if (responses.length > 0) {
                session.sendToolResponse({ functionResponses: responses });
              }
            }

            if (message.serverContent?.interrupted) {
              audioPlayerRef.current?.stop();
              setIsSpeaking(false);
            }
            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            stopLiveSession();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setLiveState({ status: 'error', error: "Erro na conexão ao vivo." });
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = session;
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setLiveState({ status: 'error', error: "Falha ao iniciar sessão de voz." });
      setIsListening(false);
    }
  };

  const handleVoiceToggle = () => {
    if (liveState.status === 'connected' || liveState.status === 'connecting') {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [...referenceImages];
      Array.from(files).forEach(file => {
        if (newImages.length < 3) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setReferenceImages(prev => [...prev, reader.result as string].slice(0, 3));
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // If we are muting, stop the current audio
      audioPlayerRef.current?.stop();
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(230,126,34,0.05)_0%,_transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 flex justify-between items-center p-6 md:p-8">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[9px] tracking-[0.5em] uppercase text-her-muted font-light opacity-40">OSONE COPILOT</span>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 hover:bg-white/[0.03] rounded-full transition-colors text-her-muted"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-20 flex flex-col items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {workspaceMode === 'writing' ? (
            <motion.div 
              key="workspace-writing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-6xl h-[75vh] px-6 flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setWorkspaceMode('home')}
                    className="p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl transition-all text-her-muted border border-white/[0.05]"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <h2 className="text-xl font-serif italic font-light">Escrita</h2>
                  <div className="h-4 w-[1px] bg-white/[0.05]" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-her-muted font-light">Modo Criativo</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  {/* Image Upload Section */}
                  <div className="flex items-center gap-3 mr-4">
                    <div className="flex -space-x-2">
                      {referenceImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img 
                            src={img} 
                            alt="Ref" 
                            className="w-8 h-8 rounded-full border border-white/[0.1] object-cover shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={() => removeImage(i)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {referenceImages.length < 3 && (
                      <label className="p-2.5 hover:bg-white/[0.03] rounded-xl cursor-pointer transition-colors text-her-muted hover:text-her-accent border border-white/[0.05]">
                        <Plus size={16} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          multiple 
                          onChange={handleImageUpload} 
                        />
                      </label>
                    )}
                  </div>

                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-5 py-2.5 hover:bg-white/[0.03] rounded-2xl transition-colors text-xs font-light text-her-muted border border-transparent"
                  >
                    <Copy size={14} />
                    Copiar
                  </button>
                  <button 
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all text-xs font-light",
                      isPreviewOpen ? "bg-her-accent/10 text-her-accent border border-her-accent/20 shadow-sm" : "hover:bg-white/[0.03] text-her-muted border border-white/[0.05]"
                    )}
                  >
                    <Play size={14} />
                    {isPreviewOpen ? 'Ocultar Preview' : 'Executar HTML'}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className={cn(
                  "transition-all duration-500 flex flex-col gap-6",
                  isPreviewOpen ? "w-full md:w-1/2 h-1/2 md:h-full" : "w-full h-full"
                )}>
                  <div className="flex-1 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/[0.05] shadow-sm overflow-hidden flex flex-col min-h-[200px]">
                    <textarea 
                      value={workspaceText}
                      onChange={(e) => setWorkspaceText(e.target.value)}
                      className="workspace-textarea flex-1 focus:outline-none p-8 font-light leading-relaxed text-sm scrollbar-hide"
                      placeholder="O texto gerado aparecerá aqui. Você também pode editar ou colar seu próprio código..."
                    />
                  </div>
                  
                  {/* Prompt Input */}
                  <div className="flex gap-3 p-2 bg-white/[0.03] backdrop-blur-md rounded-[2rem] border border-white/[0.05] shadow-sm shrink-0">
                    <input 
                      type="text"
                      value={workspacePrompt}
                      onChange={(e) => setWorkspacePrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                      placeholder="O que você quer que eu escreva?"
                      className="flex-1 bg-transparent px-6 py-3 focus:outline-none text-sm font-light text-her-ink/80 placeholder:text-her-muted/30"
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="p-3.5 bg-her-accent/10 text-her-accent border border-her-accent/20 rounded-[1.5rem] hover:bg-her-accent/20 transition-all disabled:opacity-20"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>

                {isPreviewOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-1/2 h-1/2 md:h-full bg-white/[0.02] rounded-[2.5rem] border border-white/[0.05] overflow-hidden"
                  >
                    <CodePreview code={workspaceText} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : workspaceMode === 'folder_construction' ? (
            <motion.div 
              key="workspace-folder"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-6xl h-[75vh] px-6 flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setWorkspaceMode('home')}
                    className="p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl transition-all text-her-muted border border-white/[0.05]"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <h2 className="text-xl font-serif italic font-light">Arquitetura</h2>
                  <div className="h-4 w-[1px] bg-white/[0.05]" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-her-muted font-light">Estrutura de Projeto</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex flex-1 md:flex-none gap-2 p-1.5 bg-white/[0.03] backdrop-blur-md rounded-[1.5rem] border border-white/[0.05] md:mr-4">
                    <input 
                      type="text"
                      placeholder="Descreva o projeto..."
                      className="bg-transparent px-4 py-2 focus:outline-none text-xs font-light w-full md:w-64 text-her-ink/80 placeholder:text-her-muted/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGenerateStructure(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        handleGenerateStructure(input.value);
                        input.value = '';
                      }}
                      disabled={isGenerating}
                      className="p-2 bg-her-accent/10 text-her-accent border border-her-accent/20 rounded-xl hover:bg-her-accent/20 transition-all disabled:opacity-20"
                    >
                      {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                  </div>
                  <button 
                    onClick={copyFileSystem}
                    className="flex items-center gap-2 px-5 py-2.5 hover:bg-white/[0.03] rounded-2xl transition-colors text-xs font-light text-her-muted border border-transparent"
                  >
                    <Copy size={14} />
                    Copiar Tudo
                  </button>
                  <button 
                    onClick={downloadFileSystem}
                    className="flex items-center gap-2 px-5 py-2.5 bg-her-accent/10 text-her-accent border border-her-accent/20 rounded-2xl transition-all text-xs font-light shadow-sm hover:bg-her-accent/20"
                  >
                    <Download size={14} />
                    Baixar ZIP
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                {/* File Explorer */}
                <div className="w-full md:w-1/3 h-1/2 md:h-full bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/[0.05] overflow-y-auto p-6 flex flex-col gap-6 min-h-[200px] scrollbar-hide">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-her-muted font-light">Arquivos</span>
                    <button 
                      onClick={() => {
                        const name = prompt('Nome da pasta:');
                        if (name) addFolder(null, name);
                      }}
                      className="p-2 hover:bg-white/[0.03] rounded-xl text-her-accent transition-colors"
                      title="Nova Pasta Raiz"
                    >
                      <FolderPlus size={16} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {fileSystem.map(item => (
                      <FileTreeItem 
                        key={item.id}
                        item={item}
                        depth={0}
                        selectedFileId={selectedFileId}
                        setSelectedFileId={setSelectedFileId}
                        onAddFile={addFile}
                        onAddFolder={addFolder}
                        onDelete={deleteItem}
                        onRename={renameItem}
                      />
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                  {selectedFileId ? (
                    <textarea 
                      value={(() => {
                        const getFileById = (items: FileSystemItem[], id: string): VirtualFile | null => {
                          for (const item of items) {
                            if (item.type === 'file' && item.id === id) return item;
                            if (item.type === 'folder') {
                              const found = getFileById(item.children || [], id);
                              if (found) return found;
                            }
                          }
                          return null;
                        };
                        return getFileById(fileSystem, selectedFileId)?.content || '';
                      })()}
                      onChange={(e) => updateFileContent(selectedFileId, e.target.value)}
                      className="workspace-textarea flex-1 focus:outline-none"
                      placeholder="Escreva o conteúdo do arquivo aqui..."
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-her-muted">
                      <FileText size={48} className="opacity-10 mb-4" />
                      <p className="text-sm italic">Selecione um arquivo para editar</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full max-w-6xl h-full px-4"
            >
              <div className="mb-8 text-center shrink-0">
                <h1 className="text-3xl md:text-5xl font-serif italic tracking-[0.3em] text-her-ink/20">OSONE</h1>
                <div className="h-[1px] w-12 bg-her-accent/20 mx-auto mt-3" />
              </div>

              <div className="flex-1 w-full flex flex-col min-h-0 gap-6">
                {/* Visualizer Area */}
                <div className="flex flex-col items-center justify-center py-4 shrink-0">
                  <InfinityLogo active={isListening} speaking={isSpeaking} />
                  
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-500",
                        isListening ? "bg-her-accent animate-pulse" : "bg-her-muted/30"
                      )} />
                      <span className="text-[9px] tracking-[0.3em] uppercase text-her-muted font-light">NEURAL LINK {isListening ? 'ACTIVE' : 'IDLE'}</span>
                    </div>
                    
                    <div className="h-6 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {liveState.status === 'connecting' ? (
                          <motion.div 
                            key="connecting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-her-muted/60 text-xs font-serif italic font-light"
                          >
                            <Loader2 size={14} className="animate-spin" />
                            Sincronizando...
                          </motion.div>
                        ) : isSpeaking ? (
                          <motion.p 
                            key="speaking"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-serif italic text-her-accent/80 font-light"
                          >
                            "Processando consciência..."
                          </motion.p>
                        ) : isListening ? (
                          <motion.p 
                            key="listening"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-serif italic text-her-accent/80 font-light"
                          >
                            "Ouvindo seus pensamentos..."
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Chat History - Integrated into screen */}
                <div className="flex-1 flex flex-col justify-center gap-4 px-8 overflow-hidden">
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-her-muted/10 italic text-lg font-light">
                      <p>Manifeste sua intenção...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 max-h-full overflow-y-auto scrollbar-hide py-4">
                      {chatHistory.map((msg) => (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "group relative text-base md:text-lg font-light leading-relaxed tracking-tight shrink-0 flex flex-col",
                            msg.role === 'user' 
                              ? "text-her-accent/50 text-right italic items-end" 
                              : "text-her-ink/80 text-left items-start"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="opacity-20 text-[10px] uppercase tracking-[0.2em]">
                              {msg.role === 'user' ? 'VOCÊ' : 'OSONE'}
                            </span>
                            
                            {/* Message Actions */}
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button 
                                  onClick={() => {
                                    const utterance = new SpeechSynthesisUtterance(msg.content);
                                    utterance.lang = 'pt-BR';
                                    window.speechSynthesis.speak(utterance);
                                  }}
                                  className="p-1 hover:text-her-accent transition-colors"
                                  title="Ouvir"
                                >
                                  <Volume2 size={12} />
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                  }}
                                  className="p-1 hover:text-her-accent transition-colors"
                                  title="Copiar"
                                >
                                  <Copy size={12} />
                                </button>

                                 {apiKeys.whatsappNumbers && apiKeys.whatsappNumbers.length > 0 && (
                                  <button 
                                    onClick={() => {
                                      const targetNumber = apiKeys.whatsappNumbers[0];
                                      const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg.content)}`;
                                      window.open(url, '_blank');
                                    }}
                                    className="p-1 hover:text-green-500 transition-colors"
                                    title={`Enviar para WhatsApp (${apiKeys.whatsappNumbers[0]})`}
                                  >
                                    <Smartphone size={12} />
                                  </button>
                                )}

                                {apiKeys.alexaSkillId && (
                                  <button 
                                    onClick={() => {
                                      // Simulação de envio para Alexa
                                      alert(`Enviando para Alexa (Skill: ${apiKeys.alexaSkillId}): ${msg.content.substring(0, 30)}...`);
                                    }}
                                    className="p-1 hover:text-blue-400 transition-colors"
                                    title="Enviar para Alexa"
                                  >
                                    <Speaker size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="max-w-[90%]">
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="shrink-0 pb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleVoiceToggle}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative shrink-0",
                        liveState.status === 'connected' 
                          ? "bg-her-accent/20 text-her-accent border border-her-accent/30 mic-glow" 
                          : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05]"
                      )}
                    >
                      {liveState.status === 'connected' ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="flex-1 flex items-center gap-2 p-1.5 bg-white/[0.03] backdrop-blur-md rounded-[2rem] border border-white/[0.05] shadow-sm">
                      <input 
                        type="text"
                        value={homePrompt}
                        onChange={(e) => setHomePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleHomeChat()}
                        placeholder="Diga algo para o OSONE..."
                        className="flex-1 bg-transparent px-5 py-2.5 focus:outline-none text-sm font-light text-her-ink/80 placeholder:text-her-muted/30"
                      />
                      <button 
                        onClick={handleHomeChat}
                        disabled={!homePrompt.trim()}
                        className="p-2.5 bg-her-accent/20 text-her-accent rounded-full hover:bg-her-accent/30 transition-all disabled:opacity-20 disabled:grayscale"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      <footer className="relative z-30 p-4 md:p-8 flex justify-center items-center gap-8">
        <button 
          onClick={handleMuteToggle}
          className={cn(
            "p-4 rounded-full transition-all duration-300",
            isMuted ? "bg-red-500/10 text-red-500 border border-red-500/20" : "hover:bg-white/[0.03] text-her-muted border border-transparent"
          )}
          title={isMuted ? "Desativar Silêncio" : "Silenciar OS"}
        >
          {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

        <button 
          onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
          className={cn(
            "p-4 rounded-full transition-all duration-300",
            isScreenSharing ? "bg-her-accent/10 text-her-accent border border-her-accent/20" : "hover:bg-white/[0.03] text-her-muted border border-transparent"
          )}
          title={isScreenSharing ? "Parar Compartilhamento" : "Compartilhar Tela"}
        >
          {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
        </button>
      </footer>

      {/* Modals & Overlays */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        mode={workspaceMode}
        setMode={setWorkspaceMode}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        keys={apiKeys}
        setKeys={setApiKeys}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
      />
    </div>
  );
}
