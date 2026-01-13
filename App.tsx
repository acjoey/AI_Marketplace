
import React, { useState } from 'react';
import { 
  LayoutGrid, ShieldCheck, 
  Settings, LogOut, Flashlight, Wrench, Image as ImageIcon
} from 'lucide-react';

import { AppData, ViewState } from './types';
import { Marketplace } from './views/Marketplace';
import { ChatInterface } from './views/ChatInterface';
import { WorkflowInterface } from './views/WorkflowInterface';
import { AdminDashboard } from './views/AdminDashboard';
import { CreateApp } from './views/CreateApp';
import { Workbench } from './views/Workbench';
import { ImageGenView } from './views/ImageGenView';
import { FeedbackModal } from './components/FeedbackModal';

// Mock Data - Initial apps are published
const INITIAL_APPS: AppData[] = [
  {
    id: 'gpt',
    name: 'General GPT',
    description: '通用企业助手。支持文件分析、图像输入，并提供符合合规要求的受控输出格式。',
    icon: 'gpt',
    iconBg: '#e0fbf7',
    iconColor: '#0f766e',
    tag: '对话',
    mode: 'chat',
    status: 'published',
    creator: 'AI 基础架构组',
    lastUpdater: '张三',
    usersCount: '12.8k',
    likes: 128,
    dislikes: 6,
    favs: 42,
    feedbacks: 14,
    myVote: null,
    isFav: false,
    quota: { limit: 2000, used: 1240, unit: '次' }
  },
  {
    id: 'weekly',
    name: 'Weekly Report Helper',
    description: '连接 Jira 和 GitLab，自动总结进度、风险和下周计划，生成符合汇报要求的格式。',
    icon: 'report',
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    tag: '自动化',
    mode: 'workflow', 
    status: 'published',
    workflowInputs: [
        { id: 'w1', type: 'text', label: '报告周期', required: true, placeholder: '例如：2023 W42' },
        { id: 'w2', type: 'paragraph', label: '本周重点补充', required: false, placeholder: '额外需要强调的事项...' }
    ],
    creator: '效率工具小组',
    lastUpdater: '李四',
    usersCount: '1.2k',
    likes: 66,
    dislikes: 4,
    favs: 18,
    feedbacks: 7,
    myVote: null,
    isFav: false,
    quota: { limit: 50, used: 48, unit: '次' }
  },
  {
    id: 'copy',
    name: 'Marketing Copy Gen',
    description: '一键生成社交媒体帖子、广告文案和公关稿，支持品牌语调控制与多渠道适配。',
    icon: 'copy',
    iconBg: '#fae8ff',
    iconColor: '#d946ef',
    tag: '内容',
    mode: 'chat',
    status: 'published',
    // ADDED: Dynamic configuration inputs
    workflowInputs: [
      { id: 'topic', type: 'text', label: '营销主题', required: true, placeholder: '例如：夏季新品发布会' },
      { id: 'platform', type: 'select', label: '发布平台', required: true, options: ['微信公众号', '小红书', 'LinkedIn', 'Twitter'] },
      { id: 'tone', type: 'select', label: '文案语气', required: false, options: ['专业严谨', '幽默风趣', '激情澎湃', '温馨感人'] },
      { id: 'ref_doc', type: 'file', label: '参考资料', required: false, accept: '.pdf,.docx' }
    ],
    creator: '市场运营部',
    lastUpdater: '王五',
    usersCount: '2.5k',
    likes: 74,
    dislikes: 9,
    favs: 21,
    feedbacks: 11,
    myVote: null,
    isFav: false,
    quota: { limit: 'unlimited', used: 5420, unit: '次' }
  },
  {
    id: 'review',
    name: 'PRD Auto Review', 
    description: '上传 PRD 文档，自动进行完整性、逻辑性和风险合规审查，生成详细审查报告。',
    icon: 'code',
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    tag: '工程',
    mode: 'workflow',
    status: 'published',
    workflowInputs: [
        { id: 'r1', type: 'text', label: '项目名称', required: true, placeholder: 'Project Name' },
        { id: 'r2', type: 'file', label: '上传 PRD 文档', required: true, accept: '.docx,.pdf' }
    ],
    creator: '平台研发部',
    lastUpdater: '赵六',
    usersCount: '800',
    likes: 39,
    dislikes: 3,
    favs: 9,
    feedbacks: 5,
    myVote: null,
    isFav: false,
    quota: { limit: 100, used: 100, unit: '次' }
  }
];

