import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, Settings, RefreshCw, Trash2, CircleDot, 
  MousePointer, Paintbrush, Power, Sliders, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HandTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  onAddNotification: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
}

export function HandTracker({ videoRef, isCameraActive, onAddNotification }: HandTrackerProps) {
  // Master states
  const [isActive, setIsActive] = useState(false);
  
  // Tracking inputs: 
  // 'skin': Skin color isolation
  // 'calibrated': Chroma filter calibrated
  // 'mouse': Virtual Mouse Emulation / Play mode
  const [trackingMode, setTrackingMode] = useState<'skin' | 'calibrated' | 'mouse'>('skin');
  const [interactionStyle, setInteractionStyle] = useState<'draw' | 'click' | 'hover'>('draw');
  
  // Compact state
  const [showSettings, setShowSettings] = useState(false);
  
  // Calibration colors
  const [calibratedColor, setCalibratedColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [tolerance, setTolerance] = useState(38);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Sensitivity settings
  const [sensitivity, setSensitivity] = useState(0.5); // Range scaling
  const [pinchThreshold, setPinchThreshold] = useState(0.85); // Detection threshold relative to baseline
  
  // Real-time diagnostics
  const [handsDetected, setHandsDetected] = useState(false);
  const [gestureState, setGestureState] = useState<'Mão Aberta' | 'Dedo Levantado' | 'Pinça'>('Mão Aberta');
  const [fps, setFps] = useState(30);

  // Screen Coordinates (absolute)
  const [screenCoords, setScreenCoords] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isDrawingLocal, setIsDrawingLocal] = useState(false);
  const [activeColor, setActiveColor] = useState('#22d3ee'); // Neon Cyan by default

  // Trail drawings
  const [drawings, setDrawings] = useState<Point[][]>([]);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);

  // Standalone camera stream for automatic, reliable feedback
  const [internalStream, setInternalStream] = useState<MediaStream | null>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Refs
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Moving filters
  const currentCoordsRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const previousCoordsRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isPinchingRef = useRef(false);
  const baselineSpreadRef = useRef<number>(0.15);
  const dwellStartTimeRef = useRef<number | null>(null);
  const hasTriggeredDwellClickRef = useRef<boolean>(false);

  // Toggle tracking activity
  const toggleActive = () => {
    const next = !isActive;
    setIsActive(next);
    if (next) {
      onAddNotification("Mão Inteligente G5 ativada com sucesso!", "success");
    } else {
      onAddNotification("Mão Inteligente G5 colocada em repouso.", "info");
      setHandsDetected(false);
      setGestureState('Mão Aberta');
    }
  };

  // Synchronize canvas dimensions to screen viewport
  useEffect(() => {
    const handleResize = () => {
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.width = window.innerWidth;
        drawingCanvasRef.current.height = window.innerHeight;
        redrawCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [drawings, currentLine, activeColor]);

  // Canvas drawing routine
  const redrawCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render historical lines
    drawings.forEach(line => {
      if (line.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line[0].color;
      ctx.lineWidth = line[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = line[0].color;
      
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      ctx.stroke();
    });

    // Render current active layout
    if (currentLine.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = currentLine[0].color;
      ctx.lineWidth = currentLine[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = currentLine[0].color;

      ctx.moveTo(currentLine[0].x, currentLine[0].y);
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };

  const clearDrawings = () => {
    setDrawings([]);
    setCurrentLine([]);
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
    onAddNotification("Rabisco apagado com sucesso!", "info");
  };

  // Frame grab color calibration
  const triggerCalibration = () => {
    if (!isCameraActive || !videoRef.current) {
      onAddNotification("É necessário ativiar a câmera de transmissão do OSONE para calibrar!", "error");
      return;
    }
    setIsCalibrating(true);
    setTrackingMode('calibrated');
    onAddNotification("Mantenha o objeto ou palma da mão bem no centro do feed por 2 segundos...", "info");

    setTimeout(() => {
      try {
        const video = videoRef.current;
        if (video) {
          const w = 160;
          const h = 120;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const tCtx = tempCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(video, 0, 0, w, h);
            // Center sample extraction
            const cropW = 10;
            const cropH = 10;
            const imgData = tCtx.getImageData(80 - cropW/2, 60 - cropH/2, cropW, cropH);
            const data = imgData.data;

            let rSum = 0, gSum = 0, bSum = 0;
            const size = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
              rSum += data[i];
              gSum += data[i+1];
              bSum += data[i+2];
            }

            const r = Math.round(rSum / size);
            const g = Math.round(gSum / size);
            const b = Math.round(bSum / size);

            setCalibratedColor({ r, g, b });
            setIsCalibrating(false);
            onAddNotification(`Chroma-Key calibrado com sucesso! RGB (${r}, ${g}, ${b})`, "success");
          }
        }
      } catch (err) {
        console.error(err);
        setIsCalibrating(false);
        onAddNotification("Erro ao obter espectro da cor. Reconectando webcam...", "error");
      }
    }, 2050);
  };

  // EFFECT: Direct Mouse Movement Tracking (Alternative / Playback mode)
  useEffect(() => {
    if (!isActive || trackingMode !== 'mouse') return;

    setHandsDetected(true);

    const handleMouseMove = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      
      setScreenCoords({ x: cx, y: cy });
      currentCoordsRef.current = { x: cx, y: cy };
      previousCoordsRef.current = { x: cx, y: cy };

      // Pinch & Finger Emulation
      const isMouseDown = e.buttons === 1;
      const isShiftDown = e.shiftKey;
      
      let simulatedGesture: 'Mão Aberta' | 'Dedo Levantado' | 'Pinça' = 'Mão Aberta';
      if (isMouseDown) {
        simulatedGesture = 'Pinça';
      } else if (isShiftDown) {
        simulatedGesture = 'Dedo Levantado';
      }
      
      isPinchingRef.current = (simulatedGesture === 'Pinça' || simulatedGesture === 'Dedo Levantado');
      setGestureState(simulatedGesture);

      handleActionsAtCoords(cx, cy, simulatedGesture);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive, trackingMode, interactionStyle, activeColor, drawings, currentLine]);

  // EFFECT: Automatically request and handle internal webcam stream if parent OSONE camera is inactive
  useEffect(() => {
    if (isActive && trackingMode !== 'mouse') {
      if (!isCameraActive || !videoRef.current) {
        if (!internalStream) {
          navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } })
            .then(stream => {
              setInternalStream(stream);
              if (internalVideoRef.current) {
                internalVideoRef.current.srcObject = stream;
                internalVideoRef.current.play().catch(e => console.error("Error starting backup video playback:", e));
              }
              onAddNotification("Visão G5 Conectada: Rastreando movimentos da mão!", "success");
            })
            .catch(err => {
              console.error("Internal tracker camera request denied or failed:", err);
              onAddNotification("Não foi possível acessar a câmera para o rastreio da mão.", "error");
            });
        }
      } else {
        // Clear if parent camera handles it
        if (internalStream) {
          internalStream.getTracks().forEach(t => t.stop());
          setInternalStream(null);
        }
      }
    } else {
      // release tracks if inactive or in mouse-emulation mode
      if (internalStream) {
        internalStream.getTracks().forEach(t => t.stop());
        setInternalStream(null);
      }
    }

    return () => {
      // Clean up on component unmount
      if (internalStream) {
        internalStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive, trackingMode, isCameraActive, videoRef]);

  // EFFECT: Video-based Computer Vision tracking thread
  useEffect(() => {
    if (!isActive || trackingMode === 'mouse') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    let frameCount = 0;

    const runVisionProcessing = () => {
      if (!isActive) return;

      const video = videoRef.current && videoRef.current.readyState >= 2
        ? videoRef.current
        : (internalVideoRef.current && internalVideoRef.current.readyState >= 2 ? internalVideoRef.current : null);

      if (video) {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }

        const width = 160;
        const height = 120;
        const offCanvas = offscreenCanvasRef.current;
        offCanvas.width = width;
        offCanvas.height = height;

        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.save();
          offCtx.scale(-1, 1);
          offCtx.drawImage(video, -width, 0, width, height);
          offCtx.restore();

          const imgData = offCtx.getImageData(0, 0, width, height);
          const pixels = imgData.data;

          let centroidX = 0;
          let centroidY = 0;
          let sumXSq = 0;
          let sumYSq = 0;
          let matchCount = 0;

          // Diagnostics frame mapping
          const viewCanvas = trackerCanvasRef.current;
          let viewCtx: CanvasRenderingContext2D | null = null;
          let viewData: ImageData | null = null;
          if (viewCanvas) {
            viewCanvas.width = width;
            viewCanvas.height = height;
            viewCtx = viewCanvas.getContext('2d');
            if (viewCtx) viewData = viewCtx.createImageData(width, height);
          }

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx+1];
              const b = pixels[idx+2];

              let isMatched = false;

              if (trackingMode === 'calibrated' && calibratedColor) {
                const dist = Math.sqrt((r - calibratedColor.r)**2 + (g - calibratedColor.g)**2 + (b - calibratedColor.b)**2);
                isMatched = dist < tolerance;
              } else {
                // Adaptive YCbCr + RGB skin segmentation
                const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                const isSkinYCbCr = (cb > 75 && cb < 129 && cr > 132 && cr < 174);

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const isSkinRGB = r > 65 && g > 45 && b > 25 && r > g && r > b && (max - min) > 15 && Math.abs(r - g) > 12;

                isMatched = isSkinYCbCr || isSkinRGB;
              }

              if (isMatched) {
                centroidX += x;
                centroidY += y;
                sumXSq += x * x;
                sumYSq += y * y;
                matchCount++;

                if (viewData) {
                  const targetIdx = (y * width + x) * 4;
                  viewData.data[targetIdx] = 34;    // Cyan overlay tracker visual
                  viewData.data[targetIdx+1] = 211;
                  viewData.data[targetIdx+2] = 238;
                  viewData.data[targetIdx+3] = 255;
                }
              } else if (viewData) {
                const targetIdx = (y * width + x) * 4;
                viewData.data[targetIdx] = Math.max(0, r - 150);
                viewData.data[targetIdx+1] = Math.max(0, g - 150);
                viewData.data[targetIdx+2] = Math.max(0, b - 150);
                viewData.data[targetIdx+3] = 255;
              }
            }
          }

          if (viewCtx && viewData) {
            viewCtx.putImageData(viewData, 0, 0);
            if (isCalibrating) {
              viewCtx.strokeStyle = '#22d3ee';
              viewCtx.lineWidth = 2;
              viewCtx.strokeRect(80 - 10, 60 - 10, 20, 20);
            }
          }

          // Centroid mapping & tracking trigger - minimum size to avoid stray noise
          if (matchCount > 120) {
            setHandsDetected(true);
            const cx = centroidX / matchCount;
            const cy = centroidY / matchCount;

            // Single-pass statistical variance calculation
            const varX = (sumXSq / matchCount) - (cx * cx);
            const varY = (sumYSq / matchCount) - (cy * cy);

            const stdX = Math.sqrt(Math.max(0, varX)) / width;
            const stdY = Math.sqrt(Math.max(0, varY)) / height;

            const frameSpread = Math.sqrt(stdX * stdX + stdY * stdY);

            // Re-adapt dynamic baseline spread
            if (baselineSpreadRef.current === 0.15 || (frameSpread > baselineSpreadRef.current && frameSpread < 0.35)) {
              baselineSpreadRef.current = baselineSpreadRef.current * 0.96 + frameSpread * 0.04;
            }

            const pinchRatio = frameSpread / baselineSpreadRef.current;
            const isPinching = pinchRatio < (0.72 * pinchThreshold);
            const spreadRatio = stdY / (stdX || 0.01);

            // High Precision Gesture Decoupler Heuristic
            let detectedGesture: 'Mão Aberta' | 'Dedo Levantado' | 'Pinça' = 'Mão Aberta';
            if (isPinching) {
              detectedGesture = 'Pinça';
            } else if (spreadRatio > 1.35 && stdX < 0.10) {
              detectedGesture = 'Dedo Levantado';
            } else {
              detectedGesture = 'Mão Aberta';
            }

            isPinchingRef.current = (detectedGesture === 'Pinça' || detectedGesture === 'Dedo Levantado');
            setGestureState(detectedGesture);

            // Map tracking screen coordinates
            const scaleMin = 0.5 - (sensitivity * 0.44);
            const scaleMax = 0.5 + (sensitivity * 0.44);

            const mapVal = (v: number) => {
              const normal = (v - scaleMin) / (scaleMax - scaleMin);
              return Math.max(0, Math.min(1, normal));
            };

            const targetScreenX = mapVal(cx / width) * window.innerWidth;
            const targetScreenY = mapVal(cy / height) * window.innerHeight;

            // Low-pass exponential filter to keep it extremely stable
            const filterWeight = 0.16;
            const filteredX = previousCoordsRef.current.x + (targetScreenX - previousCoordsRef.current.x) * filterWeight;
            const filteredY = previousCoordsRef.current.y + (targetScreenY - previousCoordsRef.current.y) * filterWeight;

            previousCoordsRef.current = { x: filteredX, y: filteredY };
            currentCoordsRef.current = { x: filteredX, y: filteredY };
            setScreenCoords({ x: filteredX, y: filteredY });

            handleActionsAtCoords(filteredX, filteredY, detectedGesture);
          } else {
            setHandsDetected(false);
            if (isDrawingLocal) {
              setDrawings(prev => [...prev, currentLine]);
              setCurrentLine([]);
              setIsDrawingLocal(false);
            }
            dwellStartTimeRef.current = null;
            hasTriggeredDwellClickRef.current = false;
          }
        }
      }

      // Live FPS calculations
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      animationFrameId.current = requestAnimationFrame(runVisionProcessing);
    };

    animationFrameId.current = requestAnimationFrame(runVisionProcessing);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isActive, trackingMode, calibratedColor, tolerance, sensitivity, pinchThreshold, isDrawingLocal, currentLine, isCameraActive, videoRef, internalStream]);

  // Execute pointer and coordinate actions
  const handleActionsAtCoords = (sx: number, sy: number, gesture: 'Mão Aberta' | 'Dedo Levantado' | 'Pinça') => {
    const isPinching = gesture === 'Pinça' || gesture === 'Dedo Levantado';
    if (interactionStyle === 'draw') {
      if (isPinching) {
        if (!isDrawingLocal) {
          setIsDrawingLocal(true);
        }
        const p: Point = { x: sx, y: sy, color: activeColor, size: 6.5 };
        setCurrentLine(prev => {
          const next = [...prev, p];
          if (next.length > 350) return next.slice(50);
          return next;
        });
        redrawCanvas();
      } else {
        if (isDrawingLocal) {
          setIsDrawingLocal(false);
          if (currentLine.length > 1) {
            setDrawings(prev => [...prev, currentLine]);
          }
          setCurrentLine([]);
        }
      }
    } 
    
    else if (interactionStyle === 'click') {
      if (isPinching) {
        if (!isDrawingLocal) {
          setIsDrawingLocal(true);
          simulateMouseClick(sx, sy);
        }
      } else {
        setIsDrawingLocal(false);
      }
    } 
    
    else if (interactionStyle === 'hover') {
      const prevX = previousCoordsRef.current.x;
      const prevY = previousCoordsRef.current.y;
      const distanceMoved = Math.sqrt((sx - prevX)**2 + (sy - prevY)**2);

      if (distanceMoved < 14) { 
        if (dwellStartTimeRef.current === null) {
          dwellStartTimeRef.current = performance.now();
          hasTriggeredDwellClickRef.current = false;
        } else {
          const elapsed = performance.now() - dwellStartTimeRef.current;
          if (elapsed >= 1000 && !hasTriggeredDwellClickRef.current) {
            simulateMouseClick(sx, sy);
            hasTriggeredDwellClickRef.current = true;
          }
        }
      } else {
        dwellStartTimeRef.current = performance.now();
        hasTriggeredDwellClickRef.current = false;
      }
    }
  };

  const simulateMouseClick = (x: number, y: number) => {
    // Coordinate targeted dispatch
    const targetElement = document.elementFromPoint(x, y) as HTMLElement;
    if (targetElement) {
      try {
        const dEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y });
        const uEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y });
        const cEvent = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y });

        targetElement.dispatchEvent(dEvent);
        targetElement.dispatchEvent(uEvent);
        targetElement.click();

        // High frequency digital click audio feedback
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(950, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1300, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);

        onAddNotification(`Clique executado na coordenada (${Math.round(x)}, ${Math.round(y)})`, "success");
      } catch (err) {
        console.error("Simulation click dispatch failed:", err);
      }
    }
  };

  const getSkeleton = (gesture: 'Mão Aberta' | 'Dedo Levantado' | 'Pinça') => {
    const joints: { [key: string]: { x: number; y: number } } = {};
    const bones: { from: string; to: string }[] = [];

    // Wrist & Carpal
    joints['wrist'] = { x: 50, y: 88 };
    joints['carpal'] = { x: 50, y: 68 };
    bones.push({ from: 'wrist', to: 'carpal' });

    // MCP Knuckles (at the base of fingers)
    const mcp = {
      thumb: { x: 32, y: 66 },
      index: { x: 38, y: 51 },
      middle: { x: 50, y: 46 },
      ring: { x: 62, y: 50 },
      pinky: { x: 68, y: 58 }
    };

    Object.entries(mcp).forEach(([name, pos]) => {
      joints[`mcp_${name}`] = pos;
      bones.push({ from: 'carpal', to: `mcp_${name}` });
    });

    // Metacarpal arch lines (connect knuckles together to form the palm structure)
    bones.push({ from: 'mcp_thumb', to: 'mcp_index' });
    bones.push({ from: 'mcp_index', to: 'mcp_middle' });
    bones.push({ from: 'mcp_middle', to: 'mcp_ring' });
    bones.push({ from: 'mcp_ring', to: 'mcp_pinky' });

    // Finger lines with joints
    const fingerSpecs = [
      { name: 'thumb', angles: [-130, -110], lengths: [12, 10], segments: ['pip', 'tip'] },
      { name: 'index', angles: [-90, -90, -90], lengths: [13, 11, 9], segments: ['pip', 'dip', 'tip'] },
      { name: 'middle', angles: [-76, -76, -76], lengths: [15, 12, 10], segments: ['pip', 'dip', 'tip'] },
      { name: 'ring', angles: [-56, -56, -56], lengths: [14, 11, 9], segments: ['pip', 'dip', 'tip'] },
      { name: 'pinky', angles: [-32, -32, -32], lengths: [11, 9, 8], segments: ['pip', 'dip', 'tip'] }
    ];

    fingerSpecs.forEach(finger => {
      let currentX = mcp[finger.name as keyof typeof mcp].x;
      let currentY = mcp[finger.name as keyof typeof mcp].y;
      let lastJoint = `mcp_${finger.name}`;

      finger.segments.forEach((seg, idx) => {
        let angleDeg = finger.angles[idx];
        let length = finger.lengths[idx];

        if (gesture === 'Pinça') {
          // Bending joint calculations when pinching
          if (finger.name === 'thumb') {
            angleDeg += (idx + 1) * 32;
            length *= 0.72;
          } else if (finger.name === 'index') {
            angleDeg -= (idx + 1) * 36;
            length *= 0.68;
          } else {
            angleDeg += (idx + 1) * 58;
            length *= 0.48;
          }
        } else if (gesture === 'Dedo Levantado') {
          // Single pointing finger - straight up index, other fingers curled
          if (finger.name === 'index') {
            angleDeg = -95;
            length *= 1.08;
          } else if (finger.name === 'thumb') {
            angleDeg += 38;
            length *= 0.45;
          } else {
            angleDeg += (idx + 1) * 65;
            length *= 0.45;
          }
        }

        const rad = (angleDeg * Math.PI) / 180;
        const nextX = currentX + Math.cos(rad) * length;
        const nextY = currentY + Math.sin(rad) * length;

        const jointName = `${finger.name}_${seg}`;
        joints[jointName] = { x: nextX, y: nextY };
        bones.push({ from: lastJoint, to: jointName });

        currentX = nextX;
        currentY = nextY;
        lastJoint = jointName;
      });
    });

    return { joints, bones };
  };

  return (
    <>
      {/* 1. Transparent Drawing Canvas and Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none select-none">
          {/* Overlay canvas for physical drawings */}
          <canvas 
            ref={drawingCanvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Dwell loader circle ring */}
          {interactionStyle === 'hover' && dwellStartTimeRef.current !== null && !hasTriggeredDwellClickRef.current && (
            <div 
              style={{ left: screenCoords.x - 22, top: screenCoords.y - 22, position: 'absolute' }}
              className="w-11 h-11 rounded-full border border-cyan-400/30 flex items-center justify-center animate-[spin_1.2s_linear_infinite]"
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-cyan-500/60" />
            </div>
          )}

          {/* Holographic Cybernetic tracking hand */}
          <div 
            style={{ 
              transform: `translate(${screenCoords.x - 45}px, ${screenCoords.y - 45}px)`,
              position: 'absolute',
              transition: 'transform 0.04s linear'
            }}
            className={cn(
              "w-[90px] h-[90px] flex items-center justify-center relative",
              handsDetected ? "opacity-100 scale-100" : "opacity-35 scale-90"
            )}
          >
            {/* Realistic fully-articulated cyber skeleton */}
            <svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 w-full h-full pointer-events-none z-10 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
            >
              {(() => {
                const gesture = gestureState;
                const isPinchingOrPointing = gesture === 'Pinça' || gesture === 'Dedo Levantado';
                const { joints, bones } = getSkeleton(gesture);
                
                const colorVal = gesture === 'Pinça' 
                  ? "#f43f5e" 
                  : (gesture === 'Dedo Levantado' ? "#fb7185" : activeColor);

                return (
                  <g>
                    {/* Render Bones as extremely thin lines */}
                    {bones.map((b, i) => {
                      const p1 = joints[b.from];
                      const p2 = joints[b.to];
                      if (!p1 || !p2) return null;
                      return (
                        <line
                          key={`bone_${i}`}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={colorVal}
                          strokeWidth="0.95"
                          opacity={0.85}
                          strokeLinecap="round"
                          className="transition-all duration-100"
                        />
                      );
                    })}

                    {/* Render Joints as distinct nodules */}
                    {Object.entries(joints).map(([name, pos]) => {
                      const isTip = name.includes('tip');
                      const isWrist = name === 'wrist';
                      const radius = isWrist ? 2.5 : (isTip ? 1.5 : 1.8);
                      
                      return (
                        <circle
                          key={`joint_${name}`}
                          cx={pos.x}
                          cy={pos.y}
                          r={radius}
                          fill={isPinchingOrPointing ? "#ffffff" : colorVal}
                          stroke={isPinchingOrPointing ? colorVal : "#ffffff"}
                          strokeWidth="0.5"
                          className="transition-all duration-100"
                        />
                      );
                    })}
                  </g>
                );
              })()}
            </svg>

            {/* Coord telemetry HUD text with real-time Gesture Indicators */}
            <div className="absolute top-[80px] text-[7.5px] font-mono whitespace-nowrap bg-black/90 px-2 py-0.5 rounded-full border border-white/10 text-zinc-300 shadow-lg flex items-center gap-1">
              <span className="text-[6.5px] text-zinc-500 uppercase tracking-wider">HUD</span>
              <span className="text-zinc-500">|</span>
              <span>X:{Math.round(screenCoords.x)}</span>
              <span>Y:{Math.round(screenCoords.y)}</span>
              <span className="text-zinc-500">|</span>
              <span className={cn(
                "font-semibold uppercase tracking-wider text-[7px]",
                gestureState === 'Pinça' ? "text-rose-400" : (gestureState === 'Dedo Levantado' ? "text-amber-400" : "text-cyan-400")
              )}>
                {gestureState}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Compact Capsule Dock (Floats at bottom right - NEVER blocks the central orb!) */}
      <div className="fixed bottom-28 right-6 z-[105] flex flex-col items-end gap-2.5 font-sans select-none">
        
        {/* Expanded Micro Panel Settings - Opens above/side instead of covering the central OSONE orb */}
        <AnimatePresence>
          {showSettings && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="w-72 bg-[#080808]/95 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 backdrop-blur-md text-zinc-100 font-sans"
            >
              {/* Vision state indicator */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-bold tracking-widest font-mono text-cyan-400 uppercase">Ajustes Micro-Mão</span>
                </div>
                <div className="text-[9px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                  {trackingMode === 'mouse' ? "Mouse Copy" : fps + " FPS"}
                </div>
              </div>

              {/* Source control dropdown toggles */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Modo de Rastreamento</span>
                <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/5 p-0.5 rounded-lg">
                  <button
                    onClick={() => setTrackingMode('mouse')}
                    className={cn(
                      "py-1 text-[8px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all",
                      trackingMode === 'mouse' ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Mouth-Copy
                  </button>
                  <button
                    onClick={() => {
                      setTrackingMode('skin');
                      if (!isCameraActive) onAddNotification("Visão OSONE inativa. Ligue a câmera!", "error");
                    }}
                    className={cn(
                      "py-1 text-[8px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all",
                      trackingMode === 'skin' ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Filtro Pele
                  </button>
                  <button
                    onClick={() => {
                      setTrackingMode('calibrated');
                      if (!isCameraActive) onAddNotification("Visão OSONE inativa. Ligue a câmera!", "error");
                    }}
                    className={cn(
                      "py-1 text-[8px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all",
                      trackingMode === 'calibrated' ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Chroma
                  </button>
                </div>
              </div>

              {/* Interaction Modality toggles */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Tipo de Interação</span>
                <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/5 p-0.5 rounded-lg">
                  <button
                    onClick={() => setInteractionStyle('draw')}
                    className={cn(
                      "py-1.5 text-[8.5px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all flex flex-col items-center gap-0.5",
                      interactionStyle === 'draw' ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Paintbrush size={10} />
                    <span>Desenhar</span>
                  </button>
                  <button
                    onClick={() => setInteractionStyle('click')}
                    className={cn(
                      "py-1.5 text-[8.5px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all flex flex-col items-center gap-0.5",
                      interactionStyle === 'click' ? "bg-rose-500/15 text-rose-450 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <MousePointer size={10} />
                    <span>Clique</span>
                  </button>
                  <button
                    onClick={() => setInteractionStyle('hover')}
                    className={cn(
                      "py-1.5 text-[8.5px] font-mono tracking-wider uppercase rounded-md cursor-pointer transition-all flex flex-col items-center gap-0.5",
                      interactionStyle === 'hover' ? "bg-orange-500/15 text-orange-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <CircleDot size={10} />
                    <span>Dwell 1s</span>
                  </button>
                </div>
              </div>

              {/* Dynamic feedback webcam canvas for Calibration (Only shown when calibrated mode activated) */}
              {trackingMode !== 'mouse' && (
                <div className="bg-neutral-950 border border-white/5 rounded-xl p-2 flex gap-2 h-20 items-center justify-between">
                  <div className="w-[100px] h-full bg-zinc-900 rounded overflow-hidden relative border border-white/5">
                    <canvas ref={trackerCanvasRef} className="w-full h-full object-cover" />
                    {!isCameraActive && !internalStream && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[7.5px] text-center text-zinc-500 leading-none">
                        Sem câmera
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1.5 text-[8.5px] font-mono text-zinc-400">
                    {trackingMode === 'calibrated' ? (
                      <>
                        <button 
                          onClick={triggerCalibration}
                          className="py-1 px-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded font-semibold text-center text-[8px] cursor-pointer"
                        >
                          Auto Calibrar
                        </button>
                        <div className="flex justify-between">
                          <span>Tolerância:</span>
                          <span className="text-zinc-300">{tolerance}</span>
                        </div>
                        <input 
                          type="range" min="15" max="75" value={tolerance} 
                          onChange={e => setTolerance(parseInt(e.target.value))}
                          className="w-full h-1 accent-cyan-400 cursor-pointer"
                        />
                      </>
                    ) : (
                      <span className="text-stone-400 leading-relaxed text-[7.5px]">
                        Filtro de Pele ativo. Posicione a mão aberta frente à câmera.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* sliders sensitivity details */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                  <span>Sensibilidade do Cursor</span>
                  <span className="text-cyan-400">{Math.round(sensitivity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="0.9" step="0.05" value={sensitivity}
                  onChange={e => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-zinc-800 rounded"
                />
              </div>

              {/* Neon drawing palette selector */}
              {interactionStyle === 'draw' && (
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Cores Rabiscos:</span>
                  <div className="flex items-center gap-1.5">
                    {['#22d3ee', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                      <button
                        key={c}
                        onClick={() => setActiveColor(c)}
                        style={{ backgroundColor: c }}
                        className={cn(
                          "w-4 h-4 rounded-full transition-all border cursor-pointer",
                          activeColor === c ? "border-white scale-110 shadow-lg" : "border-stone-900"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Capsule Float-Dock Footer Bar */}
        <div className="flex items-center gap-1 bg-[#060606]/90 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          
          {/* Main Activation Trigger Hook */}
          <button
            onClick={toggleActive}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative",
              isActive 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.4)]" 
                : "bg-white/[0.04] text-zinc-400 hover:text-white"
            )}
            title={isActive ? "Colocar Mão em Repouso" : "Ligar Mão Inteligente"}
          >
            <Hand size={15} className={cn(isActive && "animate-pulse")} />
            {isActive && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-450 border border-black rounded-full animate-ping" />
            )}
          </button>

          {/* Quick Clear drawings */}
          {isActive && interactionStyle === 'draw' && (
            <button
              onClick={clearDrawings}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-400 bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Apagar todos os rabiscos"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Collapsible settings gear */}
          {isActive && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                showSettings ? "bg-white/10 text-cyan-400" : "text-zinc-400 hover:text-zinc-200"
              )}
              title="Ajustar Configurações"
            >
              <Settings size={13} className={cn(showSettings && "rotate-45 transition-transform")} />
            </button>
          )}
        </div>

      </div>
      <video 
        ref={internalVideoRef} 
        className="absolute w-px h-px opacity-0 pointer-events-none" 
        autoPlay 
        playsInline 
        muted 
      />
    </>
  );
}
