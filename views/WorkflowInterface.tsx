
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Play, FileText, CheckCircle, AlertCircle, 
  Clock, Download, RefreshCw, UploadCloud, File, Zap,
  History, X, ChevronRight, Calendar, Terminal, Layers, Copy, Check, Box, Square, Ban, AlertTriangle
} from 'lucide-react';
import { AppData, WorkflowInputDef, WorkflowRunResult } from '../types';

interface WorkflowInterfaceProps {
  app: AppData;
  onBack: () => void;
}

export const WorkflowInterface: React.FC<WorkflowInterfaceProps> = ({ app, onBack }) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const timeoutRef = useRef<number>(0);
  
  // Mock initial history
  const [history, setHistory] = useState<WorkflowRunResult[]>([
    {
      id: 'mock-1',
      status: 'succeeded',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, 
      inputs: { 'w1': '2023 W41', 'w2': 'Project Alpha launch successful.' },
      outputText: "### 自动化生成的报告\n\n**本周重点：**\nProject Alpha 顺利发布，各项指标符合预期。\n\n**风险提示：**\n供应链延迟风险略有上升。",
      outputFiles: [{ name: 'Weekly_Report_W41.pdf', url: '#', size: '450 KB' }]
    },
    {
      id: 'mock-2',
      status: 'failed',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, 
      inputs: { 'w1': '2023 W40' },
      outputText: "Error: Data source connection timeout. Please check your network settings.",
    }
  ]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const workflowInputs = app.workflowInputs || [
    { id: 'default_1', type: 'text', label: '输入内容', required: true } as WorkflowInputDef
  ];

  const handleInputChange = (id: string, value: any) => {
    setInputs(prev => ({ ...prev, [id]: value }));
    // Clear error when user types
    if (errors[id]) {
        setErrors(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }
  };

  const handleRun = () => {
    // Validation
    const newErrors: Record<string, string> = {};
    let hasError = false;
    
    workflowInputs.forEach(input => {
        const val = inputs[input.id];
        if (input.required) {
             if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
                newErrors[input.id] = '此项为必填项';
                hasError = true;
             }
        }
    });

    if (hasError) {
        setErrors(newErrors);
        return;
    }

    const newRunId = Date.now().toString();
    setIsRunning(true);
    
    // Optimistic UI
    const newRun: WorkflowRunResult = {
      id: newRunId,
      status: 'running',
      timestamp: Date.now(),
      inputs: { ...inputs }
    };
    setHistory(prev => [newRun, ...prev]);
    setActiveRunId(newRunId);

    // Simulate Processing
    timeoutRef.current = window.setTimeout(() => {
      setIsRunning(false);
      setShowStopConfirm(false); // Close the stop modal if it's open when task finishes naturally
      setHistory(prev => prev.map(run => {
        if (run.id === newRunId) {
          return {
            ...run,
            status: 'succeeded',
            outputText: "### 自动化审查报告\n\n**检查结果：**\n- 格式规范性：通过\n- 关键要素完整性：**警告** (缺少风险评估章节)\n\n建议补充第 4 章节的风险应对方案。详情请查看附件。",
            outputFiles: [
              { name: '审查报告_v1.docx', url: '#', size: '245 KB' },
              { name: '问题清单.xlsx', url: '#', size: '12 KB' }
            ]
          };
        }
        return run;
      }));
    }, 3000);
  };

  const requestStop = () => {
    setShowStopConfirm(true);
  };

  const confirmStop = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    setIsRunning(false);
    setShowStopConfirm(false);
    
    setHistory(prev => prev.map(run => {
        if (run.id === activeRunId && run.status === 'running') {
            return {
                ...run,
                status: 'stopped',
                outputText: "任务已由用户手动终止。",
                outputFiles: []
            };
        }
        return run;
    }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeResult = history.find(h => h.id === activeRunId);

  const getInputLabel = (id: string) => {
    const def = app.workflowInputs?.find(i => i.id === id);
    return def ? def.label : id;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 p-6 gap-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none -z-10" />

      {/* Sidebar: Form Input */}
      <aside className="w-1/3 min-w-[400px] bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-float flex flex-col ring-1 ring-slate-900/5 relative overflow-hidden z-10 transition-all duration-300">
         {/* Header */}
         <div className="p-6 border-b border-slate-100/80 bg-white/40 backdrop-blur-md z-10">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold mb-4 group">
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 返回广场
            </button>
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 transform transition-transform hover:scale-105 duration-300" style={{ backgroundColor: app.iconBg, color: app.iconColor }}>
                   <Zap size={28} fill="currentColor" />
               </div>
               <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{app.name}</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1.5">
                     <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase tracking-wide shadow-sm">v1.0</span>
                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                     <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md"><Box size={12} /> 自动化工作流</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Form */}
         <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">应用描述</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {app.description}
                </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); isRunning ? requestStop() : handleRun(); }}>
               {workflowInputs.map(input => (
                 <div key={input.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <label className={`flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide mb-2.5 ml-1 ${errors[input.id] ? 'text-red-500' : 'text-slate-500'}`}>
                       {input.label} {input.required && <span className="text-rose-400" title="Required">*</span>}
                    </label>
                    
                    {input.type === 'text' && (
                       <input 
                         type="text"
                         placeholder={input.placeholder}
                         disabled={isRunning}
                         className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-sm disabled:bg-slate-50 disabled:text-slate-400 ${errors[input.id] ? 'border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300'}`}
                         value={inputs[input.id] || ''}
                         onChange={(e) => handleInputChange(input.id, e.target.value)}
                       />
                    )}

                    {input.type === 'paragraph' && (
                       <textarea 
                         placeholder={input.placeholder}
                         disabled={isRunning}
                         className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 h-32 resize-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400 ${errors[input.id] ? 'border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300'}`}
                         value={inputs[input.id] || ''}
                         onChange={(e) => handleInputChange(input.id, e.target.value)}
                       />
                    )}

                    {input.type === 'select' && (
                       <div className="relative">
                           <select
                               disabled={isRunning}
                               className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-sm font-bold text-slate-700 appearance-none shadow-sm cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${errors[input.id] ? 'border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300'}`}
                               value={inputs[input.id] || ''}
                               onChange={(e) => handleInputChange(input.id, e.target.value)}
                           >
                               <option value="" disabled>请选择...</option>
                               {input.options?.map(opt => (
                                   <option key={opt} value={opt}>{opt}</option>
                               ))}
                           </select>
                           <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                       </div>
                    )}

                    {input.type === 'file' && (
                       <div className={`relative group ${!isRunning ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${errors[input.id] ? 'border-red-300 bg-red-50/20' : (inputs[input.id] ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-primary-soft/30')}`}>
                             <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${errors[input.id] ? 'bg-red-100 text-red-500' : (inputs[input.id] ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300 group-hover:text-primary shadow-sm')}`}>
                                {inputs[input.id] ? <CheckCircle size={24} /> : (errors[input.id] ? <AlertCircle size={24} /> : <UploadCloud size={24} />)}
                             </div>
                             {inputs[input.id] ? (
                                <div>
                                    <p className="text-sm font-bold text-emerald-700 truncate max-w-[200px] mx-auto">{inputs[input.id]}</p>
                                    <p className="text-[10px] text-emerald-500 mt-1 font-bold">点击更换文件</p>
                                </div>
                             ) : (
                                <div>
                                    <p className={`text-sm font-bold ${errors[input.id] ? 'text-red-500' : 'text-slate-600 group-hover:text-primary-dark'}`}>
                                        {errors[input.id] ? '请上传文件' : '点击或拖拽上传'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Supports {input.accept || 'All'}</p>
                                </div>
                             )}
                          </div>
                          <input 
                             type="file" 
                             disabled={isRunning}
                             className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                             accept={input.accept}
                             onChange={(e) => handleInputChange(input.id, e.target.files?.[0]?.name)}
                          />
                       </div>
                    )}

                    {errors[input.id] && (
                        <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1 ml-1">
                            <AlertCircle size={12} /> {errors[input.id]}
                        </div>
                    )}
                 </div>
               ))}
            </form>
         </div>

         {/* Footer Action */}
         <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md z-10">
            {isRunning ? (
                <button 
                   onClick={requestStop}
                   className="w-full py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-500 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 hover:shadow-md transition-all transform active:scale-[0.98] duration-200 flex items-center justify-center gap-2 group"
                >
                   <Square size={18} fill="currentColor" className="opacity-50 group-hover:opacity-100 transition-opacity" /> 
                   <span>停止任务</span>
                </button>
            ) : (
                <button 
                   onClick={handleRun}
                   className="w-full py-4 rounded-2xl font-bold text-sm bg-slate-900 text-white shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] duration-200 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1"
                >
                   <Play size={18} fill="currentColor" /> 开始运行
                </button>
            )}
         </div>
      </aside>

      {/* Main Content: Results & History */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden relative">
         
         {/* Active Result View */}
         <div className="flex-1 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-float flex flex-col overflow-hidden relative ring-1 ring-slate-900/5 z-0 transition-all duration-300">
            
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-100/80 px-6 flex items-center justify-between bg-white/40 backdrop-blur-md">
               <span className="font-extrabold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                 <FileText size={16} className="text-primary" /> 执行结果
               </span>
               
               <div className="flex items-center gap-3">
                  {activeResult && (
                     <div className="flex items-center gap-2 mr-2 animate-in fade-in">
                        <span className="text-xs text-slate-400 font-mono hidden xl:inline-block border border-slate-200 rounded px-1.5 bg-white/50">{activeResult.id}</span>
                        {activeResult.status === 'succeeded' && <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1 shadow-sm"><CheckCircle size={10} /> SUCCESS</span>}
                        {activeResult.status === 'running' && <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-extrabold border border-blue-200 animate-pulse flex items-center gap-1 shadow-sm"><RefreshCw size={10} className="animate-spin" /> RUNNING</span>}
                        {activeResult.status === 'failed' && <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-extrabold border border-red-200 flex items-center gap-1 shadow-sm"><AlertCircle size={10} /> FAILED</span>}
                        {activeResult.status === 'stopped' && <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-extrabold border border-slate-200 flex items-center gap-1 shadow-sm"><Ban size={10} /> STOPPED</span>}
                     </div>
                  )}

                  <div className="h-5 w-px bg-slate-200 mx-2"></div>

                  <button 
                     onClick={() => setIsHistoryOpen(true)}
                     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-primary/30 hover:text-primary hover:bg-primary-soft/50 transition-all shadow-sm group hover:shadow-md"
                  >
                     <History size={14} className="group-hover:text-primary transition-colors" />
                     历史记录
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
               {!activeResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 animate-in fade-in zoom-in-95 duration-500">
                     <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-100/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <Play size={32} fill="currentColor" className="text-slate-200 ml-1 relative z-10" />
                     </div>
                     <p className="text-lg font-bold text-slate-800 mb-1">准备就绪</p>
                     <p className="text-sm font-medium text-slate-400">在左侧填写参数以开始任务</p>
                  </div>
               ) : (
                  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                     
                     {/* 1. INPUTS Section */}
                     <div className="mb-8">
                         <div className="flex items-center gap-2 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                                <Terminal size={16} />
                             </div>
                             <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">输入参数 (Input)</h3>
                         </div>
                         
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
                                {Object.entries(activeResult.inputs).map(([key, val]) => (
                                    <div key={key} className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                            {getInputLabel(key)}
                                        </span>
                                        <div className="text-sm font-bold text-slate-700 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 min-h-[46px]">
                                            {String(val).match(/\.(pdf|docx|xlsx|txt|jpg|png)$/i) ? <File size={16} className="text-primary flex-shrink-0" /> : null}
                                            <span className="truncate">{String(val)}</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </div>
                     </div>

                     {/* Arrow Separator */}
                     <div className="flex justify-center mb-8 opacity-20">
                         <div className="bg-slate-300 p-2 rounded-full shadow-inner">
                            <ChevronRight size={24} className="rotate-90 text-slate-600" />
                         </div>
                     </div>

                     {/* 2. OUTPUTS Section */}
                     <div>
                         <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                   <Layers size={16} />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">执行结果 (Output)</h3>
                             </div>
                             {activeResult.outputText && (
                                <button 
                                  onClick={() => handleCopy(activeResult.outputText!)}
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100"
                                >
                                    {copied ? <Check size={12} /> : <Copy size={12} />}
                                    {copied ? '已复制' : '复制结果'}
                                </button>
                             )}
                         </div>

                         {activeResult.status === 'running' ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                               <div className="flex items-center gap-3 text-slate-700 font-bold mb-6">
                                  <RefreshCw size={20} className="animate-spin text-primary" /> 
                                  正在处理任务...
                               </div>
                               <div className="space-y-4">
                                  <div className="h-4 bg-slate-100 rounded-lg w-3/4 animate-pulse"></div>
                                  <div className="h-4 bg-slate-50 rounded-lg w-1/2 animate-pulse"></div>
                                  <div className="h-4 bg-slate-50 rounded-lg w-5/6 animate-pulse"></div>
                               </div>
                            </div>
                         ) : (
                            <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${activeResult.status === 'stopped' ? 'border-slate-300' : 'border-slate-200'}`}>
                               {/* Meta Info Bar */}
                               <div className={`flex items-center gap-4 text-xs px-6 py-3 border-b ${activeResult.status === 'stopped' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-50/50 border-slate-100 text-slate-400'}`}>
                                  <div className="flex items-center gap-1.5 font-bold"><Calendar size={14} /> {new Date(activeResult.timestamp).toLocaleString()}</div>
                                  <div className={`w-px h-3 ${activeResult.status === 'stopped' ? 'bg-slate-300' : 'bg-slate-200'}`}></div>
                                  <div className="font-mono">ID: {activeResult.id}</div>
                               </div>

                               <div className="p-8 space-y-8">
                                   {/* Text Output */}
                                   {activeResult.outputText && (
                                      <div className={`prose prose-sm max-w-none font-medium ${activeResult.status === 'stopped' ? 'text-slate-500' : 'text-slate-700'}`}>
                                         {activeResult.outputText.split('\n').map((line, i) => (
                                            <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/^### (.*)/, '<h3 class="text-lg font-bold text-slate-900 mb-2 mt-4">$1</h3>').replace(/^- (.*)/, '<li class="ml-4 list-disc marker:text-slate-300">$1</li>') }} />
                                         ))}
                                      </div>
                                   )}

                                   {/* File Outputs */}
                                   {activeResult.outputFiles && activeResult.outputFiles.length > 0 && (
                                      <div className="pt-6 border-t border-slate-100">
                                         <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Download size={12} /> 生成文件
                                         </h4>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeResult.outputFiles.map((file, idx) => (
                                               <div key={idx} className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-white transition-all group cursor-pointer">
                                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 transition-transform">
                                                     <FileText size={20} />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                     <div className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{file.name}</div>
                                                     <div className="text-xs text-slate-400 font-bold mt-0.5">{file.size}</div>
                                                  </div>
                                                  <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                                                     <Download size={16} />
                                                  </button>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                               </div>
                            </div>
                         )}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* History Drawer */}
         {isHistoryOpen && (
            <div className="absolute inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200 rounded-3xl overflow-hidden">
               <div className="flex-1" onClick={() => setIsHistoryOpen(false)} />
               <div className="w-96 bg-white/90 backdrop-blur-xl h-full shadow-2xl border-l border-white/50 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/60 z-10">
                     <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                        <History size={20} className="text-primary" /> 运行历史
                     </h3>
                     <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                     {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                           <History size={32} className="mb-3 opacity-20" />
                           <div className="text-xs font-bold">暂无运行记录</div>
                        </div>
                     ) : (
                        history.map(run => (
                           <div 
                              key={run.id} 
                              onClick={() => { setActiveRunId(run.id); setIsHistoryOpen(false); }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${
                                 activeRunId === run.id 
                                    ? 'bg-white border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/10' 
                                    : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md'
                              }`}
                           >
                              <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-2">
                                    {run.status === 'succeeded' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                                    {run.status === 'running' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                                    {run.status === 'failed' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                    {run.status === 'stopped' && <div className="w-2 h-2 rounded-full bg-slate-400"></div>}
                                    <span className={`text-xs font-extrabold uppercase tracking-wider ${
                                       run.status === 'succeeded' ? 'text-emerald-700' : 
                                       run.status === 'failed' ? 'text-red-700' : 
                                       run.status === 'stopped' ? 'text-slate-500' : 'text-blue-700'
                                    }`}>
                                       {run.status === 'succeeded' ? 'SUCCESS' : run.status}
                                    </span>
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {new Date(run.timestamp).toLocaleDateString()}
                                 </span>
                              </div>
                              
                              <div className="text-[10px] text-slate-400 mb-3 flex items-center gap-1.5 font-medium">
                                <Clock size={12} /> {new Date(run.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              
                              {/* Mini Input Summary */}
                              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5">
                                 {Object.entries(run.inputs).slice(0, 2).map(([key, val]) => (
                                    <div key={key} className="text-xs text-slate-500 truncate flex items-center gap-2">
                                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                                       <span className="truncate flex-1 font-medium">{String(val)}</span>
                                    </div>
                                 ))}
                                 {Object.keys(run.inputs).length > 2 && (
                                     <div className="text-[9px] text-slate-400 pl-3.5">+{Object.keys(run.inputs).length - 2} more...</div>
                                 )}
                              </div>

                              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-primary">
                                 <ChevronRight size={20} />
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Stop Confirmation Modal */}
         {showStopConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 ring-1 ring-black/5 scale-100">
                  <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                        <AlertTriangle size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-slate-900">确认停止任务？</h3>
                     <p className="text-sm text-slate-500 mt-2">
                        当前正在运行的任务将被中断，已生成的内容可能会丢失。
                     </p>
                  </div>
                  <div className="flex gap-3">
                     <button 
                       onClick={() => setShowStopConfirm(false)}
                       className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                     >
                        取消
                     </button>
                     <button 
                       onClick={confirmStop}
                       className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                     >
                        确认停止
                     </button>
                  </div>
               </div>
            </div>
         )}

      </main>
    </div>
  );
};