export default function App() {
  const [view, setView] = useState<ViewState>('marketplace');
  const [apps, setApps] = useState<AppData[]>(INITIAL_APPS);
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackApp, setFeedbackApp] = useState<AppData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Edit State
  const [editingApp, setEditingApp] = useState<AppData | null>(null);

  const currentUser = 'Admin User'; // Mock current user

  const handleOpenApp = (app: AppData) => {
    setSelectedApp(app);
    if (app.mode === 'workflow') {
        setView('workflow');
    } else {
        setView('chat');
    }
  };

  const handleVote = (id: string, type: 'like' | 'dislike') => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app;
      let newLikes = app.likes;
      let newDislikes = app.dislikes;
      let newVote = app.myVote;
      if (app.myVote === type) {
        if (type === 'like') newLikes--;
        else newDislikes--;
        newVote = null;
        showToast(`已取消${type === 'like' ? '点赞' : '踩'}`);
      } else {
        if (app.myVote === 'like') newLikes--;
        if (app.myVote === 'dislike') newDislikes--;
        if (type === 'like') newLikes++;
        else newDislikes++;
        newVote = type;
        showToast(`${type === 'like' ? '已点赞' : '已踩'}`);
      }
      return { ...app, likes: newLikes, dislikes: newDislikes, myVote: newVote };
    }));
  };

  const handleToggleFav = (id: string) => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app;
      const isFav = !app.isFav;
      showToast(isFav ? '已收藏' : '已取消收藏');
      return { ...app, isFav, favs: isFav ? app.favs + 1 : app.favs - 1 };
    }));
  };

  const openFeedback = (app: AppData) => {
    setFeedbackApp(app);
    setIsFeedbackOpen(true);
  };

  const submitFeedback = (text: string) => {
    showToast('感谢您的反馈');
    setApps(prev => prev.map(a => 
      a.id === feedbackApp?.id ? { ...a, feedbacks: a.feedbacks + 1 } : a
    ));
  };

  const handleStartCreate = () => {
    setEditingApp(null);
    setView('create-app');
  };

  const handleEditApp = (app: AppData) => {
    setEditingApp(app);
    setView('create-app');
  };

  const handleSaveApp = (appData: Partial<AppData>) => {
    if (editingApp) {
        // Update existing app
        setApps(prev => prev.map(a => a.id === editingApp.id ? { ...a, ...appData, lastUpdater: currentUser } : a));
        showToast('应用配置已更新');
    } else {
        // Create new app
        const newApp: AppData = {
          id: `new_${Date.now()}`,
          name: appData.name || 'New App',
          description: appData.description || '',
          icon: appData.icon || 'zap',
          iconBg: '#f0fdfa', // Default color
          iconColor: '#0f766e',
          tag: appData.tag || 'New',
          creator: currentUser,
          lastUpdater: currentUser,
          usersCount: '0',
          likes: 0,
          dislikes: 0,
          favs: 0,
          feedbacks: 0,
          myVote: null,
          isFav: false,
          quota: { limit: 100, used: 0, unit: '次' },
          status: 'draft', // Default to draft
          ...appData
        } as AppData;
    
        setApps(prev => [newApp, ...prev]);
        showToast(`应用 "${newApp.name}" 已创建，请在工作台调试后发布`);
    }
    
    setEditingApp(null);
    setView('workbench'); // Redirect to Workbench
  };

  const handleTogglePublish = (app: AppData) => {
     const newStatus = app.status === 'published' ? 'draft' : 'published';
     setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
     showToast(newStatus === 'published' ? '应用已发布至广场' : '应用已下架，仅自己可见');
  };

  const handleDeleteApp = (id: string) => {
     setApps(prev => prev.filter(a => a.id !== id));
     showToast('应用已删除');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 selection:bg-primary/30">
      <header className="h-18 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm transition-all">
        <div className="flex items-center gap-3 select-none cursor-pointer group" onClick={() => setView('marketplace')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-primary shadow-lg shadow-slate-200 group-hover:shadow-primary/20 transition-all group-hover:scale-105">
            <Flashlight size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-none">AI应用广场</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-full border border-slate-200/60">
          <button 
            onClick={() => setView('marketplace')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              view === 'marketplace' || view === 'chat' || (view === 'create-app' && !editingApp) || view === 'workflow'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <LayoutGrid size={16} className={view === 'marketplace' || view === 'chat' || (view === 'create-app' && !editingApp) || view === 'workflow' ? 'text-primary' : ''} /> 应用广场
          </button>
          
          <button 
            onClick={() => setView('image-gen')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              view === 'image-gen'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ImageIcon size={16} className={view === 'image-gen' ? 'text-primary' : ''} /> 图像创作
          </button>

          <button 
            onClick={() => setView('workbench')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              view === 'workbench' || (view === 'create-app' && editingApp)
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Wrench size={16} className={view === 'workbench' || (view === 'create-app' && editingApp) ? 'text-primary' : ''} /> 我的工作台
          </button>

          <button 
            onClick={() => setView('admin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              view === 'admin' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck size={16} className={view === 'admin' ? 'text-primary' : ''} /> 管理后台
          </button>
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-xs font-bold text-slate-800">{currentUser}</span>
             <span className="text-[10px] font-medium text-slate-400">Product Dept.</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white cursor-pointer hover:ring-primary/50 transition-all">
            AU
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {view === 'marketplace' && (
          <Marketplace 
            apps={apps}
            onOpenApp={handleOpenApp}
            onVote={handleVote}
            onToggleFav={handleToggleFav}
            onFeedback={openFeedback}
            onCreateApp={handleStartCreate}
          />
        )}
        {view === 'create-app' && (
          <CreateApp 
            onBack={() => { setView('workbench'); setEditingApp(null); }}
            onSubmit={handleSaveApp}
            initialData={editingApp}
          />
        )}
        {view === 'workbench' && (
            <Workbench 
              apps={apps}
              currentUser={currentUser}
              onOpenApp={handleOpenApp}
              onCreateApp={handleStartCreate}
              onTogglePublish={handleTogglePublish}
              onDeleteApp={handleDeleteApp}
              onEditApp={handleEditApp}
            />
        )}
        {view === 'image-gen' && <ImageGenView />}
        {view === 'chat' && selectedApp && (
          <ChatInterface app={selectedApp} onBack={() => setView(selectedApp.status === 'draft' ? 'workbench' : 'marketplace')} />
        )}
        {view === 'workflow' && selectedApp && (
            <WorkflowInterface app={selectedApp} onBack={() => setView(selectedApp.status === 'draft' ? 'workbench' : 'marketplace')} />
        )}
        {view === 'admin' && <AdminDashboard />}
      </div>
      
      <FeedbackModal 
        app={feedbackApp}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={submitFeedback}
      />
      
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 border border-white/10 ${toast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,208,176,0.8)] animate-pulse"></div>
        {toast}
      </div>
    </div>
  );
}
