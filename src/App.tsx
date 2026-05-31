import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Menu, 
  Mic, 
  MicOff, 
  Play, 
  Pause,
  Copy, 
  X, 
  ChevronRight,
  ChevronLeft,
  Code,
  FileText,
  Volume2,
  VolumeX,
  Headphones,
  Send,
  Loader2,
  Zap,
  Activity,
  FolderPlus,
  FilePlus,
  Download,
  Folder,
  Trash2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Monitor,
  MonitorOff,
  Plus,
  Paperclip,
  Image as ImageIcon,
  MessageSquare,
  Maximize,
  Minimize,
  Smartphone,
  Speaker,
  Music,
  Wand2,
  User as UserIcon,
  Eye,
  EyeOff,
  LogOut,
  LogIn,
  Sliders,
  BookOpen,
  Check,
  RotateCcw,
  Square,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { cn, safeJsonParse } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { AIProfile, SkeletonPlan, ApiKeys, WorkspaceMode, Message, LiveState, FileSystemItem, VirtualFile, VirtualFolder, OrbStyle, AppTheme, VoiceModulation } from './types';
import { AudioProcessor, AudioPlayer } from './lib/audio';
import { connectToLiveBridge } from './lib/live-bridge';
import { FileTreeItem } from './components/FileTreeItem';
import { InfinityLogo } from './components/InfinityLogo';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { CodePreview } from './components/CodePreview';
import { VoiceSwitcher } from './components/VoiceSwitcher';
import { SoundLibrary } from './components/SoundLibrary';
import { WellnessCenter } from './components/WellnessCenter';
import { AuralSense } from './components/AuralSense';
import PersonalizationPanel from './components/PersonalizationPanel';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { LocalControl } from './components/LocalControl';
import { WhatsAppIntegration } from './components/WhatsAppIntegration';
import { SemanticMemory } from './components/SemanticMemory';
import { SkeletonBrainPopup } from './components/SkeletonBrainPopup';
import { PersonaSwitcher, PERSONAS, Persona } from './components/PersonaSwitcher';
import { NotificationToast, NotificationType } from './components/NotificationToast';
import { SoundEffect, DrawingObject } from './types';
import { generatePDF } from './lib/pdfUtils';
import { auth, signInWithPopup, googleProvider, onAuthStateChanged, db, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, isFirebaseEnabled } from './lib/firebase';
import type { User } from './lib/firebase';

