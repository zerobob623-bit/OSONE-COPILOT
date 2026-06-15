export interface AIProfile {
  name: string;
  personality: string;
  writingStyle: string;
  obsidianConfig?: {
    baseUrl: string;
    apiKey: string;
    vaultName?: string;
  };
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface ApiKeys {
  gemini: string;
  googleHomeId?: string;
  googleHomeToken?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  elevenLabsStability?: number;
  elevenLabsSimilarityBoost?: number;
  elevenLabsStyle?: number;
  elevenLabsSpeakerBoost?: boolean;
  elevenLabsModel?: string;
  geminiModel?: 'gemini-3.5-flash' | 'gemini-2.5-flash';
  googleCustomSearchApiKey?: string;
  googleCustomSearchCx?: string;
}

export type OrbStyle = 'classic' | 'superintelligence' | 'neural' | 'shadow' | 'wave' | 'jarvis';
export type AppTheme = 'her' | 'cyberpunk' | 'monochrome' | 'nature';

export type WorkspaceMode = 'home' | 'writing' | 'sounds' | 'canvas' | 'wellness' | 'aural_control' | 'local_control' | 'whatsapp' | 'map' | 'rag' | 'creator' | 'tiktok' | 'lens' | 'sentinel';

export interface RagFile {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  type: string;
  isActive: boolean;
}

export interface DrawingObject {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  points?: number[]; // For lines/polygons
  stroke?: string;
  fill?: string;
  opacity?: number;
}

export interface SoundEffect {
  id: string;
  name: string;
  category: string;
  url: string;
}

export interface Character {
  id: string;
  name: string;
  characteristics: string;
  imageUrl?: string;
}

export interface WebtoonPanel {
  id: string;
  imageUrl?: string;
  dialogue: string;
  narration: string;
  panelNumber: number;
  imagePrompt?: string;
}

export interface WebtoonProject {
  id: string;
  title: string;
  idea: string;
  characters: Character[];
  style: string;
  language: string;
  panels: WebtoonPanel[];
  createdAt: number;
}

export interface VirtualFile {
  id: string;
  name: string;
  content: string;
  type: 'file';
}

export interface VirtualFolder {
  id: string;
  name: string;
  children: FileSystemItem[];
  type: 'folder';
}

export type FileSystemItem = VirtualFile | VirtualFolder;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export interface SkeletonPlan {
  id: string;
  title: string;
  content: string; // Markdown
  status: 'pending' | 'approved' | 'rejected';
}

export interface LiveState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error?: string;
}

export interface VoiceModulation {
  pitch: number;
  rate: number;
  distortion: number;
}

export interface WritingProject {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}



