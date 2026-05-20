import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Computer, 
  Terminal, 
  HardDrive, 
  Cpu, 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Upload, 
  Power, 
  RefreshCw, 
  Code,
  Copy, 
  Check, 
  Play, 
  FileCode, 
  Video, 
  Settings, 
  Music, 
  Calculator, 
  Chrome, 
  MousePointer, 
  FolderOpen,
  Plus,
  Trash2,
  FileUp,
  ExternalLink,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

// Native OSONE bridge controller script template for the user's local PC
const BRIDGE_SCRIPT = `/**
 * OSONE 4 - Computer Linker Bridge (Ponte de Conexão Física)
 * Execute este script no seu computador para permitir controle real de arquivos e abrir aplicativos.
 * Roda nativamente no Node.js (Sem necessidade de npm install).
 * 
 * Execução rápida:
 * 1. Salve este arquivo como "osone-bridge.js"
 * 2. Abra o terminal na pasta e digite: node osone-bridge.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 4488;

const server = http.createServer((req, res) => {
  // Configuração simplificada de CORS para acesso seguro a partir do OSONE local/web
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const pathname = url.pathname;

  // Status de conexão e metadados básicos do OS
  if (pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'online', 
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      home: process.env.HOME || process.env.USERPROFILE || '.',
      username: process.env.USER || process.env.USERNAME || 'Usuário Local'
    }));
    return;
  }

  // Listagem de Arquivos Real do HD
  if (pathname === '/files/list') {
    let targetPath = url.searchParams.get('path');
    if (!targetPath) {
      targetPath = process.env.HOME || process.env.USERPROFILE || '.';
    }
    
    try {
      const parentDir = path.dirname(targetPath);
      const items = fs.readdirSync(targetPath, { withFileTypes: true });
      const list = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'folder' : 'file',
        path: path.join(targetPath, item.name)
      }));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        currentPath: path.resolve(targetPath), 
        parentPath: path.resolve(parentDir) === path.resolve(targetPath) ? null : path.resolve(parentDir),
        items: list 
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Leitura de Arquivo Local em tempo real
  if (pathname === '/files/read') {
    let targetPath = url.searchParams.get('path');
    try {
      if (!targetPath) throw new Error('O caminho do arquivo é obrigatório');
      const content = fs.readFileSync(targetPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, content }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Escrita / Criação de Arquivo Local
  if (pathname === '/files/write' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.path) throw new Error('O caminho para salvar o arquivo é obrigatório');
        fs.writeFileSync(data.path, data.content || '', 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Arquivo salvo com sucesso' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Deletar Arquivo Local
  if (pathname === '/files/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.path) throw new Error('O caminho do item é obrigatório');
        
        const stat = fs.statSync(data.path);
        if (stat.isDirectory()) {
          fs.rmdirSync(data.path, { recursive: true });
        } else {
          fs.unlinkSync(data.path);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Item excluído com sucesso' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Launch / Abrir Aplicativos no S.O. Local
  if (pathname === '/apps/launch') {
    const appName = url.searchParams.get('name');
    let command = '';

    if (process.platform === 'win32') { // Windows
      switch (appName) {
        case 'vscode': command = 'code .'; break;
        case 'calc': command = 'calc'; break;
        case 'notepad': command = 'start notepad'; break;
        case 'navigator': command = 'start chrome || start msedge || start explorer'; break;
        case 'spotify': command = 'start spotify'; break;
        case 'explorer': command = 'explorer .'; break;
        case 'terminal': command = 'start cmd'; break;
        default: command = appName;
      }
    } else if (process.platform === 'darwin') { // macOS
      switch (appName) {
        case 'vscode': command = 'code .'; break;
        case 'calc': command = 'open -a Calculator'; break;
        case 'notepad': command = 'open -a TextEdit'; break;
        case 'navigator': command = 'open -a "Google Chrome" || open http://google.com'; break;
        case 'spotify': command = 'open -a Spotify'; break;
        case 'explorer': command = 'open .'; break;
        case 'terminal': command = 'open -a Terminal'; break;
        default: command = \`open -a "\${appName}"\`;
      }
    } else { // Linux
      switch (appName) {
        case 'vscode': command = 'code .'; break;
        case 'calc': command = 'gnome-calculator || xcalc || mate-calc'; break;
        case 'notepad': command = 'gedit || nano'; break;
        case 'navigator': command = 'xdg-open http://google.com || google-chrome || chromium-browser'; break;
        case 'spotify': command = 'spotify'; break;
        case 'explorer': command = 'xdg-open .'; break;
        case 'terminal': command = 'xterm || gnome-terminal || mate-terminal'; break;
        default: command = appName;
      }
    }

    if (command) {
      exec(command, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command }));
        }
      });
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Aplicativo desconhecido' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(\`==================================================\`);
  console.log(\`OSONE Bridge Conectada! Rodando em http://127.0.0.1:\${PORT}\`);
  console.log(\`Pronta para receber requisições do seu OSONE 4 no navegador.\`);
  console.log(\`==================================================\`);
});
`;

