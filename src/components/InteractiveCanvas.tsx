import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Eraser, Palette, Download, Trash2, Wand2, Gamepad2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { DrawingObject } from '../types';

interface InteractiveCanvasProps {
  objects: DrawingObject[];
  onDraw?: (obj: DrawingObject) => void;
  onClear?: () => void;
  isAIProcessing?: boolean;
}

export function InteractiveCanvas({ objects, onDraw, onClear, isAIProcessing }: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [currentColor, setCurrentColor] = useState('#8B5CF6');
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');

  const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF'];

  // Sync canvas size with container
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        drawAll();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [objects]);

  // Redraw when objects or currentPath changes
  useEffect(() => {
    drawAll();
  }, [objects, currentPath]);

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allObjects = [...objects];
    
    // Add current preview path
    if (currentPath.length >= 4) {
      allObjects.push({
        id: 'preview',
        type: 'line',
        x: currentPath[0],
        y: currentPath[1],
        points: currentPath,
        stroke: currentTool === 'eraser' ? '#121212' : currentColor, // Approximate bg color for eraser
        color: currentTool === 'eraser' ? '#121212' : currentColor,
      });
    }

    allObjects.forEach(obj => {
      ctx.beginPath();
      ctx.globalAlpha = obj.opacity ?? 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = obj.stroke || obj.color || '#000';
      ctx.fillStyle = obj.fill || obj.color || 'transparent';
      ctx.lineWidth = obj.type === 'line' ? (currentTool === 'eraser' && obj.id === 'preview' ? 20 : 4) : 2;

      switch (obj.type) {
        case 'rect':
          ctx.rect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          if (obj.fill) ctx.fill();
          ctx.stroke();
          break;
        case 'circle':
          ctx.arc(obj.x, obj.y, obj.radius || 0, 0, Math.PI * 2);
          if (obj.fill) ctx.fill();
          ctx.stroke();
          break;
        case 'line':
          if (obj.points && obj.points.length >= 4) {
            ctx.moveTo(obj.points[0], obj.points[1]);
            for (let i = 2; i < obj.points.length; i += 2) {
              ctx.lineTo(obj.points[i], obj.points[i+1]);
            }
            ctx.stroke();
          }
          break;
        case 'text':
          ctx.font = `${obj.fontSize || 16}px serif`;
          ctx.fillText(obj.text || '', obj.x, obj.y);
          break;
      }
    });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startManualDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([x, y, x, y]);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    setCurrentPath(prev => [...prev, x, y]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length >= 4 && onDraw) {
      onDraw({
        id: Math.random().toString(36).substr(2, 9),
        type: 'line',
        x: currentPath[0],
        y: currentPath[1],
        points: currentPath,
        stroke: currentTool === 'eraser' ? '#121212' : currentColor,
        color: currentTool === 'eraser' ? '#121212' : currentColor,
      });
    }
    setCurrentPath([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'osone-canvas.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-7xl flex-1 px-4 md:px-8 pb-4 md:pb-8 flex flex-col gap-6 h-full"
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-her-accent/20 flex items-center justify-center text-her-accent">
            <Gamepad2 size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-serif italic text-her-ink">Espaço Interativo</h2>
            <p className="text-xs text-her-muted opacity-60">Jogue, desenhe e interaja com o OSONE</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onClear}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-her-ink/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Limpar Canvas"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={handleDownload}
            className="px-6 py-2.5 bg-her-ink text-her-bg rounded-2xl text-sm font-medium transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-her-ink/20"
          >
            <Download size={18} />
            Salvar Arte
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Toolbar */}
        <div className="w-16 flex flex-col gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-3 shrink-0 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setCurrentTool('pen')}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
              currentTool === 'pen' ? "bg-her-accent text-white shadow-lg shadow-her-accent/20" : "text-her-ink/40 hover:bg-white/5"
            )}
          >
            <Palette size={18} />
          </button>
          <button 
            onClick={() => setCurrentTool('eraser')}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
              currentTool === 'eraser' ? "bg-her-accent text-white shadow-lg shadow-her-accent/20" : "text-her-ink/40 hover:bg-white/5"
            )}
          >
            <Eraser size={18} />
          </button>
          
          <div className="h-[1px] bg-white/10 w-8 mx-auto shrink-0" />

          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => { setCurrentColor(color); setCurrentTool('pen'); }}
              className={cn(
                "w-10 h-10 rounded-full transition-all border-2 shrink-0 p-1",
                currentColor === color && currentTool === 'pen' ? "border-her-accent scale-110 shadow-lg shadow-her-accent/20" : "border-transparent hover:scale-105"
              )}
            >
              <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
            </button>
          ))}
          
          <div className="flex-1" />
        </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[3rem] relative overflow-hidden group cursor-crosshair touch-none"
          onMouseDown={startManualDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startManualDrawing}
          onTouchMove={handleMouseMove}
          onTouchEnd={stopDrawing}
        >
          {objects.length === 0 && !isAIProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none opacity-20">
              <Wand2 size={48} className="mb-4 text-her-ink" />
              <h3 className="text-xl font-serif italic">O que vamos criar juntos?</h3>
              <p className="text-sm max-w-xs mt-2">Peça ao OSONE para desenhar algo ou iniciar um jogo visual.</p>
            </div>
          )}

          <canvas 
            ref={canvasRef}
            className="w-full h-full"
          />

        </div>
      </div>
    </motion.div>
  );
}
