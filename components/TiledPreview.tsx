
import React, { useState } from 'react';

interface TiledPreviewProps {
  imageUrl: string;
}

const TiledPreview: React.FC<TiledPreviewProps> = ({ imageUrl }) => {
  const [tileSize, setTileSize] = useState(250); // Scale of the texture

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Seamless Preview
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 uppercase">Zoom</label>
          <input 
            type="range" 
            min="100" 
            max="600" 
            value={tileSize} 
            onChange={(e) => setTileSize(Number(e.target.value))}
            className="w-32 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${tileSize}px`,
            backgroundPosition: 'center'
          }}
        />
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <a 
            href={imageUrl} 
            download="texture.png"
            className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 p-2 rounded-lg text-white shadow-lg flex items-center gap-2 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Original
          </a>
        </div>

        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
          Tiled Grid View
        </div>
      </div>
    </div>
  );
};

export default TiledPreview;