// Simulated/Emulated files & directories context when bridge is offline
const INITIAL_EMULATED_FILES = [
  { name: 'Documentos', type: 'folder', path: 'C:/Users/Local/Documentos' },
  { name: 'Projetos', type: 'folder', path: 'C:/Users/Local/Projetos' },
  { name: 'Musicas', type: 'folder', path: 'C:/Users/Local/Musicas' },
  { name: 'Download', type: 'folder', path: 'C:/Users/Local/Downloads' },
  { name: 'osone_notes.txt', type: 'file', path: 'C:/Users/Local/Documentos/osone_notes.txt', content: 'Este é o OSONE Inteligência Artificial ativado.' },
  { name: 'ai_mindset.json', type: 'file', path: 'C:/Users/Local/Projetos/ai_mindset.json', content: '{\n  "version": "4.0.0",\n  "status": "awake",\n  "system": "OSONE SKELETON BRAIN"\n}' },
  { name: 'script.py', type: 'file', path: 'C:/Users/Local/Projetos/script.py', content: 'print("Olá Mundo da IA!")\n' }
];

export const LocalControl = ({ onClose }: { onClose: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [bridgeUrl] = useState('http://127.0.0.1:4488');
  const [osMeta, setOsMeta] = useState<any>(null);
  
  // Navigation & filesystem state
  const [currentPath, setCurrentPath] = useState('C:/Users/Local');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  // File View / Write Modal
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  
  // Alerts / Logs feed
  const [statusLogs, setStatusLogs] = useState<string[]>(['Painel de Controle de Automação Local carregado.']);
  
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Check Connection with the real Localhost bridge
  const checkConnection = async (silent = false) => {
    if (!silent) setIsChecking(true);
    try {
      const response = await fetch(`${bridgeUrl}/status`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setOsMeta(data);
        if (!isConnected) {
          addLog(`Conectado com sucesso ao computador local de: ${data.username || 'Usuário'} (${data.platform})`);
          // Navigate to real user Home directory
          setCurrentPath(data.home);
          loadFiles(data.home, true);
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      if (isConnected) {
        setIsConnected(false);
        setOsMeta(null);
        addLog('Conexão perdida com o computador local. Entrando em Modo Demonstrativo.');
        // Fallback to emulated
        loadEmulatedFiles(currentPath);
      } else if (!silent) {
        addLog('Ponte OSONE Linker offline no IP 127.0.0.1:4488. Use ou copie o instalador abaixo para ativar.');
      }
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  // Periodic automatic reconnection attempts (every 5 seconds)
  useEffect(() => {
    checkConnection(true);
    const interval = setInterval(() => {
      checkConnection(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Handle file list loading
  const loadFiles = async (dirPath: string, useRealBridge = isConnected) => {
    if (useRealBridge) {
      try {
        const response = await fetch(`${bridgeUrl}/files/list?path=${encodeURIComponent(dirPath)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentPath(data.currentPath);
            setParentPath(data.parentPath);
            setItems(data.items);
          } else {
            addLog(`Falha ao acessar diretório local: ${data.error}`);
          }
        }
      } catch (err) {
        addLog('Falha de rede ao listar arquivo real.');
      }
    } else {
      loadEmulatedFiles(dirPath);
    }
  };

  // Emulated filesystem operations
  const loadEmulatedFiles = (dirPath: string) => {
    // Basic filter of items starting with or belonging within path
    const normalizedPath = dirPath.replace(/\\/g, '/');
    setCurrentPath(normalizedPath);
    
    // Settle generic parent folders
    const pathParts = normalizedPath.split('/');
    if (pathParts.length > 1) {
      setParentPath(pathParts.slice(0, -1).join('/'));
    } else {
      setParentPath(null);
    }

    // Filter items mimicking subdirectories
    let filteredItems = INITIAL_EMULATED_FILES.filter(f => {
      const parentOfFile = f.path.substring(0, f.path.lastIndexOf('/'));
      return parentOfFile === normalizedPath;
    });

    // If empty emulated space, populate standard directory
    if (filteredItems.length === 0) {
      filteredItems = [
        { name: 'meu_arquivo_de_texto.txt', type: 'file', path: `${normalizedPath}/meu_arquivo_de_texto.txt`, content: 'Exemplo de texto gerado para arquivos virtuais.' },
        { name: 'backup_projetos', type: 'folder', path: `${normalizedPath}/backup_projetos` }
      ];
    }
    
    setItems(filteredItems);
  };

  // Bootstrap files default load
  useEffect(() => {
    loadFiles(currentPath);
  }, []);

  // Launch Computer Apps
  const launchApp = async (appName: string, label: string) => {
    addLog(`Comando de ativação enviado: [Abrir ${label}]`);
    if (isConnected) {
      try {
        const response = await fetch(`${bridgeUrl}/apps/launch?name=${encodeURIComponent(appName)}`);
        const data = await response.json();
        if (data.success) {
          addLog(`Aplicativo lançado com sucesso no PC: ${label} (Comando: ${data.command})`);
        } else {
          addLog(`Erro ao abrir aplicativo no PC: ${data.error || 'Falha de processador'}`);
        }
      } catch (err) {
        addLog(`Erro ao se comunicar com a ponte local para lançar ${label}`);
      }
    } else {
      // Emu simulated delay
      const appCommand = {
        vscode: "code .",
        calc: "calc",
        notepad: "start notepad",
        navigator: "chrome.exe",
        spotify: "spotify",
        explorer: "explorer .",
        terminal: "start cmd"
      }[appName] || appName;
      
      addLog(`[DEMO] Iniciando simulação de execução remota...`);
      setTimeout(() => {
        addLog(`[DEMO - OFF] Aplicativo seria aberto de verdade no Host via comando: "${appCommand}"`);
      }, 700);
    }
  };

  // Read single File
  const handleReadFile = async (file: any) => {
    if (isConnected) {
      try {
        const response = await fetch(`${bridgeUrl}/files/read?path=${encodeURIComponent(file.path)}`);
        const data = await response.json();
        if (data.success) {
          setSelectedFile(file);
          setFileContent(data.content);
        } else {
          addLog(`Erro ao ler arquivo: ${data.error}`);
        }
      } catch (err) {
        addLog('Erro de transmissão ao ler o arquivo.');
      }
    } else {
      setSelectedFile(file);
      setFileContent(file.content || 'Este arquivo é simulado. Abra a ponte para ler arquivos do seu HD.');
    }
  };

  // Click handler for items
  const handleItemClick = (item: any) => {
    if (item.type === 'folder') {
      loadFiles(item.path);
    } else {
      handleReadFile(item);
    }
  };

  // Create Virtual/Real File
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const fileFullPath = `${currentPath}/${newFileName}`;
    
    if (isConnected) {
      try {
        setIsSaving(true);
        const response = await fetch(`${bridgeUrl}/files/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: fileFullPath,
            content: `// Arquivo criado em: ${new Date().toLocaleString()}\n`
          })
        });
        const data = await response.json();
        if (data.success) {
          addLog(`Arquivo criado no disco rígido: ${newFileName}`);
          loadFiles(currentPath);
          setNewFileName('');
          setIsCreatingFile(false);
        } else {
          addLog(`Falha ao criar arquivo: ${data.error}`);
        }
      } catch (err) {
        addLog('Erro de rede ao criar arquivo físico.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Offline emulated
      INITIAL_EMULATED_FILES.push({
        name: newFileName,
        type: 'file',
        path: fileFullPath,
        content: `// Código ou Texto do OSONE Virtual\n`
      });
      addLog(`Arquivo virtual criado no emulador: ${newFileName}`);
      loadEmulatedFiles(currentPath);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  // Save current File Content back
  const handleSaveFileContent = async () => {
    if (!selectedFile) return;
    
    if (isConnected) {
      try {
        setIsSaving(true);
        const response = await fetch(`${bridgeUrl}/files/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: selectedFile.path,
            content: fileContent
          })
        });
        const data = await response.json();
        if (data.success) {
          addLog(`Arquivo salvo fisicamente: ${selectedFile.name}`);
          setSelectedFile(null);
        } else {
          addLog(`Erro ao escrever no arquivo: ${data.error}`);
        }
      } catch (err) {
        addLog('Falha ao salvar modificações no arquivo.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Offline Emulated save
      const index = INITIAL_EMULATED_FILES.findIndex(f => f.path === selectedFile.path);
      if (index !== -1) {
        INITIAL_EMULATED_FILES[index].content = fileContent;
      }
      addLog(`[Offline] Conteúdo atualizado no arquivo virtual: ${selectedFile.name}`);
      setSelectedFile(null);
    }
  };

  // Delete File list item
  const handleDeleteItem = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!confirm(`Deseja realmente excluir: ${item.name}?`)) return;

    if (isConnected) {
      try {
        const response = await fetch(`${bridgeUrl}/files/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: item.path })
        });
        const data = await response.json();
        if (data.success) {
          addLog(`Excluído fisicamente do HD: ${item.name}`);
          loadFiles(currentPath);
        } else {
          addLog(`Erro ao excluir: ${data.error}`);
        }
      } catch (err) {
        addLog('Falha ao excluir o arquivo físico.');
      }
    } else {
      const idx = INITIAL_EMULATED_FILES.findIndex(f => f.path === item.path);
      if (idx !== -1) {
        INITIAL_EMULATED_FILES.splice(idx, 1);
      }
      addLog(`[Offline] Item excluído do simulador: ${item.name}`);
      loadEmulatedFiles(currentPath);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(BRIDGE_SCRIPT);
    setIsCopied(true);
    addLog('Código da OSONE Linker copiado para a área de transferência.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 bg-her-bg overflow-y-auto p-4 md:p-6 custom-scrollbar text-her-ink">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-her-accent/15 text-her-accent border border-her-accent/20 rounded-2xl">
            <Computer size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic tracking-wide font-light">Controle do Computador</h1>
            <p className="text-xs text-her-muted font-mono leading-relaxed mt-0.5">Navegue por aplicativos e gerencie arquivos locais em tempo real.</p>
          </div>
        </div>

        {/* Status bar integration */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 border rounded-full text-xs font-mono font-medium flex items-center gap-2",
            isConnected 
              ? "bg-[#22d3ee]/14 text-[#22d3ee] border-[#22d3ee]/30" 
              : "bg-white/[0.03] text-her-muted border-white/[0.05]"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-[#22d3ee] animate-pulse" : "bg-her-muted/50")} />
            <span>{isConnected ? `SINC_ON: Host (${osMeta?.username})` : 'MODO_DEMO (Offline)'}</span>
          </div>

          <button 
            onClick={() => checkConnection(false)} 
            disabled={isChecking}
            className="p-2.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] text-her-ink rounded-xl transition"
            title="Sincronizar Computador"
          >
            <RefreshCw size={15} className={cn(isChecking && "animate-spin")} />
          </button>
          
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] text-xs uppercase tracking-widest text-her-muted rounded-xl transition"
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 min-h-0">
        
        {/* LEFT COLUMN: App Launcher & File Manager */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Desktop Application Control Center */}
          <div className="p-5 md:p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
            <div className="flex items-center gap-2 justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-her-muted font-semibold pointer-events-none flex items-center gap-2">
                <Terminal size={14} className="text-[#22d3ee]" /> Navegação por Aplicativos de Computador
              </span>
              <span className="text-[8px] font-mono opacity-40 uppercase">Acesso Executável</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { id: 'vscode', label: 'VS Code', icon: FileCode, desc: 'Editor de Código', color: 'hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400' },
                { id: 'explorer', label: 'Pastas / Explorer', icon: FolderOpen, desc: 'Gerenciador de Arquivos', color: 'hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400' },
                { id: 'terminal', label: 'Terminal / Exec', icon: Terminal, desc: 'Terminal do Sistema', color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400' },
                { id: 'navigator', label: 'Chrome / Navegador', icon: Chrome, desc: 'Navegar na Web', color: 'hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400' },
                { id: 'spotify', label: 'Spotify', icon: Music, desc: 'Biblioteca de Mídia', color: 'hover:border-green-500/30 hover:bg-green-500/5 hover:text-green-400' },
                { id: 'notepad', label: 'Notepad', icon: FileText, desc: 'Notas & Documentos', color: 'hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-400' },
                { id: 'calc', label: 'Calculadora', icon: Calculator, desc: 'Utilitário de Contas', color: 'hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-pink-400' }
              ].map((app) => (
                <button
                  key={app.id}
                  onClick={() => launchApp(app.id, app.label)}
                  className={cn(
                    "relative p-4 bg-[#0d0d0d] border border-white/5 rounded-2xl text-left transition duration-300 group overflow-hidden flex flex-col justify-between align-baseline",
                    app.color
                  )}
                >
                  <div className="flex justify-between w-full align-middle">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-105 transition-transform">
                      <app.icon size={18} />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={12} className="text-current" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold leading-none">{app.label}</p>
                    <p className="text-[10px] text-her-muted mt-1 leading-none group-hover:opacity-80 font-light truncate">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Real-time Interactive Local File System */}
          <div className="p-5 md:p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-her-muted font-semibold pointer-events-none flex items-center gap-2">
                <HardDrive size={14} className="text-[#a855f7]" /> Explorer - Sistema de Arquivos Remoto
              </span>
              
              {/* Explorer path and creation controls */}
              <div className="flex items-center gap-2">
                {isCreatingFile ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5"
                  >
                    <input 
                      type="text" 
                      placeholder="nome_do_arquivo.txt" 
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="px-3 py-1.5 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500 w-44"
                    />
                    <button 
                      onClick={handleCreateFile} 
                      className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition"
                      title="Salvar Novo Arquivo"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => { setIsCreatingFile(false); setNewFileName(''); }} 
                      className="p-2 bg-white/[0.01] hover:bg-white/[0.03] text-her-muted border border-white/5 rounded-lg transition"
                    >
                      X
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.04] text-her-ink border border-white/[0.05] rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> <span>Novo Arquivo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current path address bar */}
            <div className="flex items-center gap-2 p-3 bg-black/50 border border-white/5 rounded-xl text-xs font-mono shrink-0 mb-4 overflow-x-auto select-all">
              <button 
                onClick={() => parentPath && loadFiles(parentPath)}
                disabled={!parentPath}
                className={cn("p-1 text-her-ink transition", !parentPath ? "opacity-35 cursor-not-allowed" : "hover:scale-115")}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-her-muted select-none">Localização:</span>
              <span className="text-white/80 whitespace-nowrap">{currentPath || 'C:/'}</span>
            </div>

            {/* Files Grid and Explorer List */}
            <div className="flex-1 min-h-[300px] border border-white/5 lg:max-h-[500px] rounded-2xl bg-[#070707] overflow-y-auto p-2 custom-scrollbar">
              <div className="divide-y divide-white/[0.03]">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Folder size={32} className="text-her-muted opacity-30 mb-3" />
                    <p className="text-xs text-her-muted font-mono">Pasta vazia ou sem arquivos com autorização de leitura.</p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      onClick={() => handleItemClick(item)}
                      className="group flex items-center justify-between p-3.5 hover:bg-white/[0.02] cursor-pointer transition rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          item.type === 'folder' 
                            ? "bg-amber-400/5 text-amber-500 border border-amber-500/10" 
                            : "bg-[#22d3ee]/5 text-[#22d3ee] border border-[#22d3ee]/10"
                        )}>
                          {item.type === 'folder' ? <Folder size={15} /> : <FileText size={15} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white group-hover:text-cyan-400 transition">{item.name}</p>
                          <p className="text-[10px] text-her-muted font-mono leading-none tracking-tight select-none mt-1">{item.type.toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.type === 'file' && (
                          <div className="text-[9px] font-mono text-her-muted bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                            Clique para Editar
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteItem(e, item)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded transition-all"
                          title={`Excluir ${item.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Connection Tutorial & Command logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Section 3: Connection setup bridge instructions */}
          <div className="p-5 md:p-6 bg-gradient-to-b from-[#0a0f12] to-[#0b0c10] border border-white/[0.05] rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none select-none" />
            
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#22d3ee] font-semibold pointer-events-none flex items-center gap-2 mb-4">
              <Zap size={14} className="animate-pulse" /> Ativar Integração Direta Real
            </span>
            
            <p className="text-[11px] text-her-muted leading-relaxed font-light mb-4">
              O OSONE de navegador pode controlar seu computador e arquivos locais **de verdade**. Para isso, você apenas precisa rodar a ponte integrada local no Node.js.
            </p>

            <div className="space-y-4">
              {/* Terminal instruction code block */}
              <div className="p-3.5 bg-black/60 border border-white/10 rounded-2xl font-mono text-[10px] space-y-1.5">
                <p className="text-[#a855f7] select-none">// No terminal de comandos:</p>
                <p className="text-white">1. Crie o arquivo <span className="text-cyan-400">"osone-bridge.js"</span></p>
                <p className="text-white">2. Copie o script e execute:</p>
                <div className="bg-black border border-white/5 p-2 rounded text-emerald-400 select-all leading-tight">
                  node osone-bridge.js
                </div>
              </div>

              {/* Botão Copiar Script centralizado */}
              <button
                onClick={handleCopyScript}
                className={cn(
                  "w-full py-3 border rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-300",
                  isCopied
                    ? "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/30"
                    : "bg-[#22d3ee] hover:bg-[#22d3ee]/80 text-black border-transparent"
                )}
              >
                {isCopied ? (
                  <>
                    <Check size={14} />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Código da Ponte</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: System Event Log Feed */}
          <div className="p-5 md:p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl flex-1 flex flex-col min-h-[250px]">
            <span className="text-[10px] uppercase tracking-[0.25em] text-her-muted font-semibold pointer-events-none flex items-center gap-2 mb-4">
              <Code size={14} className="text-emerald-500" /> Registro de Operações
            </span>

            {/* Logs List Container */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-emerald-400 overflow-y-auto space-y-2 select-text h-[200px] lg:h-[300px] custom-scrollbar">
              {statusLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-white/[0.02] pb-1.5 last:border-0 opacity-90">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* File Editor Modal */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl flex flex-col max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <FileText size={16} className="text-[#22d3ee]" />
                  <span className="text-white font-bold">{selectedFile.name}</span>
                  <span className="text-white/40">({isConnected ? 'Arquivo Real' : 'Simulado'})</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs hover:text-white uppercase tracking-widest text-her-muted"
                >
                  X
                </button>
              </div>

              {/* Text area editor block */}
              <div className="flex-1 min-h-0 my-4">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-[#050505] border border-white/5 p-4 rounded-xl font-mono text-xs text-[#22d3ee]/90 focus:outline-none focus:border-[#22d3ee]/20 resize-none custom-scrollbar leading-relaxed"
                />
              </div>

              {/* Modal controls */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 shrink-0">
                <p className="text-[10px] font-mono text-her-muted select-none">Localização: {selectedFile.path}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 hover:bg-white/5 text-xs text-her-muted uppercase tracking-wider rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveFileContent}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black text-xs font-semibold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isSaving ? 'Gravando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
