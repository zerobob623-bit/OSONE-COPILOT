import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  Target, 
  Megaphone, 
  MessageSquare, 
  Zap, 
  Loader2, 
  Copy, 
  Check, 
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  Clock,
  Upload,
  FileSearch,
  FileText,
  BrainCircuit,
  ArrowRight,
  Edit3,
  Scissors
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { ViralStudio } from './ViralStudio';
import { VideoTimelineState } from '../types';

interface ScriptSection {
  title: string;
  content: string;
  visualCue: string;
}

interface ViralScript {
  id: string;
  topic: string;
  suggestedTitle: string;
  thumbnailStrategy: string;
  sections: ScriptSection[];
  imageUrl?: string;
  isReferenceBased?: boolean;
}

export function ViralFlow({ 
  apiKeys, 
  timeline, 
  setTimeline,
  onMenuClick,
  onBack
}: { 
  apiKeys: { gemini: string };
  timeline: VideoTimelineState;
  setTimeline: React.Dispatch<React.SetStateAction<VideoTimelineState>>;
  onMenuClick?: () => void;
  onBack?: () => void;
}) {
  const [selectedScript, setSelectedScript] = useState<ViralScript | null>(null);
  const [isHubCollapsed, setIsHubCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'hub' | 'studio'>('hub');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Common State
  const [activeTab, setActiveTab] = useState<'create' | 'analyze'>('create');
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('entertainment');
  const [tone, setTone] = useState('energetic');
  const [platform, setPlatform] = useState('tiktok');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scripts, setScripts] = useState<ViralScript[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const niches = [
    { id: 'entertainment', name: 'Entretenimento', icon: <Video size={14} /> },
    { id: 'education', name: 'Educação / Tutorial', icon: <TrendingUp size={14} /> },
    { id: 'finance', name: 'Finanças / Business', icon: <Target size={14} /> },
    { id: 'lifestyle', name: 'Lifestyle / Vlog', icon: <Clock size={14} /> },
  ];

  const tones = [
    { id: 'energetic', name: 'Energético' },
    { id: 'educational', name: 'Educativo' },
    { id: 'funny', name: 'Engraçado' },
    { id: 'emotional', name: 'Emocional' },
  ];

  const platforms = [
    { id: 'tiktok', name: 'TikTok' },
    { id: 'shorts', name: 'YouTube Shorts' },
    { id: 'reels', name: 'Instagram Reels' },
    { id: 'youtube', name: 'YouTube (Long)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setTranscription(null);
      setMobileTab('studio'); // Auto-navigate to studio
    }
  };

  const analyzeVideo = async () => {
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if (!videoFile || !effectiveApiKey) return;

    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: effectiveApiKey });

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(videoFile);
      });

      const base64Data = await base64Promise;

      const prompt = "Analise este vídeo. Forneça uma transcrição completa das falas e identifique a estrutura do roteiro (Hook, Retenção, CTA).";

      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: videoFile.type
                }
              }
            ]
          }
        ]
      });

      setTranscription(result.text);
    } catch (error) {
      console.error("Erro ao analisar vídeo:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateViralScript = async (referenceContent?: string) => {
    const currentTopic = referenceContent ? "Baseado na referência analisada" : topic;
    const effectiveApiKey = process.env.GEMINI_API_KEY || apiKeys.gemini;
    if ((!currentTopic && !referenceContent) || !effectiveApiKey) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const prompt = referenceContent 
        ? `Use este conteúdo como REFERÊNCIA ESTRATÉGICA (vibe, estrutura, gatilhos): "${referenceContent}".
           Crie um NOVO roteiro totalmente original, mas com a mesma 'PEGADA' funcional e estilo de retenção para ${platform}.
           Nicho: ${niche}
           Tom: ${tone}`
        : `Crie um roteiro viral estratégico para ${platform}.
           Assunto: ${topic}
           Nicho: ${niche}
           Tom: ${tone}`;
      
      const viralRules = `
      REGRAS DE VIRALIDADE (Baseadas em análise de 52k canais):
      1. TÍTULO: Máximo 5 palavras (~30 caracteres). Simples e direto. NÃO use números. Use gatilhos de NEGATIVIDADE ou URGÊNCIA (ex: 'Não faça isso', 'O erro fatal').
      2. CONTEÚDO: Se for educativo, apresente como ENTRETENIMENTO. Foco total em retenção.
      3. DURACÃO: Se for YouTube Long, sugira estrutura para 18-24 minutos.
      4. THUMBNAIL: SEM TEXTO. Deve usar cores vibrantes (Ciano é recomendado).
      `;

      const finalPrompt = `${prompt}
      ${viralRules}
      O roteiro deve ter 3 partes: GANCHO (Hook), CORPO (Body) e CHAMADA (CTA).
      Responda em formato JSON:
      {
        "suggestedTitle": "Title here (max 5 words, simple, no numbers, negative/urgent)",
        "thumbnailStrategy": "Explanations of the thumbnail visual strategy following the rules (cyan colors, no text)",
        "sections": [
          { "title": "GANCHO", "content": "texto...", "visualCue": "sugestão visual em português" },
          { "title": "CORPO", "content": "texto...", "visualCue": "sugestão visual em português" },
          { "title": "CTA", "content": "texto...", "visualCue": "sugestão visual em português" }
        ],
        "imagePrompt": "A highly detailed image prompt in ENGLISH for AI generation. Must follow: NO TEXT in image, use vibrant cyan and bright lighting, simple composition."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text);
      
      // Generate individual visual reference
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
          parts: [{ text: `${data.imagePrompt}. Cinematic, modern, 8k, viral energy.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

      let imageUrl = '';
      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      const newScript: ViralScript = {
        id: Math.random().toString(36).substr(2, 9),
        topic: referenceContent ? "Roteiro via Inteligência de Referência" : topic,
        suggestedTitle: data.suggestedTitle,
        thumbnailStrategy: data.thumbnailStrategy,
        sections: data.sections,
        imageUrl,
        isReferenceBased: !!referenceContent
      };

      setScripts(prev => [newScript, ...prev]);
      setActiveTab('create');
      // Set current script context for studio
      setSelectedScript(newScript);
      if (referenceContent) {
        // Notification logic should be handled by App.tsx, but UI feedback is good
      }
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-black relative">
       {/* FULL SCREEN VIDEO EDITOR */}
       <div className="flex-1 h-full bg-black relative flex overflow-hidden">
        <ViralStudio 
          initialScript={selectedScript || undefined} 
          timeline={timeline}
          setTimeline={setTimeline}
          videoFile={videoFile}
          apiKeys={apiKeys}
          onMenuClick={onMenuClick}
          onBack={onBack}
        />
       </div>
    </div>
  );
}