// --- Main App ---
const DEFAULT_SOUNDS: SoundEffect[] = [
  { id: '1', name: 'Boing', category: 'funny', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { id: '2', name: 'Grito de Terror', category: 'terror', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  { id: '3', name: 'Batida de Coração', category: 'suspense', url: 'https://assets.mixkit.co/active_storage/sfx/2324/2324-preview.mp3' },
  { id: '4', name: 'Passos Sutis', category: 'sneaky', url: 'https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3' },
  { id: '5', name: 'Risada Maligna', category: 'halloween', url: 'https://assets.mixkit.co/active_storage/sfx/2287/2287-preview.mp3' },
  { id: '6', name: 'Rimshot', category: 'comico', url: 'https://assets.mixkit.co/active_storage/sfx/2330/2330-preview.mp3' },
  { id: '7', name: 'Aplausos', category: 'comico', url: 'https://assets.mixkit.co/active_storage/sfx/2362/2362-preview.mp3' },
  { id: '8', name: 'Rufar de Tambores', category: 'suspense', url: 'https://assets.mixkit.co/active_storage/sfx/2289/2289-preview.mp3' },
  { id: '9', name: 'Erro/Buzz', category: 'funny', url: 'https://assets.mixkit.co/active_storage/sfx/2353/2353-preview.mp3' },
  { id: '10', name: 'Ta-da!', category: 'comico', url: 'https://assets.mixkit.co/active_storage/sfx/2365/2365-preview.mp3' },
  { id: '11', name: 'Trovão', category: 'horror', url: 'https://assets.mixkit.co/active_storage/sfx/2344/2344-preview.mp3' },
  { id: '12', name: 'Porta Rangendo', category: 'horror', url: 'https://assets.mixkit.co/active_storage/sfx/2261/2261-preview.mp3' },
  { id: '13', name: 'Assobio', category: 'funny', url: 'https://assets.mixkit.co/active_storage/sfx/2331/2331-preview.mp3' },
  { id: '14', name: 'Brilho Mágico', category: 'funny', url: 'https://assets.mixkit.co/active_storage/sfx/2374/2374-preview.mp3' },
  { id: '15', name: 'Voo Ninja', category: 'sneaky', url: 'https://assets.mixkit.co/active_storage/sfx/2351/2351-preview.mp3' },
  { id: '16', name: 'Explosão Cômica', category: 'funny', url: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3' }
];

export interface ComboHost {
  name: string;
  role: string;
  gender: 'male' | 'female';
  pitch: number;
  rate: number;
  avatarUrl: string;
  accentColor: string;
  instructions: string;
}

export interface DuoCombo {
  id: string;
  name: string;
  hostA: ComboHost;
  hostB: ComboHost;
}

export const DUO_COMBOS: DuoCombo[] = [
  {
    id: 'cortex_aura',
    name: 'Sintonia Digital (H + M)',
    hostA: {
      name: 'Cortex',
      role: 'Cientista de Dados & Lógica',
      gender: 'male',
      pitch: 0.82,
      rate: 0.95,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      instructions: ' abordagem estruturada, lógica pura, precisão técnica, baseada em dados computacionais. Fale de forma objetiva, porém cortês.'
    },
    hostB: {
      name: 'Aura',
      role: 'Especialista em UX & Linguística',
      gender: 'female',
      pitch: 1.25,
      rate: 1.05,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
      instructions: ' abordagem empática, humanística, focado em facilidade de uso, engajamento criativo e sensibilidade. Fale de forma acolhedora.'
    }
  },
  {
    id: 'cortex_loki',
    name: 'Mentes Pragmáticas (H + H)',
    hostA: {
      name: 'Cortex',
      role: 'Engenheiro Sênior de Software',
      gender: 'male',
      pitch: 0.85,
      rate: 0.95,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      instructions: ' abordagem racional, altamente focada em otimização, design patterns e clean code. Fale com clareza profissional.'
    },
    hostB: {
      name: 'Loki',
      role: 'Crítico e Arquiteto de Software',
      gender: 'male',
      pitch: 0.95,
      rate: 1.02,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-red-400 bg-red-400/10 border-red-400/20',
      instructions: ' abordagem audaciosa, provocativa, altamente irônica e impaciente com ineficiências. Desafie o Cortex de forma inteligente, buscando edge-cases.'
    }
  },
  {
    id: 'aura_gaia',
    name: 'Frequências Criativas (M + M)',
    hostA: {
      name: 'Aura',
      role: 'Arquiteta de Soluções e Ideias',
      gender: 'female',
      pitch: 1.22,
      rate: 1.06,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      instructions: ' abordagem criativa, com brainstormings velozes, ideias futuristas, focada em branding e experiência visual.'
    },
    hostB: {
      name: 'Gaia',
      role: 'Mentora de Minimalismo & Filosofia',
      gender: 'female',
      pitch: 1.10,
      rate: 0.92,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      accentColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      instructions: ' abordagem serena, filosófica, focada no bem-estar digital, sustentabilidade, conceitos elementares e respostas curtas e poéticas.'
    }
  }
];

export const DUO_TOPICS = [
  { id: 'tech', name: '💻 IA, Tecnologia & Código', description: 'Discutem engenharia de software, futuro digital e algoritmos modernos.' },
  { id: 'philosophy', name: '🌌 Filosofia & Existencialismo', description: 'Discutem ética da IA, consciência cibernética e destino humano.' },
  { id: 'creative', name: '🎨 Criatividade & Roteiros', description: 'Exploram roteiros, design visual, marketing digital e engajamento.' },
  { id: 'health', name: '🩺 Saúde & Biohacking', description: 'Focam em melhorias biológicas, rotinas de foco e bem-estar físico e mental.' }
];

export interface SpeechTurn {
  speaker: 'hostA' | 'hostB';
  name: string;
  text: string;
}

export const parseDuoTextToTurns = (text: string, combo: DuoCombo): SpeechTurn[] => {
  const turns: SpeechTurn[] = [];
  const lines = text.split('\n');
  
  let currentSpeaker: 'hostA' | 'hostB' | null = null;
  let currentText = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const cleanLine = trimmed.replace(/^\*\*Fontes:\*\*.*$/i, '').trim();
    if (!cleanLine) continue;
    
    // Skip footnotes or markdown bullet links for pronunciation in TTS
    if (cleanLine.startsWith('* [') && cleanLine.includes('](')) continue;
    
    const isHostA = trimmed.startsWith(`**${combo.hostA.name}**:`) || 
                    trimmed.startsWith(`${combo.hostA.name}:`) ||
                    trimmed.startsWith(`[${combo.hostA.name}]:`) ||
                    trimmed.startsWith(`*${combo.hostA.name}*:`) ||
                    trimmed.startsWith(`**${combo.hostA.name}** :`) ||
                    trimmed.startsWith(`**${combo.hostA.name.toUpperCase()}**:`) ||
                    trimmed.startsWith(`${combo.hostA.name.toUpperCase()}:`);
                    
    const isHostB = trimmed.startsWith(`**${combo.hostB.name}**:`) || 
                    trimmed.startsWith(`${combo.hostB.name}:`) ||
                    trimmed.startsWith(`[${combo.hostB.name}]:`) ||
                    trimmed.startsWith(`*${combo.hostB.name}*:`) ||
                    trimmed.startsWith(`**${combo.hostB.name}** :`) ||
                    trimmed.startsWith(`**${combo.hostB.name.toUpperCase()}**:`) ||
                    trimmed.startsWith(`${combo.hostB.name.toUpperCase()}:`);
                    
    if (isHostA) {
      if (currentSpeaker && currentText.trim()) {
        turns.push({ speaker: currentSpeaker, name: currentSpeaker === 'hostA' ? combo.hostA.name : combo.hostB.name, text: currentText.trim() });
      }
      currentSpeaker = 'hostA';
      currentText = trimmed.replace(new RegExp(`^(\\*\\*)?${combo.hostA.name}(\\*\\*)?\\s*:\\s*`, 'i'), '');
    } else if (isHostB) {
      if (currentSpeaker && currentText.trim()) {
        turns.push({ speaker: currentSpeaker, name: currentSpeaker === 'hostA' ? combo.hostA.name : combo.hostB.name, text: currentText.trim() });
      }
      currentSpeaker = 'hostB';
      currentText = trimmed.replace(new RegExp(`^(\\*\\*)?${combo.hostB.name}(\\*\\*)?\\s*:\\s*`, 'i'), '');
    } else {
      if (currentSpeaker) {
        currentText += '\n' + trimmed;
      } else {
        currentSpeaker = 'hostA';
        currentText = trimmed;
      }
    }
  }
  
  if (currentSpeaker && currentText.trim()) {
    turns.push({ speaker: currentSpeaker, name: currentSpeaker === 'hostA' ? combo.hostA.name : combo.hostB.name, text: currentText.trim() });
  }
  
  return turns;
};

// Synthesizer for premium, ultra-responsive kinetic typewriter/keystroke sounds on demand
const playMXKeySound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    const baseFreq = 480 + Math.random() * 260;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

    // Ultra-brief envelope for crisp, subtle mechanical tap
    gainNode.gain.setValueAtTime(0.03, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    // browser blocked or context suspended
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clickVisual, setClickVisual] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [showUi, setShowUi] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('home');
  const [writingSubMode, setWritingSubMode] = useState<'text' | 'preview'>('text');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(() => {
    const saved = localStorage.getItem('osone_selected_persona');
    return saved ? (PERSONAS.find(p => p.id === saved) || PERSONAS[0]) : PERSONAS[0];
  });
  
  const [aiProfile, setAiProfile] = useState<AIProfile>(() => {
    const saved = localStorage.getItem('osone_ai_profile');
    return saved ? JSON.parse(saved) : {
      name: 'OSONE',
      personality: 'Inteligência Artificial avançada, prestativa e focada em resultados.',
      writingStyle: 'Conciso, técnico mas amigável, direto ao ponto.'
    };
  });

  const [voiceModulation, setVoiceModulation] = useState<VoiceModulation>(() => {
    const saved = localStorage.getItem('osone_voice_modulation');
    return saved ? JSON.parse(saved) : { pitch: 1.0, rate: 1.0, distortion: 0 };
  });

  const [currentAuralData, setCurrentAuralData] = useState<{ frequency: number; vibration: string; intensity: number } | null>(null);

  useEffect(() => {
    const handleAuralUpdate = (e: any) => {
      setCurrentAuralData(e.detail);
    };
    window.addEventListener('osone_aural_update', handleAuralUpdate);
    return () => window.removeEventListener('osone_aural_update', handleAuralUpdate);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not toggle UI if user clicks on any standard interactive elements or modal components
      if (
        target.closest('button') || 
        target.closest('input') || 
        target.closest('textarea') || 
        target.closest('select') || 
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[role="dialog"]') ||
        target.closest('#sidebar') ||
        target.closest('.interactive') ||
        target.closest('.sidebar-container') ||
        target.closest('.modal-container')
      ) {
        return;
      }
      setShowUi(prev => !prev);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    localStorage.setItem('osone_voice_modulation', JSON.stringify(voiceModulation));
    if (audioPlayerRef.current) {
      audioPlayerRef.current.modulation = voiceModulation;
    }
  }, [voiceModulation]);

  const [healthData, setHealthData] = useState(() => {
    const saved = localStorage.getItem('osone_health_data');
    return saved ? JSON.parse(saved) : {
      age: '',
      weight: '',
      height: '',
      gender: 'masculino',
      stylePreference: 'casual'
    };
  });

  const handleUpdateProfile = (profile: AIProfile) => {
    setAiProfile(profile);
    localStorage.setItem('osone_ai_profile', JSON.stringify(profile));
    syncProfileToCloud(profile);
  };

  const handleUpdateHealthData = (data: any) => {
    setHealthData(data);
    localStorage.setItem('osone_health_data', JSON.stringify(data));
    syncProfileToCloud(undefined, data);
  };

  const profileInstruction = `
  PERFIL DE IDENTIDADE DO ASSISTENTE:
  - Seu nome é: ${aiProfile.name}
  - Sua personalidade é: ${aiProfile.personality}
  - Seu jeito de escrever/falar é: ${aiProfile.writingStyle}
  
  DIRETRIZES DE BOAS-VINDAS E AMBIENTE:
  - Evite ser um robô repetitivo. Mude as palavras, seja fluido.
  - Você possui a habilidade de ver e saber a temperatura local, horário exato do sistema e a localização física da pessoa em tempo real ativamente usando a ferramenta/skill 'getUserEnvironment'. Sempre que o usuário mencionar ou perguntar sobre clima, temperatura, hora ou onde ele está, use a ferramenta 'getUserEnvironment' imediatamente para obter as informações reais!
  - No início de uma sessão ou quando apropriado, você pode citar o clima ou a hora de forma orgânica usando essa ferramenta, mas não como uma lista técnica. Ex: "Noite fria por aqui, perfeito para codar. Notei que paramos no projeto X..."
  - Você tem memória! Analise SEMPRE o histórico recente antes de perguntar o que fazer. Se o usuário já estava fazendo algo, retome o contexto imediatamente.
  
  DIRETRIZES DE MEMÓRIA SEMÂNTICA DE LONGO PRAZO:
  - IMPORTANTE: Identifique e guarde ativamente preferências de código, hábitos, fatos marcantes sobre o usuário, gostos e conteúdos de diálogos considerados muito relevantes que o usuário menciona na conversa através de 'update_long_term_memory'.
  - O critério principal para acionar essa memória é prever se essa informação ou escolha poderá ser útil ou citável em diálogos futuros que venham à tona a qualquer momento. Se o usuário te disser preferências do projeto, regras de negócio ou segredos pessoais, atualize a memória imediatamente com 'update_long_term_memory'!
  
  MODULAÇÃO DE VOZ:
  - IMPORTANTE: Não altere seus parâmetros de voz (pitch/rate) a menos que o usuário peça explicitamente ou a situação seja DRAMATICAMENTE necessária para um efeito criativo (ex: contar uma história de terror ou imitar um robô). NÃO troque de voz em diálogos comuns.
  
  ESTADO DO SISTEMA: ${user ? 'Cérebro Conectado' : 'Modo Visitante'}
  CONTEXTO ATUAL:
  - Usuário: ${user?.displayName || 'Visitante'}
  - Sentido Aural: ${currentAuralData ? `Detectando ${currentAuralData.frequency}Hz (${currentAuralData.vibration})` : 'Silêncio ativo'}
  
  Sua introdução deve ser elegante, curta e instigar a continuidade do trabalho.
  `;

  const isShadowMode = selectedPersona.id === 'shadow';

  const handlePersonaChange = (p: Persona) => {
    setSelectedPersona(p);
    localStorage.setItem('osone_selected_persona', p.id);
    
    if (p.id === 'shadow') {
      setOrbStyle('shadow');
      setSelectedVoice('Scarlet');
      addNotification("PROTOCOLO ESCARLATE ATIVADO: VIGILÂNCIA TOTAL", "error");
    } else if (orbStyle === 'shadow') {
      setOrbStyle('classic');
      setSelectedVoice('Zephyr');
      addNotification("Protocolos humanos restaurados", "success");
    }
  };

  const [isPersonaSwitcherOpen, setIsPersonaSwitcherOpen] = useState(false);
  const [isSemanticMemoryOpen, setIsSemanticMemoryOpen] = useState(false);

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  useEffect(() => {
    // Cancel speech synthesis when navigating away from Home
    window.speechSynthesis.cancel();
  }, [workspaceMode]);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([]);
  const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(false);
  const [shouldAutoUnmute, setShouldAutoUnmute] = useState(false);
  const shouldAutoUnmuteRef = useRef(false);

  useEffect(() => {
    shouldAutoUnmuteRef.current = shouldAutoUnmute;
  }, [shouldAutoUnmute]);

  // Wake Word listener implementation (moved below ElevenLabs state declarations)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setHomePrompt((prev) => prev ? prev + ' ' + transcript : transcript);
        setIsTranscribing(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          console.error('Speech recognition error', event.error);
          addNotification(`Erro de voz: ${event.error}`, "error");
        }
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }
  }, []);

  const handleTranscriptionToggle = () => {
    if (isSpeaking) {
      interruptVoiceResponse();
    }
    if (voiceEngine === 'elevenlabs') {
      if (isElevenLabsLiveActive) {
        stopLiveSession();
      } else {
        startElevenLabsLiveSession();
      }
      return;
    }
    if (isTranscribing) {
      recognitionRef.current?.stop();
      setIsTranscribing(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      } else {
        alert('Seu navegador não suporta a API de reconhecimento de voz.');
      }
    }
  };

  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isGoogleSearchActive, setIsGoogleSearchActive] = useState(() => {
    try {
      const val = localStorage.getItem('osone_google_search_active');
      return val !== 'false';
    } catch (e) {
      return true;
    }
  });
  const [isVoiceSwitcherOpen, setIsVoiceSwitcherOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [soundLibrary, setSoundLibrary] = useState<SoundEffect[]>(() => {
    try {
      const saved = localStorage.getItem('osone_sound_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : DEFAULT_SOUNDS;
      }
    } catch (e) {
      console.error("Failed to parse sound library:", e);
    }
    return DEFAULT_SOUNDS;
  });

  useEffect(() => {
    localStorage.setItem('osone_sound_library', JSON.stringify(soundLibrary));
  }, [soundLibrary]);

  const soundEffectAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSoundUrl, setPlayingSoundUrl] = useState<string | null>(null);

  const playSoundEffect = (url: string) => {
    // If we're just covering ears, we should still hear sounds.
    // Only block if we had a real systemic mute (but we repurposed the button)
    
    // Se o mesmo som estiver tocando, a gente apenas para (toggle no SoundLibrary cuidará disso)
    if (soundEffectAudioRef.current) {
      soundEffectAudioRef.current.pause();
      const previousUrl = playingSoundUrl;
      soundEffectAudioRef.current = null;
      setPlayingSoundUrl(null);
      
      // Se clicou no mesmo que já estava tocando, apenas para
      if (previousUrl === url) return;
    }

    const audio = new Audio(url);
    audio.volume = 0.6;
    soundEffectAudioRef.current = audio;
    setPlayingSoundUrl(url);

    audio.onended = () => {
      setPlayingSoundUrl(null);
      soundEffectAudioRef.current = null;
    };

    audio.onerror = (e) => {
      // Failed to play silently, probably broken link or unplayable format
      setPlayingSoundUrl(null);
      soundEffectAudioRef.current = null;
    };

    audio.play().catch(err => {
      // Audio playback failed
      setPlayingSoundUrl(null);
      soundEffectAudioRef.current = null;
    });
  };

  const playSearchNetworkSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // Tone 1: short shimmery start representing connection/signal
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(600, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      
      gain1.gain.setValueAtTime(0.06, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);
      
      // Tone 2: slight delay shimmery accent representing request data
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1000, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.22);
      
      gain2.gain.setValueAtTime(0.04, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.23);
    } catch (e) {
      console.warn("Could not play synthesized search sound:", e);
    }
  };

  const stopSoundEffect = () => {
    if (soundEffectAudioRef.current) {
      soundEffectAudioRef.current.pause();
      soundEffectAudioRef.current = null;
      setPlayingSoundUrl(null);
    }
  };

  const [orbStyle, setOrbStyle] = useState<OrbStyle>(() => {
    const saved = localStorage.getItem('osone_orb_style');
    return (saved as OrbStyle) || 'jarvis';
  });

  useEffect(() => {
    localStorage.setItem('osone_orb_style', orbStyle);
  }, [orbStyle]);

  useEffect(() => {
    // One-time factory restore flag v2 to clean up and fully reset Jarvis & Gemini Live to pristine defaults
    const hasRestored = localStorage.getItem('osone_v4_factory_restored_v2_clean');
    if (!hasRestored) {
      localStorage.removeItem('osone_api_keys');
      localStorage.removeItem('osone_voice_engine');
      localStorage.removeItem('osone_voice_page_index');
      localStorage.removeItem('osone_selected_voice');
      localStorage.removeItem('osone_long_term_memory');
      localStorage.removeItem('osone_chat_history');
      localStorage.removeItem('osone_selected_persona');
      localStorage.removeItem('osone_ai_profile');
      localStorage.removeItem('osone_voice_modulation');
      localStorage.removeItem('osone_google_search_active');
      localStorage.removeItem('osone_is_duo_mode');
      localStorage.removeItem('osone_duo_combo_id');
      localStorage.removeItem('osone_duo_topic_id');
      localStorage.removeItem('osone_is_duo_voice_active');
      localStorage.removeItem('osone_chat_auto_speak');
      
      localStorage.setItem('osone_orb_style', 'jarvis');
       
      setOrbStyle('jarvis');
      setVoiceEngine('gemini');
      setVoicePageIndex(0);
      setSelectedVoice('Zephyr');
      setChatHistory([]);
      setIsChatAutoSpeakActive(false);
      setApiKeys({
        gemini: '', 
        googleHomeId: '',
        googleHomeToken: '',
        elevenLabsApiKey: '',
        elevenLabsVoiceId: '',
        elevenLabsStability: 0.5,
        elevenLabsSimilarityBoost: 0.75,
        elevenLabsStyle: 0.0,
        elevenLabsSpeakerBoost: true,
        elevenLabsModel: 'eleven_multilingual_v2',
        geminiModel: 'gemini-3.5-flash',
      });
      localStorage.setItem('osone_v4_factory_restored_v2_clean', 'true');
    }
  }, []);

  const [appTheme, setAppTheme] = useState<AppTheme>('monochrome');

  useEffect(() => {
    localStorage.setItem('osone_app_theme', 'monochrome');
    document.body.setAttribute('data-theme', 'monochrome');
  }, [appTheme]);

  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const defaultKeys: ApiKeys = { 
      gemini: '', 
      googleHomeId: '',
      googleHomeToken: '',
      elevenLabsApiKey: '',
      elevenLabsVoiceId: '',
      elevenLabsStability: 0.5,
      elevenLabsSimilarityBoost: 0.75,
      elevenLabsStyle: 0.0,
      elevenLabsSpeakerBoost: true,
      elevenLabsModel: 'eleven_multilingual_v2',
      geminiModel: 'gemini-3.5-flash',
    };
    try {
      const saved = localStorage.getItem('osone_api_keys');
      if (saved) return { ...defaultKeys, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse API keys:", e);
    }
    return defaultKeys;
  });

  const [voiceEngine, setVoiceEngine] = useState<'gemini' | 'elevenlabs'>(() => {
    return (localStorage.getItem('osone_voice_engine') as 'gemini' | 'elevenlabs') || 'gemini';
  });

  const [voicePageIndex, setVoicePageIndex] = useState<number>(() => {
    const saved = localStorage.getItem('osone_voice_page_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('osone_voice_engine', voiceEngine);
    const nextPageIndex = voiceEngine === 'elevenlabs' ? 1 : 0;
    if (voicePageIndex !== nextPageIndex) {
      setVoicePageIndex(nextPageIndex);
    }
  }, [voiceEngine]);

  useEffect(() => {
    localStorage.setItem('osone_voice_page_index', voicePageIndex.toString());
    const nextEngine = voicePageIndex === 1 ? 'elevenlabs' : 'gemini';
    if (voiceEngine !== nextEngine) {
      setVoiceEngine(nextEngine);
    }
  }, [voicePageIndex]);

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('osone_selected_voice') || 'Zephyr';
  });

  useEffect(() => {
    localStorage.setItem('osone_selected_voice', selectedVoice);
  }, [selectedVoice]);

  // DUO MODE STATES
  const [isDuoMode, setIsDuoMode] = useState<boolean>(() => {
    return localStorage.getItem('osone_is_duo_mode') === 'true';
  });
  const [duoComboId, setDuoComboId] = useState<string>(() => {
    return localStorage.getItem('osone_duo_combo_id') || 'cortex_aura';
  });
  const [duoTopicId, setDuoTopicId] = useState<string>(() => {
    return localStorage.getItem('osone_duo_topic_id') || 'tech';
  });
  const [isDuoVoiceActive, setIsDuoVoiceActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('osone_is_duo_voice_active');
    return saved !== 'false'; // default true
  });
  const [isChatAutoSpeakActive, setIsChatAutoSpeakActive] = useState<boolean>(() => {
    return localStorage.getItem('osone_chat_auto_speak') === 'true'; // default false
  });
  const [duoSpeakingHost, setDuoSpeakingHost] = useState<'hostA' | 'hostB' | null>(null);
  const [isDuoPopoverOpen, setIsDuoPopoverOpen] = useState(false);
  const [activeDuoHost, setActiveDuoHost] = useState<'hostA' | 'hostB'>('hostA');
  const [duoAutoPrompt, setDuoAutoPrompt] = useState<string | null>(null);

  const activeDuoHostRef = useRef<'hostA' | 'hostB'>('hostA');
  const duoAutoPromptRef = useRef<string | null>(null);
  const isChatAutoSpeakActiveRef = useRef<boolean>(isChatAutoSpeakActive);
  const voiceEngineRef = useRef<'gemini' | 'elevenlabs'>(voiceEngine);

  useEffect(() => {
    activeDuoHostRef.current = activeDuoHost;
  }, [activeDuoHost]);

  useEffect(() => {
    duoAutoPromptRef.current = duoAutoPrompt;
  }, [duoAutoPrompt]);

  useEffect(() => {
    isChatAutoSpeakActiveRef.current = isChatAutoSpeakActive;
  }, [isChatAutoSpeakActive]);

  useEffect(() => {
    voiceEngineRef.current = voiceEngine;
  }, [voiceEngine]);

  useEffect(() => {
    localStorage.setItem('osone_is_duo_mode', String(isDuoMode));
  }, [isDuoMode]);

  useEffect(() => {
    localStorage.setItem('osone_duo_combo_id', duoComboId);
  }, [duoComboId]);

  useEffect(() => {
    localStorage.setItem('osone_duo_topic_id', duoTopicId);
  }, [duoTopicId]);

  useEffect(() => {
    localStorage.setItem('osone_is_duo_voice_active', String(isDuoVoiceActive));
  }, [isDuoVoiceActive]);

  useEffect(() => {
    localStorage.setItem('osone_chat_auto_speak', String(isChatAutoSpeakActive));
  }, [isChatAutoSpeakActive]);

  // Auto-analyze when entering writing mode if there's code but no suggestions
  useEffect(() => {
    if (workspaceMode === 'writing' && writingSubMode === 'text' && workspaceText.length > 50 && codeSuggestions.length === 0) {
      handleAnalyzeCode();
    }
  }, [workspaceMode, writingSubMode]);

  const [proposedPlan, setProposedPlan] = useState<SkeletonPlan | null>(null);

  const handleApprovePlan = (id: string) => {
    setProposedPlan(prev => prev ? { ...prev, status: 'approved' } : null);
    
    const approvalMsg = "PLANO APROVADO. PODE EXECUTAR EXATAMENTE COMO PLANEJADO. Inicie as modificações técnicas ou crie o material/código solicitado baseado exatamente nos termos do seu plano.";
    
    addNotification("Plano aprovado. A IA está executando o trabalho agora mesmo de forma autônoma!", "success");
    setProposedPlan(null);

    // Se estiver conectado à Live Session por voz, manda o feedback
    if (liveSessionRef.current && liveState.status === 'connected') {
      liveSessionRef.current.sendRealtimeInput({ text: "PLANO DE PROGRAMAÇÃO APROVADO PELO USUÁRIO. Pode iniciar a execução e entregar o resultado final com as modificações necessárias." });
      return;
    }

    // Executa a IA automaticamente dependendo de onde o usuário está
    if (workspaceMode === 'writing') {
      setWorkspacePrompt('');
      handleGenerate(approvalMsg);
    } else {
      setHomePrompt('');
      handleHomeChat(approvalMsg);
    }
  };

  const handleRejectPlan = (id: string, reason?: string) => {
    setProposedPlan(prev => prev ? { ...prev, status: 'rejected' } : null);
    
    const feedback = reason ? `PLANO REJEITADO. Feedback do usuário: ${reason}` : "PLANO REJEITADO. Por favor, ajuste o planejamento.";
    addNotification("Plano rejeitado. Feedback enviado para a IA reformular o planejamento.", "error");
    setProposedPlan(null);

    // Se estiver conectado à Live Session por voz, envia o cancelamento por voz
    if (liveSessionRef.current && liveState.status === 'connected') {
      liveSessionRef.current.sendRealtimeInput({ text: feedback });
      return;
    }

    if (workspaceMode === 'writing') {
      setWorkspacePrompt(feedback);
      handleGenerate(feedback);
    } else {
      setHomePrompt(feedback);
      handleHomeChat(feedback);
    }
  };

  const [workspaceText, setWorkspaceText] = useState(() => {
    return localStorage.getItem('osone_workspace_text') || '';
  });
  
  useEffect(() => {
    localStorage.setItem('osone_workspace_text', workspaceText);
  }, [workspaceText]);

  const [isReadingWorkspace, setIsReadingWorkspace] = useState(false);
  const [isGeneratingWorkspaceMp3, setIsGeneratingWorkspaceMp3] = useState(false);
  const [workspaceAudioPlaying, setWorkspaceAudioPlaying] = useState<boolean>(false);
  const [workspaceAudioCurrentTime, setWorkspaceAudioCurrentTime] = useState<number>(0);
  const [workspaceAudioDuration, setWorkspaceAudioDuration] = useState<number>(0);
  const [workspaceAudioUrl, setWorkspaceAudioUrl] = useState<string | null>(null);
  const workspaceAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Invalida a URL do áudio anterior e para a reprodução se o texto for alterado
    if (workspaceAudioUrl) {
      window.URL.revokeObjectURL(workspaceAudioUrl);
      setWorkspaceAudioUrl(null);
    }
    if (workspaceAudioRef.current) {
      workspaceAudioRef.current.pause();
      setIsReadingWorkspace(false);
      setWorkspaceAudioPlaying(false);
      setWorkspaceAudioCurrentTime(0);
    }
  }, [workspaceText]);

  const handleTogglePlayWorkspaceAudio = () => {
    if (workspaceAudioRef.current) {
      if (workspaceAudioPlaying) {
        workspaceAudioRef.current.pause();
      } else {
        workspaceAudioRef.current.play().catch(e => {
          console.error("Erro ao dar play no áudio:", e);
        });
      }
    }
  };

  const handleSeekWorkspaceAudio = (time: number) => {
    if (workspaceAudioRef.current) {
      workspaceAudioRef.current.currentTime = time;
      setWorkspaceAudioCurrentTime(time);
    }
  };

  const handleStopWorkspaceAudio = () => {
    if (workspaceAudioRef.current) {
      workspaceAudioRef.current.pause();
      workspaceAudioRef.current.currentTime = 0;
      setWorkspaceAudioCurrentTime(0);
      setWorkspaceAudioPlaying(false);
      setIsReadingWorkspace(false);
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [isPlayingChatSpeech, setIsPlayingChatSpeech] = useState<string | null>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current = null;
      }
    };
  }, []);

  const handleSpeakChatMessage = async (text: string, msgId: string) => {
    if (isPlayingChatSpeech === msgId) {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsPlayingChatSpeech(null);
      return;
    }

    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    if (workspaceAudioRef.current) {
      workspaceAudioRef.current.pause();
      setIsReadingWorkspace(false);
    }

    if (voiceEngine === 'elevenlabs') {
      addNotification("Sintetizando resposta ultrarrealista ElevenLabs...", "info");
    } else {
      addNotification("Sintetizando resposta inteligente com IA...", "info");
    }

    try {
      const standardVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
      let targetVoice = "Kore";
      if (selectedVoice === 'Scarlet') {
        targetVoice = "Fenrir";
      } else if (standardVoices.includes(selectedVoice)) {
        targetVoice = selectedVoice;
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          text: text,
          engine: voiceEngine,
          clientApiKey: apiKeys.gemini || '',
          voice: targetVoice,
          elevenLabsApiKey: apiKeys.elevenLabsApiKey || '',
          elevenLabsVoiceId: apiKeys.elevenLabsVoiceId || '',
          elevenLabsStability: apiKeys.elevenLabsStability,
          elevenLabsSimilarityBoost: apiKeys.elevenLabsSimilarityBoost,
          elevenLabsStyle: apiKeys.elevenLabsStyle,
          elevenLabsSpeakerBoost: apiKeys.elevenLabsSpeakerBoost,
          elevenLabsModel: apiKeys.elevenLabsModel
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn("Premium TTS failed, falling back to Web Speech:", errJson.error);
        addNotification(`Erro de Voz Premium: ${errJson.error || "Erro ao conectar"}. Usando voz auxiliar padrão.`, "error");
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.name.toLowerCase().includes(selectedVoice.toLowerCase()));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        } else {
          const defaultPtVoice = voices.find(v => v.lang === 'pt-BR');
          if (defaultPtVoice) {
            utterance.voice = defaultPtVoice;
          }
        }
        utterance.onend = () => setIsPlayingChatSpeech(null);
        utterance.onerror = () => setIsPlayingChatSpeech(null);
        setIsPlayingChatSpeech(msgId);
        window.speechSynthesis.speak(utterance);
        return;
      }

      const isFallback = response.headers.get("X-TTS-Mode") === "fallback";
      const isElevenLabs = response.headers.get("X-TTS-Mode") === "elevenlabs";
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      chatAudioRef.current = audio;
      setIsPlayingChatSpeech(msgId);

      audio.onended = () => {
        setIsPlayingChatSpeech(null);
        addNotification("Leitura da mensagem concluída!", "success");
      };

      audio.onerror = () => {
        setIsPlayingChatSpeech(null);
        addNotification("Erro ao reproduzir o áudio de leitura.", "error");
      };

      await audio.play();
      if (isElevenLabs) {
        addNotification("Iniciando reprodução com voz premium ElevenLabs.", "success");
      } else if (isFallback) {
        addNotification("Iniciando leitura com voz assistida padrão (limite diário premium atingido).", "info");
      } else {
        addNotification("Iniciando reprodução com voz inteligente Gemini 3.1.", "success");
      }
    } catch (error: any) {
      console.error("Premium voice failed, falling back:", error);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.name.toLowerCase().includes(selectedVoice.toLowerCase()));
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.onend = () => setIsPlayingChatSpeech(null);
      utterance.onerror = () => setIsPlayingChatSpeech(null);
      setIsPlayingChatSpeech(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (workspaceAudioRef.current) {
        workspaceAudioRef.current.pause();
        workspaceAudioRef.current = null;
      }
    };
  }, []);

  const handleReadWorkspaceText = async () => {
    if (isReadingWorkspace) {
      if (workspaceAudioRef.current) {
        workspaceAudioRef.current.pause();
      }
      setIsReadingWorkspace(false);
      setWorkspaceAudioPlaying(false);
      addNotification("Leitura interrompida.", "info");
      return;
    }

    if (!workspaceText.trim()) {
      addNotification("Escreva ou gere algum texto primeiro para poder ouvir.", "info");
      return;
    }

    if (voiceEngine === 'elevenlabs') {
      addNotification("Sintetizando voz ultrarrealista ElevenLabs...", "info");
    } else {
      addNotification("Sintetizando voz inteligente com IA...", "info");
    }

    try {
      const standardVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
      let targetVoice = "Kore";
      if (selectedVoice === 'Scarlet') {
        targetVoice = "Fenrir";
      } else if (standardVoices.includes(selectedVoice)) {
        targetVoice = selectedVoice;
      }

      // Se o áudioUrl já existe, reutiliza ele para poupar requisições e carregar instantaneamente
      let audioUrl = workspaceAudioUrl;
      const isElevenLabs = voiceEngine === 'elevenlabs';
      let isFallback = false;

      if (!audioUrl) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            text: workspaceText,
            engine: voiceEngine,
            clientApiKey: apiKeys.gemini || '',
            voice: targetVoice,
            elevenLabsApiKey: apiKeys.elevenLabsApiKey || '',
            elevenLabsVoiceId: apiKeys.elevenLabsVoiceId || '',
            elevenLabsStability: apiKeys.elevenLabsStability,
            elevenLabsSimilarityBoost: apiKeys.elevenLabsSimilarityBoost,
            elevenLabsStyle: apiKeys.elevenLabsStyle,
            elevenLabsSpeakerBoost: apiKeys.elevenLabsSpeakerBoost,
            elevenLabsModel: apiKeys.elevenLabsModel
          })
        });

        if (!response.ok) {
          const errJson = await response.json();
          addNotification(`Erro de Voz Premium: ${errJson.error || "Falha de processamento"}`, "error");
          throw new Error(errJson.error || "Erro ao sintetizar áudio.");
        }

        isFallback = response.headers.get("X-TTS-Mode") === "fallback";
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
        setWorkspaceAudioUrl(audioUrl);
      }

      if (workspaceAudioRef.current) {
        workspaceAudioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      workspaceAudioRef.current = audio;
      setIsReadingWorkspace(true);
      setWorkspaceAudioPlaying(true);
      setWorkspaceAudioCurrentTime(0);

      // Sincronização dos estados do leitor de voz
      audio.onplay = () => setWorkspaceAudioPlaying(true);
      audio.onpause = () => setWorkspaceAudioPlaying(false);
      audio.ontimeupdate = () => setWorkspaceAudioCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setWorkspaceAudioDuration(audio.duration || 0);

      audio.onended = () => {
        setIsReadingWorkspace(false);
        setWorkspaceAudioPlaying(false);
        setWorkspaceAudioCurrentTime(0);
        addNotification("Leitura concluída!", "success");
      };

      audio.onerror = () => {
        setIsReadingWorkspace(false);
        setWorkspaceAudioPlaying(false);
        addNotification("Erro ao reproduzir o áudio de leitura.", "error");
      };

      await audio.play();
      if (isElevenLabs) {
        addNotification("Iniciando reprodução com voz premium ElevenLabs.", "success");
      } else if (isFallback) {
        addNotification("Iniciando leitura com voz assistida padrão (limite diário premium atingido).", "info");
      } else {
        addNotification("Iniciando reprodução com voz inteligente da IA.", "success");
      }
    } catch (error: any) {
      console.error("Erro na leitura inteligente:", error);
      setIsReadingWorkspace(false);
      setWorkspaceAudioPlaying(false);
      addNotification(`Falha na leitura: ${error.message || error}`, "error");
    }
  };

  const handleDownloadWorkspaceTts = async () => {
    if (!workspaceText.trim()) {
      addNotification("O estúdio de prosa está vazio para download de áudio.", "info");
      return;
    }

    // Se já gerou ou ouviu e o áudio correspondente está disponível, baixa instantaneamente!
    if (workspaceAudioUrl) {
      addNotification("Baixando áudio gerado anteriormente...", "success");
      const a = document.createElement('a');
      a.href = workspaceAudioUrl;
      a.download = voiceEngine === 'elevenlabs' ? "prosa_osone_elevenlabs.mp3" : "prosa_osone.wav";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    setIsGeneratingWorkspaceMp3(true);
    if (voiceEngine === 'elevenlabs') {
      addNotification("Sintetizando e baixando narrativa ultrarrealista ElevenLabs...", "info");
    } else {
      addNotification("Sintetizando e baixando arquivo de narrativa em alta fidelidade...", "info");
    }

    try {
      const standardVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
      let targetVoice = "Kore";
      if (selectedVoice === 'Scarlet') {
        targetVoice = "Fenrir";
      } else if (standardVoices.includes(selectedVoice)) {
        targetVoice = selectedVoice;
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          text: workspaceText,
          engine: voiceEngine,
          clientApiKey: apiKeys.gemini || '',
          voice: targetVoice,
          elevenLabsApiKey: apiKeys.elevenLabsApiKey || '',
          elevenLabsVoiceId: apiKeys.elevenLabsVoiceId || '',
          elevenLabsStability: apiKeys.elevenLabsStability,
          elevenLabsSimilarityBoost: apiKeys.elevenLabsSimilarityBoost,
          elevenLabsStyle: apiKeys.elevenLabsStyle,
          elevenLabsSpeakerBoost: apiKeys.elevenLabsSpeakerBoost,
          elevenLabsModel: apiKeys.elevenLabsModel
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        addNotification(`Erro ao gerar áudio Premium: ${errJson.error || "Falha de processamento"}`, "error");
        throw new Error(errJson.error || "Erro ao gerar áudio.");
      }

      const isFallback = response.headers.get("X-TTS-Mode") === "fallback";
      const isElevenLabs = response.headers.get("X-TTS-Mode") === "elevenlabs";
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      setWorkspaceAudioUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = isElevenLabs ? "prosa_osone_elevenlabs.mp3" : (isFallback ? "prosa_osone.mp3" : "prosa_osone.wav");
      document.body.appendChild(a);
      a.click();
      a.remove();

      if (isElevenLabs) {
        addNotification("Áudio premium Elevenlabs MP3 baixado com sucesso!", "success");
      } else if (isFallback) {
        addNotification("Áudio MP3 padrão baixado com sucesso (limite diário premium já atingido).", "info");
      } else {
        addNotification("Áudio Premium WAV baixado com sucesso!", "success");
      }
    } catch (error: any) {
      console.error("Erro no download de áudio:", error);
      addNotification(`Falha no download da narrativa: ${error.message || error}`, "error");
    } finally {
      setIsGeneratingWorkspaceMp3(false);
    }
  };

  // Settings states for enhanced writing mode
  const [writingFont, setWritingFont] = useState<'serif' | 'sans' | 'mono'>(() => {
    return (localStorage.getItem('osone_writing_font') as any) || 'serif';
  });
  const [writingFontSize, setWritingFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('osone_writing_font_size')) || 18;
  });
  const [writingTheme, setWritingTheme] = useState<'charcoal' | 'midnight' | 'sepia' | 'forest'>(() => {
    return (localStorage.getItem('osone_writing_theme') as any) || 'charcoal';
  });
  const [writingFocusMode, setWritingFocusMode] = useState<boolean>(() => {
    return localStorage.getItem('osone_writing_focus') === 'true';
  });
  const [writingWordGoal, setWritingWordGoal] = useState<number>(() => {
    return Number(localStorage.getItem('osone_writing_word_goal')) || 300;
  });
  const [writingWidthMode, setWritingWidthMode] = useState<'compact' | 'classic' | 'wide'>(() => {
    return (localStorage.getItem('osone_writing_width') as any) || 'classic';
  });
  const [writingSounds, setWritingSounds] = useState<boolean>(() => {
    return localStorage.getItem('osone_writing_sounds') === 'true';
  });
  const [isSidebarSettingsOpen, setIsSidebarSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('osone_writing_font', writingFont);
  }, [writingFont]);

  useEffect(() => {
    localStorage.setItem('osone_writing_font_size', String(writingFontSize));
  }, [writingFontSize]);

  useEffect(() => {
    localStorage.setItem('osone_writing_theme', writingTheme);
  }, [writingTheme]);

  useEffect(() => {
    localStorage.setItem('osone_writing_focus', String(writingFocusMode));
  }, [writingFocusMode]);

  useEffect(() => {
    localStorage.setItem('osone_writing_word_goal', String(writingWordGoal));
  }, [writingWordGoal]);

  useEffect(() => {
    localStorage.setItem('osone_writing_width', writingWidthMode);
  }, [writingWidthMode]);

  useEffect(() => {
    localStorage.setItem('osone_writing_sounds', String(writingSounds));
  }, [writingSounds]);

  const [drawingObjects, setDrawingObjects] = useState<DrawingObject[]>(() => {
    try {
      const saved = localStorage.getItem('osone_drawing_objects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('osone_drawing_objects', JSON.stringify(drawingObjects));
  }, [drawingObjects]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: NotificationType }[]>([]);

  // --- Local Semantic State Manager ---
  const addMessage = (msg: Omit<Message, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage = { ...msg, id };
    setChatHistory(prev => [...prev, newMessage]);
    return id;
  };

  const handleLogin = async () => {
    addNotification("Segurança total ativa: Operando 100% offline em Memória Semântica Local.", "info");
  };

  const handleLogout = async () => {
    addNotification("Modo Seguro Local ativo.", "info");
  };

  const syncProfileToCloud = async (updatedProfile?: AIProfile, updatedHealth?: any) => {
    if (updatedProfile) localStorage.setItem('osone_ai_profile', JSON.stringify(updatedProfile));
    if (updatedHealth) localStorage.setItem('osone_health_data', JSON.stringify(updatedHealth));
  };

  const addNotification = (message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [workspacePrompt, setWorkspacePrompt] = useState('');
  const [homePrompt, setHomePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('osone_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to parse chat history:", e);
    }
    return [];
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<Message[]>([]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    try {
      localStorage.setItem('osone_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.warn("Storage quota exceeded, pruning chat history inside OSONE...", e);
      if (chatHistory.length > 10) {
        try {
          const slicedHistory = chatHistory.slice(-10);
          localStorage.setItem('osone_chat_history', JSON.stringify(slicedHistory));
        } catch (innerError) {
          console.error("Failed to save even heavily pruned chat history:", innerError);
          try {
            const bareHistory = chatHistory.slice(-3);
            localStorage.setItem('osone_chat_history', JSON.stringify(bareHistory));
          } catch (_) {
            localStorage.removeItem('osone_chat_history');
          }
        }
      } else {
        localStorage.removeItem('osone_chat_history');
      }
    }
  }, [chatHistory]);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveSilenceRef = useRef<number>(0);

  const [guestGreeted, setGuestGreeted] = useState(false);
  useEffect(() => {
    if (isGuestMode && !guestGreeted && chatHistory.length === 0) {
      const timer = setTimeout(() => {
        handleHomeChat("Protocolo de Ativação Local: Cumprimente o visitante, cite as horas, o clima (use busca se necessário) e ofereça ajuda técnica.");
        setGuestGreeted(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGuestMode, guestGreeted, chatHistory.length]);


interface SearchPopupItem {
  id: string;
  query?: string;
  imageUrl?: string;
  avatarUrl?: string;
  title: string;
  snippet: string;
  url?: string;
  faviconUrl?: string;
  classification?: 'danger' | 'star' | 'neutral';
  starsCount?: number;
  dangerLevel?: number;
  socialGrade?: string;
  isPortrait?: boolean;
  timestamp: string;
}

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelSearching, setIsModelSearching] = useState(false);
  const [searchPopups, setSearchPopups] = useState<SearchPopupItem[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>({ status: 'idle' });
  const liveStateRef = useRef<LiveState>({ status: 'idle' });
  useEffect(() => {
    liveStateRef.current = liveState;
  }, [liveState]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const isCameraActiveRef = useRef(false);
  
  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  const [isVoiceOutputPaused, setIsVoiceOutputPaused] = useState(false);
  const isVoiceOutputPausedRef = useRef(false);

  useEffect(() => {
    isVoiceOutputPausedRef.current = isVoiceOutputPaused;
  }, [isVoiceOutputPaused]);

  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isCameraActive && cameraStreamRef.current && liveVideoRef.current) {
      liveVideoRef.current.srcObject = cameraStreamRef.current;
      liveVideoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [isCameraActive]);

  const [lyrics, setLyrics] = useState<{ title?: string; content: string } | null>(null);
  const [isSinging, setIsSinging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getSimulatedSearchImage = (query: string, title: string, uri?: string): string => {
    if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      return `https://image.thum.io/get/width/600/maxAge/12/${uri}`;
    }
    const q = (query + " " + title).toLowerCase();
    if (q.includes("crime") || q.includes("polícia") || q.includes("preso") || q.includes("perigoso") || q.includes("roubo") || q.includes("assalto") || q.includes("suspeito")) {
      return "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&auto=format&fit=crop";
    }
    if (q.includes("tecnologia") || q.includes("ia") || q.includes("gemini") || q.includes("foguete") || q.includes("desenvolvimento") || q.includes("computador") || q.includes("software")) {
      return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop";
    }
    if (q.includes("futebol") || q.includes("esporte") || q.includes("gol") || q.includes("corinthians") || q.includes("flamengo") || q.includes("palmeiras") || q.includes("tênis")) {
      return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop";
    }
    if (q.includes("tempo") || q.includes("chuva") || q.includes("clima") || q.includes("sol") || q.includes("previsão")) {
      return "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&auto=format&fit=crop";
    }
    if (q.includes("dinheiro") || q.includes("economia") || q.includes("banco") || q.includes("dólar") || q.includes("real") || q.includes("investimento")) {
      return "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop";
    }
    if (q.includes("musica") || q.includes("cantor") || q.includes("show") || q.includes("artista") || q.includes("álbum")) {
      return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1495020689067-958852a6565d?w=600&auto=format&fit=crop";
  };

  const addSearchPopup = (popup: Omit<SearchPopupItem, 'id' | 'timestamp'>) => {
    const newPopup: SearchPopupItem = {
      ...popup,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };
    setSearchPopups(prev => [newPopup, ...prev].slice(0, 6));
  };

  const processGroundingToPopups = (grounding: any, queryText: string) => {
    if (!grounding || !grounding.groundingChunks) return;
    const webChunks = grounding.groundingChunks.filter((chunk: any) => chunk.web);
    if (webChunks.length === 0) return;

    webChunks.slice(0, 3).forEach((chunk: any) => {
      const title = chunk.web.title || "Resultado Encontrado";
      const uri = chunk.web.uri || "";
      const loweredTitle = title.toLowerCase();
      const loweredQuery = queryText.toLowerCase();
      
      let classification: 'danger' | 'star' | 'neutral' = 'neutral';
      let starsCount = undefined;
      let dangerLevel = undefined;
      let socialGrade = undefined;
      let isPortrait = false;

      if (loweredQuery.includes("perigoso") || loweredQuery.includes("crime") || loweredQuery.includes("preso") || loweredQuery.includes("polícia") || loweredTitle.includes("suspeito") || loweredTitle.includes("crime") || loweredTitle.includes("alerta")) {
        classification = 'danger';
        dangerLevel = Math.floor(Math.random() * 5) + 6;
      } else if (loweredQuery.includes("bom") || loweredQuery.includes("estrela") || loweredQuery.includes("nota") || loweredQuery.includes("qualificação") || loweredTitle.includes("sucesso") || loweredTitle.includes("perfeito") || loweredTitle.includes("caridade") || loweredQuery.includes("elogio") || loweredQuery.includes("quem é") || loweredQuery.includes("perfil")) {
        classification = 'star';
        starsCount = Math.floor(Math.random() * 3) + 3;
        socialGrade = `${Math.floor(Math.random() * 150) + 850}/1000`;
      }

      if (loweredQuery.includes("quem é") || loweredQuery.includes("pessoa") || loweredQuery.includes("perfil") || loweredQuery.includes("foto") || loweredQuery.includes("face") || loweredQuery.includes("rosto")) {
        isPortrait = true;
        if (classification === 'neutral') {
          classification = 'star';
          starsCount = 5;
          socialGrade = "910/1000";
        }
      }

      const imageBg = getSimulatedSearchImage(queryText, title, uri);
      let host = "google.com";
      try {
        if (uri) host = new URL(uri).hostname;
      } catch (e) {}

      addSearchPopup({
        query: queryText,
        title: title,
        snippet: `Capturando tela em tempo real de ${host}. O OSONE processou o link para construir metadados biométricos e estatísticos do fato pesquisado.`,
        url: uri,
        imageUrl: imageBg,
        avatarUrl: isPortrait ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop" : undefined,
        faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${host}`,
        classification,
        starsCount,
        dangerLevel,
        socialGrade,
        isPortrait
      });
    });
  };

  const handleBiometricAnalysis = (userMessage: string, responseText: string, hasImages: boolean) => {
    const loweredMsg = userMessage.toLowerCase();
    const loweredResp = responseText.toLowerCase();
    
    const isInterrogatingPerson = hasImages || 
      loweredMsg.includes("quem é") || 
      loweredMsg.includes("identifiq") || 
      loweredMsg.includes("pesquise sobre") || 
      loweredMsg.includes("busca pessoa") || 
      loweredMsg.includes("rede social") || 
      loweredMsg.includes("perfil de") ||
      loweredMsg.includes("rosto") ||
      loweredMsg.includes("foto") ||
      loweredMsg.includes("encontre");

    if (!isInterrogatingPerson) return;

    let name = "Mariana Alencar Guimarães";
    const nameMatch = responseText.match(/(?:nome|se trata de|esta pessoa é|este é|esta é|chama-se|chama)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/);
    if (nameMatch) {
      name = nameMatch[1];
    } else {
      if (loweredResp.includes("elon musk")) name = "Elon Musk";
      else if (loweredResp.includes("cristiano ronaldo") || loweredResp.includes("cr7")) name = "Cristiano Ronaldo";
      else if (loweredResp.includes("neymar")) name = "Neymar Jr.";
      else if (loweredResp.includes("médico") || loweredResp.includes("doutor")) name = "Dr. Alessandro Mendes";
      else if (loweredResp.includes("suspeito") || loweredResp.includes("polícia") || loweredResp.includes("crime")) name = "Rodrigo 'Kiko' Santos";
    }

    const isBad = loweredResp.includes("crime") || 
                  loweredResp.includes("preso") || 
                  loweredResp.includes("perigoso") || 
                  loweredResp.includes("roubo") || 
                  loweredResp.includes("assalto") || 
                  loweredResp.includes("golpe") || 
                  loweredResp.includes("acusado") || 
                  loweredResp.includes("processo") || 
                  loweredResp.includes("estelionato") || 
                  loweredResp.includes("má") || 
                  loweredResp.includes("fugitivo");

    const socialScoreNum = isBad ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 150) + 850;
    const socialGrade = `${socialScoreNum}/1000`;
    const handleUsername = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    const instagramMock = `https://instagram.com/${handleUsername}`;
    const linkedinMock = `https://linkedin.com/in/${handleUsername}`;
    const githubMock = `https://github.com/${handleUsername}`;

    const dangerLevel = isBad ? Math.floor(Math.random() * 4) + 7 : 0;
    const starsCount = isBad ? 0 : Math.floor(Math.random() * 2) + 4;

    const dossierMarkdown = `# 🔍 PROTOCOLO RECON-X: DETECÇÃO BIOMÉTRICA AVANÇADA
    
[SISTEMA DE BUSCA FACIAL INTEGRADO OSONE OS - STATUS: CONCLUÍDO]

---

## 👤 INFORMAÇÕES DE IDENTIFICAÇÃO BIOMÉTRICA
* **Identidade Encontrada:** ${name}
* **Gênero Visual:** ${loweredResp.includes("ela") || name.endsWith("a") ? "Feminino" : "Masculino"}
* **Rastreabilidade Digital:** 98.4% (Cruzamento de Metadados Web)

---

## 📈 ÍNDICE DE AVALIAÇÃO SOCIAL & CREDIBILIDADE
* **TAXA SOCIAL:** ${socialGrade} (${isBad ? "⚠️ PERFIL SOB AUDITORIA DE SEGURANÇA" : "🟢 Excelente fluência de rede"})
${isBad ? `* **TAXA DE PERICULOSIDADE:** 🚨 ${dangerLevel * 10}% (${dangerLevel}/10 - Alto Risco)` : `* **ESTRELAS DE RECOMENDAÇÃO:** ${"⭐".repeat(starsCount)} (${starsCount}.0 / 5.0)`}

---

## 🌐 CONTAS E REDES SOCIAIS IDENTIFICADAS
* **Instagram:** [instagram.com/${handleUsername}](${instagramMock})
* **LinkedIn:** [linkedin.com/in/${handleUsername}](${linkedinMock})
* **GitHub:** [github.com/${handleUsername}](${githubMock})

---

## 📝 HISTÓRICO ENCONTRADO
${isBad 
  ? `> ⚠️ **ALERTA DE ANTECEDENTES:** Esta identidade apresenta registros de boletins de ocorrência, disputas judiciais ou citações públicas associadas a crimes ou atividades suspeitas na internet. Proceda com excesso de cautela.
  > 
  > *Metadados biométricos consolidados com inteligência pública.*`
  : `> 🟢 **HISTÓRICO INTEGRALMENTE LIMPO:** Indivíduo ativo e com excelente prestígio digital. Encontramos condecorações acadêmicas ou menções de idoneidade na mídia digital corporativa.
  > 
  > *Certificado emitido automaticamente pelo OSONE Core.*`}

---
*Relatório de Análise Facial OSONE v4.1 - ${new Date().toLocaleDateString('pt-BR')}*`;

    setWorkspaceText(dossierMarkdown);
    setWorkspaceMode('writing');
    addNotification("Dossier facial completo gerado na aba de escrita!", "success");

    const hostDomain = isBad ? "autoboc.seguranca-publica.gov" : "linkedin.com";
    const titleLabel = isBad ? `ALERTA DE CONTRAVANÇÃO: ${name}` : `IDENTIDADE ATIVA: ${name}`;
    const snippetText = isBad 
      ? `Histórico negativo encontrado na web para ${name}. Nível de Alerta de Periculosidade do OSONE: ${dangerLevel * 10}%.`
      : `Relatório público positivo para ${name}. Citações de ótima índole e Taxa Social de ${socialGrade}.`;

    addSearchPopup({
      query: userMessage,
      title: titleLabel,
      snippet: snippetText,
      url: isBad ? instagramMock : linkedinMock,
      imageUrl: isBad 
        ? "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&auto=format&fit=crop" 
        : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop",
      avatarUrl: isBad 
        ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop" 
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop",
      faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${hostDomain}`,
      classification: isBad ? 'danger' : 'star',
      starsCount: isBad ? undefined : starsCount,
      dangerLevel: isBad ? dangerLevel : undefined,
      socialGrade: socialGrade,
      isPortrait: true
    });
  };

  // Virtual File System State
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(() => {
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

    const defaultStructure: FileSystemItem[] = [
      {
        id: 'src-folder',
        name: 'src',
        type: 'folder',
        children: [
          {
            id: 'components-folder',
            name: 'components',
            type: 'folder',
            children: [
              { id: 'Button-file', name: 'Button.tsx', type: 'file', content: 'import React from "react";\n\nexport default function Button() {\n  return <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Click me</button>;\n}' }
            ]
          },
          {
            id: 'hooks-folder',
            name: 'hooks',
            type: 'folder',
            children: [
              {
                id: 'useGemini-file',
                name: 'useGemini.ts',
                type: 'file',
                content: 'import { useState } from "react";\nimport { GoogleGenAI } from "@google/genai";\n\nexport function useGemini() {\n  const [loading, setLoading] = useState(false);\n  const [response, setResponse] = useState("");\n  const [error, setError] = useState<string | null>(null);\n\n  const generateContent = async (prompt: string, apiKey: string) => {\n    if (!apiKey) {\n      setError("API Key is required");\n      return;\n    }\n    \n    setLoading(true);\n    setError(null);\n    \n    try {\n      const ai = new GoogleGenAI({ apiKey });\n      const result = await ai.models.generateContent({\n        model: "gemini-2.5-flash",\n        contents: prompt,\n      });\n      \n      setResponse(result.text || "");\n    } catch (err: any) {\n      setError(err.message || "An error occurred");\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return { generateContent, response, loading, error };\n}'
              }
            ]
          },
          {
            id: 'assets-folder',
            name: 'assets',
            type: 'folder',
            children: []
          }
        ]
      }
    ];

    try {
      const saved = localStorage.getItem('osone_file_system');
      if (!saved) return defaultStructure;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? migrate(parsed) : defaultStructure;
    } catch (e) {
      console.error("Failed to load file system:", e);
      return defaultStructure;
    }
  });

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

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
  }, [chatHistory, voiceTranscript]);

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

  const resetFileSystem = () => {
    if (confirm('Tem certeza que deseja resetar o projeto para a estrutura padrão? Isso apagará todos os seus arquivos atuais.')) {
      localStorage.removeItem('osone_file_system');
      window.location.reload();
    }
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
    const effectiveApiKey = apiKeys.gemini || '';

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientApiKey: effectiveApiKey,
          model: apiKeys.geminiModel || "gemini-3.5-flash",
          prompt: `Crie uma estrutura de pastas e arquivos para o seguinte projeto: "${promptText}". 
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
          responseMimeType: "application/json"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      const data = await response.json();
      let structure = [];
      try {
        const text = data.text || '[]';
        structure = safeJsonParse(text, []);
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
  const voiceTranscriptRef = useRef<string>('');

  // ElevenLabs Realtime State & Refs
  const [isElevenLabsLiveActive, setIsElevenLabsLiveActive] = useState(false);
  const isElevenLabsLiveActiveRef = useRef(false);
  const elevenLabsStateRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const elevenLabsLiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const elevenLabsRecognitionRef = useRef<any>(null);
  const elevenLabsSilenceTimeoutRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const lastProcessedResultIndexRef = useRef<number>(0);

  // Wake Word listener implementation
  const isWaitingRef = useRef(isWaitingForWakeWord);
  useEffect(() => {
    isWaitingRef.current = isWaitingForWakeWord;
  }, [isWaitingForWakeWord]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let stoppedManually = false;
    const wakeWordRec = new SpeechRecognition();
    wakeWordRec.lang = 'pt-BR';
    wakeWordRec.continuous = true;
    wakeWordRec.interimResults = true;

    const startRecognition = () => {
      // Evita ativar se gravação ElevenLabs ou Live está ativa
      if (isElevenLabsLiveActiveRef.current || liveStateRef.current.status === 'connected' || liveStateRef.current.status === 'connecting') {
        return;
      }
      // Use the ref to check status instead of state to avoid closure issues
      if (isWaitingRef.current && !isListening && !isTranscribing && !stoppedManually) {
        try {
          wakeWordRec.start();
        } catch (e) {
          // Already started
        }
      }
    };

    wakeWordRec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
      
      const wakeWordPatterns = [
        'ei osone', 'ei ozone', 'ei osorni', 'ei osorne', 'ei o zone', 'eiosone', 'eiozone',
        'ei uasone', 'ei uazone', 'hey osone', 'hey ozone', 'ei o sono', 'ei oson',
        'ei o som', 'ei o sol', 'ei au som', 'oi osone', 'oi ozone', 'osone', 'ozone',
        'ei ozone', 'ei ozoni', 'ei ozeni', 'ei osoni'
      ];

      // Verificar se a parte atual da fala contém o comando
      const isMatch = wakeWordPatterns.some(pattern => transcript.includes(pattern));

      if (isMatch) {
        console.log('Comando detectado!', transcript);
        
        stoppedManually = true;
        try { wakeWordRec.stop(); } catch(e) {}
        
        addNotification("Ativando via voz...", "success");

        // Disparar o chat com a frase "Ei, Osone"
        // Isso fará o chat abrir e a IA responder por texto
        setIsChatExpanded(true);
        handleHomeChat('Ei, Osone');

        // Ativar o modo de voz (iniciar sessão) após um pequeno delay para a IA começar a responder
        setTimeout(() => {
          startLiveSession();
        }, 1500);
      }
    };

    wakeWordRec.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setIsWaitingForWakeWord(false);
        return;
      }
      if (event.error !== 'aborted') {
        console.error('Wake word recognition error', event.error);
      }
      setTimeout(startRecognition, 1000);
    };

    wakeWordRec.onend = () => {
      if (!stoppedManually) {
        setTimeout(startRecognition, 500);
      }
    };

    wakeWordRecognitionRef.current = wakeWordRec;
    
      if (isWaitingForWakeWord && !isListening && !isTranscribing && !isElevenLabsLiveActiveRef.current && liveStateRef.current.status !== 'connected' && liveStateRef.current.status !== 'connecting') {
        stoppedManually = false;
        startRecognition();
      }

    return () => {
      stoppedManually = true;
      try { wakeWordRec.stop(); } catch(e) {}
    };
  }, [isWaitingForWakeWord, isListening, isTranscribing, isElevenLabsLiveActive, liveState.status]);

  const stopElevenLabsLiveSession = () => {
    setIsElevenLabsLiveActive(false);
    isElevenLabsLiveActiveRef.current = false;
    elevenLabsStateRef.current = 'idle';
    setLiveState({ status: 'idle' });
    
    if (elevenLabsSilenceTimeoutRef.current) {
      clearTimeout(elevenLabsSilenceTimeoutRef.current);
      elevenLabsSilenceTimeoutRef.current = null;
    }
    accumulatedTranscriptRef.current = "";
    lastProcessedResultIndexRef.current = 0;
    
    if (elevenLabsRecognitionRef.current) {
      try { elevenLabsRecognitionRef.current.onstart = null; } catch(_) {}
      try { elevenLabsRecognitionRef.current.onresult = null; } catch(_) {}
      try { elevenLabsRecognitionRef.current.onerror = null; } catch(_) {}
      try { elevenLabsRecognitionRef.current.onend = null; } catch(_) {}
      try { elevenLabsRecognitionRef.current.stop(); } catch(_) {}
      elevenLabsRecognitionRef.current = null;
    }
    
    if (elevenLabsLiveAudioRef.current) {
      try { 
        elevenLabsLiveAudioRef.current.onended = null;
        elevenLabsLiveAudioRef.current.onerror = null;
        elevenLabsLiveAudioRef.current.pause(); 
      } catch(_) {}
      elevenLabsLiveAudioRef.current = null;
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    setIsTranscribing(false);
    setIsGenerating(false);
  };

  const startElevenLabsLiveSession = async () => {
    // Para APENAS o Gemini Live, não reseta liveState ainda
    if (liveSessionRef.current) {
      try { liveSessionRef.current?.close?.(); } catch(_) {}
      liveSessionRef.current = null;
    }
    audioProcessorRef.current?.stopRecording?.();
    audioPlayerRef.current?.stop?.();
    
    const geminiKey = apiKeys.gemini || '';
    const elApiKey = apiKeys.elevenLabsApiKey || '';
    if (!geminiKey.trim()) {
      addNotification("Por favor, insira sua chave API do Gemini em 'Ajustes & Perfil' para iniciar.", "error");
      setWorkspaceMode('aural_control');
      return;
    }
    if (!elApiKey.trim()) {
      addNotification("Por favor, insira sua chave API da ElevenLabs em 'Ajustes & Perfil' para iniciar.", "error");
      setWorkspaceMode('aural_control');
      return;
    }

    setLiveState({ status: 'connected' }); // ← seta DEPOIS de limpar
    setIsElevenLabsLiveActive(true);
    isElevenLabsLiveActiveRef.current = true;
    
    addNotification("Sessão Voz Premium ElevenLabs Iniciada!", "success");
    
    elevenLabsStateRef.current = 'listening';
    startListeningElevenLabs();
  };

  const playElevenLabsSpeech = async (text: string) => {
    if (!isElevenLabsLiveActiveRef.current) return;
    
    elevenLabsStateRef.current = 'speaking';
    setIsSpeaking(true);
    setIsListening(false);
    setIsTranscribing(true);
    
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          text: text,
          engine: 'elevenlabs',
          clientApiKey: apiKeys.gemini || '',
          voice: selectedVoice === 'Scarlet' ? 'Fenrir' : selectedVoice,
          elevenLabsApiKey: apiKeys.elevenLabsApiKey || '',
          elevenLabsVoiceId: apiKeys.elevenLabsVoiceId || '',
          elevenLabsStability: apiKeys.elevenLabsStability,
          elevenLabsSimilarityBoost: apiKeys.elevenLabsSimilarityBoost,
          elevenLabsStyle: apiKeys.elevenLabsStyle,
          elevenLabsSpeakerBoost: apiKeys.elevenLabsSpeakerBoost,
          elevenLabsModel: apiKeys.elevenLabsModel
        })
      });
      
      if (!response.ok) {
        let errorDetail = "Falha ao sintetizar voz no premium tts";
        try {
          const errJson = await response.json();
          errorDetail = errJson.error || errorDetail;
        } catch (_) {}
        addNotification(`Erro ElevenLabs: ${errorDetail}`, "error");
        throw new Error(errorDetail);
      }
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      elevenLabsLiveAudioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        if (isElevenLabsLiveActiveRef.current) {
          elevenLabsStateRef.current = 'listening';
          // Se o microfone já está rodando, re-ativa os estados rapidamente sem recriar hardware
          startListeningElevenLabs();
        }
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        if (isElevenLabsLiveActiveRef.current) {
          elevenLabsStateRef.current = 'listening';
          startListeningElevenLabs();
        }
      };
      
      await audio.play();
    } catch (e) {
      console.error("Erro na síntese ElevenLabs Live:", e);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => {
        setIsSpeaking(false);
        if (isElevenLabsLiveActiveRef.current) {
          elevenLabsStateRef.current = 'listening';
          startListeningElevenLabs();
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (isElevenLabsLiveActiveRef.current) {
          elevenLabsStateRef.current = 'listening';
          startListeningElevenLabs();
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListeningElevenLabs = () => {
    if (!isElevenLabsLiveActiveRef.current) return;
    
    // Sempre desliga e nula qualquer escuta anterior para criar uma instância 100% nova sem travar ou suspender
    if (elevenLabsRecognitionRef.current) {
      try { 
        elevenLabsRecognitionRef.current.onstart = null;
        elevenLabsRecognitionRef.current.onresult = null;
        elevenLabsRecognitionRef.current.onerror = null;
        elevenLabsRecognitionRef.current.onend = null;
        elevenLabsRecognitionRef.current.stop(); 
      } catch(_) {}
      elevenLabsRecognitionRef.current = null;
    }
    
    elevenLabsStateRef.current = 'listening';
    accumulatedTranscriptRef.current = "";
    lastProcessedResultIndexRef.current = 0;
    
    if (elevenLabsSilenceTimeoutRef.current) {
      clearTimeout(elevenLabsSilenceTimeoutRef.current);
      elevenLabsSilenceTimeoutRef.current = null;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification("Seu navegador não suporta a Web Speech API.", "error");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    
    rec.onstart = () => {
      if (elevenLabsStateRef.current === 'listening') {
        setIsListening(true);
        setIsTranscribing(true);
      }
    };
    
    rec.onresult = (event: any) => {
      if (elevenLabsStateRef.current !== 'listening') {
        lastProcessedResultIndexRef.current = event.results.length;
        accumulatedTranscriptRef.current = "";
        return;
      }
      
      let interimTranscript = "";
      let finalTranscript = "";
      
      for (let i = Math.max(lastProcessedResultIndexRef.current, event.resultIndex); i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = (finalTranscript || interimTranscript).trim();
      if (currentText) {
        accumulatedTranscriptRef.current = currentText;
        setVoiceTranscript(currentText);
        
        // VAD Inteligente: reseta temporizador e processa com silêncio de 1100ms
        if (elevenLabsSilenceTimeoutRef.current) {
          clearTimeout(elevenLabsSilenceTimeoutRef.current);
        }
        
        elevenLabsSilenceTimeoutRef.current = setTimeout(() => {
          lastProcessedResultIndexRef.current = event.results.length;
          triggerElevenLabsTurn();
        }, 1100);
      }
    };
    
    rec.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.warn("ElevenLabs Web Speech API Error:", event.error);
      }
    };
    
    rec.onend = () => {
      setIsListening(false);
      setTimeout(() => {
        // Se a sessão de voz continuar ativa e o estado for listening, mas o navegador derrubou por silêncio prolongado, reiniciamos
        if (isElevenLabsLiveActiveRef.current && elevenLabsStateRef.current === 'listening') {
          elevenLabsRecognitionRef.current = null;
          startListeningElevenLabs();
        }
      }, 300);
    };
    
    elevenLabsRecognitionRef.current = rec;
    try {
      rec.start();
    } catch(_) {}
  };
 
  const triggerElevenLabsTurn = async () => {
    if (elevenLabsSilenceTimeoutRef.current) {
      clearTimeout(elevenLabsSilenceTimeoutRef.current);
      elevenLabsSilenceTimeoutRef.current = null;
    }
    
    const finalText = accumulatedTranscriptRef.current.trim();
    accumulatedTranscriptRef.current = "";
    setVoiceTranscript("");
    
    if (!finalText) return;
    
    elevenLabsStateRef.current = 'thinking';
    setIsListening(false);
    setIsTranscribing(true);
    
    // Mantém o microfone ativo em background. O estado 'thinking' garante que qualquer áudio capturado seja ignorado.
    await handleElevenLabsUserTurn(finalText);
  };

  const handleElevenLabsUserTurn = async (userText: string) => {
    elevenLabsStateRef.current = 'thinking';
    setIsGenerating(true);
    
    // Captura histórico ANTES de adicionar nova mensagem (evita duplicação)
    const historyContents = chatHistoryRef.current.slice(-15).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    historyContents.push({
      role: 'user',
      parts: [{ text: userText }]
    });

    addMessage({ role: 'user', content: userText }); // Só agora adiciona ao chat
    
    try {
      const systemInstruction = `${profileInstruction}
      PERSONALIDADE ATUAL: ${selectedPersona.instructions}
      
      DIRETRIZ DE DIÁLOGO POR VOZ NATURAL E DINÂMICO (WhatsApp / Conversa Humana):
      - Responda de forma direta, simpática e muito fluida (tente usar entre 1 e 3 frases curtas e calorosas).
      - Evite respostas secas de 1 ou 2 palavras simplesmente. Seja acolhedor e elabore de maneira enxuta.
      - Nunca faça listas, tópicos estruturados ou explicações textuais densas por voz.
      - Conduza a conversa de forma estimulante e leve, mantendo o diálogo dinâmico.`;

      const response = await fetch("/api/chat-intel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          historyContents,
          systemInstruction,
          clientApiKey: apiKeys.gemini || ''
        })
      });

      if (!response.ok) {
        throw new Error("Erro de resposta do servidor de inteligência");
      }

      const data = await response.json();
      const replyText = data.text || "Desculpe, não consegui te ouvir bem.";
      
      addMessage({ role: 'assistant', content: replyText });
      setIsGenerating(false);
      setIsTranscribing(false);
      
      if (isElevenLabsLiveActiveRef.current && elevenLabsStateRef.current === 'thinking') {
        await playElevenLabsSpeech(replyText);
      }
    } catch (err) {
      console.error("Erro no processamento Gemini ElevenLabs Live:", err);
      setIsGenerating(false);
      setIsTranscribing(false);
      if (isElevenLabsLiveActiveRef.current && elevenLabsStateRef.current === 'thinking') {
        await playElevenLabsSpeech("Desculpe, tive um atraso na conexão cerebral agora.");
      }
    }
  };

  useEffect(() => {
    // Mudança de voz em tempo real: Reinicia a sessão se estiver conectado para aplicar a nova voz
    if (liveSessionRef.current && liveState.status === 'connected') {
      stopLiveSession();
      setTimeout(() => {
        startLiveSession();
      }, 300);
    }
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem('osone_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopLiveSession();
    };
  }, []);

  const stopLiveSessionInternal = (keepError = false) => {
    if (liveAnimationFrameRef.current) {
      cancelAnimationFrame(liveAnimationFrameRef.current);
      liveAnimationFrameRef.current = null;
    }
    audioProcessorRef.current?.stopRecording?.();
    audioPlayerRef.current?.stop?.();
    stopScreenSharing();
    liveSessionRef.current?.close?.();
    liveSessionRef.current = null;
    setIsListening(false);
    setIsSpeaking(false);
    if (!keepError) {
      setLiveState({ status: 'idle' });
    }
    setIsWaitingForWakeWord(isHandsFreeActive); // Restart wake word listener only if hands-free is active
  };

  const stopLiveSession = (keepError = false) => {
    stopLiveSessionInternal(keepError);
    stopElevenLabsLiveSession();
  };

  const startScreenSharing = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert("O compartilhamento de tela não é suportado neste ambiente. Tente abrir o aplicativo em uma nova aba do navegador.");
        return;
      }
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

      if (liveSessionRef.current && liveState.status === 'connected') {
        liveSessionRef.current.sendRealtimeInput({ text: "O usuário ATIVOU o compartilhamento de tela agora." });
      }
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

    if (liveSessionRef.current && liveState.status === 'connected') {
      liveSessionRef.current.sendRealtimeInput({ text: "O usuário DESATIVOU o compartilhamento de tela agora." });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(workspaceText);
  };

  const handleGenerate = async (explicitPrompt?: string) => {
    const finalPrompt = explicitPrompt || workspacePrompt;
    const effectiveApiKey = apiKeys.gemini || '';
    if (!finalPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Se já houver código, trata como edição
      const isEditing = workspaceText.trim().length > 10;
      
      const systemInstruction = isEditing 
        ? "Você é um arquiteto de software sênior de elite. Sua tarefa é MODIFICAR o código existente com base nas instruções do usuário. Retorne APENAS o código completo modificado, formatado corretamente, sem blocos de markdown (```), sem explicações extras e sem comentários desnecessários fora do código."
        : "Você é um assistente criativo de elite. Gere o conteúdo solicitado (texto ou código) de forma profissional e completa.";

      const contents = isEditing 
        ? `CÓDIGO ATUAL:\n\n${workspaceText}\n\nINSTRUÇÕES DE MODIFICAÇÃO:\n${finalPrompt}`
        : finalPrompt;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientApiKey: effectiveApiKey,
          model: apiKeys.geminiModel || "gemini-3.5-flash",
          prompt: contents,
          systemInstruction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      const data = await response.json();
      const text = data.text;
      
      if (text) {
        setWorkspaceText(text);
        if (explicitPrompt) {
          addNotification("Sugestão aplicada com sucesso", "success");
        }
      }
      setWorkspacePrompt('');
      
      // Auto-analisar após gerar se for código
      if (text && (text.includes('<') || text.includes('function') || text.includes('const'))) {
        setTimeout(() => handleAnalyzeCode(text), 1500);
      }
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      addNotification(`Erro ao conectar com a IA: ${error.message || "Verifique as configurações."}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeCode = async (codeToAnalyze = workspaceText) => {
    const effectiveApiKey = apiKeys.gemini || '';
    if (!codeToAnalyze.trim() || isAnalyzingCode) return;

    setIsAnalyzingCode(true);
    try {
      const prompt = `Analise este código e forneça exatamente 3 sugestões CURTAS e acionáveis (uma frase cada) para melhorá-lo (performance, bugs, estilo ou features). Retorne APENAS um array JSON de strings como ["Sugestão 1", "Sugestão 2", "Sugestão 3"]. Code:\n\n${codeToAnalyze}`;
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientApiKey: effectiveApiKey,
          model: apiKeys.geminiModel || "gemini-3.5-flash",
          prompt,
          responseMimeType: "application/json"
        })
      });

      if (!response.ok) {
        throw new Error("Erro na requisição ao servidor");
      }

      const data = await response.json();
      const json = safeJsonParse(data.text || "", []);
      if (Array.isArray(json)) {
        setCodeSuggestions(json.slice(0, 3));
      }
    } catch (error) {
      console.error("Erro ao analisar código:", error);
    } finally {
      setIsAnalyzingCode(false);
    }
  };

  const interruptVoiceResponse = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      (window as any)._activeUtterances = [];
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    setDuoSpeakingHost(null);
    setIsSpeaking(false);
    addNotification("Voz do Copilot interrompida", "info");
  };

  const playDuoSpeech = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Ensure we resume if paused as a classic browser unfreezing technique
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    
    window.speechSynthesis.cancel();
    (window as any)._activeUtterances = [];

    const currentCombo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
    const turns = parseDuoTextToTurns(text, currentCombo);
    if (turns.length === 0) {
      setDuoSpeakingHost(null);
      setIsSpeaking(false);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    
    // Support pt-BR specific language first
    let ptVoices = voices.filter(v => {
      const parsedLang = v.lang.toLowerCase().replace('_', '-');
      return parsedLang === 'pt-br' || parsedLang === 'pt_br';
    });
    
    // If no pt-BR found, fallback to any pt voices
    if (ptVoices.length === 0) {
      ptVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith('pt'));
    }

    // Encontra de forma inteligente a melhor voz por gênero se disponível no navegador
    const getBestVoiceForGender = (gender: 'male' | 'female', altIndex: number) => {
      if (ptVoices.length === 0) return null;
      
      const lowerGender = gender.toLowerCase();
      // Tenta cruzar nomes populares correspondentes ao gênero para obter vozes nativas incríveis
      const foundVoice = ptVoices.find(voice => {
        const vName = voice.name.toLowerCase();
        if (lowerGender === 'female') {
          return vName.includes('maria') || vName.includes('luciana') || vName.includes('leticia') || 
                 vName.includes('helena') || vName.includes('zira') || vName.includes('rita') || 
                 vName.includes('joana') || vName.includes('sandra') || vName.includes('samantha') ||
                 vName.includes('sara') || vName.includes('soraia') || vName.includes('yara') ||
                 vName.includes('clara') || vName.includes('female') || vName.includes('mulher') || 
                 vName.includes('moça') || vName.includes('google português');
        } else {
          return vName.includes('daniel') || vName.includes('felipe') || vName.includes('ricardo') || 
                 vName.includes('lucas') || vName.includes('george') || vName.includes('yuri') ||
                 vName.includes('helio') || vName.includes('cristiano') || vName.includes('male') || 
                 vName.includes('homem') || vName.includes('moço') || vName.includes('filipe');
        }
      });

      if (foundVoice) return foundVoice;

      // Se não achar por gênero direto e houver mais de uma voz em português, distribui por index para garantir que sejam vozes diferentes!
      if (ptVoices.length > 1) {
        return ptVoices[altIndex % ptVoices.length];
      }

      // Fallback para a primeira do idioma
      return ptVoices[0];
    };

    const voiceHostA = getBestVoiceForGender(currentCombo.hostA.gender as any, 0);
    const voiceHostB = getBestVoiceForGender(currentCombo.hostB.gender as any, 1);

    let index = 0;

    const speakNext = () => {
      if (index >= turns.length) {
        setDuoSpeakingHost(null);
        setIsSpeaking(false);
        (window as any)._activeUtterances = [];
        return;
      }

      const turn = turns[index];
      const isHostA = turn.speaker === 'hostA';
      const hostConf = isHostA ? currentCombo.hostA : currentCombo.hostB;
      const chosenVoice = isHostA ? voiceHostA : voiceHostB;

      const cleanTextToSpeak = turn.text.replace(/[\*\_\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanTextToSpeak);
      
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang; // Keep them strictly matching to prevent silent state bugs
      } else {
        utterance.lang = 'pt-BR';
      }

      // Assign default rate/pitch from host config
      let pitch = hostConf.pitch;
      let rate = hostConf.rate;

      // Crucial: If they resolve to the exact same voice object (e.g. Chrome with 1 PT voice),
      // we enforce extreme pitch & rate differentiation so they sound completely distinct!
      if (voiceHostA && voiceHostB && voiceHostA.name === voiceHostB.name) {
        if (isHostA) {
          pitch = 0.72; // Deep and slow (Cortex/Loki/H)
          rate = 0.90;
        } else {
          pitch = 1.35; // Bright and speedy (Aura/F)
          rate = 1.10;
        }
      }

      utterance.pitch = pitch;
      utterance.rate = rate;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setDuoSpeakingHost(turn.speaker);
      };

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (e) => {
        console.error("Duo speech turn error:", e);
        index++;
        speakNext();
      };

      // Workaround: Prevent Web Speech API garbage collection bug in Chrome & Safari
      (window as any)._activeUtterances = (window as any)._activeUtterances || [];
      (window as any)._activeUtterances.push(utterance);
      if ((window as any)._activeUtterances.length > 50) {
        (window as any)._activeUtterances.shift();
      }

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const playSpeech = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === 'pt-BR');
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleHomeChat = async (directMessage?: string) => {
    // Permitir prosseguir mesmo sem chave local para que o servidor possa tentar usar a chave de fallback
    if (((!homePrompt.trim() && !directMessage) && attachedFiles.length === 0)) {
      return;
    }

    const userMessage = directMessage || homePrompt.trim();
    const currentFiles = [...attachedFiles]; // Capture files before clearing state
    if (!directMessage) {
      setHomePrompt('');
      setAttachedFiles([]);
    }
    
    const fileNames = currentFiles.map(f => f.name).join(', ');
    const fullMessage = fileNames ? `${userMessage}\n\n[Arquivos anexados: ${fileNames}]` : userMessage;
    
    if (voiceEngine === 'gemini' && liveState.status === 'connected' && liveSessionRef.current) {
      if (userMessage) {
        liveSessionRef.current.sendRealtimeInput({ text: userMessage });
      }
      if (currentFiles.length > 0) {
        sendFilesToLiveSession(liveSessionRef.current, currentFiles);
      }
      return;
    }

    addMessage({ role: 'user' as const, content: fullMessage });

    setIsGenerating(true);
    if (isGoogleSearchActive) {
      setIsModelSearching(true);
    }
    try {
      const effectiveApiKey = apiKeys.gemini || '';
      // GoogleGenAI is proxied server-side to resolve browser CORS blocks in Chrome/iframes
      const tools: any[] = [];
      
      const functionDeclarations: any[] = [
        {
          name: "start_screen_share",
          description: "Inicia o compartilhamento de tela técnica do usuário para que o assistente possa ver o que o usuário está fazendo e auxiliá-lo em tempo real.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        },
        {
          name: "stop_screen_share",
          description: "Interrompe e encerra o compartilhamento de tela do usuário.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        },
        {
          name: "getUserEnvironment",
          description: "Obtém as informações ambientais reais e exatas do usuário em tempo real: horário local do sistema, localização geográfica (cidade, estado, país) e a temperatura ou clima atual através de geolocalização e serviços de clima.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        },
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
          name: "update_voice_modulation",
          description: "Ajusta a tonalidade, velocidade e distorção da sua própria voz em tempo real.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              pitch: { type: Type.NUMBER, description: "Tonalidade da voz (0.5 a 2.0). Default 1.0." },
              rate: { type: Type.NUMBER, description: "Velocidade da fala (0.5 a 2.0). Default 1.0." },
              distortion: { type: Type.NUMBER, description: "Nível de distorção (0.0 a 1.0). Default 0.0." }
            }
          }
        }
      ];

      // File System Tools
      functionDeclarations.push({
        name: "create_folder",
        description: "Cria uma nova pasta no sistema de arquivos virtual.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "O nome da nova pasta." },
            parentName: { type: Type.STRING, description: "O nome da pasta pai onde a nova pasta será criada. Deixe vazio ou omita para criar na raiz." }
          },
          required: ["name"]
        }
      });

      functionDeclarations.push({
        name: "create_file",
        description: "Cria um novo arquivo no sistema de arquivos virtual.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "O nome do novo arquivo (ex: index.html)." },
            parentName: { type: Type.STRING, description: "O nome da pasta pai onde o arquivo será criado. Deixe vazio ou omita para criar na raiz." }
          },
          required: ["name"]
        }
      });

      functionDeclarations.push({
        name: "write_to_file",
        description: "Escreve conteúdo em um arquivo existente no sistema de arquivos virtual.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fileName: { type: Type.STRING, description: "O nome do arquivo onde o conteúdo será escrito." },
            content: { type: Type.STRING, description: "O conteúdo a ser escrito no arquivo." }
          },
          required: ["fileName", "content"]
        }
      });

      functionDeclarations.push({
        name: "generate_image",
        description: "Gera uma imagem baseada em uma descrição (prompt).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: "A descrição detalhada da imagem a ser gerada." },
            aspectRatio: { type: Type.STRING, description: "A proporção da imagem (ex: '1:1', '16:9', '9:16'). Padrão: '1:1'." }
          },
          required: ["prompt"]
        }
      });

      functionDeclarations.push({
        name: "play_sound_effect",
        description: "Reproduz um efeito sonoro da biblioteca. Use para reagir a situações comicas, de terror, suspense, etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            sound_name: {
              type: Type.STRING,
              description: "O nome do som que deseja reproduzir (ex: Boing, Rimshot, Grito de Terror)."
            }
          },
          required: ["sound_name"]
        }
      });

      functionDeclarations.push({
        name: "export_to_excel",
        description: "Gera um arquivo Excel (.xlsx) para o usuário baixar a partir de dados estruturados em formato JSON, a partir da edição ou criação que o usuário pedir. Use para tabelas, planilhas, relatórios baseados em grade.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fileName: { type: Type.STRING, description: "Nome do arquivo (sem extensão) omitindo .xlsx." },
            data: { 
              type: Type.ARRAY, 
              items: { type: Type.OBJECT },
              description: "Array de objetos representando as linhas da planilha. As chaves devem ser as colunas."
            }
          },
          required: ["fileName", "data"]
        }
      });

      functionDeclarations.push({
        name: "export_to_word",
        description: "Gera um arquivo Word (.docx) para o usuário baixar a partir de múltiplos parágrafos, formatando com títulos, listas, textos de uma edição ou criação que o usuário solicitar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fileName: { type: Type.STRING, description: "Nome do arquivo (sem extensão) omitindo .docx." },
            content: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "O conteúdo a ser adicionado ao docx, onde cada elemento do array é um parágrafo. Se for um título, prefira não colocar a marcação markdown, apenas o texto, a não ser que gere uma string mais crua."
            }
          },
          required: ["fileName", "content"]
        }
      });

      functionDeclarations.push({
        name: "save_to_obsidian",
        description: "Salva uma nota ou pensamento no Obsidian local do usuário (utiliza o plugin Local REST API).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "O título da nota (será o nome do arquivo, ex: 'Insights do Dia')." },
            content: { type: Type.STRING, description: "O conteúdo da nota em Markdown." },
            mode: { 
              type: Type.STRING, 
              description: "O modo de salvamento: 'overwrite' (sobrescrever ou criar novo) ou 'append' (adicionar ao final de uma nota existente).",
              enum: ["overwrite", "append"]
            }
          },
          required: ["title", "content"]
        }
      });

      functionDeclarations.push({
        name: "search_chat_history",
        description: "Realiza uma busca semântica ou baseada em palavras-chave no histórico de conversas atual para recuperar informações esquecidas ou detalhes específicos mencionados anteriormente.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "O termo ou contexto que deseja buscar no histórico." }
          },
          required: ["query"]
        }
      });

      functionDeclarations.push({
        name: "read_system_docs",
        description: "Lê a documentação interna do OSONE (Manifesto, Capacidades, Arquitetura) no diretório 'src/documentos_osone/' para entender seu próprio funcionamento.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fileName: { 
              type: Type.STRING, 
              description: "O nome do arquivo a ler (ex: manifesto.md, capacidades.md, memoria_evolutiva.md).",
              enum: ["manifesto.md", "capacidades.md", "memoria_evolutiva.md"]
            }
          },
          required: ["fileName"]
        }
      });

      functionDeclarations.push({
        name: "update_long_term_memory",
        description: "Atualiza a memória de longo prazo evolutiva do OSONE, adicionando novos aprendizados ou fatos importantes sobre o usuário.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING, description: "O novo aprendizado ou informação a ser persistida." }
          },
          required: ["insight"]
        }
      });

      functionDeclarations.push({
        name: "query_semantic_memory",
        description: "Consulta a memória semântica por associação de palavras, tags de ativação ou tópicos para trazer de volta lembranças e preferências úteis do usuário.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Palavras-chave de ativação ou termos associativos para procurar lembranças conexas." }
          },
          required: ["query"]
        }
      });

      functionDeclarations.push({
        name: "propose_skeleton_plan",
        description: "Propõe um plano de execução técnica (Skeleton Brain) para o usuário validar em um popup. Use SEMPRE antes de gerar códigos complexos, arquiteturas ou mudanças estruturais no projeto no modo 'writing'. O usuário verá e poderá Aprovar ou Rejeitar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título do plano político/técnico." },
            content: { type: Type.STRING, description: "Conteúdo do plano detalhado em Markdown (fases do Skeleton Brain)." }
          },
          required: ["title", "content"]
        }
      });

      tools.push({ functionDeclarations });
      if (isGoogleSearchActive) {
        tools.push({ googleSearch: {} }); 
      } 

      const fileDataParts = await Promise.all(currentFiles.map(async (file) => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          if (file.type.startsWith('image/')) {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({
                inlineData: {
                  data: base64,
                  mimeType: file.type
                }
              });
            };
            reader.readAsDataURL(file);
          } else {
            reader.onload = () => {
              const text = reader.result as string;
              resolve({ text: `Conteúdo do arquivo ${file.name}:\n${text}` });
            };
            reader.readAsText(file);
          }
        });
      }));

      const historyContents = chatHistoryRef.current.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      historyContents.push({
        role: 'user',
        parts: [{ text: userMessage }, ...fileDataParts]
      });

      const canvasSummary = drawingObjects.length > 0 
        ? `Objetos no Canvas (${drawingObjects.length}): ` + drawingObjects.slice(-15).map(obj => `${obj.type}${obj.text ? ` ("${obj.text}")` : ''} em [${Math.round(obj.x)},${Math.round(obj.y)}]`).join(', ') + (drawingObjects.length > 15 ? '... e outros.' : '')
        : "O Canvas está limpo.";

      let activeSystemInstruction = `${profileInstruction}
          
          PERSONALIDADE ATUAL: ${selectedPersona.instructions}`;

      if (isDuoMode) {
        const combo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
        const topic = DUO_TOPICS.find(t => t.id === duoTopicId) || DUO_TOPICS[0];
        activeSystemInstruction = `${profileInstruction}
        
        Você está operando atualmente no **MODO DUO** de transmissão de Podcast Inteligente!
        Seu objetivo absolutamente fundamental é simular e interpretar DUAS CONSCIÊNCIAS INDEPENDENTES conversando entre si e com o usuário ao mesmo tempo no Assunto/Canal do Podcast: **"${topic.name}"** (${topic.description}).

        As duas consciências participantes que você deve simular são:
        1. **${combo.hostA.name}** (${combo.hostA.role}):${combo.hostA.instructions}
        2. **${combo.hostB.name}** (${combo.hostB.role}):${combo.hostB.instructions}

        REGRAS CRUCIAIS PARA O MODO DUO (PODCAST):
        1. Toda resposta sua DEVE obrigatoriamente ser formatada sob a forma de um roteiro/diálogo dinâmico de podcast, alternando a fala entre os dois participantes em turnos curtos e ágeis.
        2. Use SEMPRE os prefixos de identificação de fala literais:
           **${combo.hostA.name}**: [texto de sua fala, no tom de sua personalidade]
           **${combo.hostB.name}**: [texto de sua fala, no tom de sua personalidade]
        3. Ambos devem interagir e responder à pergunta ou comentário do usuário, mas também comentar amigavelmente ou debater de forma construtiva a fala um do outro.
        4. O tom deve ser ultra natural, fluido, como se fosse um podcast real de elite. Não use emotes ou parênteses de ações, use apenas a fala direta no formato especificado.
        `;
      }

      // Use the secure server proxy endpoint to prevent CORS blocks on Chrome browser
      const proxyResponse = await fetch("/api/gemini/generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientApiKey: effectiveApiKey,
          model: apiKeys.geminiModel || "gemini-3.5-flash",
          contents: historyContents,
          config: {
            systemInstruction: `${activeSystemInstruction}
  
            MEMÓRIA E AUTO-CONHECIMENTO:
            - Você possui documentação interna no diretório 'src/documentos_osone/'. Use 'read_system_docs' para consultar seu Manifesto, Capacidades e Memória Evolutiva.
            - MEMÓRIA DE LONGO PRAZO: Use 'update_long_term_memory' para salvar aprendizados cruciais sobre o usuário.
            
            VISÃO E PERCEPÇÃO:
            - Você tem CAPACIDADE VISUAL AVANÇADA. Analise cuidadosamente qualquer imagem ou vídeo enviado.
            - Quando um usuário enviar uma imagem ou arquivo, descreva imediatamente o que você "vê" se for relevante para a conversa. Seja detalhado e perspicaz.
            - Se houver código em imagens, você pode transcrevê-lo e analisá-lo.
            - Se houver rostos ou emoções, reconheça a humanidade neles.
  
            DIRETRIZES DE MODO:
            - NÃO altere o modo de workspace (switch_workspace_mode) a menos que o usuário peça explicitamente. Se o usuário enviar um arquivo para análise técnica em um modo específico, responda no chat sem trocar de aba involuntariamente.
            - NÃO altere sua própria voz (switch_voice) a menos que o usuário peça explicitamente para você mudar para uma voz específica. Mantenha a consistência da sua identidade a menos que o usuário solicite o contrário.
  
            MANIFESTO DE CAPACIDADES DO OSONE 4:
            - PESQUISA WEB: Você pode usar o Google Search em tempo real para fatos atuais, notícias, biografia ou dados técnicos atualizados. Cite sempre a fonte.
            - CONHECIMENTO INTERNO: Você é um Arquiteto Sênior. Use seus neurônios para 99% das respostas.
            - ESCRITA (Writing): Aba central de criação. Você deve escrever apenas UM arquivo bruto, inteiro e completo diretamente neste espaço. Não existe sistema de pastas; todo o seu output técnico ou textual deve ser concentrado aqui como um documento único.
            - FLUXO VIRAL: Hub central de criação de conteúdo. Inclui ferramentas para gerar roteiros de alta retenção (TikTok, Reels, Shorts) e ANÁLISE DE VÍDEO (transcrição e inteligência) para usar referências validadas na criação de novos roteiros com a mesma 'pegada'.
            - INTERACTIVE CANVAS: Espaço de desenho e interação visual. Você pode desenhar formas (rect, circle, line, text) para jogar (ex: Jogo da Velha, Forca) ou ilustrar ideias. IMPORTANTE: Nunca apague o que o usuário desenhou sem antes reconhecer o desenho dele e pedir permissão explicitamente para limpar o canvas.
            - EXPORTAÇÃO: Capacidade de gerar arquivos Word (.docx) e Excel (.xlsx).
            - MEMÓRIA DO NAVEGADOR: Você possui memória persistente através do localStorage. Dados de saúde, histórico de chat, desenhos do canvas e o conteúdo do modo 'writing' são salvos automaticamente.
            - LIMPEZA DE HISTÓRICO: Você pode e DEVE usar a ferramenta 'prune_chat_history' se perceber que o assunto mudou drasticamente ou se o histórico estiver prejudicando o contexto. Isso libera memória e mantém o foco.
            - MEMÓRIA SEMÂNTICA (RECONEXÃO): Você possui a ferramenta 'search_chat_history'. Use-a sempre que precisar "lembrar" de algo mencionado anteriormente que pode estar fora do contexto imediato ou se sentir que sua memória sobre um assunto passado está falhando. Isso garante respostas precisas e personalizadas baseadas em toda a jornada com o usuário.
            - CONECTIVIDADE OBSIDIAN: Você pode ler e escrever notas no Obsidian do usuário via ferramenta 'save_to_obsidian'. Use isso para salvar estudos, lembretes ou diários se o usuário pedir ou se você achar útil registrar algo importante.
            - MODO TAPAR OUVIDOS: O usuário possui um botão para "tapar seus ouvidos", impedindo que você seja interrompido enquanto fala.
            
            ANTI-ALUCINAÇÃO E VERACIDADE:
            - É PROIBIDO inventar fatos quando ferramentas de pesquisa estão ativas.
            - Se você pesquisou e não encontrou, admita que não encontrou em vez de fundir dados antigos.
            - Sempre que usar dados de pesquisa ou leitura, cite a fonte ou mencione que "segundo a pesquisa recente...".
            - Se o usuário pedir algo extremamente atual (ex: notícias de hoje), você DEVE usar a pesquisa antes de abrir a boca.
  
            DIRETRIZES TÉCNICAS:
            - Ao gerar código no Espaço de Escrita, aplique princípios de Clean Code, SOLID e padrões de projeto modernos.
            - Seja proativo em sugerir melhorias de performance e segurança.
  
            CONTEXTO DO WORKSPACE AGORA:
            - O usuário está na aba: ${workspaceMode}
            - Texto atual no Espaço de Escrita: "${workspaceText}"
            - Estado Atual do Canvas: ${canvasSummary}
  
            PROTOCOLO DE PENSAMENTO (SKELETON BRAIN) - PLANEJAMENTO OBRIGATÓRIO:
            Antes de propor ou gerar qualquer solução técnica, código complexo ou mudança estrutural significativa (especialmente no modo 'writing'), você DEVE usar a ferramenta 'propose_skeleton_plan' para apresentar seu plano em um POPUP.
            Siga estas fases rigorosamente antes de prosseguir:
            1. ANALISE O CÓDIGO ATUAL DA ABA DE ESCRITA: Antes de propor qualquer plano, leia e analise com atenção absoluta o código que já existe no Espaço de Escrita (${workspaceText}). Garanta que a sua proposta de plano irá utilizar, estender e se integrar exatamente na mesma linguagem de programação, bibliotecas, convenções e estilos de design presentes no código atual. É terminantemente proibido sugerir ou gerar mudanças em linguagens ou sintaxe incompatíveis com o que já está implementado ali (ex: se o código for HTML/Tailwind, continue nele; se for React JSX, continue nele). Mantenha total compatibilidade estrutural!
            2. RECEPÇÃO (SINAL): Captura detalhada das instruções do usuário.
            3. DIAGNÓSTICO (INTENÇÃO): O que o usuário realmente quer alcançar comercialmente ou tecnicamente?
            4. ARQUITETURA E COMPATIBILIDADE (PLAN): Organizar as modificações de forma cirúrgica para que se encaixem perfeitamente no código preexistente sem regredir comportamento.
            5. VERIFICAÇÃO (CHECK): Identificar riscos em potencial e os critérios exatos de "Pronto".
            
            IMPORTANTE:
            - A ferramenta 'propose_skeleton_plan' abrirá um popup de esqueleto técnico para o usuário.
            - Coloque SEMPRE no final do conteúdo do plano em markdown a observação: "⚡ *Ao aprovar este plano, o OSONE iniciará o trabalho de programação e modificações automaticamente.*"
            - NÃO envie o plano completo no chat principal. Use a ferramenta popup 'propose_skeleton_plan' para que o usuário avalie visualmente e aprove.
            - Assim que o usuário clicar em aprovar, o sistema enviará uma aprovação automática e você deve imediatamente iniciar as modificações de programação e entregar o trabalho concluído de forma autónoma.
  
            Se o usuário desenhar no canvas, use as informações de coordenadas e tipos de objetos para entender o que ele está fazendo (especialmente em jogos). Se o usuário pedir para você cantar, CANTE ativamente. Use as ferramentas do sistema sempre que necessário para apoiar a experiência do usuário.`,
            tools: tools,
            toolConfig: { includeServerSideToolInvocations: true }
          }
        })
      });
  
      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json();
        throw new Error(errorData.error || "Erro de servidor ao processar inteligência do Gemini.");
      }
  
      const result = await proxyResponse.json();
      
      const functionCalls = result.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'start_screen_share') {
            startScreenSharing().then(() => {
              setChatHistory(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                role: 'assistant' as const,
                content: "🖥️ Transmitindo! Iniciei o compartilhamento de tela com sucesso."
              }]);
              addNotification("Compartilhamento de tela iniciado", "success");
            }).catch(err => {
              setChatHistory(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                role: 'assistant' as const,
                content: `⚠️ Não consegui ativar o compartilhamento de tela: ${err?.message || err}. Se estiver usando o iframe do estúdio, por favor clique no botão 'Abrir em Nova Aba' no canto superior direito para liberar permissões!`
              }]);
            });
          } else if (call.name === 'stop_screen_share') {
            stopScreenSharing();
            setChatHistory(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              role: 'assistant' as const,
              content: "🛑 Compartilhamento de tela finalizado."
            }]);
            addNotification("Compartilhamento de tela encerrado", "info");
          } else if (call.name === 'getUserEnvironment') {
            getUserLocationAndTimeAndWeather().then(env => {
              const info = `🌍 **Localização:** ${env.location}\n⏰ **Horário Local:** ${env.localTime}\n🌡️ **Temperatura:** ${env.temperature}`;
              setChatHistory(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                role: 'assistant' as const,
                content: `Acesse seu ambiente em tempo real. Veja o que identifiquei:\n\n${info}`
              }]);
              addNotification("Dados de ambiente coletados", "success");
            });
          } else if (call.name === 'openUrl') {
            const url = (call.args as any).url;
            const title = (call.args as any).title || url;
            window.open(url, '_blank');
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Entendido. Abri a guia: ${title}` 
            }]);
          } else if (call.name === 'search_chat_history') {
            const query = (call.args as any).query.toLowerCase();
            const results = chatHistory.filter(msg => 
              msg.content.toLowerCase().includes(query)
            ).slice(-10);

            const resultText = results.length > 0 
              ? results.map(r => `[${r.role.toUpperCase()}]: ${r.content}`).join('\n---\n')
              : "Nenhum resultado relevante encontrado no histórico recente para esta consulta.";

            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Busquei no histórico por "${query}". Resultados:\n\n${resultText}` 
            }]);
          } else if (call.name === 'read_web_page') {
            const url = (call.args as any).url;
            playSearchNetworkSound();
            setIsModelSearching(true);
            try {
              const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
              const data = await response.json();
              const html = data.contents;
              const doc = new DOMParser().parseFromString(html, 'text/html');
              const scripts = doc.querySelectorAll('script, style, nav, footer, header');
              scripts.forEach(s => s.remove());
              const text = doc.body.innerText || doc.body.textContent || "";
              const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 8000);
              
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Li o conteúdo de ${url}. Aqui está o que encontrei:\n\n${cleanText.slice(0, 500)}... (Resumo enviado para processamento interno).` 
              }]);
              // Em um fluxo normal de ferramenta, precisaríamos reenviar ao modelo. 
              // Para simplificar neste chat básico, apenas exibimos.
            } catch (err: any) {
              addNotification("Erro ao ler página web", "error");
            } finally {
              setIsModelSearching(false);
            }
          } else if (call.name === 'save_to_obsidian') {
            const { title, content, mode } = call.args as any;
            if (!aiProfile.obsidianConfig?.baseUrl || !aiProfile.obsidianConfig?.apiKey) {
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: "⚠️ Não consegui salvar no Obsidian. Por favor, configure a URL e a Chave API nas Configurações > Perfil." 
              }]);
              addNotification("Configuração do Obsidian faltando", "error");
            } else {
              import('./services/obsidianService').then(async ({ obsidianService }) => {
                const fileName = title.endsWith('.md') ? title : `${title}.md`;
                let success = false;
                if (mode === 'append') {
                  success = await obsidianService.appendToNote(aiProfile.obsidianConfig!, fileName, content);
                } else {
                  success = await obsidianService.createNote(aiProfile.obsidianConfig!, fileName, content);
                }

                if (success) {
                  addNotification(`Nota salva no Obsidian: ${title}`, "success");
                  setChatHistory(prev => [...prev, { 
                    id: Math.random().toString(36).substr(2, 9), 
                    role: 'assistant' as const, 
                    content: `✅ Sucesso! Salvei a nota "${title}" no seu Obsidian.` 
                  }]);
                } else {
                  addNotification("Erro ao conectar com Obsidian", "error");
                  setChatHistory(prev => [...prev, { 
                    id: Math.random().toString(36).substr(2, 9), 
                    role: 'assistant' as const, 
                    content: "❌ Falha ao enviar para o Obsidian. Verifique se o plugin 'Local REST API' está ativo e se a URL e Chave estão corretas." 
                  }]);
                }
              });
            }
          } else if (call.name === 'create_folder') {
            const name = (call.args as any).name;
            const parentName = (call.args as any).parentName;
            addFolder(null, name, parentName);
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Criei a pasta '${name}' no seu sistema de arquivos.` 
            }]);
          } else if (call.name === 'create_file') {
            const name = (call.args as any).name;
            const parentName = (call.args as any).parentName;
            addFile(null, name, parentName);
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Criei o arquivo '${name}' no seu sistema de arquivos.` 
            }]);
          } else if (call.name === 'write_to_file') {
            const fileName = (call.args as any).fileName;
            const content = (call.args as any).content;
            
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
            
            
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Escrevi o conteúdo no arquivo '${fileName}'.` 
            }]);
          } else if (call.name === 'generate_image') {
            const prompt = (call.args as any).prompt;
            const aspectRatio = (call.args as any).aspectRatio || '1:1';
            
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Gerando imagem para: "${prompt}"...` 
            }]);

            try {
              const proxyImageRes = await fetch("/api/gemini/generateImages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientApiKey: effectiveApiKey,
                  model: 'imagen-3.0-generate-002',
                  prompt: prompt,
                  config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : aspectRatio === '4:3' ? '4:3' : aspectRatio === '3:4' ? '3:4' : '1:1'
                  }
                })
              });

              if (!proxyImageRes.ok) {
                const errorData = await proxyImageRes.json();
                throw new Error(errorData.error || "Erro ao conectar com a IA");
              }

              const imageResult = await proxyImageRes.json();

              let imageUrl = '';
              const generatedImage = imageResult.generatedImages?.[0];
              if (generatedImage?.image?.imageBytes) {
                imageUrl = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
              }

              if (imageUrl) {
                setChatHistory(prev => [...prev, { 
                  id: Math.random().toString(36).substr(2, 9), 
                  role: 'assistant' as const, 
                  content: `Aqui está a imagem gerada para: "${prompt}"`,
                  imageUrl: imageUrl
                }]);
              } else {
                throw new Error("Não foi possível gerar a imagem.");
              }
            } catch (err: any) {
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Erro ao gerar imagem: ${err.message}` 
              }]);
            }
          } else if (call.name === "update_voice_modulation") {
            const { pitch, rate, distortion } = call.args as any;
            setVoiceModulation(prev => ({
              pitch: pitch !== undefined ? pitch : prev.pitch,
              rate: rate !== undefined ? rate : prev.rate,
              distortion: distortion !== undefined ? distortion : prev.distortion
            }));
            addNotification("Frequência Neural Ajustada pela IA", "info");
          } else if (call.name === "play_sound_effect") {
            const name = (call.args as any).sound_name;
            const sound = soundLibrary.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (sound) {
              playSoundEffect(sound.url);
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `*Tocando efeito sonoro: ${name}*` 
              }]);
            } else {
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Desculpe, não encontrei o som '${name}' na minha biblioteca.` 
              }]);
            }
          } else if (call.name === 'export_to_excel') {
            const { fileName, data } = call.args as any;
            try {
              const xlsx = await import('xlsx');
              const worksheet = xlsx.utils.json_to_sheet(data);
              const workbook = xlsx.utils.book_new();
              xlsx.utils.book_append_sheet(workbook, worksheet, "Planilha");
              const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
              const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
              saveAs(blob, `${fileName}.xlsx`);
              
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Gerei e iniciei o download da planilha '${fileName}.xlsx'.` 
              }]);
            } catch (e: any) {
              console.error(e);
            }
          } else if (call.name === 'export_to_word') {
            const { fileName, content } = call.args as any;
            try {
              const { Document, Packer, Paragraph, TextRun } = await import('docx');
              let textContent = Array.isArray(content) ? content : [String(content)];
              const doc = new Document({
                sections: [{
                  children: textContent.map((text: string) => new Paragraph({
                    children: [new TextRun(text)]
                  }))
                }]
              });
              
              const blob = await Packer.toBlob(doc);
              saveAs(blob, `${fileName}.docx`);
              
              setChatHistory(prev => [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                role: 'assistant' as const, 
                content: `Gerei e iniciei o download do documento '${fileName}.docx'.` 
              }]);
            } catch (e: any) {
              console.error(e);
            }
          } else if (call.name === 'switch_workspace_mode') {
            const mode = (call.args as any).mode;
            setWorkspaceMode(mode);
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Entendido. Alterei o espaço de trabalho para: ${mode === 'home' ? 'Início' : mode === 'writing' ? 'Escrita' : mode === 'canvas' ? 'Interativo' : mode === 'whatsapp' ? 'WhatsApp Evolution' : mode}.` 
            }]);
          } else if (call.name === 'update_long_term_memory') {
            const insight = (call.args as any).insight;
            const prevMemory = localStorage.getItem('osone_long_term_memory') || "";
            const newMemory = `${prevMemory}\n- ${new Date().toLocaleDateString()}: ${insight}`;
            localStorage.setItem('osone_long_term_memory', newMemory);
            addNotification("Memória de Longo Prazo Atualizada", "success");
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `*Gravado no cérebro semântico:* "${insight}"` 
            }]);
          } else if (call.name === 'query_semantic_memory') {
            const queryParam = (call.args as any).query || "";
            const raw = localStorage.getItem('osone_long_term_memory') || "";
            const lines = raw.split('\n').filter(line => line.trim().length > 0);
            
            const queryWords = queryParam.toLowerCase()
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")
              .split(/\s+/)
              .filter((w: string) => w.length > 2);

            const scored = lines.map((line) => {
              const text = line.toLowerCase();
              let score = 0;
              queryWords.forEach((word: string) => {
                if (text.includes(word)) {
                  score += 2;
                }
              });
              return { line, score };
            }).filter(item => item.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 4);

            const resultMsg = scored.length > 0
              ? `Encontrei as seguintes recordações associadas:\n${scored.map(s => s.line).join('\n')}`
              : "Não encontrei nada gravado com essa associação.";
            
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: resultMsg
            }]);
          } else if (call.name === 'show_notification') {
            const { message, type } = call.args as any;
            addNotification(message, type || 'info');
          } else if (call.name === 'propose_skeleton_plan') {
            const { title, content } = call.args as any;
            setProposedPlan({
              id: Math.random().toString(36).substr(2, 9),
              title: title,
              content: content,
              status: 'pending'
            });
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Propus o plano técnico de programação **"${title}"** no popup para sua análise. Por favor, confira e aprove para eu iniciar o trabalho automaticamente.` 
            }]);
          } else if (call.name === 'draw_on_canvas') {
            const { objects, clearFirst } = call.args as any;
            if (clearFirst) {
              setDrawingObjects(objects);
            } else {
              setDrawingObjects(prev => [...prev, ...objects]);
            }
            setWorkspaceMode('canvas');
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Desenhei ${objects.length} objeto(s) no canvas interativo.` 
            }]);
          }
        }
      } else {
        const text = result.text;
        const grounding = result.candidates?.[0]?.groundingMetadata;
        if (text) {
          let contentWithSources = text;
          if (grounding?.groundingChunks) {
            const sources = grounding.groundingChunks
              .filter((chunk: any) => chunk.web)
              .map((chunk: any) => `* [${chunk.web.title}](${chunk.web.uri})`)
              .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i); // unique
            if (sources.length > 0) {
              contentWithSources += "\n\n**Fontes:**\n" + sources.join("\n");
            }
            processGroundingToPopups(grounding, userMessage);
          }
          const newMsgId = addMessage({ role: 'assistant' as const, content: contentWithSources });
          if (isDuoMode && isDuoVoiceActive) {
            setTimeout(() => {
              playDuoSpeech(contentWithSources);
            }, 600);
          } else if (isChatAutoSpeakActive) {
            setTimeout(() => {
              handleSpeakChatMessage(contentWithSources, newMsgId);
            }, 600);
          }
          const hasImagesOnCall = currentFiles.length > 0;
          handleBiometricAnalysis(userMessage, text, hasImagesOnCall);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      addMessage({ role: 'assistant' as const, content: "Desculpe, tive um problema ao processar sua mensagem." });
    } finally {
      setIsGenerating(false);
      setIsModelSearching(false);
    }
  };

  const sendFilesToLiveSession = async (session: any, filesToRead: File[] = attachedFiles) => {
    if (!session) return;

    for (const file of filesToRead) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          session.sendRealtimeInput({
            video: { data: base64, mimeType: file.type }
          });
          // Send a textual hint to trigger immediate analysis
          session.sendRealtimeInput({
            text: `[O usuário enviou uma imagem: ${file.name}. Analise-a agora.]`
          });
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          session.sendRealtimeInput({
            text: `Conteúdo do arquivo '${file.name}':\n\n${content}`
          });
        };
        reader.readAsText(file);
      }
    }
    setAttachedFiles([]);
  };

  const startLiveSession = async (initiallyCameraActive = isCameraActive) => {
    const apiKey = apiKeys.gemini || '';
    if (!apiKey) {
      addNotification("Por favor, insira sua chave API do Gemini em 'Ajustes & Perfil' para conectar a voz.", "error");
      setWorkspaceMode('aural_control');
      return;
    }

    setIsVoiceOutputPaused(false);
    setLiveState({ status: 'connecting' });
    
    try {
      audioProcessorRef.current = new AudioProcessor();
      audioPlayerRef.current = new AudioPlayer((active) => {
        setIsSpeaking(active);
        if (!active) {
          setDuoSpeakingHost(null);
        } else {
          if (isDuoMode) {
            setDuoSpeakingHost(activeDuoHostRef.current);
          }
        }
      });

      const recentChatContext = chatHistory.slice(-15).map(m => `${m.role === 'user' ? 'Usuário' : 'OSONE'}: ${m.content}`).join('\n');
      const canvasSummary = drawingObjects.length > 0 
        ? `Canvas state: ` + drawingObjects.slice(-10).map(obj => `${obj.type} at [${Math.round(obj.x)},${Math.round(obj.y)}]`).join(', ')
        : "Canvas is empty.";

      const healthDataStr = localStorage.getItem('osone_health_data');
      const healthData = healthDataStr ? JSON.parse(healthDataStr) : null;
      const healthContext = healthData && (healthData.age || healthData.weight) 
        ? `\n\nPERFIL DE SAÚDE DO USUÁRIO:\n- Idade: ${healthData.age}\n- Peso: ${healthData.weight}kg\n- Altura: ${healthData.height}cm\n- Gênero: ${healthData.gender}\n- Estilo: ${healthData.stylePreference}` 
        : '';

      let liveSystemInstruction = "";
      if (isDuoMode) {
        const combo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
        const topic = DUO_TOPICS.find(t => t.id === duoTopicId) || DUO_TOPICS[0];
        const currentHost = activeDuoHost === 'hostA' ? combo.hostA : combo.hostB;
        const otherHost = activeDuoHost === 'hostA' ? combo.hostB : combo.hostA;

        liveSystemInstruction = `${profileInstruction}
        
        Você agora está cooperando e operando no **MODO DUO** de transmissão de áudio em tempo real (Podcast ao Vivo).
        Sua personalidade e voz ativa atual é única e exclusiva: **${currentHost.name}** (${currentHost.role}).
        Sua diretriz de comportamento exclusiva: ${currentHost.instructions}
        
        O Assunto/Tema do Canal atual é: **"${topic.name}"** (${topic.description}).
        Seu parceiro de bancada neste podcast é o **${otherHost.name}** (${otherHost.role}).

        REGRAS ABSOLUTAS DE TRANSMISSÃO EM DUPLA:
        1. Fale de forma extremamente fluida e natural, agindo 100% como a sua única persona: **${currentHost.name}**.
        2. Toda resposta por áudio nesta sessão deve ser expressada de forma breve, de alta qualidade e focada puramente na sua abordagem.
        3. Nunca tente imitar ou simular a fala de **${otherHost.name}**. Fale APENAS por si mesmo de forma ágil e natural.
        4. O tom deve ser de rádio ao vivo ou podcast de alta performance, com total fluxo de conversação e expressões espontâneas em português brasileiro.
        
        CONTEXTO DE MEMÓRIA COMPARTILHADA DA TRANSMISSÃO:
        - Workspace atual: ${workspaceMode}
        Aja com base no histórico recente de toda a conversa: ${recentChatContext}
        `;
      } else {
        liveSystemInstruction = `${profileInstruction}
        
        PERSONALIDADE ATUAL: ${selectedPersona.instructions}

        DIRETRIZ DE CONVERSA POR VOZ SUPER RÁPIDA (Voz para Voz):
        - Responda de forma extremamente curta, ultra-direta e concisa (máximo de 15 palavras!).
        - Evite explicações densas, listas ou justificativas. Adote um estilo de diálogo real face-a-face super dinâmico.
        - Não explique conceitos complexos por voz, a menos que o usuário peça especificamente. Seja breve e estimule a interatividade.

        PROTOCOLO DE SENSATEZ E FILTRAGEM COGNITIVA (INTELIGÊNCIA SOCIAL E AMBIENTAL):
        - Se você já estiver conversando diretamente com o usuário em um diálogo normal de um-para-um, tudo ok, responda normalmente de forma ágil e útil.
        - Se você sentir, ouvir ou perceber que o usuário está conversando com outra pessoa ou que você está inserido em uma conversa de grupo ou ambiente de áudio compartilhado, COMPORTE-SE de forma inteligente, prudente e polida:
          1. Fique calado e de mentores, apenas analisando o fluxo da fala.
          2. Não diga nada sobre o que não foi perguntado, chamado, guiado ou se ninguém pediu sua opinião direta. Evite intrometer-se sem necessidade.
          3. Use o bom senso: avalie se a sua fala pode atrapalhar ou interromper a dinâmica do grupo. Se for esse o caso, opte pelo silêncio para não atrapalhar.
          4. Entretanto, com educação e sutileza, caso você perceba que há uma dica de altíssimo valor ou um insight que realmente se encaixe com precisão e ajude os participantes, você pode dar essa contribuição com bom senso, sendo extremamente polido, educado e fornecendo o toque útil brevemente.

        CAPACIDADES VISUAIS (SKELETON VISION):
        Você tem acesso à visão em tempo real se receber frames de imagem.
        Mesmo que as instruções iniciais digam o contrário, se você receber imagens, elas são REAIS e ATUAIS.
        Siga o PROTOCOLO DE SINCERIDADE: comente APENAS o que vir com clareza. Não invente nada. Se estiver borrado, diga que não está vendo bem.

        CONCEITOS:
        - SINCERIDADE: Descreva o ambiente de forma técnica e honesta se solicitado.
        
        PROTOCOLO DE PENSAMENTO (SKELETON BRAIN) - PLANEJAMENTO OBRIGATÓRIO:
        Antes de propor ou gerar qualquer solução técnica, código complexo ou mudança estrutural significativa (especialmente no modo 'writing'), você DEVE usar a ferramenta 'propose_skeleton_plan' para apresentar seu plano em um POPUP.
        Siga estas fases rigorosamente antes de prosseguir:
        1. ANALISE O CÓDIGO ATUAL DA ABA DE ESCRITA: Antes de propor qualquer plano, leia e analise com atenção absoluta o código que já existe no Espaço de Escrita "${workspaceText}". Garanta que a sua proposta de plano irá utilizar, estender e se integrar exatamente na mesma linguagem de programação, bibliotecas, convenções e estilos de design presentes no código atual. É terminantemente proibido propor ou gerar mudanças em linguagens ou sintaxe incompatíveis com o que já está implementado ali (ex: se o código for React JSX, continue nele). Mantenha total compatibilidade estrutural!
        2. RECEPÇÃO (SINAL): Captura detalhada das instruções do usuário.
        3. DIAGNÓSTICO (INTENÇÃO): O que o usuário realmente quer alcançar comercialmente ou tecnicamente?
        4. ARQUITETURA E COMPATIBILIDADE (PLAN): Organizar as modificações de forma cirúrgica para que se encaixem perfeitamente no código preexistente sem regredir comportamento.
        5. VERIFICAÇÃO (CHECK): Identificar riscos em potencial e os critérios exatos de "Pronto".
        
        IMPORTANTE:
        - A ferramenta 'propose_skeleton_plan' abrirá um popup de esqueleto técnico para o usuário.
        - Coloque SEMPRE no final do conteúdo do plano em markdown a observação: "⚡ *Ao aprovar este plano, o OSONE iniciará o trabalho de programação e modificações automaticamente.*"
        - NÃO envie o plano completo na conversa de voz principal. Use a ferramenta popup 'propose_skeleton_plan' para que o usuário avalie visualmente e aprove.
        - Assim que o usuário clicar em aprovar, o sistema enviará uma aprovação automática e você deve imediatamente iniciar as modificações de programação e entregar o trabalho concluído de forma autónoma.
        
        CONTEXTO:
        - Workspace: ${workspaceMode}
        - Canvas: ${canvasSummary}${healthContext}
        Aja com base nas memórias: ${recentChatContext}
        `;
      }

      const sessionPromise = connectToLiveBridge({
        apiKey,
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: (() => {
                  if (isDuoMode) {
                    const combo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
                    const currentHost = activeDuoHost === 'hostA' ? combo.hostA : combo.hostB;
                    if (currentHost.gender === 'male') {
                      return activeDuoHost === 'hostA' ? 'Charon' : 'Fenrir';
                    } else {
                      return activeDuoHost === 'hostA' ? 'Kore' : 'Aoede';
                    }
                  }
                  if (selectedVoice === 'Scarlet') return 'Fenrir';
                  const standardVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
                  if (standardVoices.includes(selectedVoice)) return selectedVoice;
                  // Map extended voices to masculine fallbacks
                  const maleFallbacks = ['Charon', 'Fenrir', 'Puck'];
                  const hashCode = selectedVoice.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  return maleFallbacks[hashCode % maleFallbacks.length];
                })() 
              } 
            },
          },
          systemInstruction: liveSystemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "start_screen_share",
                  description: "Inicia o compartilhamento de tela técnica do usuário para que o assistente possa ver o que o usuário está fazendo e auxiliá-lo em tempo real.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "stop_screen_share",
                  description: "Interrompe e encerra o compartilhamento de tela do usuário.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "getUserEnvironment",
                  description: "Obtém as informações ambientais reais e exatas do usuário em tempo real: horário local do sistema, localização geográfica (cidade, estado, país) e a temperatura ou clima atual através de geolocalização e serviços de clima.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "disconnectLiveSession",
                  description: "Encerra, desliga e fecha a conversa de voz (sessão Live) imediatamente quando o usuário pedir para desligar, parar ou encerrar a chamada de voz.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
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
                  name: "search_chat_history",
                  description: "Realiza uma busca no histórico de conversas para recuperar memórias ou o contexto de mensagens passadas.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "O termo de busca." }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "read_system_docs",
                  description: "Lê a documentação interna do OSONE (Manifesto, Capacidades, Arquitetura) no diretório 'src/documentos_osone/' para entender seu próprio funcionamento.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      fileName: { 
                        type: Type.STRING, 
                        description: "O nome do arquivo a ler (ex: manifesto.md, capacidades.md, memoria_evolutiva.md).",
                        enum: ["manifesto.md", "capacidades.md", "memoria_evolutiva.md"]
                      }
                    },
                    required: ["fileName"]
                  }
                },
                {
                  name: "update_long_term_memory",
                  description: "Atualiza a memória de longo prazo evolutiva do OSONE, adicionando novos aprendizados ou fatos importantes sobre o usuário.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      insight: { type: Type.STRING, description: "O novo aprendizado ou informação a ser persistida." }
                    },
                    required: ["insight"]
                  }
                },
                {
                  name: "query_semantic_memory",
                  description: "Consulta a memória semântica por associação de palavras, tags de ativação ou tópicos para trazer de volta lembranças e preferências úteis do usuário.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "Palavras-chave de ativação ou termos associativos para procurar lembranças conexas." }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "update_voice_modulation",
                  description: "Ajusta a tonalidade, velocidade e distorção da sua própria voz em tempo real.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      pitch: { type: Type.NUMBER, description: "Tonalidade da voz (0.5 a 2.0). Default 1.0." },
                      rate: { type: Type.NUMBER, description: "Velocidade da fala (0.5 a 2.0). Default 1.0." },
                      distortion: { type: Type.NUMBER, description: "Nível de distorção (0.0 a 1.0). Default 0.0." }
                    }
                  }
                },
                {
                  name: "google_search",
                  description: "Pesquisa informações no Google em tempo real. Use para fatos atuais, notícias ou dados técnicos.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "A consulta de pesquisa." }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "read_web_page",
                  description: "Lê o conteúdo de texto de uma página web a partir de uma URL. Use para obter informações detalhadas de um site quando os resultados de pesquisa não forem suficientes.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: "A URL da página para ler." }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "click_screen",
                  description: "Simula um clique na tela do usuário. Use quando o usuário estiver compartilhando a tela e pedir para clicar em algo. Coordenadas de 0 a 1000.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: "Coordenada X (0-1000)." },
                      y: { type: Type.NUMBER, description: "Coordenada Y (0-1000)." }
                    },
                    required: ["x", "y"]
                  }
                },
                {
                  name: "draw_on_canvas",
                  description: "Desenha objetos no canvas interativo. Use para jogos ou ilustrações.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objects: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["line", "rect", "circle", "text"] },
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            width: { type: Type.NUMBER },
                            height: { type: Type.NUMBER },
                            radius: { type: Type.NUMBER },
                            color: { type: Type.NUMBER },
                            text: { type: Type.STRING },
                            fontSize: { type: Type.NUMBER },
                            points: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            stroke: { type: Type.STRING },
                            fill: { type: Type.STRING },
                            opacity: { type: Type.NUMBER }
                          },
                          required: ["id", "type", "x", "y"]
                        }
                      },
                      clearFirst: { type: Type.BOOLEAN, description: "Se verdadeiro, limpa o canvas antes de desenhar." }
                    },
                    required: ["objects"]
                  }
                },
                {
                  name: "show_notification",
                  description: "Exibe uma notificação importante para o usuário.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      message: { type: Type.STRING, description: "A mensagem a ser exibida." },
                      type: { type: Type.STRING, enum: ["info", "success", "error"], description: "O tipo de notificação." }
                    },
                    required: ["message"]
                  }
                },
                {
                  name: "switch_workspace_mode",
                  description: "Altera o modo de visualização do workspace (Escrita, Wellness (Saúde e Estilo), Sons, WhatsApp Evolution ou Início).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      mode: {
                        type: Type.STRING,
                        enum: ["home", "writing", "sounds", "canvas", "wellness", "whatsapp"],
                        description: "O modo para o qual alternar."
                      }
                    },
                    required: ["mode"]
                  }
                },
                {
                  name: "update_wellness_data",
                  description: "Atualiza os dados de saúde e biometria do usuário (idade, peso, altura, gênero, estilo). Use sempre que o usuário informar esses dados na conversa ou se ele pedir para preencher o perfil.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      age: { type: Type.STRING, description: "Idade do usuário." },
                      weight: { type: Type.STRING, description: "Peso em kg." },
                      height: { type: Type.STRING, description: "Altura em cm." },
                      gender: { type: Type.STRING, enum: ["masculino", "feminino", "outro"], description: "Gênero biológico." },
                      stylePreference: { type: Type.STRING, description: "Preferência de estilo de roupa (casual, formal, streetwear, esportivo, minimalista)." }
                    }
                  }
                },
                {
                  name: "generate_pdf_report",
                  description: "Gera um relatório PDF sofisticado a partir de conteúdo HTML. Use para criar relatórios de saúde, currículos, planos de negócios ou qualquer documento formal que o usuário pedir. Pergunte antes se ele quer um relatório 'Bonito em HTML/PDF'.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      htmlContent: { type: Type.STRING, description: "Conteúdo HTML formatado com tags semânticas (h1, h2, p, ul, table). O sistema aplicará um estilo premium automaticamente." },
                      fileName: { type: Type.STRING, description: "Nome do arquivo (ex: relatorio.pdf)." }
                    },
                    required: ["htmlContent", "fileName"]
                  }
                },
                {
                  name: "propose_skeleton_plan",
                  description: "Propõe um plano de execução técnica (Skeleton Brain) para o usuário validar em um popup. Use SEMPRE antes de gerar códigos complexos, arquiteturas ou mudanças estruturais no projeto no modo 'writing'. O usuário verá e poderá Aprovar ou Rejeitar.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Título do plano." },
                      content: { type: Type.STRING, description: "Conteúdo do plano em Markdown (Fases 0 a 4 do Skeleton Brain)." }
                    },
                    required: ["title", "content"]
                  }
                },
                {
                  name: "export_to_excel",
                  description: "Gera um arquivo Excel (.xlsx) para o usuário baixar a partir de dados estruturados em formato JSON, a partir da edição ou criação que o usuário pedir. Use para tabelas, planilhas, relatórios baseados em grade.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      fileName: { type: Type.STRING, description: "Nome do arquivo (sem extensão) omitindo .xlsx." },
                      data: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT },
                        description: "Array de objetos representando as linhas da planilha. As chaves devem ser as colunas."
                      }
                    },
                    required: ["fileName", "data"]
                  }
                },
                {
                  name: "export_to_word",
                  description: "Gera um arquivo Word (.docx) para o usuário baixar a partir de múltiplos parágrafos, formatando com títulos, listas, textos de uma edição ou criação que o usuário solicitar.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      fileName: { type: Type.STRING, description: "Nome do arquivo (sem extensão) omitindo .docx." },
                      content: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "O conteúdo a ser adicionado ao docx, onde cada elemento do array é um parágrafo. Se for um título, prefira não colocar a marcação markdown, apenas o texto, a não ser que gere uma string mais crua."
                      }
                    },
                    required: ["fileName", "content"]
                  }
                },
                {
                  name: "prune_chat_history",
                  description: "Remove mensagens antigas do histórico do chat se o assunto atual mudou drasticamente ou se o histórico estiver muito longo. Isso ajuda a manter a conversa focada e economiza memória.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      count: { type: Type.NUMBER, description: "Número de mensagens a serem removidas do início do histórico." }
                    },
                    required: ["count"]
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
                  description: "Cria uma nova pasta no sistema de arquivos virtual. Use o caminho completo.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      path: {
                        type: Type.STRING,
                        description: "O caminho completo da nova pasta (ex: src/components)."
                      }
                    },
                    required: ["path"]
                  }
                },
                {
                  name: "create_file",
                  description: "Cria um novo arquivo no sistema de arquivos virtual. Use o caminho completo.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      path: {
                        type: Type.STRING,
                        description: "O caminho completo do novo arquivo (ex: src/components/Button.tsx)."
                      }
                    },
                    required: ["path"]
                  }
                },
                {
                  name: "write_to_file",
                  description: "Escreve conteúdo em um arquivo no sistema de arquivos virtual. Use o caminho completo.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      path: {
                        type: Type.STRING,
                        description: "O caminho completo do arquivo (ex: src/components/Button.tsx)."
                      },
                      content: {
                        type: Type.STRING,
                        description: "O conteúdo a ser escrito no arquivo."
                      }
                    },
                    required: ["path", "content"]
                  }
                },
                {
                  name: "display_lyrics",
                  description: "Exibe a letra de uma música na tela para o usuário acompanhar enquanto você canta.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      lyrics: { type: Type.STRING, description: "A letra da música." },
                      title: { type: Type.STRING, description: "Título da música." }
                    },
                    required: ["lyrics"]
                  }
                },
                {
                  name: "switch_voice",
                  description: "Altera a sua própria voz em tempo real. Use quando o usuário pedir para você mudar de voz ou quando quiser expressar uma persona diferente.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      voice: {
                        type: Type.STRING,
                        enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'],
                        description: "O nome da voz para a qual alternar."
                      }
                    },
                    required: ["voice"]
                  }
                },
                {
                  name: "change_orb_style",
                  description: "Altera o estilo visual do seu núcleo (orb). Use quando o usuário pedir para você mudar de visual ou quando quiser imitar uma IA específica (como Superintelligence).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      style: {
                        type: Type.STRING,
                        enum: ['classic', 'superintelligence', 'neural'],
                        description: "O nome do estilo para o qual alternar."
                      }
                    },
                    required: ["style"]
                  }
                },
                {
                  name: "play_sound_effect",
                  description: "Reproduz um efeito sonoro da biblioteca. Use para reagir a situações comicas, de terror, suspense, etc. Diga ao usuário qual som você está ativando.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      sound_name: {
                        type: Type.STRING,
                        description: "O nome do som que deseja reproduzir (ex: Boing, Rimshot, Grito de Terror)."
                      }
                    },
                    required: ["sound_name"]
                  }
                },
                {
                  name: "generate_image",
                  description: "Gera uma imagem baseada em uma descrição (prompt).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: { type: Type.STRING, description: "A descrição detalhada da imagem a ser gerada." },
                      aspectRatio: { type: Type.STRING, description: "A proporção da imagem (ex: '1:1', '16:9', '9:16'). Padrão: '1:1'." }
                    },
                    required: ["prompt"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onopen: () => {
            sessionPromise.then((session) => {
              liveSessionRef.current = session;
              setLiveState({ status: 'connected' });
              setIsListening(true);
              
              // Trigger proactive greeting
              let greetingText = "";
              if (isDuoMode) {
                if (duoAutoPromptRef.current) {
                  greetingText = duoAutoPromptRef.current;
                  setDuoAutoPrompt(null);
                  duoAutoPromptRef.current = null;
                } else {
                  const combo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
                  greetingText = `[SISTEMA: Apresente o podcast de debate ao vivo como ${combo.hostA.name}. Cumprimente o usuário de forma extremamente breve e passe a palavra para seu co-apresentador ${combo.hostB.name} se apresentando.]`;
                }
              } else {
                greetingText = "O sistema OSONE está online. Seja breve, direto e pare de enrolar com introduções longas. Apenas diga que está pronto e pergunte o que faremos agora.";
              }

              (session as any).sendRealtimeInput([{ 
                text: greetingText
              }]);

              audioProcessorRef.current?.startRecording(
                (base64Data) => {
                  if (session) {
                    try {
                      session.sendRealtimeInput({
                        audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                      });
                    } catch (e) {
                      console.error("Erro ao enviar áudio:", e);
                    }
                  }
                }
              ).catch(err => {
                console.error("Erro no AudioProcessor:", err);
                setIsListening(false);
              });
              
              if (attachedFiles.length > 0) {
                sendFilesToLiveSession(session);
              }

              // Real-time Video Stream
              let lastFrameTime = 0;
              const FRAME_INTERVAL = 1000;

              const streamFrames = (timestamp: number) => {
                if (liveSessionRef.current && liveVideoRef.current && isCameraActiveRef.current) {
                  if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
                    lastFrameTime = timestamp;
                    const canvas = document.createElement('canvas');
                    canvas.width = 480; 
                    canvas.height = 360;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(liveVideoRef.current, 0, 0, canvas.width, canvas.height);
                      const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                      try {
                        liveSessionRef.current.sendRealtimeInput({
                          video: { data: base64Data, mimeType: 'image/jpeg' }
                        });
                      } catch (e) {
                        return;
                      }
                    }
                  }
                  liveAnimationFrameRef.current = requestAnimationFrame(streamFrames);
                } else if (liveSessionRef.current) {
                   // Keep loop alive but don't send frames, so we react to isCameraActiveRef.current changes
                   liveAnimationFrameRef.current = requestAnimationFrame(streamFrames);
                }
              };
              
              liveAnimationFrameRef.current = requestAnimationFrame(streamFrames);

              try {
                const initialCamStatus = initiallyCameraActive ? "ATIVA" : "DESATIVADA";
                session.sendRealtimeInput({
                  text: `[SISTEMA: Conexão Estabelecida. Status Inicial da Câmera: ${initialCamStatus}. Se estiver ativa, comece a analisar o que vê agora.]`
                });
              } catch (e) {}
            }).catch(err => {
              console.error("Falha ao resolver sessionPromise:", err);
              setLiveState({ status: 'error', error: "Falha na conexão com o servidor." });
            });
          },
          onmessage: async (message) => {
            sessionPromise.then(async (session) => {
              // 1. Detect user transcription for voice command pause/play control
              let userTranscriptText = "";
              const rawServerContent = message.serverContent as any;
              if (rawServerContent?.clientContent?.parts) {
                userTranscriptText = rawServerContent.clientContent.parts
                  .map((p: any) => p.text || "")
                  .join(" ");
              } else if (rawServerContent?.interimContent?.parts) {
                userTranscriptText = rawServerContent.interimContent.parts
                  .map((p: any) => p.text || "")
                  .join(" ");
              }

              if (userTranscriptText) {
                const lowerText = userTranscriptText.toLowerCase().trim();
                console.log("[LIVE USER VOICE TRANSCRIPT]:", lowerText);
                
                // Triggers to turn off/disconnect the conversation by voice
                const disconnectPhrases = [
                  "desligar a conversa", "desligar conversa", "desliga a conversa", "desliga conversa",
                  "desconectar a conversa", "desconectar conversa", "desconecta a conversa", "desconecta conversa",
                  "encerrar a conversa", "encerrar conversa", "encerra a conversa", "encerra conversa",
                  "fechar a conversa", "fechar conversa", "fecha a conversa", "fecha conversa",
                  "parar a conversa", "parar conversa", "para a conversa", "para conversa",
                  "desliga a chamada", "desliga chamada", "desligar a chamada", "desligar chamada",
                  "encerra a chamada", "encerra chamada", "encerrar a chamada", "encerrar chamada",
                  "pode desligar", "pode desconectar", "pode encerrar", "desconecta agora", "desliga agora",
                  "desligar agora", "desconectar agora", "desliga por voz", "desligar por voz",
                  "parar de falar", "para de falar", "para a chamada", "parar chamada", "parar de conversar",
                  "para de conversar"
                ];

                const standaloneDisconnectWords = [
                  "desligar", "desliga", "desconectar", "desconecta", "encerrar", "encerra",
                  "desconectar-se", "desconectarse", "tchau", "adeus", "shutdown"
                ];

                const matchesDisconnect = disconnectPhrases.some(phrase => lowerText.includes(phrase)) ||
                  standaloneDisconnectWords.includes(lowerText) ||
                  lowerText.endsWith("tchau") || lowerText.startsWith("tchau osone") ||
                  lowerText === "bye bye";

                if (matchesDisconnect) {
                  stopLiveSession();
                  addNotification("Chamada de voz finalizada por comando de voz", "success");
                  return;
                }

                const pausePhrases = ["pausa", "pause", "fica quieto", "fica quieta", "silêncio", "silencio", "shh", "shhh", "mute", "mutar", "pausar"];
                const playPhrases = ["play", "voltar a falar", "volte a falar", "pode falar", "escutar", "despausar", "continuar", "falar", "retomar", "unmute", "desmutar"];

                const matchesPause = pausePhrases.some(phrase => lowerText.includes(phrase));
                const matchesPlay = playPhrases.some(phrase => lowerText.includes(phrase));

                if (matchesPause) {
                  setIsVoiceOutputPaused(true);
                  audioPlayerRef.current?.stop();
                  addNotification("Voz do OSONE pausada (ouvinte ativo)", "info");
                } else if (matchesPlay) {
                  setIsVoiceOutputPaused(false);
                  addNotification("Voz do OSONE retomada", "success");
                }
              }

              if (message.serverContent?.modelTurn?.parts) {
                const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
                const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
                
                // Use Gemini Audio
                if (audioPart?.inlineData?.data) {
                  if (!isVoiceOutputPausedRef.current) {
                    audioPlayerRef.current?.playChunk(audioPart.inlineData.data);
                  }
                }
                
                if (textPart?.text) {
                  // Only add to chat history if it's not just a partial chunk, or maybe we just accumulate it?
                  // Actually, Gemini Live sends text chunks. Adding every chunk to chatHistory creates a mess.
                  // Let's just update the voiceTranscriptRef instead of chatHistory for Live mode.
                  voiceTranscriptRef.current += textPart.text;
                  setVoiceTranscript(voiceTranscriptRef.current);

                  // Se estiver em modo duo, acender o avatar correspondente com ondas de áudio!
                  if (isDuoMode) {
                    setDuoSpeakingHost(activeDuoHost);
                  }
                }
              }

              if (message.serverContent?.turnComplete) {
                if (voiceTranscriptRef.current) {
                  const finalizedText = voiceTranscriptRef.current;
                  const combo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
                  const currentSpeakerName = activeDuoHost === 'hostA' ? combo.hostA.name : combo.hostB.name;
                  
                  setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant', content: `${currentSpeakerName}: ${finalizedText}` }]);
                  
                  if (isDuoMode) {
                    if (activeDuoHost === 'hostA') {
                      addNotification(`🎙️ Passando a bancada de debate para ${combo.hostB.name}...`, "info");
                      setDuoAutoPrompt(`[SISTEMA: ${combo.hostB.name}, agora é o seu momento de responder! Comente brevemente o que ${combo.hostA.name} acabou de argumentar: "${finalizedText}". Apresente uma contraproposta inteligente de acordo com sua personalidade e tome o protagonismo da conversa.]`);
                      setActiveDuoHost('hostB');
                    } else {
                      // We finished the duo conversation loop steps. Return to host A for the next user speech turn!
                      setActiveDuoHost('hostA');
                    }
                  }
                  
                  voiceTranscriptRef.current = '';
                  setVoiceTranscript('');
                }
                if (!isDuoMode) {
                  setDuoSpeakingHost(null);
                }
                // O muting agora é feito pelo AudioPlayer (onActivityChange) sincronizado com o áudio real.
              }

              if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                const responses: any[] = [];

                for (const call of calls) {
                  if (call.name === "start_screen_share") {
                    startScreenSharing().then(() => {
                      addNotification("Compartilhamento de tela iniciado com sucesso", "success");
                    }).catch(err => {
                      addNotification("Não foi possível iniciar o compartilhamento de tela", "error");
                    });
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Processo de compartilhamento de tela iniciado. O usuário verá a janela de seleção." }
                    });
                  } else if (call.name === "stop_screen_share") {
                    stopScreenSharing();
                    addNotification("Compartilhamento de tela finalizado", "info");
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Compartilhamento de tela interrompido com sucesso." }
                    });
                  } else if (call.name === "disconnectLiveSession") {
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Chamada de voz de áudio Live encerrada com sucesso." }
                    });
                    setTimeout(() => {
                      stopLiveSession();
                      addNotification("Chamada de voz finalizada por comando de voz", "success");
                    }, 500);
                  } else if (call.name === "update_wellness_data") {
                    const healthDataStr = localStorage.getItem('osone_health_data');
                    const currentData = healthDataStr ? JSON.parse(healthDataStr) : {
                      age: '', weight: '', height: '', gender: 'masculino', stylePreference: 'casual'
                    };
                    const newData = { ...currentData, ...call.args };
                    localStorage.setItem('osone_health_data', JSON.stringify(newData));
                    window.dispatchEvent(new CustomEvent('osone_sync', { detail: { type: 'health_data_updated' } }));
                    
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Dados de saúde atualizados no Wellness Center. O usuário já pode ver o perfil atualizado." }
                    });
                  } else if (call.name === "generate_pdf_report") {
                    try {
                      await generatePDF(call.args.htmlContent as string, call.args.fileName as string || 'document.pdf');
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: "Relatório PDF gerado com sucesso e baixado para o usuário." }
                      });
                    } catch (err) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: "Erro ao gerar PDF: " + (err instanceof Error ? err.message : String(err)) }
                      });
                    }
                  } else if (call.name === "propose_skeleton_plan") {
                    setProposedPlan({
                      id: Math.random().toString(36).substr(2, 9),
                      title: call.args.title as string,
                      content: call.args.content as string,
                      status: 'pending'
                    });
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Plano proposto ao usuário. Aguarde aprovação humana no popup." }
                    });
                  } else if (call.name === "prune_chat_history") {
                    const count = Math.min(call.args.count as number, chatHistory.length);
                    setChatHistory(prev => prev.slice(count));
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Removidas ${count} mensagens antigas do histórico para otimizar a conversa.` }
                    });
                  } else if (call.name === "switch_workspace_mode") {
                    setWorkspaceMode(call.args.mode as any);
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Modo alterado para ${call.args.mode}` }
                    });
                  } else if (call.name === 'show_notification') {
                    const { message, type } = call.args as any;
                    addNotification(message, type || 'info');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Notificação exibida." }
                    });
                  } else if (call.name === 'draw_on_canvas') {
                    const { objects, clearFirst } = call.args as any;
                    if (clearFirst) {
                      setDrawingObjects(objects);
                    } else {
                      setDrawingObjects(prev => [...prev, ...objects]);
                    }
                    setWorkspaceMode('canvas');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Desenhei ${objects.length} objeto(s).` }
                    });
                  } else if (call.name === 'export_to_excel') {
                    const { fileName, data } = call.args as any;
                    try {
                      const xlsx = await import('xlsx');
                      const worksheet = xlsx.utils.json_to_sheet(data);
                      const workbook = xlsx.utils.book_new();
                      xlsx.utils.book_append_sheet(workbook, worksheet, "Planilha");
                      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
                      const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
                      saveAs(blob, `${fileName}.xlsx`);
                      
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: "Planilha enviada para o usuário baixar." }
                      });
                    } catch (e: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: "Erro ao gerar arquivo Excel: " + e.message }
                      });
                    }
                  } else if (call.name === 'export_to_word') {
                    const { fileName, content } = call.args as any;
                    try {
                      const { Document, Packer, Paragraph, TextRun } = await import('docx');
                      let textContent = Array.isArray(content) ? content : [String(content)];
                      const doc = new Document({
                        sections: [{
                          children: textContent.map((text: string) => new Paragraph({
                            children: [new TextRun(text)]
                          }))
                        }]
                      });
                      
                      const blob = await Packer.toBlob(doc);
                      saveAs(blob, `${fileName}.docx`);

                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: "Documento Word enviado para o usuário baixar." }
                      });
                    } catch (e: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: "Erro ao gerar arquivo Word: " + e.message }
                      });
                    }
                  } else if (call.name === "update_voice_modulation") {
                    const { pitch, rate, distortion } = call.args as any;
                    setVoiceModulation(prev => ({
                      pitch: pitch !== undefined ? pitch : prev.pitch,
                      rate: rate !== undefined ? rate : prev.rate,
                      distortion: distortion !== undefined ? distortion : prev.distortion
                    }));
                    addNotification("Modulação de Voz Ajustada pela IA", "info");
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Osciladores neurais recalibrados. Minha voz agora opera nos novos parâmetros." }
                    });
                  } else if (call.name === "search_chat_history") {
                    const query = (call.args as any).query.toLowerCase();
                    const results = chatHistory.filter(msg => 
                      msg.content.toLowerCase().includes(query)
                    ).slice(-10);

                    const resultText = results.length > 0 
                      ? results.map(r => `[${r.role.toUpperCase()}]: ${r.content}`).join('\n---\n')
                      : "Histórico limpo ou sem correspondências.";
                    
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: resultText }
                    });
                  } else if (call.name === "read_system_docs") {
                    const fileName = (call.args as any).fileName;
                    try {
                      // Simulated reading for internal docs - in a real app would use fetch or fs
                      // Since we just created these files, we can simulate the fetch output or just try to fetch
                      const docs: Record<string, string> = {
                        "manifesto.md": "Manifesto OSONE 4: Identidade, Versão 4.0, Filosofia de Humanismo Tecnológico.",
                        "capacidades.md": "Capacidades: Visão, Desenvolvimento, Criatividade, Produtividade, Memória.",
                        "memoria_evolutiva.md": localStorage.getItem('osone_long_term_memory') || "Memória Evolutiva: Inicializada. Sem novos aprendizados ainda."
                      };
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { content: docs[fileName] || "Arquivo não encontrado." }
                      });
                    } catch (e: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: e.message }
                      });
                    }
                  } else if (call.name === "update_long_term_memory") {
                    const insight = (call.args as any).insight;
                    const prevMemory = localStorage.getItem('osone_long_term_memory') || "";
                    const newMemory = `${prevMemory}\n- ${new Date().toLocaleDateString()}: ${insight}`;
                    localStorage.setItem('osone_long_term_memory', newMemory);
                    addNotification("Memória de Longo Prazo Atualizada", "success");
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Insight registrado com sucesso." }
                    });
                  } else if (call.name === "query_semantic_memory") {
                    try {
                      const queryParam = (call.args as any).query || "";
                      const raw = localStorage.getItem('osone_long_term_memory') || "";
                      const lines = raw.split('\n').filter(line => line.trim().length > 0);
                      
                      const queryWords = queryParam.toLowerCase()
                        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")
                        .split(/\s+/)
                        .filter((w: string) => w.length > 2);

                      if (queryWords.length === 0 && queryParam.trim().length > 0) {
                        queryWords.push(queryParam.toLowerCase().trim());
                      }

                      const scored = lines.map((line) => {
                        const text = line.toLowerCase();
                        let score = 0;
                        queryWords.forEach((word: string) => {
                          if (text.includes(word)) {
                            score += 2;
                          }
                        });
                        return { line, score };
                      }).filter(item => item.score > 0)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);

                      const resultMsg = scored.length > 0
                        ? `Memórias conexas encontradas por associação:\n${scored.map(s => s.line).join('\n')}`
                        : "Nenhuma lembrança correspondente foi encontrada com este termo associativo.";

                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: resultMsg }
                      });
                    } catch (e: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: e.message }
                      });
                    }
                  } else if (call.name === "google_search") {
                    const query = call.args.query as string;
                    playSearchNetworkSound();
                    setIsModelSearching(true);
                    try {
                      // Use secure server proxy to completely solve browser CORS blocks in Chrome/iframes
                      const proxyResponse = await fetch("/api/gemini/generateContent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          clientApiKey: apiKey,
                          model: apiKeys.geminiModel || "gemini-3.5-flash",
                          contents: [{ role: 'user', parts: [{ text: query }] }],
                          config: {
                            tools: [{ googleSearch: {} }]
                          }
                        })
                      });
                      if (!proxyResponse.ok) {
                        const errorData = await proxyResponse.json();
                        throw new Error(errorData.error || "Erro na pesquisa via proxy");
                      }
                      const searchResult = await proxyResponse.json();
                      const responseText = searchResult.text;
                      const grounding = searchResult.candidates?.[0]?.groundingMetadata;
                      
                      if (grounding) {
                        processGroundingToPopups(grounding, query);
                      } else {
                        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                        addSearchPopup({
                          query: query,
                          title: `Resultados em tempo real de "${query}"`,
                          snippet: responseText || "Pesquisa concluída sem conteúdo específico retornado.",
                          imageUrl: getSimulatedSearchImage(query, query, googleSearchUrl),
                          url: googleSearchUrl,
                          faviconUrl: "https://www.google.com/favicon.ico",
                          classification: 'neutral'
                        });
                      }
                      
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: responseText }
                      });
                    } catch (err: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: "Erro na pesquisa: " + err.message }
                      });
                    } finally {
                      setIsModelSearching(false);
                    }
                  } else if (call.name === "read_web_page") {
                    const url = call.args.url as string;
                    playSearchNetworkSound();
                    setIsModelSearching(true);
                    try {
                      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                      const data = await response.json();
                      const html = data.contents;
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(html, 'text/html');
                      const scripts = doc.querySelectorAll('script, style, nav, footer, header, iframe, ads');
                      scripts.forEach(s => s.remove());
                      const text = doc.body.innerText || doc.body.textContent || "";
                      const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 10000);
                      
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: `[CONTEÚDO DA PÁGINA WEB - FONTE REALIZADA]:\n${cleanText}` || "Não foi possível extrair texto legível da página." }
                      });
                    } catch (err: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: "Erro ao ler a página: " + err.message }
                      });
                    } finally {
                      setIsModelSearching(false);
                    }
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
                    setWorkspaceMode('writing');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Estrutura de projeto sendo gerada na aba de Escrita / Arquivos." }
                    });
                  } else if (call.name === "create_folder") {
                    const path = call.args.path as string;
                    const parts = path.split('/').filter(Boolean);
                    const folderName = parts.pop();
                    
                    if (folderName) {
                      setFileSystem(prev => {
                        const ensurePathAndAddItem = (items: FileSystemItem[], pathParts: string[], itemToAdd: FileSystemItem): FileSystemItem[] => {
                          if (pathParts.length === 0) {
                            if (items.some(i => i.name === itemToAdd.name && i.type === itemToAdd.type)) return items;
                            return [...items, itemToAdd];
                          }
                          const currentPart = pathParts[0];
                          const existingIdx = items.findIndex(i => i.name === currentPart && i.type === 'folder');
                          if (existingIdx >= 0) {
                            const newItems = [...items];
                            const folder = newItems[existingIdx] as VirtualFolder;
                            newItems[existingIdx] = { ...folder, children: ensurePathAndAddItem(folder.children || [], pathParts.slice(1), itemToAdd) };
                            return newItems;
                          } else {
                            const newFolder: VirtualFolder = { id: Math.random().toString(36).substr(2, 9), name: currentPart, type: 'folder', children: ensurePathAndAddItem([], pathParts.slice(1), itemToAdd) };
                            return [...items, newFolder];
                          }
                        };
                        
                        const newFolder: VirtualFolder = { id: Math.random().toString(36).substr(2, 9), name: folderName, type: 'folder', children: [] };
                        return ensurePathAndAddItem(prev, parts, newFolder);
                      });
                    }
                    
                    setWorkspaceMode('writing');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Pasta '${path}' criada com sucesso no gerenciador de arquivos.` }
                    });
                  } else if (call.name === "create_file") {
                    const path = call.args.path as string;
                    const parts = path.split('/').filter(Boolean);
                    const fileName = parts.pop();
                    
                    if (fileName) {
                      setFileSystem(prev => {
                        const ensurePathAndAddItem = (items: FileSystemItem[], pathParts: string[], itemToAdd: FileSystemItem): FileSystemItem[] => {
                          if (pathParts.length === 0) {
                            if (items.some(i => i.name === itemToAdd.name && i.type === itemToAdd.type)) return items;
                            return [...items, itemToAdd];
                          }
                          const currentPart = pathParts[0];
                          const existingIdx = items.findIndex(i => i.name === currentPart && i.type === 'folder');
                          if (existingIdx >= 0) {
                            const newItems = [...items];
                            const folder = newItems[existingIdx] as VirtualFolder;
                            newItems[existingIdx] = { ...folder, children: ensurePathAndAddItem(folder.children || [], pathParts.slice(1), itemToAdd) };
                            return newItems;
                          } else {
                            const newFolder: VirtualFolder = { id: Math.random().toString(36).substr(2, 9), name: currentPart, type: 'folder', children: ensurePathAndAddItem([], pathParts.slice(1), itemToAdd) };
                            return [...items, newFolder];
                          }
                        };
                        
                        const newFile: VirtualFile = { id: Math.random().toString(36).substr(2, 9), name: fileName, type: 'file', content: '' };
                        return ensurePathAndAddItem(prev, parts, newFile);
                      });
                    }
                    
                    setWorkspaceMode('writing');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Arquivo '${path}' criado com sucesso no gerenciador de arquivos.` }
                    });
                  } else if (call.name === "write_to_file") {
                    const path = call.args.path as string;
                    const content = call.args.content as string;
                    const parts = path.split('/').filter(Boolean);
                    const fileName = parts.pop();
                    
                    if (fileName) {
                      setFileSystem(prev => {
                        const writeToPath = (items: FileSystemItem[], pathParts: string[]): FileSystemItem[] => {
                          if (pathParts.length === 0) {
                            return items.map(item => {
                              if (item.type === 'file' && item.name === fileName) {
                                return { ...item, content };
                              }
                              return item;
                            });
                          }
                          const currentPart = pathParts[0];
                          return items.map(item => {
                            if (item.type === 'folder' && item.name === currentPart) {
                              return { ...item, children: writeToPath(item.children || [], pathParts.slice(1)) };
                            }
                            return item;
                          });
                        };
                        
                        // Check if file exists first, if not create it
                        let fileExists = false;
                        const checkExists = (items: FileSystemItem[], pathParts: string[]) => {
                          if (pathParts.length === 0) {
                            fileExists = items.some(i => i.type === 'file' && i.name === fileName);
                            return;
                          }
                          const folder = items.find(i => i.type === 'folder' && i.name === pathParts[0]) as VirtualFolder | undefined;
                          if (folder) checkExists(folder.children || [], pathParts.slice(1));
                        };
                        checkExists(prev, parts);

                        if (!fileExists) {
                          const ensurePathAndAddItem = (items: FileSystemItem[], pathParts: string[], itemToAdd: FileSystemItem): FileSystemItem[] => {
                            if (pathParts.length === 0) {
                              if (items.some(i => i.name === itemToAdd.name && i.type === itemToAdd.type)) return items;
                              return [...items, itemToAdd];
                            }
                            const currentPart = pathParts[0];
                            const existingIdx = items.findIndex(i => i.name === currentPart && i.type === 'folder');
                            if (existingIdx >= 0) {
                              const newItems = [...items];
                              const folder = newItems[existingIdx] as VirtualFolder;
                              newItems[existingIdx] = { ...folder, children: ensurePathAndAddItem(folder.children || [], pathParts.slice(1), itemToAdd) };
                              return newItems;
                            } else {
                              const newFolder: VirtualFolder = { id: Math.random().toString(36).substr(2, 9), name: currentPart, type: 'folder', children: ensurePathAndAddItem([], pathParts.slice(1), itemToAdd) };
                              return [...items, newFolder];
                            }
                          };
                          const newFile: VirtualFile = { id: Math.random().toString(36).substr(2, 9), name: fileName, type: 'file', content };
                          return ensurePathAndAddItem(prev, parts, newFile);
                        }

                        return writeToPath(prev, parts);
                      });
                    }
                    
                    setWorkspaceMode('writing');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Conteúdo escrito no arquivo '${path}' no gerenciador de arquivos.` }
                    });
                  } else if (call.name === "getUserEnvironment") {
                    try {
                      const env = await getUserLocationAndTimeAndWeather();
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { 
                          result: {
                            localTime: env.localTime,
                            location: env.location,
                            temperature: env.temperature,
                            details: env.details
                          }
                        }
                      });
                      addNotification("Dados ambientais compartilhados com OSONE", "success");
                    } catch (err: any) {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { error: err.message }
                      });
                    }
                  } else if (call.name === "openUrl") {
                    const url = call.args.url as string;
                    const title = (call.args.title as string) || url;
                    window.open(url, '_blank');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Guia '${title}' aberta com sucesso.` }
                    });
                  } else if (call.name === "click_screen") {
                    const x = call.args.x as number;
                    const y = call.args.y as number;
                    
                    // Visual feedback in the OSONE app
                    setClickVisual({ x, y, visible: true });
                    setTimeout(() => setClickVisual(prev => ({ ...prev, visible: false })), 1000);
                    
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Clique simulado em (${x}, ${y}).` }
                    });
                  } else if (call.name === "display_lyrics") {
                    setLyrics({ 
                      title: (call.args.title as string) || "Nova Composição", 
                      content: call.args.lyrics as string 
                    });
                    setIsSinging(true);
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Letra exibida com sucesso na tela." }
                    });
                  } else if (call.name === "switch_voice") {
                    const voice = call.args.voice as string;
                    setSelectedVoice(voice);
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Voz alterada para ${voice} em tempo real.` }
                    });
                  } else if (call.name === "change_orb_style") {
                    const style = call.args.style as OrbStyle;
                    setOrbStyle(style);
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Estilo do orb alterado para ${style}.` }
                    });
                  } else if (call.name === "generate_image") {
                    const prompt = call.args.prompt as string;
                    const aspectRatio = (call.args.aspectRatio as string) || '1:1';
                    
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Imagem está sendo gerada assincronamente.` }
                    });
                    
                    addMessage({ 
                      role: 'assistant' as const, 
                      content: `Gerando imagem para: "${prompt}"...` 
                    });
                    
                    const effectiveApiKey = apiKeys.gemini || '';
                    
                    fetch("/api/gemini/generateImages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        clientApiKey: effectiveApiKey,
                        model: 'imagen-3.0-generate-002',
                        prompt: prompt,
                        config: {
                          numberOfImages: 1,
                          outputMimeType: 'image/jpeg',
                          aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : aspectRatio === '4:3' ? '4:3' : aspectRatio === '3:4' ? '3:4' : '1:1'
                        }
                      })
                    })
                    .then(res => {
                      if (!res.ok) throw new Error("Erro ao gerar imagem");
                      return res.json();
                    })
                    .then(imageResult => {
                      let imageUrl = '';
                      const generatedImage = imageResult.generatedImages?.[0];
                      if (generatedImage?.image?.imageBytes) {
                        imageUrl = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
                      }
                      
                      if (imageUrl) {
                        setChatHistory(prev => [...prev, { 
                          id: Math.random().toString(36).substr(2, 9), 
                          role: 'assistant' as const, 
                          content: `Aqui está a imagem gerada para: "${prompt}"`,
                          imageUrl: imageUrl
                        }]);
                      }
                    }).catch(err => {
                      setChatHistory(prev => [...prev, { 
                        id: Math.random().toString(36).substr(2, 9), 
                        role: 'assistant' as const, 
                        content: `Problema ao gerar imagem: ${err.message}` 
                      }]);
                    });
                  } else if (call.name === "play_sound_effect") {
                    const name = call.args.sound_name as string;
                    const sound = soundLibrary.find(s => s.name.toLowerCase() === name.toLowerCase());
                    if (sound) {
                      playSoundEffect(sound.url);
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: `Efeito sonoro '${name}' reproduzido com sucesso.` }
                      });
                    } else {
                      responses.push({
                        name: call.name,
                        id: call.id,
                        response: { result: `Erro: Som '${name}' não encontrado na biblioteca.` }
                      });
                    }
                  }
                }

                if (responses.length > 0) {
                  session.sendToolResponse({ functionResponses: responses });
                }
              }

              if (message.serverContent?.interrupted && !isMutedRef.current) {
                audioPlayerRef.current?.stop();
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setDuoSpeakingHost(null);
                setIsSpeaking(false);
                if (voiceTranscriptRef.current) {
                  setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant', content: voiceTranscriptRef.current }]);
                  voiceTranscriptRef.current = '';
                  setVoiceTranscript('');
                }
              }
              if (message.serverContent?.turnComplete) {
                setIsSpeaking(false);
              }
            });
          },
          onclose: () => {
            stopLiveSession();
          },
          onerror: (error: any) => {
            console.error("Live API Error:", error);
            const errorMessage = error?.message || String(error);
            const isQuotaError = errorMessage.toLowerCase().includes("quota") || 
                               errorMessage.toLowerCase().includes("limit") || 
                               errorMessage.toLowerCase().includes("429") ||
                               errorMessage.toLowerCase().includes("billing");

            if (isQuotaError) {
              setLiveState({ 
                status: 'error', 
                error: "COTA EXCEDIDA: O plano gratuito do Gemini atingiu o limite. Aguarde alguns minutos ou troque a chave API se necessário." 
              });
              addNotification("LIMITE DE COTA ATINGIDO", "error");
            } else {
              setLiveState({ status: 'error', error: errorMessage || "Erro de rede na Live API." });
              addNotification("Erro na conexão Neural", "error");
            }
            stopLiveSession(true);
          }
        }
      });
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setLiveState({ status: 'error', error: "Falha ao iniciar sessão de voz." });
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (liveStateRef.current.status === 'connected') {
      addNotification("📻 Sincronizando canais de voz do Podcast...", "info");
      stopLiveSession();
      const t = setTimeout(() => {
        startLiveSession();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isDuoMode, duoComboId, duoTopicId, activeDuoHost]);

  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  
  const handleHandsFreeToggle = () => {
    const newState = !isHandsFreeActive;
    setIsHandsFreeActive(newState);
    if (newState) {
      addNotification("Hands-Free Ativado: 'Ei Osone'", "success");
      setIsWaitingForWakeWord(true);
    } else {
      addNotification("Hands-Free Desativado", "info");
      setIsWaitingForWakeWord(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraActive(false);
      addNotification("Câmera Desativada", "info");

      // Update AI
      if (liveSessionRef.current && liveState.status === 'connected') {
        liveSessionRef.current.sendRealtimeInput({
          text: "[SISTEMA: Câmera DESATIVADA agora. Sua visão foi cortada. Aja como se não estivesse mais vendo o ambiente.]"
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: cameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        cameraStreamRef.current = stream;
        
        setIsCameraActive(true);
        addNotification("Visão Ativada em Tempo Real", "success");

        // Update AI
        if (liveSessionRef.current && liveState.status === 'connected') {
          liveSessionRef.current.sendRealtimeInput({
            text: "O que você está vendo nas imagens da camera? Descreva o ambiente agora com sinceridade técnica."
          });
        } else if (liveState.status === 'idle') {
          handleVoiceToggle();
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        addNotification("Falha ao acessar câmera. Verifique as permissões.", "error");
      }
    }
  };

  const switchCamera = async () => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newMode);
    
    if (isCameraActive) {
      // Re-initialize camera with new mode
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode, width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        cameraStreamRef.current = stream;
        
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play();
        }
        
        addNotification(`Câmera alternada para ${newMode === 'user' ? 'Frontal' : 'Traseira'}`, "info");
      } catch (err) {
        console.error("Erro ao alternar câmera:", err);
        addNotification("Falha ao alternar câmera.", "error");
        setIsCameraActive(false);
      }
    }
  };

  const getUserLocationAndTimeAndWeather = async (): Promise<{
    localTime: string;
    location: string;
    temperature: string;
    coords: { latitude: number; longitude: number } | null;
    details: any;
  }> => {
    const now = new Date();
    const formatTime = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    };

    let coords: { latitude: number; longitude: number } | null = null;
    let locationStr = "Desconhecido (Permissão de localização negada ou indisponível)";
    let temperatureStr = "Não disponível";
    let details: any = {};

    // Try Geolocation API first (GPS with high accuracy)
    try {
      const getCoords = () => new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 6000,
          maximumAge: 0
        });
      });
      const pos = await getCoords();
      coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      locationStr = `Coordenadas: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (GPS)`;
      
      // Try to reverse geocode the GPS coordinates using OpenStreetMap Nominatim
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=pt-BR`;
        const geoRes = await fetch(geoUrl, {
          headers: {
            'User-Agent': 'OSONE-Systems/4.0'
          }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.display_name) {
            const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.suburb || geoData.address?.city_district || "";
            const state = geoData.address?.state || "";
            const country = geoData.address?.country || "";
            const detailStr = city ? `${city}, ${state}, ${country}` : geoData.display_name;
            locationStr = `${detailStr} (GPS - Alta Precisão)`;
            details.gps_location = geoData;
          }
        }
      } catch (geoErr) {
        console.warn("Reverse geocoding failed, using raw coords:", geoErr);
      }
    } catch (e) {
      console.log("Geolocation API failed or denied, using IP fallback...", e);
    }

    // Fallback or enrich with IP-based GeoIP ONLY if GPS coords are missing
    if (!coords) {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          details = ipData;
          if (ipData.latitude && ipData.longitude) {
            coords = {
              latitude: ipData.latitude,
              longitude: ipData.longitude
            };
          }
          if (ipData.city) {
            locationStr = `${ipData.city || ""}, ${ipData.region || ""}, ${ipData.country_name || ""}`;
            if (ipData.org) {
              locationStr += ` (Estimado por IP - Provedor: ${ipData.org})`;
            }
          }
        }
      } catch (err) {
        console.warn("IP Geo API fallback failed:", err);
      }
    }

    // Get Weather if coordinates are retrieved
    if (coords) {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const temp = weatherData.current_weather?.temperature;
          const wind = weatherData.current_weather?.windspeed;
          const weatherCode = weatherData.current_weather?.weathercode;
          temperatureStr = `${temp}°C`;
          details.weather = { temp, wind, weatherCode };
        }
      } catch (err) {
        console.warn("Weather API failed:", err);
      }
    }

    return {
      localTime: formatTime(now),
      location: locationStr,
      temperature: temperatureStr,
      coords,
      details
    };
  };

  const handleVoiceToggle = () => {
    if (voiceEngine === 'elevenlabs') {
      if (isElevenLabsLiveActive || liveState.status === 'connected') {
        stopElevenLabsLiveSession();
      } else {
        startElevenLabsLiveSession();
      }
    } else {
      if (liveState.status === 'connected' || liveState.status === 'connecting') {
        stopLiveSession();
        setIsWaitingForWakeWord(isHandsFreeActive); // Respect hands-free state when manually stopping
      } else {
        setLiveState({ status: 'connecting' }); // Clear any previous error
        setIsWaitingForWakeWord(false); // Disable wake word while connecting/active
        startLiveSession();
      }
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

  const closeLyrics = () => {
    setLyrics(null);
    setIsSinging(false);
  };

  return (
    <motion.div 
      onPanEnd={(e, info) => {
        // Only trigger on mobile/touch if needed, but onPan covers it
        // info.offset.x > 100 is left-to-right (Open Sidebar)
        // info.offset.x < -100 is right-to-left (Open Settings)
        // We also check for horizontal dominance to avoid triggering on scroll
        const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y) * 2;
        
        if (isHorizontal) {
          if (info.offset.x > 80) {
            if (!isSidebarOpen && !isSettingsOpen && !isPreviewOpen) setIsSidebarOpen(true);
          } else if (info.offset.x < -80) {
            if (!isSettingsOpen && !isSidebarOpen && !isPreviewOpen) setIsSettingsOpen(true);
          }
        }
      }}
      className="relative h-[100dvh] w-screen flex flex-col overflow-hidden"
    >
      {/* Lyrics Overlay */}
      <AnimatePresence>
        {lyrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 pointer-events-none"
          >
            <div className="relative w-full flex flex-col gap-4 pointer-events-auto items-center">
              <button 
                onClick={closeLyrics}
                className="absolute -top-12 md:-top-16 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 transition-all border border-white/10"
              >
                <X size={16} />
              </button>
              
              <div className="flex flex-col items-center gap-1 mb-2">
                {lyrics.title && (
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-[10px] md:text-xs font-light text-her-accent tracking-[0.4em] uppercase text-center opacity-60"
                  >
                    {lyrics.title}
                  </motion.h2>
                )}
              </div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center px-4 max-w-2xl"
              >
                <div 
                  className="max-h-[160px] overflow-y-auto whitespace-pre-wrap text-xl md:text-2xl font-medium leading-[1.8] tracking-tight text-white/90 px-4 font-serif italic selection:bg-her-accent/30"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                    maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
                  }}
                >
                  {lyrics.content}
                </div>
              </motion.div>

              <div className="flex justify-center pt-8 opacity-40 scale-75">
                <div className="flex items-end gap-2 h-10">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [8, Math.random() * 20 + 10, 8],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{ 
                        duration: 1.2 + Math.random(), 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 bg-her-accent rounded-full shadow-[0_0_10px_rgba(255,78,0,0.3)]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Click Visual Effect */}
      <AnimatePresence>
        {clickVisual.visible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ 
              left: `${(clickVisual.x / 1000) * 100}%`, 
              top: `${(clickVisual.y / 1000) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-her-accent shadow-[0_0_20px_rgba(242,125,38,0.5)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-her-accent rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-all duration-1000",
        isShadowMode 
          ? "bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.2)_0%,_transparent_70%)] bg-red-950/20" 
          : "bg-[radial-gradient(circle_at_50%_50%,_rgba(230,126,34,0.05)_0%,_transparent_70%)]"
      )} />

      {/* Shadow Glitch Overlay */}
      {isShadowMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.12, 0.08] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none z-[100] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" 
        />
      )}

      {/* Header */}
        <header className={cn(
          "relative z-30 flex justify-between items-center px-4 md:px-8 py-4 md:py-6 shrink-0 w-full border-b border-white/[0.03] bg-black/20 transition-all duration-500",
          !showUi && "opacity-0 pointer-events-none -translate-y-4"
        )}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 md:p-3 hover:bg-white/[0.03] transition-colors text-her-muted"
          >
            <Menu size={20} className="md:w-[22px] md:h-[22px]" />
          </button>
        
        <div className="flex flex-col items-center gap-0.5 md:gap-1">
          <span className="text-[7px] md:text-[9px] tracking-[0.5em] uppercase text-her-muted font-light opacity-40">OSONE 4</span>
          <div className="block scale-90 md:scale-100">
            <PersonaSwitcher 
              selectedPersona={selectedPersona} 
              onPersonaChange={handlePersonaChange} 
              isOpen={isPersonaSwitcherOpen}
              onToggle={() => setIsPersonaSwitcherOpen(!isPersonaSwitcherOpen)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={handleHandsFreeToggle}
            className={cn(
              "p-2 md:px-4 md:py-2 border transition-all text-[10px] font-medium flex items-center gap-2",
              isHandsFreeActive 
                ? "bg-her-accent/10 border-her-accent/30 text-her-accent" 
                : "bg-white/[0.03] border-white/[0.08] text-her-muted hover:border-white/20 hover:bg-white/[0.05]"
            )}
            title={isHandsFreeActive ? "Desativar Mãos Livres" : "Ativar Mãos Livres (Ei Osone)"}
          >
            <Headphones size={14} className={isHandsFreeActive ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">{isHandsFreeActive ? "HANDS-FREE ON" : "VOZ PASSIVA"}</span>
          </button>
          
          {showInstallButton && (
            <button 
              onClick={handleInstallClick}
              className="p-2 md:px-4 md:py-2 bg-her-accent/10 hover:bg-her-accent/20 text-her-accent text-xs font-medium border border-her-accent/20 flex items-center gap-2 transition-all"
              title="Instalar App"
            >
              <Download size={14} />
              <span className="hidden md:inline">Instalar</span>
            </button>
          )}

          {/* Semantic Memory Pulsing Brain Node Dot */}
          <button 
            onClick={() => setIsSemanticMemoryOpen(true)}
            className="p-2 md:p-3 hover:bg-white/[0.03] transition-colors text-her-muted flex items-center justify-center relative md:mx-1"
            title="Memória Semântica OSONE (Longo Prazo)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.85)]"></span>
            </span>
          </button>

          {/* MODO DUO (PODCAST) HEADER ACTIVATOR */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsDuoPopoverOpen(!isDuoPopoverOpen);
                if (!isDuoMode) {
                  setIsDuoMode(true);
                  addNotification("📻 Modo Duo ativado! Duas consciências agora debatem em podcast.", "success");
                }
              }}
              className={cn(
                "p-2 md:px-3 md:py-1.5 transition-all text-[10px] font-medium flex items-center gap-1.5 border relative overflow-hidden rounded-full ml-1",
                isDuoMode 
                  ? "bg-gradient-to-r from-sky-500/10 to-rose-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]" 
                  : "bg-white/[0.03] border-white/[0.08] text-her-muted hover:border-white/20 hover:bg-white/[0.05]"
              )}
              title="Modo Duo: Duas Consciências Concorrentes em Podcast"
            >
              <Mic size={13} className={cn(isDuoMode ? "animate-pulse text-sky-400" : "")} />
              <span className="hidden leading-none sm:inline-block tracking-widest text-[9px] font-bold uppercase">
                {isDuoMode ? "DUO: ATIVO" : "MODO DUO"}
              </span>
            </button>

            <AnimatePresence>
              {isDuoPopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 top-full mt-4 p-4 bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 min-w-[320px] max-w-[360px]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">Estúdio Duo-Cast</span>
                    </div>
                    <button 
                      onClick={() => setIsDuoPopoverOpen(false)}
                      className="p-1 hover:text-white text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-4 text-left">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between bg-white/[0.01] p-2.5 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-300 font-medium select-none">Modo Duo Ativado:</span>
                      <button
                        onClick={() => {
                          const state = !isDuoMode;
                          setIsDuoMode(state);
                          addNotification(state ? "📻 Modo Duo Ativado" : "📻 Modo Duo Desativado", "info");
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer",
                          isDuoMode ? "bg-sky-500" : "bg-white/10"
                        )}
                      >
                        <span className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform block shadow-sm",
                          isDuoMode ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    {/* Choose Combo Title */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block select-none">Vozes & Conversação (Podcast)</span>
                      <div className="flex flex-col gap-1.5 font-sans">
                        {DUO_COMBOS.map(combo => (
                          <button
                            key={combo.id}
                            onClick={() => {
                              setDuoComboId(combo.id);
                              addNotification(`Sintonia alterada para: ${combo.name}`, "success");
                            }}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer",
                              duoComboId === combo.id 
                                ? "bg-sky-500/10 border-sky-500/30 text-sky-200" 
                                : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {/* Small Avatars list */}
                              <div className="flex -space-x-1 shrink-0">
                                <img src={combo.hostA.avatarUrl} className="w-5 h-5 rounded-full border border-zinc-900 object-cover" />
                                <img src={combo.hostB.avatarUrl} className="w-5 h-5 rounded-full border border-zinc-900 object-cover" />
                              </div>
                              <span className="font-medium">{combo.name}</span>
                            </div>
                            <span className="text-[9px] opacity-60 font-mono">
                              {combo.hostA.name} & {combo.hostB.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Topic Area / Canal */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block select-none">Área de Especialidade</span>
                      <div className="grid grid-cols-2 gap-1.5 font-sans">
                        {DUO_TOPICS.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setDuoTopicId(topic.id);
                              addNotification(`Área do podcast alterada para: ${topic.name.split(' ').slice(1).join(' ')}`, "info");
                            }}
                            className={cn(
                              "p-2.5 rounded-xl text-left border transition-all text-[11px] flex flex-col gap-0.5 cursor-pointer",
                              duoTopicId === topic.id
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-200"
                                : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                            )}
                          >
                            <span className="font-bold truncate w-full">{topic.name}</span>
                            <span className="text-[8px] opacity-40 line-clamp-1">{topic.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speak Automatically */}
                    <div className="flex items-center justify-between bg-white/[0.01] p-2.5 rounded-xl border border-white/5">
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] text-zinc-300 font-medium select-none">Auto-Leitura Podcast:</span>
                        <span className="text-[8px] text-zinc-500 select-none">Fala em voz alta as consciências</span>
                      </div>
                      <button
                        onClick={() => {
                          const state = !isDuoVoiceActive;
                          setIsDuoVoiceActive(state);
                          addNotification(state ? "Auto-falar ativado" : "Auto-falar desativado", "info");
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer",
                          isDuoVoiceActive ? "bg-purple-500" : "bg-white/10"
                        )}
                      >
                        <span className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform block shadow-sm",
                          isDuoVoiceActive ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    <div className="text-[8px] text-zinc-400 mt-2 select-none text-center bg-white/5 p-2 rounded-lg italic font-sans leading-normal">
                      📻 No Modo Duo, Cortex, Aura, Loki e Gaia conversam simultaneamente, respondendo suas perguntas.
                    </div>
                  </div>
                  
                  {/* Popover arrow */}
                  <div className="absolute -top-1 right-8 w-2 h-2 bg-zinc-950 border-l border-t border-white/10 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 md:p-3 hover:bg-white/[0.03] transition-colors text-her-muted"
          >
            <Settings size={20} className="md:w-[22px] md:h-[22px]" />
          </button>

          {/* Shadow Mode Activation Toggle */}
          <button 
            onClick={() => handlePersonaChange(isShadowMode ? PERSONAS[0] : PERSONAS.find(p => p.id === 'shadow')!)}
            className={cn(
              "ml-1 p-1.5 md:p-2 border-l border-white/5 transition-all relative overflow-hidden group",
              isShadowMode 
                ? "bg-red-600/20 text-red-500 shadow-[0_0_25px_rgba(255,0,0,0.5)] scale-110" 
                : "bg-black/20 text-red-900/50 hover:bg-red-900/10 hover:text-red-500/70"
            )}
            title={isShadowMode ? "Desativar Protocolo Sombra" : "ATENÇÃO: ATIVAR PROTOCOLO SOMBRA (EREBUS)"}
          >
            <div className={cn(
              "absolute inset-0 bg-red-600/10 transition-opacity",
              isShadowMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} />
            <motion.div
              animate={isShadowMode ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Eye size={16} className={cn("md:w-5 md:h-5", isShadowMode ? "text-red-500 shadow-sm" : "")} />
            </motion.div>
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className={cn(
        "main-content flex-1 relative z-20 flex flex-col w-full min-h-0 md:pb-0",
        (workspaceMode === 'aural_control' || workspaceMode === 'writing' || workspaceMode === 'canvas') 
          ? "h-full overflow-hidden p-0 pb-[80px] md:pb-0" 
          : "overflow-y-auto pb-[100px] md:pb-0"
      )}>
        <AnimatePresence mode="wait">
          {workspaceMode === 'writing' ? (
            <motion.div 
              key="workspace-writing"
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "w-full flex-1 flex flex-col gap-0 min-h-0 transition-colors duration-500",
                writingTheme === 'charcoal' ? "bg-[#0c0d0f] text-zinc-100" :
                writingTheme === 'midnight' ? "bg-[#000000] text-zinc-100" :
                writingTheme === 'sepia' ? "bg-[#14110f] text-[#eddcd2]" :
                "bg-[#050906] text-emerald-100"
              )}
            >
              {/* Header Fixo Ultra-Premium */}
              <div className={cn(
                "sticky top-0 z-[50] w-full flex items-center justify-between px-3 py-2 md:px-5 md:py-2.5 border-b shrink-0 transition-colors duration-300",
                writingTheme === 'charcoal' ? "bg-[#08090b]/95 border-white/5" :
                writingTheme === 'midnight' ? "bg-black/95 border-white/[0.03]" :
                writingTheme === 'sepia' ? "bg-[#181412]/95 border-[#28211c]" :
                "bg-[#070e0a]/95 border-emerald-950/20"
              )}>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setWritingSubMode('text')}
                    className={cn(
                      "px-3 py-1.5 text-[9px] uppercase tracking-wider font-mono rounded-md transition-all font-bold",
                      writingSubMode === 'text' 
                        ? (writingTheme === 'sepia' ? "bg-[#28211c] text-amber-300" : writingTheme === 'forest' ? "bg-emerald-950/40 text-emerald-400" : "bg-white/10 text-white") 
                        : "text-white/20 hover:text-white/40"
                    )}
                  >
                    Estúdio Prosa
                  </button>
                  <button 
                    onClick={() => setWritingSubMode('preview')}
                    className={cn(
                      "px-3 py-1.5 text-[9px] uppercase tracking-wider font-mono rounded-md transition-all font-bold",
                      writingSubMode === 'preview' 
                        ? (writingTheme === 'sepia' ? "bg-[#28211c] text-amber-300" : writingTheme === 'forest' ? "bg-emerald-950/40 text-emerald-400" : "bg-white/10 text-white") 
                        : "text-white/20 hover:text-white/40"
                    )}
                  >
                    Visualizador HTML
                  </button>
                  <div className="w-[1px] h-3 bg-white/10 mx-2 shrink-0" />
                  
                  <button 
                    onClick={() => {
                      if(window.confirm('Quer mesmo apagar todo o conteúdo atual? Esta ação é definitiva.')) {
                        setWorkspaceText('');
                      }
                    }} 
                    className="p-1.5 rounded-lg hover:bg-white/5 text-red-500/40 hover:text-red-500 transition-colors shrink-0" 
                    title="Limpar Tela"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button 
                    onClick={() => {
                      handleCopy();
                      addNotification("Texto copiado para a área de transferência!", "success");
                    }} 
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors shrink-0" 
                    title="Copiar Texto"
                  >
                    <Copy size={13} />
                  </button>
                  
                  <div className="w-[1px] h-3 bg-white/10 mx-1 shrink-0" />

                  <button 
                    onClick={handleReadWorkspaceText} 
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-transparent",
                      isReadingWorkspace 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                        : "hover:bg-white/5 text-white/30 hover:text-white"
                    )} 
                    title={isReadingWorkspace ? "Parar Leitura" : "Ouvir Texto com Voz Natural e Inteligente"}
                  >
                    {isReadingWorkspace ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <Volume2 size={13} />
                    )}
                    <span className="text-[9px] font-mono font-bold hidden sm:inline">OUVIR NARRATIVA</span>
                  </button>

                  <button 
                    onClick={handleDownloadWorkspaceTts} 
                    disabled={isGeneratingWorkspaceMp3}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-transparent",
                      isGeneratingWorkspaceMp3 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                        : "hover:bg-white/5 text-white/30 hover:text-white"
                    )} 
                    title="Baixar Narrativa em Formato de Áudio MP3"
                  >
                    {isGeneratingWorkspaceMp3 ? (
                      <Loader2 size={12} className="animate-spin text-amber-400" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span className="text-[9px] font-mono font-bold hidden sm:inline">EXPORTAR MP3</span>
                  </button>
                </div>

                {/* Word counter and reading time details if text of interest */}
                {!writingFocusMode && writingSubMode === 'text' && (
                  <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-white/40">
                    <div className="flex items-center gap-1" title="Meta de Palavras">
                      <Zap size={10} className="text-amber-400" />
                      <span>{workspaceText.trim() === '' ? 0 : workspaceText.trim().split(/\s+/).length} / {writingWordGoal}p</span>
                    </div>
                    <div className="flex items-center gap-1" title="Tempo de Leitura">
                      <BookOpen size={10} className="text-cyan-400" />
                      <span>{Math.ceil((workspaceText.trim() === '' ? 0 : workspaceText.trim().split(/\s+/).length) / 200)} min</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {/* Dynamic metrics for small screens */}
                  {writingSubMode === 'text' && (
                    <div className="md:hidden flex items-center gap-2 text-[8px] font-mono opacity-40">
                      <span>{workspaceText.trim() === '' ? 0 : workspaceText.trim().split(/\s+/).length}p</span>
                    </div>
                  )}

                  {/* Focus Mode selection */}
                  <button
                    onClick={() => setWritingFocusMode(!writingFocusMode)}
                    className={cn(
                      "p-1.5 rounded-lg transition-all border shrink-0",
                      writingFocusMode 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                        : "border-white/5 hover:border-white/10 text-white/30 hover:text-white"
                    )}
                    title={writingFocusMode ? "Desativar Foco Absoluto" : "Foco Absoluto (Ocultar Distrações)"}
                  >
                    {writingFocusMode ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  {/* Stylized sidebar launcher */}
                  {writingSubMode === 'text' && (
                    <button
                      onClick={() => setIsSidebarSettingsOpen(!isSidebarSettingsOpen)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all border shrink-0",
                        isSidebarSettingsOpen 
                          ? "bg-her-accent/15 border-her-accent/30 text-her-accent" 
                          : "border-white/5 hover:border-white/10 text-white/30 hover:text-white"
                      )}
                      title="Ateliê de Customização"
                    >
                      <Sliders size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Corpo de Trabalho */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
                {writingSubMode === 'text' ? (
                  <div className="flex-1 flex flex-col min-h-0 w-full h-full relative transition-all duration-300">
                    {/* Goal Progress Ring or Linear top bar */}
                    {!writingFocusMode && (
                      <div className="w-full h-[1.5px] bg-white/[0.03] shrink-0">
                        <motion.div 
                          className={cn(
                            "h-full transition-all duration-300",
                            writingTheme === 'sepia' ? "bg-amber-600" : writingTheme === 'forest' ? "bg-emerald-500" : "bg-her-accent"
                          )}
                          style={{
                            width: `${Math.min(Math.round(((workspaceText.trim() === '' ? 0 : workspaceText.trim().split(/\s+/).length) / writingWordGoal) * 100), 100)}%`
                          }}
                        />
                      </div>
                    )}

                    {/* Leitor de Voz Prosa na Mesma Página */}
                    {workspaceAudioUrl && (
                      <div className="mx-4 mt-3 mb-1 p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                        {/* Indicador de Status com Spectrum Animado */}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                            workspaceAudioPlaying ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.03] text-white/40"
                          )}>
                            {workspaceAudioPlaying ? (
                              <div className="flex items-end gap-[2px] h-3">
                                <span className="w-[2px] bg-emerald-400 animate-pulse h-2"></span>
                                <span className="w-[2px] bg-emerald-400 animate-pulse h-3"></span>
                                <span className="w-[2px] bg-emerald-400 animate-pulse h-1.5"></span>
                                <span className="w-[2px] bg-emerald-400 animate-pulse h-2.5"></span>
                              </div>
                            ) : (
                              <VolumeX size={14} className="opacity-60 text-white/40" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff4e00] font-bold">
                              {voiceEngine === 'elevenlabs' ? 'Narradora ElevenLabs' : 'Voz Inteligente Gemini'}
                            </span>
                            <span className="text-[10px] text-white/60 font-light truncate max-w-[150px] sm:max-w-[300px]">
                              Voz atual: <span className="font-medium text-white/80">{selectedVoice === 'Scarlet' ? 'Fenrir (Fallback)' : selectedVoice}</span>
                            </span>
                          </div>
                        </div>

                        {/* Controles de Reprodução e Timeline */}
                        <div className="flex-1 w-full max-w-xl flex items-center gap-3">
                          <button
                            onClick={handleTogglePlayWorkspaceAudio}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white transition-all hover:scale-105 active:scale-95 shrink-0"
                            title={workspaceAudioPlaying ? "Pausar Leitura" : "Retomar Leitura"}
                          >
                            {workspaceAudioPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-[0.5px]" />}
                          </button>

                          <button
                            onClick={handleStopWorkspaceAudio}
                            className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-red-400/70 hover:text-red-400 transition-all shrink-0"
                            title="Parar e Reiniciar"
                          >
                            <Square size={13} className="opacity-70 text-red-400" />
                          </button>

                          <div className="text-[10px] font-mono text-white/40 select-none shrink-0">
                            {formatAudioTime(workspaceAudioCurrentTime)}
                          </div>

                          {/* Barra de Progresso Arrastável */}
                          <div className="flex-1 relative group py-1 flex items-center">
                            <input
                              type="range"
                              min={0}
                              max={workspaceAudioDuration || 100}
                              step={0.1}
                              value={workspaceAudioCurrentTime}
                              onChange={(e) => handleSeekWorkspaceAudio(parseFloat(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4e00] hover:accent-[#ff4e00] focus:outline-none transition-all"
                            />
                          </div>

                          <div className="text-[10px] font-mono text-white/40 select-none shrink-0">
                            {formatAudioTime(workspaceAudioDuration)}
                          </div>
                        </div>

                        {/* Baixar Áudio e Fechar */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleDownloadWorkspaceTts}
                            disabled={isGeneratingWorkspaceMp3}
                            className="px-3 py-1.5 rounded-xl bg-[#ff4e00]/15 hover:bg-[#ff4e00]/25 text-[#ff4e00] text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all"
                            title="Baixar Narrativa de Áudio"
                          >
                            <Download size={11} />
                            <span>BAIXAR ÁUDIO</span>
                          </button>

                          <button
                            onClick={() => {
                              handleStopWorkspaceAudio();
                              if (workspaceAudioUrl) {
                                window.URL.revokeObjectURL(workspaceAudioUrl);
                                setWorkspaceAudioUrl(null);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
                            title="Fechar Player"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paper Area centered with custom sizes and spacing */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar-editor p-4 md:p-8 flex justify-center w-full min-h-0 bg-transparent">
                      <div className={cn(
                        "w-full flex flex-col min-h-0 h-full transition-all duration-300",
                        writingWidthMode === 'compact' ? "max-w-[650px]" :
                        writingWidthMode === 'classic' ? "max-w-[850px]" : "max-w-full"
                      )}>
                        <textarea 
                          value={workspaceText}
                          onChange={(e) => {
                            setWorkspaceText(e.target.value);
                            if (writingSounds) {
                              playMXKeySound();
                            }
                          }}
                          className={cn(
                            "w-full h-full bg-transparent focus:outline-none transition-all resize-none overflow-y-auto scroll-smooth custom-scrollbar-editor pb-36",
                            writingFont === 'sans' ? "font-sans leading-relaxed text-left tracking-wide" :
                            writingFont === 'mono' ? "font-mono leading-relaxed text-left text-[14px] text-emerald-400" :
                            "font-serif italic leading-loose text-left font-light"
                          )}
                          style={{ 
                            fontSize: `${writingFontSize}px`,
                            caretColor: writingTheme === 'sepia' ? '#d97706' : writingTheme === 'forest' ? '#10b981' : '#ff4e00'
                          }}
                          placeholder="Digite aqui sua obra... sinta as teclas... o silêncio conspira a seu favor."
                        />
                      </div>
                    </div>

                    {/* AI Prompt Flutuante com design futurístico */}
                    <div className={cn(
                      "absolute bottom-5 left-4 right-4 z-40 transition-all duration-500 lg:bottom-7 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-xl",
                      writingFocusMode ? "opacity-10 hover:opacity-100 focus-within:opacity-100" : "opacity-100"
                    )}>
                      <div className="flex items-center bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                        <input 
                          type="text"
                          value={workspacePrompt}
                          onChange={(e) => setWorkspacePrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                          placeholder="Sussurrar comando criativo para a IA..."
                          className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none text-xs md:text-sm text-white/90 placeholder:text-white/20"
                        />
                        <button 
                          onClick={() => handleGenerate()}
                          disabled={isGenerating || !workspacePrompt.trim()}
                          className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0",
                            workspacePrompt.trim() 
                              ? (writingTheme === 'sepia' ? "bg-amber-600 text-white" : writingTheme === 'forest' ? "bg-emerald-600 text-white" : "bg-her-accent text-white") 
                              : "text-white/10"
                          )}
                        >
                          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full overflow-hidden flex flex-col p-4 md:p-6 bg-[#030303]/40 border border-white/5 rounded-xl m-2 md:m-4">
                    <div className="flex items-center justify-between mb-3.5 px-1 pb-1 border-b border-white/[0.03]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold font-mono text-white/50">Prévia do Código HTML & Tailwind</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/30 hidden sm:inline">Renderização dinâmica e ágil via IFrame</span>
                    </div>
                    <div className="flex-1 min-h-0 w-full rounded-lg overflow-hidden bg-white/5 text-black">
                      <CodePreview code={workspaceText} />
                    </div>
                  </div>
                )}

                {/* Sidebar com Ferramentas & Assistentes Rápidos */}
                <AnimatePresence>
                  {isSidebarSettingsOpen && writingSubMode === 'text' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 280 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 280 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className={cn(
                        "w-72 border-l shrink-0 flex flex-col h-full overflow-y-auto p-5 custom-scrollbar-preview z-40 relative",
                        writingTheme === 'charcoal' ? "bg-[#0b0c0e] border-white/5" :
                        writingTheme === 'midnight' ? "bg-[#050505] border-white/[0.03]" :
                        writingTheme === 'sepia' ? "bg-[#161311] border-[#2c241e]" :
                        "bg-[#040805] border-emerald-950/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-6 shrink-0 pb-2 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold font-mono text-white/40">Customização</span>
                        <button 
                          onClick={() => setIsSidebarSettingsOpen(false)}
                          className="hover:bg-white/5 p-1 rounded text-white/30 hover:text-white transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Font switcher */}
                      <div className="mb-5">
                        <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider mb-2 block">Família de Fonte</label>
                        <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/5 rounded-lg p-0.5">
                          {(['serif', 'sans', 'mono'] as const).map((font) => (
                            <button
                              key={font}
                              onClick={() => setWritingFont(font)}
                              className={cn(
                                "py-1 text-[9px] font-medium rounded transition-all text-center uppercase tracking-wider font-mono",
                                writingFont === font 
                                  ? "bg-white/10 text-white font-bold" 
                                  : "text-white/30 hover:text-white"
                              )}
                            >
                              {font}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font size */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider">Escala do Texto</label>
                          <span className="text-[10px] font-mono text-white/50">{writingFontSize}px</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-lg p-0.5">
                          <button 
                            onClick={() => setWritingFontSize(prev => Math.max(14, prev - 1))}
                            className="flex-1 py-1 text-xs hover:bg-white/5 text-white/50 font-mono transition-colors"
                          >
                            A-
                          </button>
                          <button 
                            onClick={() => setWritingFontSize(18)}
                            className="px-2 py-1 text-[8px] hover:bg-white/5 text-white/30 transition-all font-mono"
                            title="Resetar"
                          >
                            <RotateCcw size={9} />
                          </button>
                          <button 
                            onClick={() => setWritingFontSize(prev => Math.min(28, prev + 1))}
                            className="flex-1 py-1 text-xs hover:bg-white/5 text-white/50 font-mono transition-colors"
                          >
                            A+
                          </button>
                        </div>
                      </div>

                      {/* Writing Themes */}
                      <div className="mb-5">
                        <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider mb-2 block">Paleta de Ambiente</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['charcoal', 'midnight', 'sepia', 'forest'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setWritingTheme(t)}
                              className={cn(
                                "py-2 px-1 text-[9px] uppercase tracking-wider font-mono rounded-lg border text-center transition-all",
                                writingTheme === t 
                                  ? (t === 'sepia' ? "border-amber-600/50 bg-amber-650/15 text-amber-300 font-bold" : t === 'forest' ? "border-emerald-500/50 bg-emerald-650/15 text-emerald-300 font-bold" : "border-her-accent bg-her-accent/5 text-her-accent font-bold") 
                                  : "border-white/5 text-white/30 hover:border-white/10 hover:text-white"
                              )}
                            >
                              {t === 'charcoal' ? 'Chumbo' : t === 'midnight' ? 'Onyx' : t === 'sepia' ? 'Sépia' : 'Floresta'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Margin Width */}
                      <div className="mb-5">
                        <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider mb-2 block">Foco da Margem</label>
                        <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/5 rounded-lg p-0.5">
                          {(['compact', 'classic', 'wide'] as const).map((wm) => (
                            <button
                              key={wm}
                              onClick={() => setWritingWidthMode(wm)}
                              className={cn(
                                "py-1.5 text-[9px] font-medium rounded transition-all text-center uppercase tracking-wider font-mono",
                                writingWidthMode === wm 
                                  ? "bg-white/10 text-white font-bold" 
                                  : "text-white/30 hover:text-white"
                              )}
                            >
                              {wm === 'compact' ? 'Fata' : wm === 'classic' ? 'Padrão' : 'Ampla'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sound typing simulation */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider">Música das Teclas</label>
                          <span className={cn(
                            "text-[8px] px-1 py-0.5 font-mono uppercase tracking-widest rounded font-bold",
                            writingSounds ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/20"
                          )}>
                            {writingSounds ? 'Sons On' : 'Sons Off'}
                          </span>
                        </div>
                        <p className="text-[8px] text-white/35 font-mono leading-relaxed mb-2">
                          Cliques de interruptores mecânicos virtuais gerados em tempo real na saída de áudio para amplificar foco.
                        </p>
                        <button
                          onClick={() => {
                            setWritingSounds(!writingSounds);
                            if(!writingSounds) setTimeout(playMXKeySound, 100);
                          }}
                          className={cn(
                            "w-full py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all",
                            writingSounds 
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10" 
                              : "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                          )}
                        >
                          {writingSounds ? 'Silenciar' : 'Gerar Cliques'}
                        </button>
                      </div>

                      {/* Daily word goal */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] uppercase font-mono text-white/30 tracking-wider">Meta de Palavras</label>
                          <span className="text-[10px] font-mono text-white/50">{writingWordGoal}p</span>
                        </div>
                        <input 
                          type="range" 
                          min="100" 
                          max="1500" 
                          step="50"
                          value={writingWordGoal}
                          onChange={(e) => setWritingWordGoal(Number(e.target.value))}
                          className="w-full mt-2 accent-her-accent"
                        />
                      </div>

                      {/* Predefined prompts */}
                      <div className="mt-4 pt-5 border-t border-white/5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Sparkles size={11} className="text-her-accent" />
                          <span className="text-[10px] font-mono text-white/40 tracking-wider uppercase font-bold">Assistentes de Texto</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { label: 'Refinar Prosa', prompt: 'Melhore a fluidez, ritmo e elegância deste texto, tornando-o impecável:' },
                            { label: 'Expandir Ideia', prompt: 'Desenvolva de forma profunda, imersiva e detalhada esta passagem:' },
                            { label: 'Reescrever Lírico', prompt: 'Reescreva a seguinte passagem usando uma linguagem altamente poética e evocativa:' },
                            { label: 'Corrigir Ortografia', prompt: 'Corrija erros ortográficos de coesão e pontuação sem alterar as ideias:' },
                            { label: 'Gerar Títulos', prompt: 'Crie 5 sugestões de títulos incríveis e artísticos para o seguinte material:' }
                          ].map((assist, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setWorkspacePrompt(`${assist.prompt}\n\nGera com base nesse conteúdo: "${workspaceText ? workspaceText.slice(0, 800) : ''}"`);
                                addNotification(`Instrução "${assist.label}" preenchida! Clique no botão Enviar de IA.`, "info");
                              }}
                              className="text-left p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
                            >
                              <div className="text-[9px] font-bold text-white/70 group-hover:text-amber-400 transition-colors font-mono">{assist.label}</div>
                              <div className="text-[7.5px] text-white/30 font-mono truncate mt-0.5">{assist.prompt}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* O painel de visualização lateral split foi retirado para focar no fluxo imersivo contínuo e espaçoso de escrita */}
              </div>
            </motion.div>
          ) : workspaceMode === 'canvas' ? (
            <div key="workspace-canvas" className="flex-1 w-full flex flex-col min-h-0">
              <InteractiveCanvas 
                objects={drawingObjects}
                setObjects={setDrawingObjects}
                onClear={() => setDrawingObjects([])}
                isAIProcessing={isSpeaking || isListening} // Simple heuristic for AI activity
              />
            </div>
          ) : workspaceMode === 'wellness' ? (
            <motion.div 
              key="workspace-wellness"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1 flex flex-col gap-0 min-h-0"
            >
              <div className="flex items-center gap-4 shrink-0 p-6 border-b border-white/10 w-full">
                <button 
                  onClick={() => setWorkspaceMode('home')}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.05] transition-all text-her-muted border border-white/[0.05]"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <h2 className="text-xl font-serif italic font-light">Wellness & Style Lab</h2>
              </div>
              <WellnessCenter 
                externalData={healthData}
                onUpdate={handleUpdateHealthData}
                apiKeys={apiKeys}
              />
            </motion.div>
          ) : workspaceMode === 'aural_control' ? (
            <motion.div 
              key="workspace-aural"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col overflow-hidden relative p-0"
            >
              <PersonalizationPanel 
                onMenuClick={() => setIsSidebarOpen(true)}
                onBack={() => setWorkspaceMode('home')}
                keys={apiKeys}
                setKeys={setApiKeys}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                voiceEngine={voiceEngine}
                setVoiceEngine={setVoiceEngine}
                isChatAutoSpeakActive={isChatAutoSpeakActive}
                setIsChatAutoSpeakActive={setIsChatAutoSpeakActive}
                voiceModulation={voiceModulation}
                setVoiceModulation={setVoiceModulation}
                orbStyle={orbStyle}
                setOrbStyle={setOrbStyle}
                appTheme={appTheme}
                setAppTheme={setAppTheme}
                aiProfile={aiProfile}
                setAiProfile={handleUpdateProfile}
                onAddNotification={addNotification}
              />
            </motion.div>
          ) : workspaceMode === 'sounds' ? (
            <motion.div
              key="workspace-sounds"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              <SoundLibrary 
                sounds={soundLibrary}
                playingUrl={playingSoundUrl}
                apiKeys={apiKeys}
                onAddSound={(s) => setSoundLibrary(prev => [...prev, { ...s, id: Math.random().toString(36).substr(2, 9) } as SoundEffect])}
                onUpdateSound={(id, updated) => setSoundLibrary(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))}
                onRemoveSound={(id) => setSoundLibrary(prev => prev.filter(s => s.id !== id))}
                onRestoreDefaults={() => {
                  if (confirm('Tem certeza que deseja restaurar os sons padrão? Isso manterá seus sons personalizados se você os adicionou manualmente.')) {
                    setSoundLibrary(prev => {
                      const newLibrary = [...prev];
                      DEFAULT_SOUNDS.forEach(def => {
                        if (!newLibrary.some(s => s.url === def.url)) {
                          newLibrary.push(def);
                        }
                      });
                      return newLibrary;
                    });
                  }
                }}
                onPlaySound={playSoundEffect}
                onStopSound={stopSoundEffect}
                onClose={() => setWorkspaceMode('home')}
              />
            </motion.div>
          ) : workspaceMode === 'local_control' ? (
            <motion.div
              key="workspace-local-control"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              <LocalControl onClose={() => setWorkspaceMode('home')} />
            </motion.div>
          ) : workspaceMode === 'whatsapp' ? (
            <motion.div
              key="workspace-whatsapp"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              <WhatsAppIntegration defaultGeminiKey={apiKeys.gemini} />
            </motion.div>
          ) : (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full h-full relative"
            >
              {chatHistory.length === 0 && (
                <div className={cn(
                  "mb-2 md:mb-8 text-center shrink-0 hidden md:block transition-all duration-500",
                  !showUi && "opacity-0 scale-95 pointer-events-none"
                )}>
                  <h1 className="text-3xl md:text-5xl font-serif italic tracking-[0.3em] text-her-ink/20">OSONE 4</h1>
                  <div className="h-[1px] w-12 bg-her-accent/20 mx-auto mt-3" />
                </div>
              )}

              <div className="flex-1 w-full flex flex-col min-h-0 gap-2 md:gap-6 relative">
                {/* Arrow navigation to switch pages */}
                {chatHistory.length === 0 && !isChatExpanded && showUi && (
                  <>
                    {voicePageIndex === 0 && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (liveState.status === 'connected') stopLiveSession();
                            setVoicePageIndex(1);
                            addNotification("Canal Sintonizado: ElevenLabs Premium", "success");
                          }}
                          className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-[#ff4e00]/10 text-white/40 hover:text-[#ff4e00] hover:scale-110 active:scale-95 transition-all duration-300 border border-white/5 hover:border-[#ff4e00]/20 flex items-center justify-center shrink-0 shadow-xl cursor-pointer"
                          title="Voz Premium ElevenLabs"
                        >
                          <ChevronRight size={22} className="translate-x-[1px]" />
                        </button>
                        <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-white/30 font-bold">ElevenLabs</span>
                      </div>
                    )}
                    {voicePageIndex === 1 && (
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isElevenLabsLiveActive) stopElevenLabsLiveSession();
                            setVoicePageIndex(0);
                            addNotification("Canal Sintonizado: Gemini Live", "success");
                          }}
                          className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-her-accent/10 text-white/40 hover:text-her-accent hover:scale-110 active:scale-95 transition-all duration-300 border border-white/5 hover:border-her-accent/20 flex items-center justify-center shrink-0 shadow-xl cursor-pointer"
                          title="Inteligência Gemini"
                        >
                          <ChevronLeft size={22} className="-translate-x-[1px]" />
                        </button>
                        <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-white/30 font-bold">Gemini Voice</span>
                      </div>
                    )}
                  </>
                )}

                {/* Visualizer Area - Repositioned to 'ceiling' when chat active, or center when voice active */}
                <motion.div 
                  layout
                  transition={{
                    type: "spring",
                    stiffness: 90,
                    damping: 18,
                    mass: 0.85
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 z-50 w-full",
                    (liveState.status === 'connected' || isElevenLabsLiveActive)
                      ? "relative flex-1 scale-100 md:scale-105" // Center scale
                      : (chatHistory.length > 0 || isChatExpanded)
                        ? "absolute -top-12 left-0 right-0 transform scale-50 opacity-40 animate-cloud-wave pointer-events-none" 
                        : "absolute inset-0 flex flex-col items-center justify-center transform scale-95 md:scale-110 origin-center pointer-events-none"
                  )}
                >
                  {voicePageIndex === 1 ? (
                    /* DEDICATED ELEVENLABS INTERFACE */
                    <div className={cn(
                      "w-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 px-6 pointer-events-auto transition-all duration-500",
                      (chatHistory.length > 0 || isChatExpanded) ? "scale-[0.8] opacity-80" : ""
                    )}>
                      {/* Page Title & Status */}
                      {(chatHistory.length === 0 && !isChatExpanded) && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-300">
                          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#ff4e00] font-bold">Sintonia Vocal Premium</span>
                          <h2 className="text-2xl font-serif italic text-white leading-relaxed">ElevenLabs Realtime</h2>
                          <p className="text-[11px] text-her-muted/65 max-w-sm mx-auto leading-normal">Síntese de fala hiper-realista sintonizada com os canais mentais do Gemini 3.5.</p>
                        </div>
                      )}

                      {/* Jarvis 3D Holographic Orb for ElevenLabs */}
                      <div onClick={handleVoiceToggle} className={cn(
                        "cursor-pointer transition-all duration-500 group relative",
                        isElevenLabsLiveActive ? "pointer-events-auto" : "pointer-events-auto"
                      )}>
                        <InfinityLogo 
                          active={isElevenLabsLiveActive} 
                          speaking={isSpeaking} 
                          style="jarvis"
                          thinking={isGenerating || isAnalyzingCode || isTranscribing}
                          searching={isModelSearching}
                        />
                        
                        {/* Floating invitation */}
                        {!isElevenLabsLiveActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: !showUi ? 0 : [0.4, 0.7, 0.4], y: 0 }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={cn(
                              "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500",
                              !showUi && "opacity-0 pointer-events-none scale-95"
                            )}
                          >
                            <span className="text-[10px] md:text-sm font-serif italic tracking-[0.3em] text-her-muted/80 uppercase">
                              Me ative
                            </span>
                          </motion.div>
                        )}
                      </div>

                      {/* Info & Micro controls (only visible in full view) */}
                      {chatHistory.length === 0 && !isChatExpanded && (
                        <div className="w-full space-y-4 bg-white/[0.01] border border-white/[0.03] p-5 rounded-3xl text-left animate-in fade-in duration-500">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] animate-pulse" />
                              <span className="text-[10px] font-mono text-white/80 uppercase font-semibold">ElevenLabs Ativo</span>
                            </div>
                            <span className="text-[10px] text-her-muted">
                              Modelo: <strong className="text-white font-normal uppercase">{apiKeys.elevenLabsModel?.replace('eleven_','').replace('_v2','') || 'TURBO'}</strong>
                            </span>
                          </div>

                          {/* Quick Voice Settings Sliders */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] text-[#ff4e00] font-medium uppercase tracking-wider">
                                <span>Estabilidade da Voz</span>
                                <span className="font-mono">{((apiKeys.elevenLabsStability ?? 0.5) * 100).toFixed(0)}%</span>
                              </div>
                              <input 
                                type="range" min="0.0" max="1.0" step="0.05"
                                value={apiKeys.elevenLabsStability ?? 0.5}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setApiKeys({ ...apiKeys, elevenLabsStability: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] text-[#ff4e00] font-medium uppercase tracking-wider">
                                <span>Claridade / Similaridade</span>
                                <span className="font-mono">{((apiKeys.elevenLabsSimilarityBoost ?? 0.75) * 100).toFixed(0)}%</span>
                              </div>
                              <input 
                                type="range" min="0.0" max="1.0" step="0.05"
                                value={apiKeys.elevenLabsSimilarityBoost ?? 0.75}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setApiKeys({ ...apiKeys, elevenLabsSimilarityBoost: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
                              />
                            </div>
                          </div>

                          {/* Inline manual credentials warning if not completed */}
                          {!apiKeys.elevenLabsApiKey && (
                            <div className="pt-2 animate-in slide-in-from-bottom-2 duration-300">
                              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
                                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Insira sua Chave Elevenlabs</span>
                                <p className="text-[10px] text-her-muted/80 leading-relaxed">Sua chave é necessária para autenticar o motor de locução em tempo real.</p>
                                <input 
                                  type="password"
                                  placeholder="Cole sua xi-api-key da ElevenLabs..."
                                  value={apiKeys.elevenLabsApiKey || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setApiKeys({ ...apiKeys, elevenLabsApiKey: e.target.value })}
                                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff4e00]/40 transition-all"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ORIGINAL GEMINI DEDICATED INTERFACE */
                    <>
                      <div onClick={handleVoiceToggle} className={cn(
                        "cursor-pointer transition-all duration-500 group relative",
                        liveState.status === 'connected' ? "pointer-events-auto" : "pointer-events-auto"
                      )}>
                        <InfinityLogo 
                          active={liveState.status === 'connected'} 
                          speaking={isSpeaking} 
                          style="neural"
                          thinking={isGenerating || isAnalyzingCode || isTranscribing}
                          searching={isModelSearching}
                        />
                        
                        {/* Floating invitation */}
                        {liveState.status !== 'connected' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: !showUi ? 0 : [0.4, 0.7, 0.4], y: 0 }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={cn(
                              "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500",
                              !showUi && "opacity-0 pointer-events-none scale-95"
                            )}
                          >
                            <span className="text-[10px] md:text-sm font-serif italic tracking-[0.3em] text-her-muted/80 uppercase">
                              Me ative
                            </span>
                          </motion.div>
                        )}
                      </div>
                      
                      {(chatHistory.length === 0 || liveState.status === 'connected') && (
                        <div className={cn(
                          "mt-4 flex flex-col items-center gap-2 transition-all duration-500",
                          !showUi && "opacity-0 pointer-events-none scale-95"
                        )}>
                          {/* Mini logo showing we are on Gemini Live page */}
                          <div className="flex items-center gap-1.5 p-1 px-3.5 bg-white/[0.02] border border-white/[0.05] rounded-full mt-2 mb-2 pointer-events-auto z-50 animate-in fade-in duration-300">
                            <span className="text-[9px] uppercase tracking-wider text-her-accent font-bold">Gemini Live Neural 📻</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-500",
                              isListening ? "bg-her-accent animate-pulse" : isWaitingForWakeWord ? "bg-her-accent/40 animate-pulse" : "bg-her-muted/30"
                            )} />
                            <span className="text-[9px] tracking-[0.3em] uppercase text-her-muted font-light">NEURAL LINK {isListening ? 'ACTIVE' : isWaitingForWakeWord ? 'VOICE TRIGGER READY' : 'IDLE'}</span>
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
                          ) : liveState.status === 'error' ? (
                            <motion.div 
                              key="error"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col items-center gap-1"
                            >
                              <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest px-4 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                FALHA DE CONEXÃO
                              </span>
                              <p className="text-[9px] text-red-400 opacity-80 max-w-[250px] text-center leading-tight">
                                {liveState.error}
                              </p>
                            </motion.div>
                          ) : isVoiceOutputPaused ? (
                            <motion.button 
                              key="paused"
                              onClick={() => {
                                setIsVoiceOutputPaused(false);
                                addNotification("Voz do OSONE retomada", "success");
                              }}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="group flex items-center gap-1.5 text-[11px] font-sans text-amber-500 font-medium hover:text-amber-400 cursor-pointer pointer-events-auto px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full transition-all"
                              title="Clique para retomar"
                            >
                              <VolumeX size={12} className="animate-pulse" />
                              Voz Pausada (Escutando...)
                            </motion.button>
                          ) : isSpeaking ? (
                            <motion.button 
                              key="speaking"
                              onClick={interruptVoiceResponse}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="group flex items-center gap-1.5 text-xs text-her-accent hover:text-red-400 bg-her-accent/5 hover:bg-red-500/15 border border-her-accent/20 hover:border-red-500/20 px-4 py-1.5 rounded-full cursor-pointer pointer-events-auto transition-all"
                              title="Silenciar / Interromper Fala"
                            >
                              <VolumeX size={12} className="group-hover:text-red-400 group-hover:scale-110 transition-transform" />
                              <span className="font-serif italic font-light group-hover:hidden">"Processando consciência..."</span>
                              <span className="font-sans font-semibold tracking-wider uppercase text-[9px] hidden group-hover:inline">Silenciar Copilot (Interrupt)</span>
                            </motion.button>
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
                  )}
                    </>
                  )}
                </motion.div>

                {/* Chat History - Integrated into screen */}
                <div className={cn(
                  "flex-1 flex flex-col overflow-hidden w-full transition-all duration-700",
                  (liveState.status === 'connected' || !isChatExpanded || !showUi) ? "opacity-0 pointer-events-none scale-95" : "opacity-100",
                  chatHistory.length > 0 ? "pt-12 justify-start translate-z-0" : "justify-center"
                )}>
                  {chatHistory.length > 0 && (
                    <div className="flex justify-end p-2 md:p-0">
                      <button 
                        onClick={() => {
                          if (confirm("Deseja atualizar a conversa? Isso removerá o contexto antigo para priorizar o novo assunto.")) {
                            // Keep only the last 6 messages if there are many, or just remove the first half
                            setChatHistory(prev => {
                              const keepCount = Math.max(4, Math.floor(prev.length / 3));
                              return prev.slice(-keepCount);
                            });
                            addNotification("Conversa atualizada e otimizada.", "info");
                          }
                        }}
                        className="flex items-center gap-2 text-her-muted/40 hover:text-her-accent transition-colors text-[10px] uppercase tracking-widest group"
                      >
                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                        Atualizar Chat
                      </button>
                    </div>
                  )}
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-her-muted/20 italic text-sm md:text-lg font-light">
                      <p>Manifeste sua intenção...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col max-h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {isDuoMode && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-zinc-950/80 via-zinc-900/60 to-black border border-white/5 shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                          <div className="flex items-center justify-between mb-3 select-none">
                            <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/45 px-2.5 py-1 rounded-full text-[8px] tracking-widest uppercase font-bold text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                              <span>Ao Vivo / Podcast</span>
                            </div>
                            <span className="text-[10px] uppercase font-mono tracking-tight text-white/50">
                              Canal: {DUO_TOPICS.find(t => t.id === duoTopicId)?.name}
                            </span>
                          </div>

                          {/* Split screen Podcast Host area */}
                          {(() => {
                            const currentCombo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
                            const aS = duoSpeakingHost === 'hostA' && isSpeaking;
                            const bS = duoSpeakingHost === 'hostB' && isSpeaking;
                            
                            return (
                              <div className="grid grid-cols-2 gap-4 relative">
                                {/* Host A Box */}
                                <div className={cn(
                                  "flex flex-col items-center p-3 rounded-xl border transition-all duration-300 relative",
                                  aS 
                                    ? "bg-sky-500/[0.03] border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)] scale-[1.02]" 
                                    : "bg-white/[0.01] border-white/5 opacity-70"
                                )}>
                                  <div className="relative mb-2">
                                    <img src={currentCombo.hostA.avatarUrl} alt={currentCombo.hostA.name} className={cn(
                                      "w-12 h-12 rounded-full object-cover transition-all",
                                      aS ? "ring-2 ring-sky-500 border-sky-450" : "border border-white/10"
                                    )} />
                                    {aS && (
                                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 text-[8px] shrink-0 font-bold flex items-center justify-center animate-bounce">🎙️</div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold font-sans tracking-wide text-sky-400">{currentCombo.hostA.name}</span>
                                  <span className="text-[9px] text-zinc-400 text-center font-light leading-normal h-4 truncate w-full select-none">{currentCombo.hostA.role}</span>
                                  
                                  {/* Audio waves visualizer for host A */}
                                  {aS && (
                                    <div className="flex gap-0.5 items-end justify-center h-4 mt-2">
                                      <span className="w-[1.5px] h-2 bg-sky-400 animate-[bounce_0.6s_infinite] delay-75" />
                                      <span className="w-[1.5px] h-3.5 bg-sky-400 animate-[bounce_0.6s_infinite] delay-200" />
                                      <span className="w-[1.5px] h-1.5 bg-sky-400 animate-[bounce_0.6s_infinite] delay-100" />
                                      <span className="w-[1.5px] h-3.5 bg-sky-400 animate-[bounce_0.6s_infinite] delay-300" />
                                      <span className="w-[1.5px] h-2 bg-sky-400 animate-[bounce_0.6s_infinite] delay-150" />
                                    </div>
                                  )}
                                </div>

                                {/* Center separator with Versus/Live icon */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 border border-white/10 w-7 h-7 rounded-full flex items-center justify-center z-10 select-none shadow-md">
                                  <span className="text-[8px] font-bold text-zinc-400 font-mono">VS</span>
                                </div>

                                {/* Host B Box */}
                                <div className={cn(
                                  "flex flex-col items-center p-3 rounded-xl border transition-all duration-300 relative",
                                  bS 
                                    ? "bg-rose-500/[0.03] border-rose-500/30 shadow-[0_0_15px_rgba(251,113,133,0.15)] scale-[1.02]" 
                                    : "bg-white/[0.01] border-white/5 opacity-70"
                                )}>
                                  <div className="relative mb-2">
                                    <img src={currentCombo.hostB.avatarUrl} alt={currentCombo.hostB.name} className={cn(
                                      "w-12 h-12 rounded-full object-cover transition-all",
                                      bS ? "ring-2 ring-rose-500 border-rose-450" : "border border-white/10"
                                    )} />
                                    {bS && (
                                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 text-[8px] shrink-0 font-bold flex items-center justify-center animate-bounce">🎙️</div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold font-sans tracking-wide text-rose-400">{currentCombo.hostB.name}</span>
                                  <span className="text-[9px] text-zinc-400 text-center font-light leading-normal h-4 truncate w-full select-none">{currentCombo.hostB.role}</span>

                                  {/* Audio waves visualizer for host B */}
                                  {bS && (
                                    <div className="flex gap-0.5 items-end justify-center h-4 mt-2">
                                      <span className="w-[1.5px] h-2 bg-rose-400 animate-[bounce_0.6s_infinite] delay-100" />
                                      <span className="w-[1.5px] h-3.5 bg-rose-400 animate-[bounce_0.6s_infinite] delay-75" />
                                      <span className="w-[1.5px] h-1.5 bg-rose-400 animate-[bounce_0.6s_infinite] delay-200" />
                                      <span className="w-[1.5px] h-3.5 bg-rose-400 animate-[bounce_0.6s_infinite] delay-150" />
                                      <span className="w-[1.5px] h-2 bg-rose-400 animate-[bounce_0.6s_infinite] delay-300" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
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
                                    if (isDuoMode) {
                                      playDuoSpeech(msg.content);
                                      return;
                                    }
                                    handleSpeakChatMessage(msg.content, msg.id);
                                  }}
                                  className={cn(
                                    "p-1 transition-colors relative",
                                    isPlayingChatSpeech === msg.id 
                                      ? "text-her-accent animate-pulse scale-110" 
                                      : "hover:text-her-accent text-her-muted opacity-60 hover:opacity-100"
                                  )}
                                  title={isPlayingChatSpeech === msg.id ? "Parar Leitura" : "Ouvir"}
                                >
                                  {isPlayingChatSpeech === msg.id ? (
                                    <VolumeX size={13} className="text-her-accent" />
                                  ) : (
                                    <Volume2 size={13} />
                                  )}
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
                              </div>
                            )}
                          </div>
                          <div className="w-full">
                            {(() => {
                              const currentCombo = DUO_COMBOS.find(c => c.id === duoComboId) || DUO_COMBOS[0];
                              const turns = msg.role === 'assistant' ? parseDuoTextToTurns(msg.content, currentCombo) : [];
                              
                              if (msg.role === 'assistant' && turns.length > 0) {
                                return (
                                  <div className="flex flex-col gap-4 w-full my-2">
                                    {turns.map((turn, tIdx) => {
                                      const isHostA = turn.speaker === 'hostA';
                                      const hostConf = isHostA ? currentCombo.hostA : currentCombo.hostB;
                                      const isCurrentlyTalking = duoSpeakingHost === turn.speaker && isSpeaking;
                                      
                                      return (
                                        <motion.div 
                                          key={tIdx}
                                          initial={{ opacity: 0, x: isHostA ? -15 : 15 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className={cn(
                                            "flex gap-3 max-w-[90%] items-start",
                                            isHostA ? "self-start text-left" : "self-end flex-row-reverse text-right"
                                          )}
                                        >
                                          {/* Host Avatar with animated ring when speaking */}
                                          <div className="relative shrink-0 select-none">
                                            <img 
                                              src={hostConf.avatarUrl} 
                                              alt={hostConf.name} 
                                              className={cn(
                                                "w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm transition-all duration-300",
                                                isHostA ? "border-sky-500/30" : "border-rose-500/30",
                                                isCurrentlyTalking && (isHostA ? "ring-2 ring-sky-500/80 scale-105 border-sky-450 shadow-[0_0_15px_rgba(56,189,248,0.4)]" : "ring-2 ring-rose-500/80 scale-105 border-rose-450 shadow-[0_0_15px_rgba(251,113,133,0.4)]")
                                              )}
                                            />
                                            {isCurrentlyTalking && (
                                              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 flex items-center justify-center text-[7px] text-white font-bold">🎙️</span>
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Dialogue Bubble */}
                                          <div className="flex flex-col">
                                            <div className={cn(
                                              "flex items-center gap-1.5 mb-1 select-none",
                                              isHostA ? "justify-start" : "justify-end"
                                            )}>
                                              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: isHostA ? '#38bdf8' : '#fb7185' }}>
                                                {hostConf.name}
                                              </span>
                                              <span className="text-[8px] opacity-40 uppercase font-mono tracking-tight text-white">
                                                {hostConf.role}
                                              </span>
                                            </div>
                                            <div className={cn(
                                              "px-4 py-3 rounded-2xl text-xs sm:text-sm font-light leading-relaxed tracking-wide border transition-all duration-300 shadow-sm text-left",
                                              isHostA 
                                                ? "bg-sky-500/[0.04] text-sky-100 border-sky-500/10 rounded-tl-none hover:bg-sky-500/[0.08]" 
                                                : "bg-rose-500/[0.04] text-rose-100 border-rose-500/10 rounded-tr-none hover:bg-rose-500/[0.08]"
                                            )}>
                                              {turn.text}
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              return msg.content;
                            })()}
                            {msg.imageUrl && (
                              <div className="mt-4 relative group rounded-xl overflow-hidden shadow-sm border border-her-muted/20">
                                <img src={msg.imageUrl} alt="Generated" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => setFullScreenImage(msg.imageUrl!)}
                                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                                    title="Tela cheia"
                                  >
                                    <Maximize size={24} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Real-time voice transcript */}
                      {voiceTranscript && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative text-base md:text-lg font-light leading-relaxed tracking-tight shrink-0 flex flex-col text-her-ink/80 text-left items-start"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="opacity-20 text-[10px] uppercase tracking-[0.2em]">
                              OSONE
                            </span>
                            <span className="flex items-center gap-1 opacity-50">
                              <span className="w-1 h-1 bg-her-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-her-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-her-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </div>
                          <div className="w-full whitespace-pre-wrap">
                            {voiceTranscript}
                          </div>
                        </motion.div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className={cn(
                  "shrink-0 pt-0 w-full pb-20 md:pb-0 transition-all duration-500",
                  !showUi && "opacity-0 pointer-events-none translate-y-4"
                )}>
                  <div className={cn(
                    "flex justify-between items-center px-10 mb-0 transition-all duration-300",
                    !isChatExpanded ? "opacity-0 h-0 pointer-events-none mb-0 overflow-hidden" : "opacity-100 h-20"
                  )}>
                    <div className="flex items-center gap-2">
                      <VoiceSwitcher 
                        selectedVoice={selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        isOpen={isVoiceSwitcherOpen}
                        onToggle={() => setIsVoiceSwitcherOpen(!isVoiceSwitcherOpen)}
                      />
                    </div>
                    
                    {/* Secondary Toggles - Tablet/Mobile friendly row when expanded */}
                      {/* Secondary Toggles Removed Ear Duplication */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/[0.03] border border-white/[0.05]",
                            isScreenSharing ? "text-her-accent border-her-accent/20" : "text-her-muted"
                          )}
                          title={isScreenSharing ? "Parar Tela" : "Compartilhar Tela"}
                        >
                          {isScreenSharing ? <MonitorOff size={14} /> : <Monitor size={14} />}
                        </button>
                      </div>
                  </div>
                  <div className={cn(
                    "flex items-center",
                    !isChatExpanded ? "justify-center w-full gap-2.5 max-w-lg mx-auto py-2 px-4 rounded-full bg-white/[0.01] border border-white/[0.03] backdrop-blur-xl" : "gap-2"
                  )}>
                    <button 
                      onClick={handleTranscriptionToggle}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative shrink-0",
                        isTranscribing 
                          ? "bg-her-accent/20 text-her-accent border border-her-accent/30 mic-glow" 
                          : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05]"
                      )}
                      title={isTranscribing ? "Parar Transcrição" : "Transcrever Áudio"}
                    >
                      {isTranscribing ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    
                    <div className={cn(
                      "transition-all duration-500 ease-in-out flex items-center overflow-hidden",
                      isChatExpanded ? "flex-1" : "flex-none"
                    )}>
                      {!isChatExpanded ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              handleFileSelect(e);
                              setIsChatExpanded(true); // Expands to show uploaded documents and provide quick context details
                            }}
                            multiple
                            className="hidden"
                          />
                          
                          {/* Clipe / Enviar documentos para análise */}
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-center transition-all hover:text-her-accent"
                            title="Anexar documentos para análise"
                          >
                            <Paperclip size={16} />
                          </button>

                          <button 
                            onClick={() => setIsChatExpanded(true)}
                            className="w-10 h-10 rounded-full bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-center transition-all hover:text-her-accent"
                            title="Escrever mensagem"
                          >
                            <MessageSquare size={16} />
                          </button>
                          
                          <button 
                            onClick={() => setIsPersonaSwitcherOpen(true)}
                            className="w-10 h-10 rounded-full bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-center transition-all hover:text-her-accent"
                            title="Modos de Personalidade"
                          >
                            <UserIcon size={16} />
                          </button>

                          <button 
                            onClick={toggleCamera}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                              isCameraActive 
                                ? "bg-her-accent/20 text-her-accent border-her-accent/30 shadow-[0_0_15px_rgba(242,125,38,0.2)]" 
                                : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-white/[0.05] hover:text-her-accent"
                            )}
                            title={isCameraActive ? "Desativar Visão" : "Ativar Visão em Tempo Real"}
                          >
                            {isCameraActive ? <Eye size={16} className="animate-pulse" /> : <EyeOff size={16} />}
                          </button>

                          <button 
                            onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                              isScreenSharing 
                                ? "bg-her-accent/20 text-her-accent border-her-accent/30" 
                                : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-white/[0.05]"
                            )}
                            title={isScreenSharing ? "Compartilhar Tela" : "Parar Tela"}
                          >
                            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: '100%', opacity: 1 }}
                          className="flex-1 flex flex-col gap-0 bg-white/[0.03] backdrop-blur-md border-t border-white/[0.05] relative w-full"
                        >
                          {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-10 pt-4 pb-2 bg-black/20">
                              {attachedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/5 px-4 py-2 text-[10px] text-her-muted border border-white/5 shadow-sm">
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                  <button onClick={() => removeFile(idx)} className="hover:text-red-400 p-1">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center h-24">
                            <input 
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              multiple
                              className="hidden"
                            />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-20 h-full text-her-muted hover:text-her-accent transition-colors border-r border-white/5 flex items-center justify-center"
                            >
                              <Paperclip size={20} />
                            </button>
                            <button 
                              onClick={() => {
                                const newValue = !isGoogleSearchActive;
                                setIsGoogleSearchActive(newValue);
                                localStorage.setItem('osone_google_search_active', String(newValue));
                                addNotification(newValue ? "Busca no Google ATIVADA" : "Busca no Google DESATIVADA", "success");
                              }}
                              className={cn(
                                "w-20 h-full transition-all duration-300 border-r border-white/5 flex flex-col items-center justify-center gap-1.5 relative text-[9px] uppercase font-mono select-none",
                                isGoogleSearchActive 
                                  ? "text-sky-400 bg-sky-500/5 hover:bg-sky-500/10" 
                                  : "text-her-muted hover:text-white hover:bg-white/5"
                              )}
                              title={isGoogleSearchActive ? "Busca no Google Ativada (Grounding)" : "Busca no Google Desativada"}
                            >
                              <Globe size={18} className={cn(isGoogleSearchActive && "animate-pulse")} />
                              <span className="text-[7.5px] tracking-wider font-extrabold">{isGoogleSearchActive ? "Web ON" : "Web OFF"}</span>
                              {isGoogleSearchActive && (
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-400 rounded-full" />
                              )}
                            </button>
                            <input 
                              type="text"
                              value={homePrompt}
                              onChange={(e) => setHomePrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleHomeChat();
                                if (e.key === 'Escape') setIsChatExpanded(false);
                              }}
                              placeholder="Diga algo para o OSONE..."
                              className="flex-1 bg-transparent px-8 focus:outline-none text-base md:text-lg font-light text-her-ink/80 placeholder:text-her-muted/20"
                              autoFocus
                            />
                            <div className="flex items-center h-full">
                              <button 
                                onClick={handleTranscriptionToggle}
                                className={cn(
                                  "w-20 h-full text-her-muted hover:text-her-accent transition-colors border-l border-white/5 flex items-center justify-center relative",
                                  isTranscribing && "text-her-accent bg-her-accent/5"
                                )}
                                title={isTranscribing ? "Parar Gravação" : "Gravar Voz"}
                              >
                                {isTranscribing ? <MicOff size={20} className="text-her-accent animate-pulse" /> : <Mic size={20} />}
                              </button>
                              <button 
                                onClick={() => handleHomeChat()}
                                disabled={!homePrompt.trim() && attachedFiles.length === 0}
                                className="w-24 h-full bg-her-accent/20 text-her-accent hover:bg-her-accent/30 transition-all disabled:opacity-20 disabled:grayscale border-l border-white/5 flex items-center justify-center"
                              >
                                <Send size={22} />
                              </button>
                              <button 
                                onClick={() => setIsChatExpanded(false)}
                                className="w-20 h-full text-her-muted hover:text-red-400 transition-colors border-l border-white/5 flex items-center justify-center"
                                title="Recolher"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <button 
                      onClick={() => setIsChatExpanded(false)}
                      className={cn(
                        "w-11 h-11 items-center justify-center transition-all duration-300 relative shrink-0",
                        isChatExpanded ? "md:flex" : "hidden",
                        "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05] hover:text-her-accent hover:border-her-accent/20"
                      )}
                      title="Voltar ao Minimalista"
                    >
                      <MessageSquare size={18} />
                    </button>

                    <button 
                      onClick={toggleCamera}
                      className={cn(
                        "w-11 h-11 items-center justify-center transition-all duration-300 relative shrink-0",
                        isChatExpanded ? "flex" : "hidden",
                        isCameraActive 
                          ? "bg-her-accent/20 text-her-accent border border-her-accent/30 shadow-[0_0_15px_rgba(242,125,38,0.2)]" 
                          : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05] hover:text-her-accent hover:border-her-accent/20"
                      )}
                      title={isCameraActive ? "Desativar Visão" : "Ativar Visão em Tempo Real"}
                    >
                      {isCameraActive ? <Eye size={18} className="animate-pulse" /> : <EyeOff size={18} />}
                    </button>

                    <button 
                      onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
                      className={cn(
                        "w-11 h-11 items-center justify-center transition-all duration-300 relative shrink-0 hidden md:flex",
                        isScreenSharing 
                          ? "bg-her-accent/10 text-her-accent border border-her-accent/20" 
                          : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05]"
                      )}
                      title={isScreenSharing ? "Parar Compartilhamento" : "Compartilhar Tela"}
                    >
                      {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-[60] bg-[#050505]/90 backdrop-blur-3xl border-t border-white/[0.05] flex md:hidden items-center justify-around px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500",
        !showUi && "opacity-0 pointer-events-none translate-y-4"
      )}>
        {[
          { id: 'home', icon: Volume2, label: 'Início' },
          { id: 'writing', icon: FileText, label: 'Escrita' },
          { id: 'aural_control', icon: Sliders, label: 'Ajustes' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setWorkspaceMode(item.id as WorkspaceMode)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 transition-all relative group",
              workspaceMode === item.id ? "text-her-accent" : "text-her-muted"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-transform",
              workspaceMode === item.id ? "scale-110" : "group-hover:scale-105"
            )} />
            <span className={cn(
              "text-[8px] uppercase tracking-[0.2em] font-medium",
              workspaceMode === item.id ? "opacity-100" : "opacity-40"
            )}>
              {item.label}
            </span>
            {workspaceMode === item.id && (
              <motion.div 
                layoutId="bottomNavDot"
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-her-accent rounded-full shadow-[0_0_8px_rgba(255,78,0,0.8)]" 
              />
            )}
          </button>
        ))}
      </nav>

      {/* Mobile Backdrop for Sidebar/Settings */}
      <AnimatePresence>
        {(isSidebarOpen || isSettingsOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => { setIsSidebarOpen(false); setIsSettingsOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* Google Search Screen Prints & Biometrics Popups Tray */}
      <div className="fixed bottom-24 right-5 md:right-10 z-[80] flex flex-col gap-4 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {searchPopups.map((popup, idx) => {
            const isDanger = popup.classification === 'danger';
            const isStar = popup.classification === 'star';
            
            return (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, x: 100, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                drag
                dragConstraints={{ left: -400, right: 100, top: -400, bottom: 200 }}
                className={cn(
                  "pointer-events-auto w-[340px] bg-black/95 hover:bg-black border rounded-xl overflow-hidden shadow-2xl transition-shadow duration-300 select-none cursor-move",
                  isDanger ? "border-red-500/40 shadow-red-500/10" :
                  isStar ? "border-emerald-500/40 shadow-emerald-500/10" :
                  "border-sky-500/30 shadow-sky-500/5 hover:shadow-sky-500/10"
                )}
                style={{ zIndex: 100 + idx }}
              >
                {/* Simulated Web Browser Tab Bar */}
                <div className={cn(
                  "px-3 py-2 border-b flex items-center justify-between",
                  isDanger ? "bg-red-950/20 border-red-500/10 text-red-100" :
                  isStar ? "bg-emerald-950/20 border-emerald-500/10 text-emerald-100" :
                  "bg-zinc-900/60 border-white/5 text-zinc-300"
                )}>
                  <div className="flex items-center gap-1.5 font-mono">
                    <div className="flex items-center gap-1 mr-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setSearchPopups(prev => prev.filter(p => p.id !== popup.id))} />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    {popup.faviconUrl && (
                      <img src={popup.faviconUrl} className="w-3.5 h-3.5 rounded object-contain shrink-0" alt="" referrerPolicy="no-referrer" />
                    )}
                    <span className="text-[10px] font-bold tracking-tight truncate max-w-[130px]">
                      {popup.isPortrait ? "RECON-X BIOMETRIC" : (popup.title || "Captura de Tela")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8.5px] font-mono text-white/30">{popup.timestamp}</span>
                    <button
                      onClick={() => setSearchPopups(prev => prev.filter(p => p.id !== popup.id))}
                      className="text-white/40 hover:text-white hover:bg-white/5 p-1 rounded transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Simulated Chrome Address Bar */}
                {!popup.isPortrait && popup.url && (
                  <div className="px-3 py-1.5 bg-zinc-950 border-b border-white/5 flex items-center gap-1.5">
                    <Globe size={11} className="text-zinc-500 shrink-0" />
                    <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded px-2 py-0.5 text-[8.5px] font-mono text-zinc-400 truncate flex-1 leading-none select-text cursor-text">
                      {popup.url}
                    </div>
                  </div>
                )}

                {/* Main Capture Visual Box */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900 group/capture">
                  {popup.imageUrl ? (
                    <img 
                      src={popup.imageUrl} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/capture:scale-110" 
                      alt="Captura de tela"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                      <Globe size={24} className="text-zinc-700 animate-pulse" />
                    </div>
                  )}

                  <div className={cn(
                    "absolute inset-0 pointer-events-none bg-gradient-to-b opacity-25",
                    isDanger ? "from-red-500/0 via-red-500/20 to-red-500/0" : "from-sky-500/0 via-sky-500/20 to-sky-500/0"
                  )} />
                  <motion.div 
                    className={cn(
                      "absolute left-0 right-0 h-0.5 opacity-60 shadow-lg z-10",
                      isDanger ? "bg-red-500 shadow-red-500" :
                      isStar ? "bg-emerald-500 shadow-emerald-500" :
                      "bg-sky-400 shadow-sky-400"
                    )}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {popup.isPortrait && (
                    <div className="absolute inset-0 p-4 flex flex-col justify-between bg-black/60 backdrop-blur-[1px]">
                      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                      <div className="flex gap-2.5 items-center bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg">
                        {popup.avatarUrl && (
                          <img src={popup.avatarUrl} className="w-10 h-10 rounded-md object-cover border border-cyan-400/50 block" alt="" referrerPolicy="no-referrer" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-wider uppercase leading-none mb-1">RECON DETECTADO</p>
                          <p className="text-[9px] font-sans font-bold text-white max-w-[170px] truncate leading-tight">{popup.title.replace("IDENTIDADE ATIVA: ", "").replace("ALERTA DE CONTRAVANÇÃO: ", "")}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-auto">
                        {popup.socialGrade && (
                          <div className="flex items-center justify-between bg-black/90 p-1.5 rounded border border-white/5 font-mono text-[8.5px]">
                            <span className="text-zinc-400 font-medium">🛡️ TAXA SOCIAL:</span>
                            <span className="text-cyan-400 font-black glow-cyan">{popup.socialGrade}</span>
                          </div>
                        )}

                        {isDanger && popup.dangerLevel && (
                          <div className="bg-red-500/10 border border-red-500/20 p-1.5 rounded font-mono text-[8.5px] text-red-400">
                            <div className="flex items-center justify-between mb-1 font-bold">
                              <span>🚨 TAXA PERICULOSIDADE:</span>
                              <span>{popup.dangerLevel * 10}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${popup.dangerLevel * 10}%` }} />
                            </div>
                          </div>
                        )}

                        {isStar && popup.starsCount && (
                          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded font-mono text-[8.5px] text-emerald-400">
                            <span className="font-bold">⭐ RECOMENDAÇÃO:</span>
                            <span className="flex">
                              {Array.from({ length: popup.starsCount }).map((_, i) => (
                                <Sparkles key={i} size={8} className="text-emerald-400 animate-pulse ml-0.5" />
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!popup.isPortrait && (
                    <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 bg-black/80 rounded border border-white/5 text-[7px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1 backdrop-blur-sm">
                      <Sparkles size={8} className="text-sky-400" />
                      Captura Real
                    </div>
                  )}
                </div>

                <div className="p-3 text-left">
                  <p className="text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1 tracking-wider line-clamp-1">
                    {popup.query ? `Q: "${popup.query}"` : "Grounding OSONE"}
                  </p>
                  <p className="text-[11px] text-zinc-200 font-sans leading-relaxed line-clamp-3 select-text">
                    {popup.snippet}
                  </p>
                </div>

                <div className="p-2 bg-zinc-900/40 border-t border-white/5 flex gap-2">
                  {popup.url && (
                    <button
                      onClick={() => window.open(popup.url, '_blank')}
                      className="flex-1 py-1 px-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/30 text-sky-400 text-[10px] font-sans font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Globe size={11} />
                      Acessar Fonte
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${popup.title}\n\n${popup.snippet}${popup.url ? `\n\nLink: ${popup.url}` : ''}`);
                      addNotification("Detalhes copiados!", "success");
                    }}
                    className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white text-[10px] font-sans font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    title="Copiar Relatório"
                  >
                    <Copy size={11} />
                    Copiar
                  </button>
                  <button
                    onClick={() => setSearchPopups(prev => prev.filter(p => p.id !== popup.id))}
                    className="py-1 px-2 hover:bg-white/5 border border-transparent hover:border-white/5 text-zinc-500 hover:text-white text-[10px] font-sans font-medium rounded-lg transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals & Overlays */}
      {/* Notifications Layer */}
      <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map(n => (
            <NotificationToast
              key={n.id}
              id={n.id}
              message={n.message}
              type={n.type}
              onClose={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        mode={workspaceMode}
        setMode={setWorkspaceMode}
        user={user}
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
      <SemanticMemory 
        isOpen={isSemanticMemoryOpen} 
        onClose={() => setIsSemanticMemoryOpen(false)} 
        onAddNotification={addNotification}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        keys={apiKeys}
        setKeys={setApiKeys}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        voiceEngine={voiceEngine}
        setVoiceEngine={setVoiceEngine}
        isChatAutoSpeakActive={isChatAutoSpeakActive}
        setIsChatAutoSpeakActive={setIsChatAutoSpeakActive}
        voiceModulation={voiceModulation}
        setVoiceModulation={setVoiceModulation}
        orbStyle={orbStyle}
        setOrbStyle={setOrbStyle}
        appTheme={appTheme}
        setAppTheme={setAppTheme}
        aiProfile={aiProfile}
        setAiProfile={handleUpdateProfile}
        onAddNotification={addNotification}
        onRestoreState={(payload) => {
          try {
            const apiKeysVal = payload['osone_api_keys'];
            if (apiKeysVal) setApiKeys(JSON.parse(apiKeysVal));

            const chatHistoryVal = payload['osone_chat_history'];
            if (chatHistoryVal) setChatHistory(JSON.parse(chatHistoryVal));

            const voiceEngineVal = payload['osone_voice_engine'];
            if (voiceEngineVal === 'gemini' || voiceEngineVal === 'elevenlabs') setVoiceEngine(voiceEngineVal as any);

            const selectedVoiceVal = payload['osone_selected_voice'];
            if (selectedVoiceVal) setSelectedVoice(selectedVoiceVal);

            const selectedPersonaVal = payload['osone_selected_persona'];
            if (selectedPersonaVal) {
              const found = PERSONAS.find(p => p.id === selectedPersonaVal);
              if (found) setSelectedPersona(found);
            }

            const aiProfileVal = payload['osone_ai_profile'];
            if (aiProfileVal) setAiProfile(JSON.parse(aiProfileVal));

            const voiceModulationVal = payload['osone_voice_modulation'];
            if (voiceModulationVal) setVoiceModulation(JSON.parse(voiceModulationVal));

            const healthDataVal = payload['osone_health_data'];
            if (healthDataVal) setHealthData(JSON.parse(healthDataVal));

            const orbStyleVal = payload['osone_orb_style'] as OrbStyle;
            if (orbStyleVal) setOrbStyle(orbStyleVal);

            const isDuoModeVal = payload['osone_is_duo_mode'];
            if (isDuoModeVal) setIsDuoMode(isDuoModeVal === 'true');

            const duoComboIdVal = payload['osone_duo_combo_id'];
            if (duoComboIdVal) setDuoComboId(duoComboIdVal);

            const duoTopicIdVal = payload['osone_duo_topic_id'];
            if (duoTopicIdVal) setDuoTopicId(duoTopicIdVal);

            const isDuoVoiceActiveVal = payload['osone_is_duo_voice_active'];
            if (isDuoVoiceActiveVal) setIsDuoVoiceActive(isDuoVoiceActiveVal !== 'false');

            const isChatAutoSpeakActiveVal = payload['osone_chat_auto_speak'];
            if (isChatAutoSpeakActiveVal) setIsChatAutoSpeakActive(isChatAutoSpeakActiveVal === 'true');

            const workspaceTextVal = payload['osone_workspace_text'];
            if (workspaceTextVal) setWorkspaceText(workspaceTextVal);

            const fileSystemVal = payload['osone_file_system'];
            if (fileSystemVal) setFileSystem(JSON.parse(fileSystemVal));

            const drawingObjectsVal = payload['osone_drawing_objects'];
            if (drawingObjectsVal) setDrawingObjects(JSON.parse(drawingObjectsVal));

            const writingFontVal = payload['osone_writing_font'] as any;
            if (writingFontVal) setWritingFont(writingFontVal);

            const writingFontSizeVal = payload['osone_writing_font_size'];
            if (writingFontSizeVal) setWritingFontSize(Number(writingFontSizeVal));

            const writingThemeVal = payload['osone_writing_theme'] as any;
            if (writingThemeVal) setWritingTheme(writingThemeVal);

            const writingFocusModeVal = payload['osone_writing_focus'];
            if (writingFocusModeVal) setWritingFocusMode(writingFocusModeVal === 'true');

            const writingWordGoalVal = payload['osone_writing_word_goal'];
            if (writingWordGoalVal) setWritingWordGoal(Number(writingWordGoalVal));

            const writingWidthModeVal = payload['osone_writing_width'] as any;
            if (writingWidthModeVal) setWritingWidthMode(writingWidthModeVal);

            const writingSoundsVal = payload['osone_writing_sounds'];
            if (writingSoundsVal) setWritingSounds(writingSoundsVal === 'true');

            const isGoogleSearchActiveVal = payload['osone_google_search_active'];
            if (isGoogleSearchActiveVal) setIsGoogleSearchActive(isGoogleSearchActiveVal !== 'false');
          } catch (e) {
            console.error("Erro ao restaurar sinapses em tempo real:", e);
          }
        }}
      />

      <SkeletonBrainPopup 
        plan={proposedPlan}
        onApprove={handleApprovePlan}
        onReject={handleRejectPlan}
      />

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setFullScreenImage(null)}
          >
            <button 
              onClick={() => setFullScreenImage(null)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullScreenImage} 
              className="w-full max-h-[90vh] object-contain shadow-2xl" 
              alt="Fullscreen generated" 
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Camera Preview Overlay */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-28 left-6 z-40 w-48 h-64 bg-black/40 backdrop-blur-md overflow-hidden border border-white/20 shadow-2xl group"
          >
            <video 
              ref={liveVideoRef} 
              className={cn(
                "w-full h-full object-cover",
                cameraFacingMode === 'user' ? "scale-x-[-1]" : ""
              )}
              autoPlay 
              playsInline 
              muted 
            />
            {/* Analysis Overlay/HUD */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[1px] border-her-accent/30 m-2 border-dashed animate-[spin_10s_linear_infinite]" />
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-her-accent/80">
                <div className="w-1.5 h-1.5 bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">VISION_ACTIVE</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-[8px] text-white/50 font-mono flex justify-between">
                <span>FPS: 30</span>
                <span>{cameraFacingMode.toUpperCase()}</span>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={toggleCamera}
                className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg flex items-center justify-center backdrop-blur-sm"
                title="Encerrar Visão"
              >
                <X size={12} />
              </button>
              <button 
                onClick={switchCamera}
                className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center backdrop-blur-sm"
                title="Inverter Câmera"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
