import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, Paperclip, 
  Sparkles, ShieldCheck, 
  Plus, Zap, AlertTriangle,
  Pin, PinOff, MoreHorizontal, Trash2,
  Bot
} from 'lucide-react';
import { AppData, Message, Thread } from '../types';

interface ChatInterfaceProps {
  app: AppData;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ app, onBack }) => {
  const [input, setInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('1');
  const [threads, setThreads] = useState<Thread[]>([
    { id: '1', title: '产品 PRD 头脑风暴', lastMessage: '分析用户需求...', active: true, isPinned: false },
    { id: '2', title: 'Q3 数据分析', lastMessage: '透视表已生成。', active: false, isPinned: true },
    { id: '3', title: '十月周报', lastMessage: '风险已高亮。', active: false, isPinned: false },
  ]);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: `你好！我是 **${app.name}**。\n所有对话数据均已加密。请问今天能帮你做什么？`, timestamp: Date.now() }
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
  }, [messages, isTyping]);

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
    if (!input.trim() || isExhausted) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    if (!isUnlimited) {
      setUsage(prev => prev + 1);
    }

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "已收到您的请求。为了提供最佳结果，请指定期望的格式（例如表格、要点）以及任何约束条件。",
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

  const createThread = () => {
    const newId = Date.now().toString();
    const newThread: Thread = { id: newId, title: '新对话', lastMessage: '', active: true, isPinned: false };
    setThreads(prev => prev.map(t => ({...t, active: false})).concat(newThread));
    setActiveThreadId(newId);
    setMessages([{ id: Date.now().toString(), role: 'ai', content: `已开启与 **${app.name}** 的新会话。`, timestamp: Date.now() }]);
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
        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/60 backdrop-blur-md z-10 sticky top-0">
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
        </div>

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
                <div className={`
                  max-w-[80%] rounded-2xl p-6 text-[15px] leading-relaxed shadow-sm
                  ${msg.role === 'ai' 
                    ? 'bg-white border border-slate-200/60 text-slate-700' 
                    : 'bg-primary-soft border border-primary/10 text-slate-900 font-medium'}
                `}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-3' : ''} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                  ))}
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
             <div className={`bg-white border-2 rounded-2xl shadow-lg shadow-slate-200/50 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all overflow-hidden ${isExhausted ? 'opacity-60 pointer-events-none' : 'border-slate-100'}`}>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExhausted}
                  placeholder={isExhausted ? "配额已用尽，请联系管理员" : "输入消息... (Shift+Enter 换行)"}
                  className="w-full max-h-48 min-h-[80px] p-5 pr-14 outline-none resize-none text-slate-700 placeholder:text-slate-400 font-medium disabled:bg-slate-50 text-base"
                />
                <div className="flex items-center justify-between px-4 pb-4 bg-white">
                   <div className="flex items-center gap-2">
                      <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors" title="添加附件">
                        <Paperclip size={20} />
                      </button>
                   </div>
                   <button 
                     onClick={handleSend}
                     disabled={!input.trim() || isExhausted}
                     className={`
                       px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all
                       ${input.trim() && !isExhausted
                         ? 'bg-slate-900 text-white shadow-lg shadow-slate-300 hover:shadow-xl hover:bg-slate-800 transform hover:-translate-y-0.5' 
                         : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                     `}
                   >
                     发送 <Send size={14} className={(input.trim() && !isExhausted) ? 'translate-x-0.5' : ''} />
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