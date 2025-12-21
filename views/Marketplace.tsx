import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronDown, Rocket, 
  ThumbsUp, ThumbsDown, Star, MessageSquare, 
  Play, Activity, Zap, FileText, PenTool, Code2,
  User, Layers, ArrowUpDown, Check, RefreshCw, Sparkles, Filter
} from 'lucide-react';
import { AppData } from '../types';

interface MarketplaceProps {
  apps: AppData[];
  onOpenApp: (app: AppData) => void;
  onToggleFav: (id: string) => void;
  onVote: (id: string, type: 'like' | 'dislike') => void;
  onFeedback: (app: AppData) => void;
  onCreateApp: () => void; // New prop
}

export const Marketplace: React.FC<MarketplaceProps> = ({ 
  apps, 
  onOpenApp, 
  onToggleFav, 
  onVote,
  onFeedback,
  onCreateApp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('所有部门');
  const [sortOrder, setSortOrder] = useState<'popular' | 'newest'>('popular');
  
  const [openDropdown, setOpenDropdown] = useState<'category' | 'sort' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['所有部门', 'AI 基础架构组', '效率工具小组', '市场运营部', '平台研发部'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApps = useMemo(() => {
    // Only show PUBLISHED apps in Marketplace
    let result = apps.filter(app => app.status === 'published');

    if (searchQuery) {
      result = result.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeCategory !== '所有部门') {
      result = result.filter(app => app.creator === activeCategory);
    }
    if (sortOrder === 'popular') {
      result = [...result].sort((a, b) => {
        const scoreA = (a.likes - a.dislikes) + (a.favs * 2);
        const scoreB = (b.likes - b.dislikes) + (b.favs * 2);
        return scoreB - scoreA;
      });
    }
    return result;
  }, [apps, searchQuery, activeCategory, sortOrder]);

  const favoritedApps = useMemo(() => apps.filter(app => app.isFav), [apps]);

  const sortedTopApps = useMemo(() => {
     return [...apps].filter(a => a.status === 'published').sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [apps]);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'gpt': return <MessageSquare size={24} />;
      case 'report': return <FileText size={24} />;
      case 'copy': return <PenTool size={24} />;
      case 'code': return <Code2 size={24} />;
      default: return <Zap size={24} />;
    }
  };

  const toggleDropdown = (name: 'category' | 'sort') => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none -z-10" />

      <div className="max-w-[1600px] mx-auto px-8 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="relative">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
              应用广场 
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary-dark text-xs font-bold border border-primary/20 backdrop-blur-sm shadow-sm">
                Enterprise Hub
              </span>
            </h1>
            <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl leading-relaxed">
              探索、发现并启用为您工作流量身定制的企业级 AI 智能体。
            </p>
          </div>
          <button 
            onClick={onCreateApp}
            className="group relative bg-slate-900 text-white pl-6 pr-8 py-4 rounded-3xl font-bold text-sm shadow-2xl shadow-slate-300 hover:shadow-slate-400 transition-all flex items-center gap-3 overflow-hidden transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900" />
            <div className="relative flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Rocket size={18} className="text-primary" />
               </div>
               <span className="tracking-wide">创建新应用</span>
            </div>
          </button>
        </div>

        {/* Filters Bar */}
        <div 
          ref={dropdownRef}
          className="sticky top-6 z-30 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-2 shadow-float mb-12 flex flex-col md:flex-row items-center gap-3 ring-1 ring-slate-900/5 transition-all duration-300"
        >
          <div className="flex-1 w-full md:w-auto flex items-center gap-4 bg-white/60 rounded-xl px-5 py-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/30 group">
            <Search size={20} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium" 
              placeholder="搜索应用 (例如 GPT-4, 周报助手, 代码审查) ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto gap-2 flex-wrap md:flex-nowrap p-1">
            <div className="relative">
              <button 
                onClick={() => toggleDropdown('category')}
                className={`whitespace-nowrap px-5 py-3 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                  openDropdown === 'category' 
                    ? 'bg-slate-100 border-slate-200 text-slate-900' 
                    : 'bg-transparent border-transparent text-slate-600 hover:bg-white/50'
                }`}
              >
                <Layers size={16} className={activeCategory !== '所有部门' ? 'text-primary' : ''} /> 
                {activeCategory} 
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'category' && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ring-1 ring-slate-900/5">
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {categories.map(cat => (
                      <div 
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setOpenDropdown(null); }}
                        className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center justify-between ${
                          activeCategory === cat ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                        {activeCategory === cat && <Check size={16} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-slate-200 self-center hidden md:block mx-1"></div>

            <div className="relative">
              <button 
                onClick={() => toggleDropdown('sort')}
                className={`whitespace-nowrap px-5 py-3 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                  openDropdown === 'sort' 
                    ? 'bg-slate-100 border-slate-200 text-slate-900' 
                    : 'bg-transparent border-transparent text-slate-600 hover:bg-white/50'
                }`}
              >
                <ArrowUpDown size={16} /> 
                {sortOrder === 'popular' ? '最受欢迎' : '最新发布'} 
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ring-1 ring-slate-900/5">
                   <div className="p-2">
                     <div onClick={() => { setSortOrder('popular'); setOpenDropdown(null); }} className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-between transition-all ${sortOrder === 'popular' ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}>最受欢迎 {sortOrder === 'popular' && <Check size={16} />}</div>
                     <div onClick={() => { setSortOrder('newest'); setOpenDropdown(null); }} className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-between transition-all ${sortOrder === 'newest' ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}>最新发布 {sortOrder === 'newest' && <Check size={16} />}</div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Grid */}
          <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredApps.length === 0 ? (
               <div className="col-span-full py-32 text-center bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner"><Search size={40} /></div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">未找到相关应用</h3>
                  <p className="text-slate-500 font-medium">尝试调整筛选条件或使用不同的关键词</p>
                  <button onClick={() => {setSearchQuery(''); setActiveCategory('所有部门');}} className="mt-8 px-6 py-2 rounded-xl bg-primary-soft text-primary-dark font-bold text-sm hover:bg-primary/20 transition-colors">清除所有筛选</button>
               </div>
            ) : (
              filteredApps.map(app => (
                <div 
                  key={app.id}
                  onClick={() => onOpenApp(app)}
                  className="group relative bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-2 hover:border-primary/30 transition-all duration-300 flex flex-col h-full cursor-pointer overflow-visible ring-1 ring-slate-900/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white/50 to-transparent rounded-3xl -z-10" />

                  {/* Card Header: Icon, Name, Stats */}
                  <div className="flex items-start justify-between mb-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300"
                      style={{ backgroundColor: app.iconBg, color: app.iconColor, boxShadow: `0 8px 20px -6px ${app.iconBg}` }}
                    >
                      {getIcon(app.icon)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider ${app.isFav ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                         {app.tag}
                       </span>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50/50 px-2 py-1 rounded-md">
                          <Activity size={12} /> {app.usersCount}
                       </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-primary-dark transition-colors line-clamp-1 pr-4">
                    {app.name}
                  </h3>
                  
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 h-10">
                    {app.description}
                  </p>

                  {/* Horizontal Meta Layout (Creator & Updater) */}
                  <div className="mt-auto mb-6 pt-5 border-t border-slate-100/60 flex items-center justify-between text-xs font-bold text-slate-400 -mx-2 px-2">
                    <div className="flex items-center gap-2 group/meta" title="创建人">
                       <div className="p-1 bg-white rounded-full shadow-sm border border-slate-100 group-hover/meta:border-primary/30 transition-colors">
                          <User size={12} className="text-slate-400 group-hover/meta:text-primary transition-colors" />
                       </div>
                       <span className="truncate max-w-[90px] text-slate-500 group-hover/meta:text-slate-700 transition-colors">{app.creator}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200"></div>
                    <div className="flex items-center gap-2 group/meta" title="最后更新">
                       <span className="truncate max-w-[90px] text-slate-500 group-hover/meta:text-slate-700 transition-colors text-right">{app.lastUpdater}</span>
                       <div className="p-1 bg-white rounded-full shadow-sm border border-slate-100 group-hover/meta:border-blue-200 transition-colors">
                          <RefreshCw size={12} className="text-slate-400 group-hover/meta:text-blue-500 transition-colors" />
                       </div>
                    </div>
                  </div>

                  {/* Card Footer: Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onVote(app.id, 'like'); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          app.myVote === 'like' 
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' 
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsUp size={14} className={app.myVote === 'like' ? 'fill-current' : ''} /> {app.likes}
                      </button>
                      <div className="w-px h-4 bg-slate-100 mx-1"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onVote(app.id, 'dislike'); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          app.myVote === 'dislike' 
                            ? 'bg-rose-50 text-rose-500 ring-1 ring-rose-100' 
                            : 'text-slate-300 hover:text-rose-500 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsDown size={14} className={app.myVote === 'dislike' ? 'fill-current' : ''} />
                      </button>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFav(app.id); }}
                      className={`ml-auto p-2.5 rounded-xl border transition-all ${
                        app.isFav 
                          ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-300 hover:border-amber-200 hover:text-amber-500 hover:shadow-sm'
                      }`}
                    >
                      <Star size={18} className={app.isFav ? 'fill-current' : ''} />
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onFeedback(app); }}
                      className="p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-primary-dark hover:border-primary/30 hover:bg-primary-soft hover:shadow-sm transition-all bg-white"
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 sticky top-32 space-y-8">
            
            {/* Favorites Widget */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-glass ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center"><Star size={14} className="fill-current" /></span> 
                  我的收藏
                </h3>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">{favoritedApps.length}</span>
              </div>
              <div className="space-y-2">
                {favoritedApps.length === 0 ? (
                  <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-bold">暂无收藏</p>
                  </div>
                ) : (
                  favoritedApps.map((app) => (
                    <div key={app.id} onClick={() => onOpenApp(app)} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-6 text-white text-xs" style={{ backgroundColor: app.iconBg, color: app.iconColor }}>{getIcon(app.icon)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-700 truncate group-hover:text-primary-dark transition-colors">{app.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium"><ThumbsUp size={10} /> {app.likes} likes</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Apps Widget */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-glass ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center"><Sparkles size={14} className="fill-current" /></span>
                  热门榜单
                </h3>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow-lg shadow-slate-200">TOP 5</span>
              </div>
              <div className="space-y-4">
                {sortedTopApps.map((app, idx) => (
                  <div key={app.id} onClick={() => onOpenApp(app)} className="flex items-center gap-4 cursor-pointer group relative">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-md transition-all z-10 ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white ring-2 ring-amber-100' : 
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white ring-2 ring-slate-100' : 
                      idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white ring-2 ring-orange-100' : 
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    {/* Connecting Line */}
                    {idx !== sortedTopApps.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200/50 -mb-4 z-0"></div>
                    )}
                    
                    <div className="min-w-0 flex-1 py-1">
                      <div className="text-sm font-bold text-slate-700 truncate group-hover:text-primary-dark transition-colors">{app.name}</div>
                      <div className="flex justify-between items-center mt-1">
                         <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">{app.creator}</span>
                         <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded border border-slate-100/50"><Activity size={10} /> {app.usersCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};