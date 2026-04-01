export interface ApiKeys {
  gemini: string;
  openai: string;
  groq: string;
  whatsappNumbers: string[];
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionInstanceName: string;
  alexaSkillId: string;
  tuyaClientId: string;
  tuyaClientSecret: string;
  tuyaRegion: string;
}

export type WorkspaceMode = 'home' | 'writing' | 'folder_construction';

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
