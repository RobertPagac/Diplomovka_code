
import React, { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
  onImageChange: (base64: string | null) => void;
}

type Tool = 'brush' | 'eraser' | 'crop';

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onImageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#6366f1'); // Indigo default
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [showGrid, setShowGrid] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  
  // Crop states
  const [cropStart, setCropStart] = useState<{ x: number, y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'White', value: '#ffffff' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
  ];

  const bgColor = '#020617';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Initial fill
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Sync overlay for crop rectangle
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (activeTool === 'crop' && cropRect) {
      ctx.strokeStyle = '#6366f1';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      
      // Semi-transparent overlay outside crop area
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      // Top
      ctx.fillRect(0, 0, overlay.width, cropRect.y);
      // Bottom
      ctx.fillRect(0, cropRect.y + cropRect.h, overlay.width, overlay.height - (cropRect.y + cropRect.h));
      // Left
      ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h);
      // Right
      ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, overlay.width - (cropRect.x + cropRect.w), cropRect.h);
    }
  }, [cropRect, activeTool]);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e.nativeEvent);
    
    if (activeTool === 'crop') {
      setCropStart(coords);
      setCropRect({ ...coords, w: 0, h: 0 });
    } else {
      setIsDrawing(true);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = activeTool === 'eraser' ? bgColor : brushColor;
      }
    }
  };

  const moveInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e.nativeEvent);

    if (activeTool === 'crop' && cropStart) {
      setCropRect({
        x: Math.min(coords.x, cropStart.x),
        y: Math.min(coords.y, cropStart.y),
        w: Math.abs(coords.x - cropStart.x),
        h: Math.abs(coords.y - cropStart.y)
      });
    } else if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasContent(true);
      }
    }
  };

  const stopInteraction = () => {
    if (isDrawing) {
      setIsDrawing(false);
      updateReference();
    }
    setCropStart(null);
  };

  const applyCrop = () => {
    if (!cropRect || cropRect.w < 5 || cropRect.h < 5) {
      setActiveTool('brush');
      setCropRect(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary canvas to hold the cropped content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.w;
    tempCanvas.height = cropRect.h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);

    // Clear and redraw onto main canvas scaled
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);

    setCropRect(null);
    setActiveTool('brush');
    updateReference();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onImageChange(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              setHasContent(true);
              updateReference();
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateReference = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      onImageChange(base64);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">Layout Reference</label>
        <button 
          type="button"
          onClick={clearCanvas}
          className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-wider font-bold"
        >
          Reset Canvas
        </button>
      </div>
      
      <div className="relative aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair shadow-inner group">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          onMouseDown={startInteraction}
          onMouseMove={moveInteraction}
          onMouseUp={stopInteraction}
          onMouseLeave={stopInteraction}
          onTouchStart={startInteraction}
          onTouchMove={moveInteraction}
          onTouchEnd={stopInteraction}
          className="w-full h-full touch-none absolute inset-0"
        />

        {/* Interaction Overlay */}
        <canvas
          ref={overlayRef}
          width={512}
          height={512}
          className="w-full h-full touch-none absolute inset-0 pointer-events-none"
        />
        
        {/* Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #475569 1px, transparent 1px),
                linear-gradient(to bottom, #475569 1px, transparent 1px)
              `,
              backgroundSize: '25% 25%'
            }}
          />
        )}
        
        {!hasContent && activeTool !== 'crop' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="text-xs">Sketch your layout</p>
          </div>
        )}

        {activeTool === 'crop' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 rounded-full flex items-center shadow-lg border border-indigo-400 overflow-hidden">
             <button 
              type="button"
              onClick={applyCrop}
              className="px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors flex items-center gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Crop
             </button>
             <div className="w-[1px] h-4 bg-indigo-400 opacity-50" />
             <button 
              type="button"
              onClick={() => { setActiveTool('brush'); setCropRect(null); }}
              className="px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
             >
                Cancel
             </button>
          </div>
        )}
      </div>

      <div className="space-y-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={activeTool === 'crop'}
                onClick={() => {
                  setBrushColor(c.value);
                  setActiveTool('brush');
                }}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-30 ${
                  activeTool === 'brush' && brushColor === c.value ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'eraser' ? 'brush' : 'eraser')}
              className={`p-1.5 rounded-lg border transition-colors ${
                activeTool === 'eraser' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Eraser Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('crop')}
              className={`p-1.5 rounded-lg border transition-colors ${
                activeTool === 'crop' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Crop Region"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showGrid ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Grid"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase tracking-tight">
              <span>Brush Size</span>
              <span>{brushSize}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              disabled={activeTool === 'crop'}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
            />
          </div>
          
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-colors border border-slate-700 mt-3">
            Import
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
