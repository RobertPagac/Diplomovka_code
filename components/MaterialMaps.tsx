
import React, { useEffect, useRef, useState } from 'react';

interface MaterialMapsProps {
  imageUrl: string;
}

const MaterialMaps: React.FC<MaterialMapsProps> = ({ imageUrl }) => {
  const heightCanvasRef = useRef<HTMLCanvasElement>(null);
  const normalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    const processImages = async () => {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Setup canvases
        const hCtx = heightCanvasRef.current?.getContext('2d', { willReadFrequently: true });
        const nCtx = normalCanvasRef.current?.getContext('2d', { willReadFrequently: true });

        if (!hCtx || !nCtx || !heightCanvasRef.current || !normalCanvasRef.current) return;

        heightCanvasRef.current.width = width;
        heightCanvasRef.current.height = height;
        normalCanvasRef.current.width = width;
        normalCanvasRef.current.height = height;

        // Draw original to get data
        hCtx.drawImage(img, 0, 0);
        const imageData = hCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. Generate Height Map (Grayscale)
        const heightData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          heightData[i] = avg;     // R
          heightData[i + 1] = avg; // G
          heightData[i + 2] = avg; // B
          heightData[i + 3] = 255; // A
        }
        hCtx.putImageData(new ImageData(heightData, width, height), 0, 0);

        // 2. Generate Normal Map (Sobel approximation)
        const normalData = new Uint8ClampedArray(data.length);
        const strength = 2.0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            
            // Sample neighbors (clamped)
            const getL = (cx: number, cy: number) => {
              const nx = Math.max(0, Math.min(width - 1, cx));
              const ny = Math.max(0, Math.min(height - 1, cy));
              const idx = (ny * width + nx) * 4;
              return (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255.0;
            };

            const tl = getL(x - 1, y - 1);
            const tc = getL(x, y - 1);
            const tr = getL(x + 1, y - 1);
            const ml = getL(x - 1, y);
            const mr = getL(x + 1, y);
            const bl = getL(x - 1, y + 1);
            const bc = getL(x, y + 1);
            const br = getL(x + 1, y + 1);

            // Sobel kernels
            const dx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
            const dy = (bl + 2.0 * bc + br) - (tl + 2.0 * tc + tr);
            const dz = 1.0 / strength;

            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const nx = (dx / len) * 0.5 + 0.5;
            const ny = (dy / len) * 0.5 + 0.5;
            const nz = (dz / len) * 0.5 + 0.5;

            normalData[i] = nx * 255;
            normalData[i + 1] = ny * 255;
            normalData[i + 2] = nz * 255;
            normalData[i + 3] = 255;
          }
        }
        nCtx.putImageData(new ImageData(normalData, width, height), 0, 0);
        setIsProcessing(false);
      };
    };

    processImages();
  }, [imageUrl]);

  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Material Map Extraction
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Normal Map</span>
            <span className="text-[10px] text-indigo-400 font-mono">X+ Y+ Z+</span>
          </div>
          <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
            <canvas ref={normalCanvasRef} className="w-full h-full object-cover" />
            {isProcessing && <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center"><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Calculates surface orientation for realistic lighting response in 3D engines.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Height / Displacement</span>
            <span className="text-[10px] text-slate-400 font-mono">8-bit Luma</span>
          </div>
          <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
            <canvas ref={heightCanvasRef} className="w-full h-full object-cover" />
            {isProcessing && <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center"><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Represents structural depth. Used for parallax mapping and vertex displacement.</p>
        </div>
      </div>
    </div>
  );
};

export default MaterialMaps;
