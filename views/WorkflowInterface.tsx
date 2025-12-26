import React, { useState } from 'react';
import { 
  ArrowLeft, Play, FileText, CheckCircle, AlertCircle, 
  Clock, Download, RefreshCw, UploadCloud, File, ShieldCheck, Zap,
  History, X, ChevronRight, Calendar
} from 'lucide-react';
import { AppData, WorkflowInputDef, WorkflowRunResult } from '../types';

interface WorkflowInterfaceProps {
  app: AppData;
  onBack: () => void;
}

export const WorkflowInterface: React.FC<WorkflowInterfaceProps> = ({ app, onBack }) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  
  // Mock initial history for demonstration
  const [history, setHistory] = useState<WorkflowRunResult[]>([
    {
      id: 'mock-1',
      status: 'completed',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      inputs: { 'w1': '2023 W41', 'w2': 'Project Alpha launch successful.' },
      outputText: "### 自动化生成的报告\n\n**本周重点：**\nProject Alpha 顺利发布，各项指标符合预期。\n\n**风险提示：**\n供应链延迟风险略有上升。",
      outputFiles: [{ name: 'Weekly_Report_W41.pdf', url: '#', size: '450 KB' }]
    },
    {
      id: 'mock-2',
      status: 'failed',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      inputs: { 'w1': '2023 W40' },
      outputText: "Error: Data source connection timeout. Please check your network settings.",
    }
  ]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Use defined inputs or default fallback
  const workflowInputs = app.workflowInputs || [
    { id: 'default_1', type: 'text', label: '输入内容', required: true } as WorkflowInputDef
  ];

  const handleInputChange = (id: string, value: any) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleRun = () => {
    const newRunId = Date.now().toString();
    setIsRunning(true);
    
    // Optimistic UI: Create a running entry
    const newRun: WorkflowRunResult = {
      id: newRunId,
      status: 'running',
      timestamp: Date.now(),
      inputs: { ...inputs }
    };
    setHistory(prev => [newRun, ...prev]);
    setActiveRunId(newRunId);

    // Simulate Processing
    setTimeout(() => {
      setIsRunning(false);
      setHistory(prev => prev.map(run => {
        if (run.id === newRunId) {
          return {
            ...run,
            status: 'completed',
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

  const activeResult = history.find(h => h.id === activeRunId);

  // Helper to get input summary for list
  const getInputSummary = (inputs: Record<string, any>) => {
     const values = Object.values(inputs);
     if (values.length === 0) return 'No inputs';
     return values[0];
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 p-6 gap-6 overflow-hidden relative">
      
      {/* Sidebar: Form Input */}
      <aside className="w-1/3 min-w-[400px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-float flex flex-col ring-1 ring-slate-900/5 relative overflow-hidden z-10">
         {/* Header */}
         <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold mb-4">
               <ArrowLeft size={14} /> 返回广场
            </button>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: app.iconBg, color: app.iconColor }}>
                   <Zap size={24} fill="currentColor" />
               </div>
               <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{app.name}</h2>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                     <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">v1.0</span>
                     <span>•</span>
                     <span>自动化工作流</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Form */}
         <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
               {app.description}
            </p>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleRun(); }}>
               {workflowInputs.map(input => (
                 <div key={input.id}>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                       {input.label} {input.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {input.type === 'text' && (
                       <input 
                         type="text"
                         placeholder={input.placeholder}
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                         value={inputs[input.id] || ''}
                         onChange={(e) => handleInputChange(input.id, e.target.value)}
                       />
                    )}

                    {input.type === 'paragraph' && (
                       <textarea 
                         placeholder={input.placeholder}
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium h-32 resize-none"
                         value={inputs[input.id] || ''}
                         onChange={(e) => handleInputChange(input.id, e.target.value)}
                       />
                    )}

                    {input.type === 'select' && (
                       <div className="relative">
                           <select
                               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium appearance-none"
                               value={inputs[input.id] || ''}
                               onChange={(e) => handleInputChange(input.id, e.target.value)}
                           >
                               <option value="" disabled>请选择</option>
                               {input.options?.map(opt => (
                                   <option key={opt} value={opt}>{opt}</option>
                               ))}
                           </select>
                           <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                       </div>
                    )}

                    {input.type === 'file' && (
                       <div className="relative group">
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center transition-all group-hover:border-primary/50 group-hover:bg-primary-soft/30 bg-slate-50/50">
                             <UploadCloud size={32} className="mx-auto text-slate-300 mb-2 group-hover:text-primary transition-colors" />
                             <p className="text-sm font-bold text-slate-600 group-hover:text-primary-dark">点击或拖拽上传</p>
                             <p className="text-xs text-slate-400 mt-1">支持 {input.accept || '所有格式'}</p>
                          </div>
                          <input 
                             type="file" 
                             className="absolute inset-0 opacity-0 cursor-pointer" 
                             accept={input.accept}
                             onChange={(e) => handleInputChange(input.id, e.target.files?.[0]?.name)}
                          />
                          {inputs[input.id] && (
                             <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <File size={14} /> {inputs[input.id]}
                             </div>
                          )}
                       </div>
                    )}
                 </div>
               ))}
            </form>
         </div>

         {/* Footer Action */}
         <div className="p-6 border-t border-slate-100 bg-white z-10">
            <button 
               onClick={handleRun}
               disabled={isRunning}
               className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isRunning ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl'}`}
            >
               {isRunning ? (
                  <>正在执行任务 <RefreshCw size={16} className="animate-spin" /></>
               ) : (
                  <>开始运行 <Play size={16} fill="currentColor" /></>
               )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 mt-3">
               <ShieldCheck size={12} className="text-primary" />
               SECURE EXECUTION ENVIRONMENT
            </div>
         </div>
      </aside>

      {/* Main Content: Results & History */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden relative">
         
         {/* Active Result View */}
         <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-float flex flex-col overflow-hidden relative ring-1 ring-slate-900/5 z-0">
            <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none -z-10" />
            
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white/40">
               <span className="font-extrabold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                 <FileText size={16} className="text-primary" /> 执行结果
               </span>
               
               <div className="flex items-center gap-3">
                  {activeResult && (
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">{activeResult.id}</span>
                        {activeResult.status === 'completed' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold border border-emerald-200">SUCCESS</span>}
                        {activeResult.status === 'running' && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold border border-blue-200 animate-pulse">RUNNING</span>}
                        {activeResult.status === 'failed' && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold border border-red-200">FAILED</span>}
                     </div>
                  )}

                  <div className="h-4 w-px bg-slate-200 mx-1"></div>

                  <button 
                     onClick={() => setIsHistoryOpen(true)}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-primary hover:text-primary transition-all shadow-sm group"
                  >
                     <History size={14} className="group-hover:text-primary transition-colors" />
                     历史记录
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               {!activeResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                     <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                        <Play size={32} fill="currentColor" className="text-slate-200" />
                     </div>
                     <p className="text-sm font-bold text-slate-400">在左侧填写表单以开始任务</p>
                  </div>
               ) : (
                  <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {activeResult.status === 'running' ? (
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 text-slate-700 font-bold">
                              <RefreshCw size={20} className="animate-spin text-primary" /> 
                              正在处理任务...
                           </div>
                           <div className="space-y-3">
                              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-8">
                           {/* Meta Info */}
                           <div className="flex items-center gap-4 text-xs text-slate-400 pb-4 border-b border-slate-100">
                              <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(activeResult.timestamp).toLocaleString()}</div>
                              <div className="w-px h-3 bg-slate-200"></div>
                              <div>ID: {activeResult.id}</div>
                           </div>

                           {/* Text Output */}
                           {activeResult.outputText && (
                              <div className="prose prose-slate prose-sm max-w-none bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                 {activeResult.outputText.split('\n').map((line, i) => (
                                    <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/^### (.*)/, '<h3 class="text-lg font-bold text-slate-900 mb-2">$1</h3>').replace(/^- (.*)/, '<li class="ml-4 list-disc">$1</li>') }} />
                                 ))}
                              </div>
                           )}

                           {/* File Outputs */}
                           {activeResult.outputFiles && activeResult.outputFiles.length > 0 && (
                              <div>
                                 <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">生成的文件</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeResult.outputFiles.map((file, idx) => (
                                       <div key={idx} className="flex items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
                                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
                                             <FileText size={20} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                             <div className="text-sm font-bold text-slate-800 truncate">{file.name}</div>
                                             <div className="text-xs text-slate-400">{file.size}</div>
                                          </div>
                                          <button className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                             <Download size={16} />
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>

         {/* History Drawer */}
         {isHistoryOpen && (
            <div className="absolute inset-0 z-50 flex justify-end bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200 rounded-3xl overflow-hidden">
               <div className="flex-1" onClick={() => setIsHistoryOpen(false)} />
               <div className="w-96 bg-white h-full shadow-2xl border-l border-white/50 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                     <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-primary" /> 运行历史
                     </h3>
                     <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                        <X size={18} />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                     {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs font-bold">暂无运行记录</div>
                     ) : (
                        history.map(run => (
                           <div 
                              key={run.id} 
                              onClick={() => { setActiveRunId(run.id); setIsHistoryOpen(false); }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${
                                 activeRunId === run.id 
                                    ? 'bg-white border-primary shadow-md ring-1 ring-primary/10' 
                                    : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-sm'
                              }`}
                           >
                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                    {run.status === 'completed' && <CheckCircle size={14} className="text-emerald-500" />}
                                    {run.status === 'running' && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
                                    {run.status === 'failed' && <AlertCircle size={14} className="text-red-500" />}
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                       run.status === 'completed' ? 'text-emerald-600' : 
                                       run.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                       {run.status}
                                    </span>
                                 </div>
                                 <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                    {new Date(run.timestamp).toLocaleDateString()}
                                 </span>
                              </div>
                              
                              <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                                <Clock size={10} /> {new Date(run.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              
                              <div className="space-y-1 pt-2 border-t border-slate-100">
                                 {Object.entries(run.inputs).slice(0, 3).map(([key, val]) => (
                                    <div key={key} className="text-xs text-slate-500 truncate flex items-center gap-1">
                                       <span className="font-bold text-slate-700 max-w-[80px] truncate">{key}:</span> 
                                       <span className="truncate">{String(val)}</span>
                                    </div>
                                 ))}
                              </div>

                              <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                 <ArrowLeft size={16} className="rotate-180" />
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         )}

      </main>
    </div>
  );
};