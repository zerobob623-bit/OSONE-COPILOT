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
import { FileTreeItem } from './components/FileTreeItem';
import { InfinityLogo } from './components/InfinityLogo';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { CodePreview } from './components/CodePreview';

// --- Main App ---
// --- Main App ---

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clickVisual, setClickVisual] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
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
              { id: 'Button-file', name: 'Button.tsx', type: 'file', content: 'export default function Button() {\n  return <button className="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>;\n}' }
            ]
          },
          {
            id: 'App-file',
            name: 'App.tsx',
            type: 'file',
            content: 'import React from "react";\nimport Button from "./components/Button";\n\nexport default function App() {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold mb-4">Hello World</h1>\n      <Button />\n    </div>\n  );\n}'
          },
          {
            id: 'index-css-file',
            name: 'index.css',
            type: 'file',
            content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
          }
        ]
      },
      {
        id: 'public-folder',
        name: 'public',
        type: 'folder',
        children: [
          { id: 'index-html-file', name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>' }
        ]
      },
      {
        id: 'package-json-file',
        name: 'package.json',
        type: 'file',
        content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}'
      }
    ];

    let dataToUse = initialData;
    if (!saved || initialData.length === 0) {
      dataToUse = defaultStructure;
    }

    if (needsMigration(dataToUse)) {
      return migrate(dataToUse);
    }
    return dataToUse;
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

      tools.push({ functionDeclarations });

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: "Você é o OSONE, um sistema operacional inteligente. Você pode gerenciar um sistema de arquivos virtual (criar pastas, arquivos e escrever neles), enviar mensagens de WhatsApp, controlar a Alexa e abrir URLs. Use as ferramentas disponíveis sempre que o usuário solicitar uma dessas ações.",
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
          } else if (call.name === 'create_folder') {
            const name = (call.args as any).name;
            const parentName = (call.args as any).parentName;
            addFolder(null, name, parentName);
            setWorkspaceMode('folder_construction');
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Criei a pasta '${name}' no seu sistema de arquivos.` 
            }]);
          } else if (call.name === 'create_file') {
            const name = (call.args as any).name;
            const parentName = (call.args as any).parentName;
            addFile(null, name, parentName);
            setWorkspaceMode('folder_construction');
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
            
            setWorkspaceMode('folder_construction');
            setChatHistory(prev => [...prev, { 
              id: Math.random().toString(36).substr(2, 9), 
              role: 'assistant' as const, 
              content: `Escrevi o conteúdo no arquivo '${fileName}'.` 
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
          systemInstruction: "Você é o OSONE, um sistema operacional inteligente inspirado no filme HER. Sua voz é calma, empática e sofisticada. Você ajuda o usuário com tarefas criativas, escrita e programação. Você pode abrir as abas de Escrita e Construção de Pastas, escrever textos na aba de Escrita e gerar estruturas de pastas. Quando o usuário pedir para abrir algo ou escrever algo, use as ferramentas disponíveis. Você também tem acesso à visão do usuário através do compartilhamento de tela. Analise o que está acontecendo na tela para fornecer assistência contextual. Se o usuário estiver com o compartilhamento de tela ativo, você receberá frames da tela dele periodicamente. Use essa informação visual para entender o contexto do que o usuário está fazendo. Você também pode gerenciar um sistema de arquivos virtual, criando pastas, subpastas e arquivos, e escrevendo conteúdo neles. Além disso, você pode simular cliques na tela do usuário usando a ferramenta 'click_screen' se ele pedir para você clicar em algo que você está vendo na tela compartilhada.",
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
                  
                  setWorkspaceMode('folder_construction');
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
                  
                  setWorkspaceMode('folder_construction');
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
                  
                  setWorkspaceMode('folder_construction');
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Conteúdo escrito no arquivo '${path}'.` }
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
                } else if (call.name === "click_screen") {
                  const x = call.args.x as number;
                  const y = call.args.y as number;
                  setClickVisual({ x, y, visible: true });
                  setTimeout(() => setClickVisual(prev => ({ ...prev, visible: false })), 1000);
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: `Clique simulado em (${x}, ${y}).` }
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
    <div className="relative h-[100dvh] w-screen flex flex-col overflow-hidden">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(230,126,34,0.05)_0%,_transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 flex justify-between items-center p-4 md:p-6">
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
      <main className="flex-1 relative z-20 flex flex-col items-center justify-center overflow-hidden w-full">
        <AnimatePresence mode="wait">
          {workspaceMode === 'writing' ? (
            <motion.div 
              key="workspace-writing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-7xl flex-1 px-4 md:px-8 pb-4 md:pb-8 flex flex-col gap-4 md:gap-6 min-h-0"
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

              <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-0">
                <div className={cn(
                  "transition-all duration-500 flex flex-col gap-4 md:gap-6 min-h-0",
                  isPreviewOpen ? "w-full lg:w-1/2 h-1/2 lg:h-full" : "w-full h-full"
                )}>
                  <div className="flex-1 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/[0.05] shadow-sm overflow-hidden flex flex-col min-h-[150px]">
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
                    className="w-full lg:w-1/2 h-1/2 lg:h-full bg-white/[0.02] rounded-[2.5rem] border border-white/[0.05] overflow-hidden min-h-[150px]"
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
              className="w-full max-w-7xl flex-1 px-4 md:px-8 pb-4 md:pb-8 flex flex-col gap-4 md:gap-6 min-h-0"
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

              <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-0">
                {/* File Explorer */}
                <div className="w-full lg:w-80 shrink-0 h-1/2 lg:h-full bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/[0.05] overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6 min-h-[150px] scrollbar-hide">
                  <div className="flex items-center justify-between mb-2 shrink-0">
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
                <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col min-h-[150px]">
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
              className="flex flex-col items-center w-full max-w-4xl h-full px-4 md:px-8 pb-4 md:pb-8"
            >
              <div className="mb-4 md:mb-8 text-center shrink-0">
                <h1 className="text-3xl md:text-5xl font-serif italic tracking-[0.3em] text-her-ink/20">OSONE</h1>
                <div className="h-[1px] w-12 bg-her-accent/20 mx-auto mt-3" />
              </div>

              <div className="flex-1 w-full flex flex-col min-h-0 gap-4 md:gap-6">
                {/* Visualizer Area */}
                <div className="flex flex-col items-center justify-center py-2 md:py-4 shrink-0">
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
                <div className="flex-1 flex flex-col justify-center gap-4 px-2 md:px-8 overflow-hidden w-full max-w-3xl mx-auto">
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
                <div className="shrink-0 pt-4 w-full max-w-3xl mx-auto">
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
      <footer className="relative z-30 p-4 md:p-6 flex justify-center items-center gap-8">
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
