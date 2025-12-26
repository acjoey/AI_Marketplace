import React, { useState } from 'react';
import { 
  Plus, Search, MoreHorizontal, Globe, Lock, 
  Edit3, Trash2, Play, Eye, Share2, Rocket, 
  MessageSquare, FileText, PenTool, Code2, Zap, Workflow, Bot
} from 'lucide-react';
import { AppData } from '../types';

interface WorkbenchProps {
  apps: AppData[];
  currentUser: string;
  onOpenApp: (app: AppData) => void;
  onCreateApp: () => void;
  onTogglePublish: (app: AppData) => void;
  onDeleteApp: (id: string) => void;
  onEditApp: (app: AppData) => void; // Added onEditApp prop
}

export const Workbench: React.FC<WorkbenchProps> = ({ 
  apps, currentUser, onOpenApp, onCreateApp, onTogglePublish, onDeleteApp, onEditApp 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter apps created by current user
  const myApps = apps.filter(app => app.creator === currentUser || app.creator === 'Admin User'); // Assuming Admin User is current

  const filteredApps = myApps.filter(app => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'gpt': return <MessageSquare size={20} />;
      case 'report': return <FileText size={20} />;
      case 'copy': return <PenTool size={20} />;
      case 'code': return <Code2 size={20} />;
      default: return <Zap size={20} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 relative p-8">
       <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-end mb-8">
             <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">我的工作台</h1>
                <p className="text-slate-500 mt-2 font-medium">管理和编排您的智能体应用，调试完成后可发布至应用广场。</p>
             </div>
             <button 
               onClick={onCreateApp}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2"
             >
                <Plus size={18} /> 创建新应用
             </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {(['all', 'published', 'draft'] as const).map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      {tab === 'all' ? '全部应用' : tab === 'published' ? '已发布' : '草稿箱'}
                   </button>
                ))}
             </div>
             <div className="relative w-full md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索我的应用..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
             </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             
             {/* Create New Card (Empty State) */}
             {filteredApps.length === 0 && searchQuery === '' && activeTab === 'all' && (
                <div onClick={onCreateApp} className="group border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[240px] cursor-pointer hover:border-primary/50 hover:bg-primary-soft/30 transition-all">
                   <div className="w-14 h-14 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 group-hover:text-primary transition-all shadow-sm">
                      <Plus size={24} />
                   </div>
                   <h3 className="font-bold text-slate-600 group-hover:text-primary-dark">创建第一个应用</h3>
                   <p className="text-xs text-slate-400 mt-1">开始构建您的 AI 助手</p>
                </div>
             )}

             {filteredApps.map(app => (
                <div key={app.id} className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all relative flex flex-col">
                   
                   {/* Status Badge */}
                   <div className="absolute top-6 right-6">
                      {app.status === 'published' ? (
                         <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-extrabold border border-emerald-100 uppercase tracking-wide">
                            <Globe size={10} /> 已上线
                         </span>
                      ) : (
                         <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-extrabold border border-amber-100 uppercase tracking-wide">
                            <Lock size={10} /> 草稿
                         </span>
                      )}
                   </div>

                   <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: app.iconBg, color: app.iconColor }}>
                         {getIcon(app.icon)}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900 truncate max-w-[140px]">{app.name}</h3>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                            <span className="uppercase">{app.mode === 'workflow' ? 'Workflow' : 'Agent'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{app.lastUpdater}</span>
                         </div>
                      </div>
                   </div>

                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2 flex-1">
                      {app.description || '暂无描述...'}
                   </p>

                   {/* Stats Row */}
                   <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-6 bg-slate-50/50 p-2 rounded-lg">
                      <div>使用: <span className="text-slate-700">{app.usersCount}</span></div>
                      <div className="w-px h-3 bg-slate-200"></div>
                      <div>点赞: <span className="text-slate-700">{app.likes}</span></div>
                   </div>

                   {/* Actions */}
                   <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button 
                        onClick={() => onOpenApp(app)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                      >
                         <Play size={14} /> 调试/运行
                      </button>
                      
                      {app.status === 'draft' ? (
                         <button 
                           onClick={() => onTogglePublish(app)}
                           className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                         >
                            <Rocket size={14} /> 发布上线
                         </button>
                      ) : (
                         <button 
                           onClick={() => onTogglePublish(app)}
                           className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                         >
                            <Lock size={14} /> 下架
                         </button>
                      )}
                   </div>
                   
                   <div className="flex items-center justify-between mt-3 px-1">
                      <button 
                         onClick={() => onEditApp(app)}
                         className="text-[10px] font-bold text-slate-400 hover:text-primary flex items-center gap-1"
                      >
                         <Edit3 size={12} /> 编辑配置
                      </button>
                      <button 
                        onClick={() => { if(confirm('确定要删除此应用吗？')) onDeleteApp(app.id) }} 
                        className="text-[10px] font-bold text-slate-300 hover:text-red-500 flex items-center gap-1"
                      >
                         <Trash2 size={12} /> 删除
                      </button>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};