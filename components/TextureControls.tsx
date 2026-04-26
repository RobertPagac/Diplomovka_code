
import React, { useState } from 'react';
import { ModelType, GenerationSettings } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface TextureControlsProps {
  onGenerate: (prompt: string, settings: GenerationSettings) => void;
  isLoading: boolean;
  isServerOnline: boolean | null;
}

const TextureControls: React.FC<TextureControlsProps> = ({ onGenerate, isLoading, isServerOnline }) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    model: ModelType.LOCAL_FLUX,
    seamless: true,
    aspectRatio: "1:1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, settings);
    }
  };

  const examples = [
    "Aged volcanic rock surface",
    "Brushed dark aluminum metal",
    "Raw concrete floor pattern",
    "Traditional Japanese tatami mat",
    "Coarse desert sand ripples"
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Texture Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'oxidized copper plates' or 'fine knit fabric'"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-24"
          />
        </div>

        <div className="relative opacity-50 grayscale pointer-events-none">
          <DrawingCanvas onImageChange={() => {}} />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-xl">
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
              Img-to-Img (Disabled for FLUX)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isServerOnline === null ? 'bg-slate-500' : 
              isServerOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className={`text-xs font-medium uppercase tracking-wider ${
              isServerOnline === null ? 'text-slate-500' : 
              isServerOnline ? 'text-slate-400' : 'text-red-400'
            }`}>
              {isServerOnline === null ? 'Checking Server...' :
               isServerOnline ? 'Local FLUX Active' : 'Server Offline (Run server.py)'}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.seamless}
              onChange={(e) => setSettings({ ...settings, seamless: e.target.checked })}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-300">Force Seamless</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Forging Pixels...
            </>
          ) : (
            'Generate Texture'
          )}
        </button>
      </form>

      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Material Presets</h3>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-full transition-colors border border-slate-700 hover:border-indigo-500/50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextureControls;
