
import React, { useState, useRef } from 'react';
import { 
  Sparkles, Download, Maximize2, RefreshCw, Eraser, 
  Image as ImageIcon, UploadCloud, Zap, History, Trash2, ChevronDown, ChevronUp,
  LayoutGrid, X, CornerUpLeft, Copy, Check, Globe, Share2, Heart, User, MessageCircle, AlertTriangle, Send,
  Wand2, Scissors, Shirt, Users, Layers
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from '../types';

// --- Types & Interfaces ---

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

interface PublicImage extends GeneratedImage {
    author: string;
    likes: number;
    isLiked?: boolean;
    comments: Comment[];
    toolId?: string; // New: Track which tool generated this
}

// Tool Definition System
type ToolId = 'text-to-image' | 'face-swap' | 'virtual-try-on' | 'remove-bg';

interface ToolDef {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    inputs: ToolInput[];
}

interface ToolInput {
    id: string;
    label: string;
    type: 'text' | 'image' | 'image-target' | 'image-source';
    required: boolean;
    placeholder?: string;
}

const TOOLS: ToolDef[] = [
    {
        id: 'text-to-image',
        name: '自由创作',
        description: '基于 Nano Banana 模型，通过文字描述生成无限创意画面。',
        icon: <Wand2 size={16} />,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inputs: [
            { id: 'prompt', label: '创意描述', type: 'text', required: true, placeholder: '描述画面内容...' },
            { id: 'ref_image', label: '参考图 (可选)', type: 'image', required: false }
        ]
    },
    {
        id: 'face-swap',
        name: '智能换脸',
        description: '基于 ComfyUI Reactor 节点，保持面部特征的高精度融合。',
        icon: <Users size={16} />,
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        inputs: [
            { id: 'source_face', label: '源人脸 (Source)', type: 'image-source', required: true, placeholder: '上传包含人脸的图片' },
            { id: 'target_bg', label: '目标底图 (Target)', type: 'image-target', required: true, placeholder: '上传目标场景图片' }
        ]
    },
    {
        id: 'virtual-try-on',
        name: '虚拟试衣',
        description: '基于 IDM-VTON，上传模特与服装图，一键生成上身效果。',
        icon: <Shirt size={16} />,
        color: 'bg-purple-50 text-purple-600 border-purple-100',
        inputs: [
            { id: 'model_img', label: '模特图 (Model)', type: 'image-target', required: true },
            { id: 'garment_img', label: '服装图 (Garment)', type: 'image-source', required: true }
        ]
    },
    {
        id: 'remove-bg',
        name: '背景移除',
        description: '基于 RMBG-1.4，精准分割主体，生成透明背景 PNG。',
        icon: <Scissors size={16} />,
        color: 'bg-orange-50 text-orange-600 border-orange-100',
        inputs: [
             { id: 'main_img', label: '原图片', type: 'image', required: true }
        ]
    }
];

// Mock Initial Public Data
const MOCK_PUBLIC_GALLERY: PublicImage[] = [
    {
        id: 'pub_1',
        url: 'https://picsum.photos/id/237/800/800',
        prompt: 'A black labrador puppy wearing astronaut gear, floating in space station, 8k realism',
        aspectRatio: '1:1',
        timestamp: Date.now() - 1000000,
        author: 'CyberPunk_Artist',
        likes: 124,
        toolId: 'text-to-image',
        comments: [
            { id: 'c1', user: 'DogLover', text: 'Too cute! Is this generated with flash model?', timestamp: Date.now() - 50000 }
        ]
    },
    {
        id: 'pub_2',
        url: 'https://picsum.photos/id/64/800/800',
        prompt: 'Virtual Try-on: Summer floral dress on model',
        aspectRatio: '3:4',
        timestamp: Date.now() - 5000000,
        author: 'Fashion_AI',
        likes: 89,
        toolId: 'virtual-try-on',
        comments: []
    }
];

export const ImageGenView: React.FC = () => {
  // Tool State
  const [activeToolId, setActiveToolId] = useState<ToolId>('text-to-image');
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

  // Input States (Dynamic based on tool)
  const [prompt, setPrompt] = useState('');
  // We use a Map-like object to store multiple image inputs: key = input_id
  const [inputImages, setInputImages] = useState<Record<string, {data: string, mimeType: string} | null>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  
  // Data States
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [publicImages, setPublicImages] = useState<PublicImage[]>(MOCK_PUBLIC_GALLERY);

  // View States
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isGalleryMode, setIsGalleryMode] = useState(false); 
  const [galleryTab, setGalleryTab] = useState<'private' | 'public'>('private');
  
  // Modal States
  const [publishImage, setPublishImage] = useState<GeneratedImage | null>(null); 
  const [detailImage, setDetailImage] = useState<PublicImage | null>(null); 
  const [newComment, setNewComment] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeInputIdRef = useRef<string | null>(null); // Tracks which input triggered the file dialog
  
  // Feedback States
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const simulateMode = !process.env.API_KEY;
  const currentUser = 'Admin User'; 
  
  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

  const triggerFileSelect = (inputId: string) => {
      activeInputIdRef.current = inputId;
      fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeInputIdRef.current) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const inputKey = activeInputIdRef.current; // capture in closure

      reader.onloadend = () => {
        const base64String = reader.result as string;
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
           setInputImages(prev => ({
               ...prev,
               [inputKey]: { mimeType: matches[1], data: matches[2] }
           }));
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeInputImage = (inputId: string) => {
      setInputImages(prev => {
          const next = { ...prev };
          delete next[inputId];
          return next;
      });
  };

  const handleGenerate = async () => {
    // Basic validation based on tool requirements
    const missingRequired = activeTool.inputs.some(input => {
        if (!input.required) return false;
        if (input.type === 'text') return !prompt.trim();
        return !inputImages[input.id];
    });

    if (missingRequired) {
        alert("请完善所有必填项");
        return;
    }
    
    setIsGenerating(true);
    setGeneratedImage(null);
    if (isGalleryMode) setIsGalleryMode(false); 

    try {
      let imageUrl = '';

      // --- SIMULATION LOGIC ---
      // In a real app, this switch would call different API endpoints (Gemini vs ComfyUI Backend)
      if (activeToolId === 'text-to-image' && !simulateMode) {
        // REAL API CALL: Nano Banana
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const parts: any[] = [];
        
        // Check for ref image (id: 'ref_image')
        const refImg = inputImages['ref_image'];
        if (refImg) {
            parts.push({
                inlineData: { mimeType: refImg.mimeType, data: refImg.data }
            });
        }
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
      } else {
        // ComfyUI Simulation / API Key Missing
        await new Promise(resolve => setTimeout(resolve, activeToolId === 'text-to-image' ? 3000 : 5000));
        
        // Mock Outputs based on tool
        if (activeToolId === 'face-swap') imageUrl = 'https://picsum.photos/id/64/800/800'; // Mock portrait
        else if (activeToolId === 'virtual-try-on') imageUrl = 'https://picsum.photos/id/177/800/800'; // Mock fashion
        else imageUrl = `https://picsum.photos/seed/${Date.now()}/800/800`;
      }

      if (imageUrl) {
        const newImage: GeneratedImage & { toolId?: string } = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: activeToolId === 'text-to-image' ? prompt : `${activeTool.name} Task`,
          aspectRatio: '1:1',
          timestamp: Date.now(),
          toolId: activeToolId
        };
        setGeneratedImage(newImage);
        setHistory(prev => [newImage, ...prev]);
      }

    } catch (error) {
      console.error("Generation failed:", error);
      alert("生成失败，请检查网络或 API Key 配置。");
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (handleDownload, handleDelete, onPublishClick, confirmPublish, handleLike, handleAddComment - Keep logic same)
  const handleDownload = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-gen-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这张图片吗？')) {
        setHistory(prev => prev.filter(img => img.id !== id));
        if (generatedImage?.id === id) setGeneratedImage(null);
    }
  };

  const onPublishClick = (e: React.MouseEvent, img: GeneratedImage) => {
      e.stopPropagation();
      if (publicImages.some(p => p.id === img.id)) { alert("该图片已发布"); return; }
      setPublishImage(img);
  };

  const confirmPublish = () => {
      if (!publishImage) return;
      const newPublicImage: PublicImage = { ...publishImage, author: currentUser, likes: 0, comments: [] };
      setPublicImages(prev => [newPublicImage, ...prev]);
      setGalleryTab('public');
      setPublishImage(null);
  };

  const handleLike = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setPublicImages(prev => prev.map(img => img.id === id ? { ...img, isLiked: !img.isLiked, likes: !img.isLiked ? img.likes + 1 : img.likes - 1 } : img));
      if (detailImage?.id === id) setDetailImage(prev => prev ? ({ ...prev, isLiked: !prev.isLiked, likes: !prev.isLiked ? prev.likes + 1 : prev.likes - 1 }) : null);
  };

  const handleAddComment = () => {
      if (!newComment.trim() || !detailImage) return;
      const comment: Comment = { id: Date.now().toString(), user: currentUser, text: newComment, timestamp: Date.now() };
      setPublicImages(prev => prev.map(img => img.id === detailImage.id ? { ...img, comments: [...img.comments, comment] } : img));
      setDetailImage(prev => prev ? ({ ...prev, comments: [...prev.comments, comment] }) : null);
      setNewComment('');
  };

  const handleReusePrompt = (e: React.MouseEvent, text: string) => {
      e.stopPropagation();
      // Only switch if it's a text prompt workflow, otherwise specialized tools don't use 'text' prompt in same way
      setActiveToolId('text-to-image');
      setPrompt(text);
      if (isGalleryMode) setIsGalleryMode(false); 
      setDetailImage(null);
  };

  return (
    <div className="absolute inset-0 flex bg-slate-50 overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none -z-10" />

      {/* Global Hidden Input for Files */}
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*" 
         onChange={handleFileSelect} 
      />

      {/* Left Sidebar: Controls */}
      <aside className="w-[380px] flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-20 shadow-sm h-full">
         
         {/* Tool Switcher Header */}
         <div className="p-5 border-b border-slate-100 flex-shrink-0 relative">
            <div 
                onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
                className={`flex items-center gap-4 p-2 -m-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 ${isToolMenuOpen ? 'bg-slate-50' : ''}`}
            >
                {/* REMOVED BIG ICON CONTAINER HERE */}
                <div className="flex-1">
                   <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                       {activeTool.name}
                       <ChevronDown size={18} className={`text-slate-400 transition-transform ${isToolMenuOpen ? 'rotate-180' : ''}`} />
                   </h2>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-1">
                      <span className={`px-1.5 py-0.5 rounded border ${activeTool.id === 'text-to-image' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                         {activeTool.id === 'text-to-image' ? 'Nano Banana' : 'ComfyUI'}
                      </span>
                   </div>
                </div>
            </div>

            {/* Tool Dropdown Menu */}
            {isToolMenuOpen && (
                <div className="absolute left-4 right-4 top-20 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-2 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                    <div className="space-y-1">
                        {TOOLS.map(tool => (
                            <div 
                               key={tool.id}
                               onClick={() => { setActiveToolId(tool.id); setIsToolMenuOpen(false); }}
                               className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeToolId === tool.id ? 'bg-slate-100 border border-slate-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                            >
                                {/* REMOVED SMALL ICON CONTAINER HERE */}
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-800">{tool.name}</div>
                                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{tool.description}</div>
                                </div>
                                {activeToolId === tool.id && <Check size={16} className="ml-auto text-slate-900" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
         </div>

         {/* Dynamic Input Form */}
         <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
            {activeTool.inputs.map(input => (
                <div key={input.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <label className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                       <span>{input.label} {input.required && <span className="text-red-500">*</span>}</span>
                       {input.type === 'text' && (
                           <div className="flex gap-2">
                                <button 
                                    onClick={() => setPrompt("A futuristic city with neon lights, cyberpunk style, 8k resolution")}
                                    className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                                >
                                    <Zap size={10} /> 示例
                                </button>
                                <button onClick={() => setPrompt('')} className="text-slate-400 hover:text-slate-600"><Eraser size={12} /></button>
                           </div>
                       )}
                    </label>

                    {input.type === 'text' ? (
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed shadow-inner"
                            placeholder={input.placeholder}
                        />
                    ) : (
                        // Image Uploaders
                        <div className="space-y-2">
                            {!inputImages[input.id] ? (
                                <div 
                                    onClick={() => triggerFileSelect(input.id)}
                                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group relative overflow-hidden ${input.required ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-slate-50/50'}`}
                                >
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                            <UploadCloud size={18} className="text-slate-400 group-hover:text-primary" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 group-hover:text-primary-dark">
                                            {input.placeholder || '点击上传图片'}
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-white">
                                    <img 
                                        src={`data:${inputImages[input.id]?.mimeType};base64,${inputImages[input.id]?.data}`} 
                                        alt="Uploaded" 
                                        className="w-full max-h-48 object-contain bg-slate-100/50" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <button 
                                            onClick={() => removeInputImage(input.id)}
                                            className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-red-500 shadow-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <Trash2 size={12} /> 移除
                                        </button>
                                    </div>
                                    {/* Tag indicating Source or Target */}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">
                                        {input.type === 'image-source' ? 'Source' : input.type === 'image-target' ? 'Target' : 'Image'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
         </div>

         {/* Generate Action */}
         <div className="p-5 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
            <button 
               onClick={handleGenerate}
               disabled={isGenerating}
               className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200/50'}`}
            >
               {isGenerating ? (
                  <>
                     <RefreshCw size={16} className="animate-spin" /> 
                     {activeTool.id === 'text-to-image' ? '正在创作...' : 'ComfyUI 处理中...'}
                  </>
               ) : (
                  <>
                     <Sparkles size={16} fill="currentColor" className="text-primary" /> 
                     {activeTool.id === 'text-to-image' ? '立即生成' : `开始${activeTool.name}`}
                  </>
               )}
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full">
         
         {/* 1. Canvas Area */}
         <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden relative z-0">
             
             {!generatedImage && !isGenerating ? (
               <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500 opacity-60">
                  <div className="w-24 h-24 mx-auto rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6">
                     <Layers size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 mb-2">准备就绪</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                     当前工具：<span className="font-bold text-slate-700">{activeTool.name}</span><br/>
                     {activeToolId === 'text-to-image' ? '配置您的 Prompt，AI 将为您绘制。' : '上传所需素材，AI 将为您执行工作流。'}
                  </p>
               </div>
             ) : (
                <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ${isGenerating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                   {isGenerating ? (
                      <div className="w-[400px] h-[400px] rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden relative flex flex-col items-center justify-center">
                         <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 via-white to-purple-50/50 animate-pulse"></div>
                         <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4 relative z-10"></div>
                         <p className="text-xs font-bold text-slate-500 relative z-10 animate-pulse uppercase tracking-wider">
                             {activeToolId === 'text-to-image' ? 'Rendering...' : 'Processing Workflow...'}
                         </p>
                      </div>
                   ) : generatedImage && (
                      <div className="relative group max-w-full max-h-full flex items-center justify-center">
                         <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 ring-8 ring-white bg-white relative">
                            <img 
                              src={generatedImage.url} 
                              alt={generatedImage.prompt}
                              className="max-h-[calc(100vh-200px)] max-w-full object-contain"
                            />
                            {/* Tool Badge on Canvas */}
                            <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase flex items-center gap-1.5">
                                {TOOLS.find(t => t.id === (generatedImage as any).toolId)?.icon}
                                {TOOLS.find(t => t.id === (generatedImage as any).toolId)?.name || 'Image'}
                            </div>
                         </div>
                         
                         {/* Floating Action Bar */}
                         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-1.5 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-2xl">
                            <button 
                              onClick={(e) => handleDownload(e, generatedImage.url, generatedImage.id)}
                              className="px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                            >
                               <Download size={14} /> 下载
                            </button>
                            <div className="w-px h-4 bg-white/20"></div>
                            <button 
                              onClick={() => window.open(generatedImage.url, '_blank')}
                              className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
                              title="全屏查看"
                            >
                               <Maximize2 size={16} />
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}
         </div>

         {/* 2. History & Gallery Container */}
         {/* ... (Keep existing structure, updated mapping to show Tool Icon) ... */}
         <div 
           className={`
              transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] 
              bg-white/80 backdrop-blur-xl border-t border-slate-200 z-10 flex flex-col
              ${isGalleryMode ? 'absolute inset-0 bg-slate-50' : `flex-shrink-0 ${isHistoryExpanded ? 'h-36' : 'h-11'}`}
           `}
         >
             {/* ... Header (Same as before) ... */}
             <div className="h-11 px-5 flex justify-between items-center bg-white/50 border-b border-transparent hover:border-slate-100 flex-shrink-0">
                {isGalleryMode ? (
                    <div className="flex items-center gap-4 h-full">
                        <button onClick={() => setGalleryTab('private')} className={`h-full flex items-center gap-2 px-1 text-xs font-bold border-b-2 transition-all ${galleryTab === 'private' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <History size={14} /> 我的创作
                        </button>
                        <button onClick={() => setGalleryTab('public')} className={`h-full flex items-center gap-2 px-1 text-xs font-bold border-b-2 transition-all ${galleryTab === 'public' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <Globe size={14} /> 社区广场
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
                       <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={12} /> 近期创作 
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 ml-1">{history.length}</span>
                       </span>
                       <span className="text-slate-400 hover:text-slate-600 transition-colors">{isHistoryExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</span>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                   {isGalleryMode ? (
                      <button onClick={() => setIsGalleryMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors"><X size={14} /> 关闭画廊</button>
                   ) : (
                      <button onClick={() => { setIsGalleryMode(true); setGalleryTab('private'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors"><LayoutGrid size={12} /> 画廊模式</button>
                   )}
                </div>
             </div>
             
             {/* Content */}
             <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                {!isGalleryMode ? (
                    // Strip View
                    isHistoryExpanded && (
                        history.length === 0 ? <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">暂无创作记录</div> : (
                            <div className="h-full overflow-x-auto flex items-center px-5 gap-4 no-scrollbar py-2 animate-in fade-in slide-in-from-bottom-2">
                            {history.map(img => (
                                <div key={img.id} onClick={() => setGeneratedImage(img)} className={`relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group ${generatedImage?.id === img.id ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <img src={img.url} className="w-full h-full object-cover" alt="thumbnail" />
                                    {/* Tool Icon Badge Mini */}
                                    <div className="absolute top-1 left-1 bg-black/40 rounded p-0.5 text-white backdrop-blur-sm">
                                        {TOOLS.find(t => t.id === (img as any).toolId)?.icon || <Wand2 size={8} />}
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        {(img as any).toolId === 'text-to-image' && <button onClick={(e) => handleReusePrompt(e, img.prompt)} className="text-white hover:text-primary transition-colors"><CornerUpLeft size={16} /></button>}
                                        <button onClick={(e) => handleDelete(e, img.id)} className="text-white hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )
                    )
                ) : (
                    // Grid View
                    <div className="h-full overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-300">
                         {(galleryTab === 'private' ? history : publicImages).length === 0 ? (
                             <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-300">
                                <LayoutGrid size={48} className="mb-4 opacity-50" />
                                <p className="text-sm font-bold">暂无内容</p>
                             </div>
                         ) : (
                             (galleryTab === 'private' ? history : publicImages).map((img) => (
                                <div key={img.id} onClick={() => { if (galleryTab === 'public') setDetailImage(img as PublicImage); else { setGeneratedImage(img); setIsGalleryMode(false); } }} className="group relative aspect-square bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer">
                                   <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="gallery-item" />
                                   
                                   {/* Tool Badge */}
                                   <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white/90 flex items-center gap-1">
                                       {TOOLS.find(t => t.id === (img as any).toolId)?.icon || <Wand2 size={10} />}
                                       <span className="text-[10px] font-bold">{TOOLS.find(t => t.id === (img as any).toolId)?.name || 'Creation'}</span>
                                   </div>

                                   {/* Hover Overlay */}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                                      <div className="flex justify-between items-start translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                                           {galleryTab === 'public' && (
                                               <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white/90">
                                                   <User size={10} />
                                                   <span className="text-[10px] font-bold truncate max-w-[80px]">{(img as PublicImage).author}</span>
                                               </div>
                                           )}
                                           {galleryTab === 'private' && <div></div>}
                                           <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(e, img.url, img.id); }} className="p-2 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-xl backdrop-blur-md transition-colors shadow-sm"><Download size={14} /></button>
                                           </div>
                                      </div>
                                      <div className="translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300">
                                          <p className="text-white text-xs font-medium line-clamp-2 mb-3 leading-relaxed opacity-90 drop-shadow-md">{img.prompt}</p>
                                          <div className="flex items-center justify-between border-t border-white/20 pt-3">
                                              {galleryTab === 'public' ? (
                                                  <div className="flex items-center gap-3">
                                                      <div className={`flex items-center gap-1.5 ${(img as PublicImage).isLiked ? 'text-rose-400' : 'text-white/70'}`}><Heart size={12} className={(img as PublicImage).isLiked ? 'fill-current' : ''} /><span className="text-[10px] font-bold">{(img as PublicImage).likes}</span></div>
                                                      <div className="flex items-center gap-1.5 text-white/70"><MessageCircle size={12} /><span className="text-[10px] font-bold">{(img as PublicImage).comments.length}</span></div>
                                                  </div>
                                              ) : (
                                                  <span className="text-[10px] font-bold text-white/70">{new Date(img.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              )}
                                              <div className="flex gap-1">
                                                   {(img as any).toolId === 'text-to-image' && <button onClick={(e) => handleReusePrompt(e, img.prompt)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"><CornerUpLeft size={14} /></button>}
                                                   {galleryTab === 'private' && (
                                                       <>
                                                            <button onClick={(e) => onPublishClick(e, img)} className="p-1.5 text-white/70 hover:text-emerald-400 hover:bg-white/20 rounded-lg transition-colors"><Share2 size={14} /></button>
                                                            <button onClick={(e) => handleDelete(e, img.id)} className="p-1.5 text-white/70 hover:text-red-400 hover:bg-white/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                       </>
                                                   )}
                                              </div>
                                          </div>
                                      </div>
                                   </div>
                                </div>
                             ))
                         )}
                      </div>
                )}
             </div>
         </div>

         {/* ... Modals (Safety, Detail) - Same Logic ... */}
         {/* ... (Existing Modal Code Omitted for Brevity but presumed kept) ... */}
         {/* 1. Safety Check Publish Modal */}
         {publishImage && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 ring-1 ring-black/5">
                     <div className="p-6 text-center">
                         <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                             <AlertTriangle size={24} />
                         </div>
                         <h3 className="text-lg font-extrabold text-slate-900 mb-2">安全确认</h3>
                         <p className="text-sm text-slate-500 leading-relaxed mb-6">
                             您即将把这张图片发布到公开社区。
                             <br/><br/>
                             <strong className="text-slate-800">请确认该图片不包含任何公司机密或敏感产品信息。</strong>
                         </p>
                         <div className="flex gap-3">
                             <button 
                               onClick={() => setPublishImage(null)}
                               className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                             >
                                 取消
                             </button>
                             <button 
                               onClick={confirmPublish}
                               className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200"
                             >
                                 确认无误，发布
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* 2. Community Detail Modal */}
         {detailImage && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row ring-1 ring-white/10">
                     <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
                         <img 
                           src={detailImage.url} 
                           alt={detailImage.prompt} 
                           className="max-w-full max-h-full object-contain shadow-2xl shadow-slate-300/50 rounded-lg"
                         />
                         <button onClick={() => setDetailImage(null)} className="absolute top-4 left-4 p-2 bg-white/50 hover:bg-white text-slate-800 rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
                         <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1.5">
                              {TOOLS.find(t => t.id === (detailImage as any).toolId)?.icon}
                              {TOOLS.find(t => t.id === (detailImage as any).toolId)?.name || 'Image'}
                         </div>
                         <div className="absolute bottom-6 right-6 flex gap-2">
                             <button onClick={(e) => handleDownload(e, detailImage.url, detailImage.id)} className="p-3 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 transition-colors"><Download size={16} /> 下载原图</button>
                         </div>
                     </div>
                     <div className="w-full md:w-[400px] bg-white flex flex-col border-l border-slate-200">
                         <div className="p-6 border-b border-slate-100">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{detailImage.author.charAt(0)}</div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{detailImage.author}</h4>
                                    <span className="text-xs text-slate-400">{new Date(detailImage.timestamp).toLocaleDateString()} 发布</span>
                                </div>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                                 <p className="text-sm text-slate-700 font-medium leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">{detailImage.prompt}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={(e) => handleLike(e, detailImage.id)} className={`flex-1 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${detailImage.isLiked ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Heart size={14} className={detailImage.isLiked ? 'fill-current' : ''} /> {detailImage.likes}</button>
                                 {(detailImage as any).toolId === 'text-to-image' && (
                                    <button onClick={(e) => handleReusePrompt(e, detailImage.prompt)} className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><CornerUpLeft size={14} /> 一键同款</button>
                                 )}
                             </div>
                         </div>
                         <div className="flex-1 overflow-y-auto p-6 space-y-4">
                             <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">评论 ({detailImage.comments.length})</h5>
                             {detailImage.comments.length === 0 ? <div className="text-center py-10 text-slate-300 text-xs">暂无评论，快来抢沙发~</div> : detailImage.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{comment.user.charAt(0)}</div>
                                     <div className="flex-1">
                                         <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700"><span className="font-bold text-slate-900 text-xs block mb-1">{comment.user}</span>{comment.text}</div>
                                         <div className="text-[10px] text-slate-300 mt-1 pl-2">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                             <div className="flex gap-2">
                                 <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} placeholder="写下你的想法..." className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                                 <button onClick={handleAddComment} disabled={!newComment.trim()} className={`p-2.5 rounded-xl transition-all ${newComment.trim() ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Send size={18} /></button>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         )}
      </main>
    </div>
  );
};
