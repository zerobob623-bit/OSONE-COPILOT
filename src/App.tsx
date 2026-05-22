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
  RotateCcw
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
import { WebtoonCreator } from './components/WebtoonCreator';
import { WellnessCenter } from './components/WellnessCenter';
import { AuralSense } from './components/AuralSense';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { LocalControl } from './components/LocalControl';
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
    
      if (isWaitingForWakeWord && !isListening && !isTranscribing) {
        stoppedManually = false;
        startRecognition();
      }

    return () => {
      stoppedManually = true;
      try { wakeWordRec.stop(); } catch(e) {}
    };
  }, [isWaitingForWakeWord, isListening, isTranscribing]); // Added isTranscribing to ensure coordination

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
    return (saved as OrbStyle) || 'neural';
  });

  useEffect(() => {
    localStorage.setItem('osone_orb_style', orbStyle);
  }, [orbStyle]);

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
    };
    try {
      const saved = localStorage.getItem('osone_api_keys');
      if (saved) return { ...defaultKeys, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse API keys:", e);
    }
    return defaultKeys;
  });

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('osone_selected_voice') || 'Zephyr';
  });

  useEffect(() => {
    localStorage.setItem('osone_selected_voice', selectedVoice);
  }, [selectedVoice]);

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
    const newMessage = { ...msg, id: Math.random().toString(36).substr(2, 9) };
    setChatHistory(prev => [...prev, newMessage]);
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

  useEffect(() => {
    localStorage.setItem('osone_chat_history', JSON.stringify(chatHistory));
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

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelSearching, setIsModelSearching] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>({ status: 'idle' });
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
    const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
    if (!effectiveApiKey || effectiveApiKey.trim() === '') {
      setIsSettingsOpen(true);
      console.error('Por favor, configure sua API Key do Gemini nas configurações.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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

  const stopLiveSession = () => {
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
    setLiveState({ status: 'idle' });
    setIsWaitingForWakeWord(isHandsFreeActive); // Restart wake word listener only if hands-free is active
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
    const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
    if (!finalPrompt.trim() || !effectiveApiKey || effectiveApiKey.trim() === '') {
      if (!effectiveApiKey || effectiveApiKey.trim() === '') setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      // Se já houver código, trata como edição
      const isEditing = workspaceText.trim().length > 10;
      
      const systemInstruction = isEditing 
        ? "Você é um arquiteto de software sênior de elite. Sua tarefa é MODIFICAR o código existente com base nas instruções do usuário. Retorne APENAS o código completo modificado, formatado corretamente, sem blocos de markdown (```), sem explicações extras e sem comentários desnecessários fora do código."
        : "Você é um assistente criativo de elite. Gere o conteúdo solicitado (texto ou código) de forma profissional e completa.";

      const contents = isEditing 
        ? `CÓDIGO ATUAL:\n\n${workspaceText}\n\nINSTRUÇÕES DE MODIFICAÇÃO:\n${finalPrompt}`
        : finalPrompt;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: contents }] }],
        config: { 
          systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = result.text;
      
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
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error);
      addNotification("Erro ao conectar com a IA. Verifique sua chave API.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeCode = async (codeToAnalyze = workspaceText) => {
    const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
    if (!codeToAnalyze.trim() || !effectiveApiKey || effectiveApiKey.trim() === '' || isAnalyzingCode) return;

    setIsAnalyzingCode(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const prompt = `Analise este código e forneça exatamente 3 sugestões CURTAS e acionáveis (uma frase cada) para melhorá-lo (performance, bugs, estilo ou features). Retorne APENAS um array JSON de strings como ["Sugestão 1", "Sugestão 2", "Sugestão 3"]. Code:\n\n${codeToAnalyze}`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      const json = safeJsonParse(result.text || "", []);
      if (Array.isArray(json)) {
        setCodeSuggestions(json.slice(0, 3));
      }
    } catch (error) {
      console.error("Erro ao analisar código:", error);
    } finally {
      setIsAnalyzingCode(false);
    }
  };

  const playSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === 'pt-BR');
    if (ptVoice) utterance.voice = ptVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleHomeChat = async (directMessage?: string) => {
    const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
    if (((!homePrompt.trim() && !directMessage) && attachedFiles.length === 0) || !effectiveApiKey || effectiveApiKey.trim() === '') {
      if (!effectiveApiKey || effectiveApiKey.trim() === '') setIsSettingsOpen(true);
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
    
    if (liveState.status === 'connected' && liveSessionRef.current) {
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
    try {
      const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
      if (!effectiveApiKey || effectiveApiKey.trim() === '') {
        setIsSettingsOpen(true);
        addMessage({ role: 'assistant', content: 'Por favor, vincule sua própria chave API Gemini nas configurações para interagir.' });
        return;
      }
      const genAI = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const tools: any[] = [];
      
      const functionDeclarations: any[] = [
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
      tools.push({ googleSearch: {} }); 

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

      const historyContents = chatHistory.map(msg => ({
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

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: historyContents,
        config: {
          systemInstruction: `${profileInstruction}
          
          PERSONALIDADE ATUAL: ${selectedPersona.instructions}

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
      });
      
      const functionCalls = result.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'getUserEnvironment') {
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
              const imageResult = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                  parts: [{ text: prompt }]
                },
                config: {
                  imageConfig: {
                    aspectRatio: aspectRatio
                  }
                }
              });

              let imageUrl = '';
              for (const part of imageResult.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                  const base64EncodeString = part.inlineData.data;
                  imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
                  break;
                }
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
              content: `Entendido. Alterei o espaço de trabalho para: ${mode === 'home' ? 'Início' : mode === 'writing' ? 'Escrita' : mode === 'webtoon' ? 'Webtoon' : mode === 'canvas' ? 'Interativo' : mode}.` 
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
          }
          addMessage({ role: 'assistant' as const, content: contentWithSources });
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      addMessage({ role: 'assistant' as const, content: "Desculpe, tive um problema ao processar sua mensagem." });
    } finally {
      setIsGenerating(false);
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
    const hasSystemKey = !!process.env.GEMINI_API_KEY;
    if (!apiKey && !hasSystemKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsVoiceOutputPaused(false);
    setLiveState({ status: 'connecting' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || (process.env.GEMINI_API_KEY as string) });
      
      audioProcessorRef.current = new AudioProcessor();
      audioPlayerRef.current = new AudioPlayer((active) => {
        setIsSpeaking(active);
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

      const liveSystemInstruction = `${profileInstruction}
      
      PERSONALIDADE ATUAL: ${selectedPersona.instructions}

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
                  description: "Altera o modo de visualização do workspace (Escrita, Webtoon (Criador de Histórias), Wellness (Saúde e Estilo), Sons ou Início).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      mode: {
                        type: Type.STRING,
                        enum: ["home", "writing", "webtoon", "sounds", "canvas", "wellness"],
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
              (session as any).sendRealtimeInput([{ 
                text: "O sistema OSONE está online. Seja breve, direto e pare de enrolar com introduções longas. Apenas diga que está pronto e pergunte o que faremos agora." 
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
                }
              }

              if (message.serverContent?.turnComplete) {
                if (voiceTranscriptRef.current) {
                  setChatHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant', content: voiceTranscriptRef.current }]);
                  voiceTranscriptRef.current = '';
                  setVoiceTranscript('');
                }
                // O muting agora é feito pelo AudioPlayer (onActivityChange) sincronizado com o áudio real.
              }

              if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                const responses: any[] = [];

                for (const call of calls) {
                  if (call.name === "disconnectLiveSession") {
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
                  } else if (call.name === "google_search") {
                    const query = call.args.query as string;
                    playSearchNetworkSound();
                    setIsModelSearching(true);
                    try {
                      const searchResult = await ai.models.generateContent({ 
                        model: "gemini-3.5-flash",
                        contents: [{ role: 'user', parts: [{ text: query }] }],
                        config: {
                          tools: [{ googleSearch: {} }]
                        }
                      });
                      const responseText = searchResult.text;
                      
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
                    setWorkspaceMode('webtoon');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: "Estrutura de projeto sendo gerada na aba de Construção de Pastas." }
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
                    
                    setWorkspaceMode('webtoon');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Pasta '${path}' criada com sucesso.` }
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
                    
                    setWorkspaceMode('webtoon');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Arquivo '${path}' criado com sucesso.` }
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
                    
                    setWorkspaceMode('webtoon');
                    responses.push({
                      name: call.name,
                      id: call.id,
                      response: { result: `Conteúdo escrito no arquivo '${path}'.` }
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
                    
                    const effectiveApiKey = apiKeys.gemini || (process.env.GEMINI_API_KEY as string) || '';
                    if (!effectiveApiKey || effectiveApiKey.trim() === '') return;
                    const genAI = new GoogleGenAI({ apiKey: effectiveApiKey });
                    genAI.models.generateContent({
                      model: 'gemini-2.5-flash-image',
                      contents: { parts: [{ text: prompt }] },
                      config: {
                        imageConfig: { aspectRatio }
                      }
                    }).then(imageResult => {
                      let imageUrl = '';
                      for (const part of imageResult.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                          const base64EncodeString = part.inlineData.data;
                          imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
                          break;
                        }
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
            stopLiveSession();
          }
        }
      });
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setLiveState({ status: 'error', error: "Falha ao iniciar sessão de voz." });
      setIsListening(false);
    }
  };

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
    if (liveState.status === 'connected' || liveState.status === 'connecting') {
      stopLiveSession();
      setIsWaitingForWakeWord(isHandsFreeActive); // Respect hands-free state when manually stopping
    } else {
      setLiveState({ status: 'connecting' }); // Clear any previous error
      setIsWaitingForWakeWord(false); // Disable wake word while connecting/active
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
          ) : workspaceMode === 'webtoon' ? (
            <motion.div 
              key="workspace-webtoon"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1 flex flex-col gap-0 min-h-0"
            >
              <div className="flex items-center gap-4 shrink-0 p-6 border-b border-white/5 w-full">
                <button 
                  onClick={() => setWorkspaceMode('home')}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.05] transition-all text-her-muted border border-white/[0.05]"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <h2 className="text-xl font-serif italic font-light">Webtoon Creator</h2>
              </div>
              <WebtoonCreator apiKeys={apiKeys} />
            </motion.div>

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
              <AuralSense 
                onMenuClick={() => setIsSidebarOpen(true)}
                onBack={() => setWorkspaceMode('home')}
                keys={apiKeys}
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
                    "flex flex-col items-center justify-center py-2 z-50",
                    liveState.status === 'connected'
                      ? "relative flex-1 scale-110 md:scale-125" // Center large when voice active
                      : (chatHistory.length > 0 || isChatExpanded)
                        ? "absolute -top-12 left-0 right-0 transform scale-50 opacity-40 animate-cloud-wave pointer-events-none" 
                        : "absolute inset-0 flex flex-col items-center justify-center transform scale-95 md:scale-110 origin-center pointer-events-none"
                  )}
                >
                  <div onClick={handleVoiceToggle} className={cn(
                    "cursor-pointer transition-all duration-500 group relative",
                    liveState.status === 'connected' ? "pointer-events-auto" : "pointer-events-auto"
                  )}>
                    <InfinityLogo 
                      active={liveState.status === 'connected'} 
                      speaking={isSpeaking} 
                      style={orbStyle}
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
                                    window.speechSynthesis.cancel();
                                    const utterance = new SpeechSynthesisUtterance(msg.content);
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
                              </div>
                            )}
                          </div>
                          <div className="w-full">
                            {msg.content}
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleTranscriptionToggle}
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 relative shrink-0",
                        isTranscribing 
                          ? "bg-her-accent/20 text-her-accent border border-her-accent/30 mic-glow" 
                          : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border border-white/[0.05]"
                      )}
                      title={isTranscribing ? "Parar Transcrição" : "Transcrever Áudio"}
                    >
                      {isTranscribing ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    
                    <div className={cn(
                      "transition-all duration-500 ease-in-out flex items-center overflow-hidden",
                      isChatExpanded ? "flex-1" : "flex-none"
                    )}>
                      {!isChatExpanded ? (
                        <div className="flex items-center">
                          <button 
                            onClick={() => setIsChatExpanded(true)}
                            className="w-20 h-20 bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-r border-white/[0.05] flex items-center justify-center transition-all hover:text-her-accent"
                            title="Escrever mensagem"
                          >
                            <MessageSquare size={18} />
                          </button>
                          
                          <button 
                            onClick={() => setIsPersonaSwitcherOpen(true)}
                            className="w-20 h-20 bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-r border-white/[0.05] flex items-center justify-center transition-all hover:text-her-accent"
                            title="Modos de Personalidade"
                          >
                            <UserIcon size={18} />
                          </button>

                          <button 
                            onClick={toggleCamera}
                            className={cn(
                              "w-20 h-20 flex items-center justify-center transition-all border-r",
                              isCameraActive 
                                ? "bg-her-accent/20 text-her-accent border-her-accent/30 shadow-[0_0_15px_rgba(242,125,38,0.2)]" 
                                : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-white/[0.05] hover:text-her-accent"
                            )}
                            title={isCameraActive ? "Desativar Visão" : "Ativar Visão em Tempo Real"}
                          >
                            {isCameraActive ? <Eye size={18} className="animate-pulse" /> : <EyeOff size={18} />}
                          </button>

                          <button 
                            onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
                            className={cn(
                              "w-20 h-20 flex items-center justify-center transition-all border-r",
                              isScreenSharing 
                                ? "bg-her-accent/20 text-her-accent border-her-accent/30" 
                                : "bg-white/[0.03] text-her-muted hover:bg-white/[0.05] border-white/[0.05]"
                            )}
                            title={isScreenSharing ? "Compartilhar Tela" : "Parar Tela"}
                          >
                            {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
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
          { id: 'aural_control', icon: Activity, label: 'Sentido' },
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
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        keys={apiKeys}
        setKeys={setApiKeys}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        voiceModulation={voiceModulation}
        setVoiceModulation={setVoiceModulation}
        orbStyle={orbStyle}
        setOrbStyle={setOrbStyle}
        appTheme={appTheme}
        setAppTheme={setAppTheme}
        aiProfile={aiProfile}
        setAiProfile={handleUpdateProfile}
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
