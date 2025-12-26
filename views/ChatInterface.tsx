import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Send, Paperclip, 
  Sparkles, ShieldCheck, 
  Plus, Zap, AlertTriangle,
  Pin, PinOff, MoreHorizontal, Trash2,
  Bot, SlidersHorizontal, Settings2, ChevronDown, ChevronUp, File, X
} from 'lucide-react';
import { AppData, Message, Thread, WorkflowInputDef } from '../types';

interface ChatInterfaceProps {
  app: AppData;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ app, onBack }) => {
  const [input, setInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('1');
  const [threads, setThreads] = useState<Thread[]>([
    { id: '1', title: '新会话', lastMessage: '等待输入...', active: true, isPinned: false },
  ]);
  
  // Dynamic Variables State
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);

  // Attachment State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation: Check for missing required inputs
  const missingInputs = useMemo(() => {
    if (!app.workflowInputs) return [];
    return app.workflowInputs.filter(input => input.required && !variableValues[input.id]);
  }, [app.workflowInputs, variableValues]);

  const isConfigValid = missingInputs.length === 0;
  
  // Has any workflow inputs? If not, config panel logic should be different
  const hasWorkflowInputs = app.workflowInputs && app.workflowInputs.length > 0;

  useEffect(() => {
      // Auto close config panel if no inputs required
      if (!hasWorkflowInputs) {
          setIsConfigPanelOpen(false);
      }
  }, [hasWorkflowInputs]);

  // Initial Message Logic
  const getInitialMessageContent = () => {
      if (app.capabilities?.welcomeMessage && app.welcomeMessage) {
          return app.welcomeMessage;
      }
      if (hasWorkflowInputs) {
          return '请在上方配置参数后开始对话，我会根据您的设定生成内容。';
      }
      return '所有对话数据均已加密。请问今天能帮你做什么？';
  };

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: `你好！我是 **${app.name}**。\n\n${getInitialMessageContent()}`, timestamp: Date.now() }
  ]);
  
  const [usage, setUsage] = useState(app.quota.used);
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isConfigPanelOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isUnlimited = app.quota.limit === 'unlimited';
  const remaining = isUnlimited ? Infinity : (app.quota.limit as number) - usage;
  const isExhausted = !isUnlimited && remaining <= 0;
  const isLow = !isUnlimited && remaining > 0 && remaining <= 5;

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleSend = () => {
    if ((!input.trim() && !attachedFile) || isExhausted) return;
    
    // Check required variables if any
    if (!isConfigValid) {
       setIsConfigPanelOpen(true);
       return;
    }

    // Construct context from variables
    let contextIntro = "";
    if (hasWorkflowInputs && Object.keys(variableValues).length > 0) {
       contextIntro = "**[已应用上下文配置]**\n" + 
          Object.entries(variableValues).map(([k, v]) => {
             const def = app.workflowInputs?.find(i => i.id === k);
             return `- ${def?.label}: ${v}`;
          }).join("\n") + "\n\n";
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      attachments: attachedFile ? [{ name: attachedFile.name, type: attachedFile.type }] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null); // Clear attachment
    setIsTyping(true);
    
    // Auto collapse config panel on send if it was open
    if (isConfigPanelOpen && messages.length <= 1 && hasWorkflowInputs) {
        setIsConfigPanelOpen(false);
    }
    
    if (!isUnlimited) {
      setUsage(prev => prev + 1);
    }

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: contextIntro ? `${contextIntro}收到。基于上述配置，为您生成以下内容：\n\n这是一个模拟的生成结果...` : "已收到您的请求。为了提供最佳结果，请指定期望的格式（例如表格、要点）以及任何约束条件。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAttachedFile(e.target.files[0]);
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const createThread = () => {
    const newId = Date.now().toString();
    const newThread: Thread = { id: newId, title: '新对话', lastMessage: '', active: true, isPinned: false };
    setThreads(prev => prev.map(t => ({...t, active: false})).concat(newThread));
    setActiveThreadId(newId);
    setMessages([{ id: Date.now().toString(), role: 'ai', content: `已开启与 **${app.name}** 的新会话。`, timestamp: Date.now() }]);
    setVariableValues({}); // Reset vars
    if (hasWorkflowInputs) setIsConfigPanelOpen(true);
  };

  const selectThread = (id: string) => {
    setActiveThreadId(id);
    setThreads(prev => prev.map(t => ({...t, active: t.id === id})));
  };

  const togglePinThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setThreads(prev => prev.map(t => 
      t.id === id ? { ...t, isPinned: !t.isPinned } : t
    ));
    setMenuOpenId(null);
  };

  const deleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) {
       setActiveThreadId('');
       setMessages([]);
    }
    setMenuOpenId(null);
  };

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  // Helper to render inputs
  const renderVariableInput = (def: WorkflowInputDef) => {
     const val = variableValues[def.id] || '';
     
     switch(def.type) {
        case 'select':
           return (
              <div className="relative">
                 <select 
                   value={val}
                   onChange={(e) => setVariableValues({...variableValues, [def.id]: e.target.value})}
                   className={`w-full appearance-none bg-slate-50 border text-slate-700 text-xs font-bold rounded-xl px-4 py-3 pr-8 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer ${def.required && !val ? 'border-amber-200 focus:border-amber-400' : 'border-slate-200'}`}
                 >
                    <option value="" disabled>请选择 {def.label}</option>
                    {def.options?.map(opt => (
                       <option key={opt} value={opt}>{opt}</option>
                    ))}
                 </select>
                 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
           );
        // Note: 'file' type inputs in workflowInputs are separate from the chat attachment feature.
        // If a workflow requires a file input specifically (e.g. for processing), it stays here.
        case 'file':
           return (
              <div className="relative group">
                 <input 
                   type="file" 
                   accept={def.accept}
                   onChange={(e) => setVariableValues({...variableValues, [def.id]: e.target.files?.[0]?.name})}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed transition-all ${val ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:border-primary/50'} ${def.required && !val ? 'border-amber-200' : 'border-slate-200'}`}>
                    {val ? <File size={14} /> : <Paperclip size={14} />}
                    <span className="text-xs font-bold truncate">{val || `点击上传 ${def.label}`}</span>
                    {val && <button onClick={(e) => {e.preventDefault(); e.stopPropagation(); setVariableValues({...variableValues, [def.id]: ''})}} className="ml-auto p-1 hover:bg-emerald-100 rounded-full"><X size={12} /></button>}
                 </div>
              </div>
           );
        default: // text or paragraph
           return (
              <input 
                 type="text"
                 value={val}
                 onChange={(e) => setVariableValues({...variableValues, [def.id]: e.target.value})}
                 placeholder={def.placeholder || `请输入 ${def.label}`}
                 className={`w-full bg-slate-50 border text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:font-medium placeholder:text-slate-400 ${def.required && !val ? 'border-amber-200 focus:border-amber-400' : 'border-slate-200'}`}
              />
           );
     }
  };

  // Determine if file upload is enabled via capabilities
  const canUploadFile = app.capabilities?.fileUpload || app.provider === 'native'; // Native always supports it in this demo context, or rely on capability

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 p-6 gap-6 overflow-hidden">
      
      {/* Sidebar - History */}
      <aside className="w-80 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl flex flex-col shadow-float hidden md:flex ring-1 ring-slate-900/5">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <span className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <Bot size={16} className="text-primary" /> 历史会话
          </span>
          <button 
            onClick={createThread}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all" title="新对话"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedThreads.map(thread => (
            <div 
              key={thread.id}
              onClick={() => selectThread(thread.id)}
              className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all border ${
                activeThreadId === thread.id 
                  ? 'bg-primary-soft border-primary/20 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm hover:border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start">
                 <div className={`font-bold text-sm mb-1.5 pr-6 truncate transition-colors ${activeThreadId === thread.id ? 'text-primary-dark' : 'text-slate-700'}`}>
                   {thread.isPinned && <Pin size={12} className="inline mr-1.5 text-primary rotate-45" fill="currentColor" />}
                   {thread.title}
                 </div>
                 
                 <button 
                    onClick={(e) => openMenu(e, thread.id)}
                    className={`absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all ${menuOpenId === thread.id ? 'opacity-100 bg-slate-200/50' : 'opacity-0 group-hover:opacity-100'}`}
                 >
                    <MoreHorizontal size={16} />
                 </button>

                 {menuOpenId === thread.id && (
                   <div ref={menuRef} className="absolute right-2 top-10 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ring-1 ring-black/5">
                      <div className="py-1">
                        <button 
                          onClick={(e) => togglePinThread(e, thread.id)}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center gap-2"
                        >
                           {thread.isPinned ? <PinOff size={14} /> : <Pin size={14} />} 
                           {thread.isPinned ? '取消置顶' : '置顶对话'}
                        </button>
                        <div className="h-px bg-slate-100 my-0.5"></div>
                        <button 
                          onClick={(e) => deleteThread(e, thread.id)}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2"
                        >
                           <Trash2 size={14} /> 删除对话
                        </button>
                      </div>
                   </div>
                 )}
              </div>
              <div className={`text-xs truncate pr-6 font-medium ${activeThreadId === thread.id ? 'text-primary-dark/70' : 'text-slate-400'}`}>
                {thread.lastMessage || '暂无消息'}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-float flex flex-col overflow-hidden relative ring-1 ring-slate-900/5">
        
        {/* Chat Header */}
        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/60 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-5">
            <button onClick={onBack} className="p-2.5 -ml-3 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{app.name}</h2>
                
                {isUnlimited ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-md uppercase tracking-wide border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <Zap size={12} fill="currentColor" /> 无限畅用
                  </span>
                ) : isExhausted ? (
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-extrabold rounded-md uppercase tracking-wide border border-red-100 flex items-center gap-1.5 animate-pulse shadow-sm">
                    <AlertTriangle size={12} fill="currentColor" /> 额度耗尽
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wide border flex items-center gap-1.5 shadow-sm transition-all ${
                    isLow 
                      ? 'bg-orange-50 text-orange-600 border-orange-200' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                    {isLow ? <AlertTriangle size={12} /> : <Zap size={12} className="text-primary" fill="currentColor" />}
                    剩余 {remaining} {app.quota.unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                 <ShieldCheck size={12} className="text-primary" />
                 <span className="tracking-wide">ENTERPRISE SECURE MODE</span>
              </div>
            </div>
          </div>
          
          {hasWorkflowInputs && (
             <button 
               onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isConfigPanelOpen ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white text-slate-500 border-slate-100 hover:border-primary/30 hover:text-primary'} ${!isConfigValid && 'ring-2 ring-amber-100 border-amber-200 bg-amber-50 text-amber-700'}`}
             >
                <SlidersHorizontal size={14} />
                {isConfigPanelOpen ? '收起配置' : '展开配置'}
                {!isConfigValid && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
             </button>
           )}
        </div>

        {/* Dynamic Variables Configuration Panel */}
        {hasWorkflowInputs && (
           <div className={`bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 transition-all duration-300 ease-in-out overflow-hidden z-10 ${isConfigPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6">
                 <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings2 size={16} className={!isConfigValid ? "text-amber-500" : "text-primary"} />
                        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">对话上下文配置</h3>
                        {!isConfigValid && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 ml-auto animate-pulse">请完善必填项以开始对话</span>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                       {app.workflowInputs!.map(input => (
                          <div key={input.id} className="flex flex-col gap-1.5">
                             <label className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1 ${input.required && !variableValues[input.id] ? 'text-amber-600' : 'text-slate-500'}`}>
                                {input.label} {input.required && <span className="text-rose-500">*</span>}
                             </label>
                             {renderVariableInput(input)}
                          </div>
                       ))}
                    </div>
                    
                    <div className="mt-3 text-center">
                       <button onClick={() => setIsConfigPanelOpen(false)} className="text-[10px] font-bold text-slate-400 hover:text-primary flex items-center justify-center gap-1 mx-auto transition-colors">
                          <ChevronUp size={12} /> 收起面板 (配置已保存)
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 relative">
          <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none -z-10" />
          <div className="relative z-0 max-w-4xl mx-auto space-y-8">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-sm font-bold
                  ${msg.role === 'ai' ? 'bg-white border border-slate-200 text-primary' : 'bg-slate-900 text-white'}
                `}>
                  {msg.role === 'ai' ? <Sparkles size={18} /> : 'ME'}
                </div>
                <div className="flex flex-col gap-2 max-w-[80%]">
                   {/* Attachments Bubble */}
                   {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         {msg.attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                  <File size={16} />
                               </div>
                               <div>
                                  <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{file.name}</div>
                                  <div className="text-[10px] text-slate-400 uppercase">{file.type.split('/')[1] || 'FILE'}</div>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}

                   <div className={`
                     rounded-2xl p-6 text-[15px] leading-relaxed shadow-sm
                     ${msg.role === 'ai' 
                       ? 'bg-white border border-slate-200/60 text-slate-700' 
                       : 'bg-primary-soft border border-primary/10 text-slate-900 font-medium'}
                   `}>
                     {msg.content.split('\n').map((line, i) => (
                       <p key={i} className={i > 0 ? 'mt-3' : ''} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                     ))}
                   </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-5 animate-in fade-in">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-primary flex items-center justify-center shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-2 h-14 w-24">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-10">
          <div className="max-w-4xl mx-auto relative">
             <div className={`bg-white border-2 rounded-2xl shadow-lg shadow-slate-200/50 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all overflow-hidden ${isExhausted || !isConfigValid ? 'border-slate-200 bg-slate-50/80' : 'border-slate-100'}`}>
                
                {/* File Attachment Preview Area */}
                {attachedFile && (
                   <div className="px-5 pt-4 pb-0 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in">
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 pl-3 pr-2 py-2 rounded-xl">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <File size={16} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{attachedFile.name}</span>
                            <span className="text-[10px] text-slate-400">{(attachedFile.size / 1024).toFixed(1)} KB</span>
                         </div>
                         <button 
                           onClick={() => setAttachedFile(null)} 
                           className="ml-2 p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                         >
                            <X size={14} />
                         </button>
                      </div>
                   </div>
                )}

                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExhausted || !isConfigValid}
                  placeholder={
                    isExhausted 
                      ? "配额已用尽，请联系管理员" 
                      : !isConfigValid
                        ? `请先完善上方必填配置: ${missingInputs.map(i => i.label).join(', ')}`
                        : "输入消息... (Shift+Enter 换行)"
                  }
                  className={`w-full max-h-48 min-h-[80px] p-5 pr-14 outline-none resize-none font-medium text-base transition-all ${
                    isExhausted || !isConfigValid 
                       ? 'bg-transparent text-slate-500 cursor-not-allowed placeholder:text-slate-400' 
                       : 'bg-white text-slate-700 placeholder:text-slate-400'
                  }`}
                />
                <div className={`flex items-center justify-between px-4 pb-4 ${isExhausted || !isConfigValid ? 'bg-transparent' : 'bg-white'}`}>
                   <div className="flex items-center gap-2">
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         onChange={handleFileSelect} 
                      />
                      <button 
                        disabled={!isConfigValid || !canUploadFile}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2.5 rounded-xl transition-colors ${!isConfigValid || !canUploadFile ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-400 hover:text-primary'}`} 
                        title={canUploadFile ? "添加附件" : "文件上传功能未开启"}
                      >
                        <Paperclip size={20} />
                      </button>
                   </div>
                   <button 
                     onClick={handleSend}
                     disabled={(!input.trim() && !attachedFile) || isExhausted || !isConfigValid}
                     className={`
                       px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all
                       ${(input.trim() || attachedFile) && !isExhausted && isConfigValid
                         ? 'bg-slate-900 text-white shadow-lg shadow-slate-300 hover:shadow-xl hover:bg-slate-800 transform hover:-translate-y-0.5' 
                         : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                     `}
                   >
                     发送 <Send size={14} className={((input.trim() || attachedFile) && !isExhausted && isConfigValid) ? 'translate-x-0.5' : ''} />
                   </button>
                </div>
             </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">AI Generate Content • Check Important Info</span>
          </div>
        </div>

      </main>
    </div>
  );
};