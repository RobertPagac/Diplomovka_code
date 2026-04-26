
import React, { useState, useEffect } from 'react';
import TextureControls from './components/TextureControls';
import TiledPreview from './components/TiledPreview';
import ModelPreview3D from './components/ModelPreview3D';
import MaterialMaps from './components/MaterialMaps';
import { TextureGeneration, GenerationSettings } from './types';
import { generateFluxTexture } from './services/fluxLocal';

const App: React.FC = () => {
  const [generations, setGenerations] = useState<TextureGeneration[]>([]);
  const [currentTexture, setCurrentTexture] = useState<TextureGeneration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'2d' | '3d'>('2d');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/', { method: 'GET' });
      setIsServerOnline(true);
    } catch (err) {
      setIsServerOnline(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleGenerate = async (prompt: string, settings: GenerationSettings) => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateFluxTexture(prompt, settings.seamless);
      
      const newGeneration: TextureGeneration = {
        id: Math.random().toString(36).substring(7),
        prompt,
        imageUrl,
        timestamp: Date.now()
      };

      setGenerations(prev => [newGeneration, ...prev].slice(0, 20));
      setCurrentTexture(newGeneration);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (generations.length > 0 && !currentTexture) {
      setCurrentTexture(generations[0]);
    }
  }, [generations, currentTexture]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <TextureControls 
              onGenerate={handleGenerate} 
              isLoading={isLoading} 
              isServerOnline={isServerOnline}
            />
            
            {/* History Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Generation History</h3>
              {generations.length === 0 ? (
                <div className="text-center py-8 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs">No textures generated yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {generations.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => setCurrentTexture(gen)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentTexture?.id === gen.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={gen.imageUrl} alt={gen.prompt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
                {error.includes("Requested entity was not found.") && (
                  <div className="flex items-center gap-4 mt-1">
                    <button 
                      onClick={() => (window as any).aistudio?.openSelectKey?.()}
                      className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors border border-red-500/50"
                    >
                      Select API Key
                    </button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-red-300 hover:underline">
                      Billing Instructions
                    </a>
                  </div>
                )}
              </div>
            )}

            {!currentTexture && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 gap-4">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-medium text-slate-400">Ready to Forge</h2>
                  <p className="text-sm max-w-xs mx-auto">Input a prompt on the left to start generating high-quality seamless textures with FLUX.</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-slate-900/30 border border-slate-800 rounded-3xl text-slate-500 gap-8 animate-pulse">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-2xl"></div>
                  <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-2xl animate-spin"></div>
                  <div className="absolute inset-4 bg-slate-900 rounded-xl flex items-center justify-center">
                     <svg className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                     </svg>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-indigo-400">Synthesizing Pixels</h2>
                  <p className="text-sm text-slate-500">FLUX is rendering your unique material...</p>
                </div>
              </div>
            )}

            {currentTexture && !isLoading && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative group">
                      <img 
                        src={currentTexture.imageUrl} 
                        alt={currentTexture.prompt} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={currentTexture.imageUrl} download="texture_original.png" className="bg-black/50 backdrop-blur-md p-2 rounded-lg text-white hover:bg-indigo-500 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                           </svg>
                         </a>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-4">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Active Prompt</label>
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{currentTexture.prompt}"</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Resolution</label>
                          <p className="text-slate-300 text-xs font-mono">1024 x 1024 px</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Format</label>
                          <p className="text-slate-300 text-xs font-mono">PNG / Seamless</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800">
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Forge Recommendations</h4>
                         <ul className="text-xs text-slate-400 space-y-2">
                           <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Perfect for 3D environment surfaces</li>
                           <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> High-quality UI background pattern</li>
                           <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Game asset material base</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start w-fit">
                    <button 
                      onClick={() => setActiveView('2d')}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeView === '2d' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      2D Tiled Preview
                    </button>
                    <button 
                      onClick={() => setActiveView('3d')}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeView === '3d' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      3D Model Preview
                    </button>
                  </div>
                  
                  <div className="min-h-[500px]">
                    {activeView === '2d' ? (
                      <TiledPreview imageUrl={currentTexture.imageUrl} />
                    ) : (
                      <ModelPreview3D textureUrl={currentTexture.imageUrl} />
                    )}
                  </div>
                </div>

                <MaterialMaps imageUrl={currentTexture.imageUrl} />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto px-4 flex justify-between items-center text-slate-500 text-xs">
          <p>© 2026 Robert Pagac.</p>
          <div className="flex gap-4 items-center">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
            )}
            <span className="hover:text-indigo-400 transition-colors">Powered by FLUX.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
