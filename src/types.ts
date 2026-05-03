export interface ApiKeys {
  gemini: string;
}

export type OrbStyle = 'classic' | 'superintelligence' | 'neural';
export type AppTheme = 'her' | 'cyberpunk' | 'monochrome' | 'nature';

export type WorkspaceMode = 'home' | 'writing' | 'webtoon' | 'sounds' | 'viralflow' | 'canvas';

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

export interface LiveState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error?: string;
}
