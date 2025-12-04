import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Loader2, Download, Video, Film, Command, History, ArrowLeft, Trash2 } from 'lucide-react';
import { enhanceUserPrompt, generateImageContent, generateVideoContent } from './services/geminiService';
import { Toggle } from './components/Toggle';
import { ImageUploader } from './components/ImageUploader';
import { LoadingState, GeneratedItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMimeType, setReferenceMimeType] = useState<string>('image/png');
  
  const [generatedItem, setGeneratedItem] = useState<GeneratedItem | null>(null);
  const [enhanceEnabled, setEnhanceEnabled] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle' });
  const [history, setHistory] = useState<GeneratedItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('nano-banana-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      // Limit history to last 20 items to avoid localStorage quota issues with base64 images
      const historyToSave = history.slice(0, 20); 
      localStorage.setItem('nano-banana-history', JSON.stringify(historyToSave));
    } catch (e) {
      console.error("Failed to save history (likely quota exceeded)", e);
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setGeneratedItem(null);
      let finalPrompt = prompt;

      // 1. Enhance prompt if enabled
      if (enhanceEnabled) {
        setLoadingState({ status: 'enhancing', message: 'Enhancing prompt...' });
        finalPrompt = await enhanceUserPrompt(prompt);
        setPrompt(finalPrompt);
      }

      // 2. Generate content based on active tab
      if (activeTab === 'image') {
        setLoadingState({ status: 'generating', message: 'Generating masterpiece...' });
        const resultUrl = await generateImageContent(
          finalPrompt,
          referenceImage || undefined,
          referenceMimeType
        );

        if (resultUrl) {
          const newItem: GeneratedItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            url: resultUrl,
            prompt: finalPrompt,
            timestamp: Date.now(),
            type: 'image'
          };
          setGeneratedItem(newItem);
          setHistory(prev => [newItem, ...prev]);
          setLoadingState({ status: 'success' });
        } else {
          setLoadingState({ status: 'error', message: 'No image generated.' });
        }

      } else {
        // Video Generation
        setLoadingState({ status: 'generating', message: 'Rendering video (this takes a moment)...' });
        const resultUrl = await generateVideoContent(
          finalPrompt,
          referenceImage || undefined,
          referenceMimeType
        );

        if (resultUrl) {
          const newItem: GeneratedItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            url: resultUrl,
            prompt: finalPrompt,
            timestamp: Date.now(),
            type: 'video'
          };
          setGeneratedItem(newItem);
          setHistory(prev => [newItem, ...prev]);
          setLoadingState({ status: 'success' });
        } else {
          setLoadingState({ status: 'error', message: 'No video generated.' });
        }
      }

    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Something went wrong.';
      setLoadingState({ status: 'error', message: msg });
    }
  };

  const handleDownload = () => {
    if (generatedItem) {
      const link = document.createElement('a');
      link.href = generatedItem.url;
      link.download = `nano-banana-${generatedItem.type}-${Date.now()}.${generatedItem.type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUseAsReference = () => {
    if (generatedItem && generatedItem.type === 'image') {
      setReferenceImage(generatedItem.url);
      setReferenceMimeType('image/png');
      setGeneratedItem(null);
      setLoadingState({ status: 'idle' });
    }
  };

  const restoreHistoryItem = (item: GeneratedItem) => {
    setGeneratedItem(item);
    setPrompt(item.prompt);
    setActiveTab(item.type);
    setLoadingState({ status: 'idle' });
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your history?")) {
      setHistory([]);
      localStorage.removeItem('nano-banana-history');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-yellow-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Nano Banana <span className="text-slate-400 font-normal">Studio</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden md:inline-flex px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
               VE0 & FLASH
             </span>
             <a href="#" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">v2.0</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
           <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'image' 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Image Studio
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'video' 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-4 h-4" />
                Video Studio
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Section */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="space-y-6 relative z-10">
                
                {/* Reference Input */}
                <ImageUploader 
                  image={referenceImage} 
                  onChange={(img, mime) => {
                    setReferenceImage(img);
                    if (mime) setReferenceMimeType(mime);
                  }} 
                />
                
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label htmlFor="prompt" className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>{activeTab === 'video' ? 'Video Description' : 'Prompt'}</span>
                    {enhanceEnabled && <span className="text-xs text-yellow-500 flex items-center gap-1"><Wand2 className="w-3 h-3"/> Active</span>}
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        activeTab === 'image' 
                        ? (referenceImage ? "Describe how to edit this image..." : "Describe the image you want to create...")
                        : (referenceImage ? "Animate this image: a cinematic pan..." : "Describe a video: a cat driving a car in neon city...")
                      }
                      className="w-full min-h-[120px] bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none resize-none transition-all"
                    />
                    <div className="absolute bottom-3 right-3">
                      <div className={`h-1.5 w-1.5 rounded-full ${prompt.length > 0 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-slate-800/50 rounded-xl px-4 border border-slate-800">
                  <Toggle 
                    enabled={enhanceEnabled} 
                    onChange={setEnhanceEnabled}
                    label="Prompt Enhancer"
                    description="Automatically improve your prompt using Gemini."
                    icon={<Wand2 className={`w-4 h-4 ${enhanceEnabled ? 'text-yellow-400' : 'text-slate-400'}`} />}
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loadingState.status === 'enhancing' || loadingState.status === 'generating'}
                  className="group relative w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                >
                  {loadingState.status === 'enhancing' || loadingState.status === 'generating' ? (
                     <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{loadingState.message}</span>
                     </>
                  ) : (
                    <>
                      {activeTab === 'image' ? <Sparkles className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                      <span>{activeTab === 'image' ? 'Generate Image' : 'Generate Video'}</span>
                    </>
                  )}
                </button>

                {loadingState.status === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                    {loadingState.message}
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Command className="w-4 h-4" /> Studio Tips
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                 {activeTab === 'image' ? (
                    <>
                      <li>Describe the entire scene when editing.</li>
                      <li>Use "Use as Reference" to iterate on your creations.</li>
                      <li>Gemini Flash is best for stylization and object changes.</li>
                    </>
                 ) : (
                    <>
                      <li>Video generation takes about 30-60 seconds.</li>
                      <li>Uploading a start image gives you more control.</li>
                      <li>Keep prompts focused on motion and atmosphere.</li>
                    </>
                 )}
              </ul>
            </div>

          </div>

          {/* Display Section */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="min-h-[500px] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
              
              {/* Toolbar */}
              <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/50">
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                    {activeTab === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span>Preview Canvas</span>
                 </div>
                 {generatedItem && (
                   <div className="flex items-center gap-3">
                     {generatedItem.type === 'image' && (
                       <button
                          onClick={handleUseAsReference}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                       >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Use as Reference</span>
                       </button>
                     )}
                     <div className="h-4 w-px bg-slate-700" />
                     <button 
                       onClick={handleDownload}
                       className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                       title="Download"
                     >
                       <Download className="w-5 h-5" />
                     </button>
                   </div>
                 )}
              </div>

              {/* Main Canvas Area */}
              <div className="flex-1 p-8 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 relative">
                
                {/* Placeholder State */}
                {!generatedItem && loadingState.status === 'idle' && (
                  <div className="text-center space-y-4 max-w-md">
                    <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-6 ring-4 ring-slate-800/50">
                      {activeTab === 'image' ? <Sparkles className="w-10 h-10 text-slate-600" /> : <Film className="w-10 h-10 text-slate-600" />}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200">
                       {activeTab === 'image' ? 'Create Something New' : 'Motion in Motion'}
                    </h3>
                    <p className="text-slate-400">
                      {activeTab === 'image' 
                        ? "Generate images from text or edit existing photos with Gemini 2.5 Flash."
                        : "Create 720p video clips from text or images using Veo. Requires a paid API key."}
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {(loadingState.status === 'enhancing' || loadingState.status === 'generating') && (
                  <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
                     <div className="w-64 h-36 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                     </div>
                     <p className="text-slate-400 text-sm">{loadingState.message}</p>
                  </div>
                )}

                {/* Result State */}
                {generatedItem && (
                  <div className="relative group max-h-full max-w-full">
                     {generatedItem.type === 'image' ? (
                       <img 
                        src={generatedItem.url} 
                        alt="Generated Artwork" 
                        className="max-w-full max-h-[70vh] rounded-lg shadow-2xl ring-1 ring-slate-700 object-contain"
                      />
                     ) : (
                       <video 
                        src={generatedItem.url} 
                        controls
                        autoPlay
                        loop
                        className="max-w-full max-h-[70vh] rounded-lg shadow-2xl ring-1 ring-slate-700"
                       />
                     )}
                  </div>
                )}
              </div>
            </div>

            {/* Persistent History Section */}
            {history.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Creations
                  </h3>
                  <div className="flex items-center gap-3">
                     <span className="text-xs text-slate-500">{history.length} items (saved locally)</span>
                     <button onClick={clearHistory} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => restoreHistoryItem(item)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${
                        generatedItem?.id === item.id 
                          ? 'ring-2 ring-yellow-500 border-transparent' 
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                           <Video className="w-6 h-6 text-slate-500 group-hover:text-yellow-500" />
                        </div>
                      )}
                      
                      {/* Overlay Type Icon */}
                      <div className="absolute top-1 right-1">
                        {item.type === 'video' && <div className="bg-black/50 rounded-full p-1"><Video className="w-2 h-2 text-white" /></div>}
                      </div>

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[10px] text-slate-200 line-clamp-2 text-left">{item.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
