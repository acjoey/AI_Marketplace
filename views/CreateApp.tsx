import React, { useState } from 'react';
import { 
  ArrowLeft, UploadCloud, Globe, Zap, 
  MessageSquare, Sliders, CheckCircle, 
  FileCode, Play, Terminal, ShieldAlert,
  Bot, Box, Workflow, Activity, Plus, Trash2,
  FileText, AlignLeft, Paperclip, Cpu, Plug, 
  BrainCircuit, Database, Search, Code2, Sparkles, X
} from 'lucide-react';
import { AppData, WorkflowInputDef } from '../types';

interface CreateAppProps {
  onBack: () => void;
  onSubmit: (app: Partial<AppData>) => void;
}

type CreationType = 'selection' | 'external' | 'native';
type ProviderType = 'dify' | 'n8n' | 'custom';
type InteractionMode = 'chat' | 'workflow';

export const CreateApp: React.FC<CreateAppProps> = ({ onBack, onSubmit }) => {
  const [creationType, setCreationType] = useState<CreationType>('selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Common Form State
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    iconBg: '#e0f2fe',
    category: '效率工具小组',
  });

  // External Form State
  const [externalConfig, setExternalConfig] = useState({
    provider: 'dify' as ProviderType,
    mode: 'chat' as InteractionMode,
    apiEndpoint: '',
    apiKey: '',
    workflowInputs: [] as WorkflowInputDef[],
  });

  // Native Form State
  const [nativeConfig, setNativeConfig] = useState({
    modelId: 'gpt-4-turbo',
    temperature: 0.7,
    systemPrompt: '',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    knowledgeFiles: [] as string[], // Mock file names
  });

  // --- Handlers ---

  const handleExternalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        ...basicInfo,
        provider: externalConfig.provider,
        mode: externalConfig.mode,
        apiEndpoint: externalConfig.apiEndpoint,
        // Mock quota etc
        icon: externalConfig.provider === 'n8n' ? 'workflow' : 'bot',
        tag: externalConfig.mode === 'chat' ? '对话' : '自动化',
        usersCount: '0',
        likes: 0,
        dislikes: 0,
        favs: 0,
        feedbacks: 0,
        isFav: false,
        quota: { limit: 100, used: 0, unit: '次' },
        workflowInputs: (externalConfig.mode === 'workflow' || externalConfig.provider === 'dify') ? externalConfig.workflowInputs : undefined
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleNativeSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        ...basicInfo,
        provider: 'native',
        mode: 'chat', // Native builder currently supports Chat Agents
        icon: 'gpt',
        tag: '原生',
        usersCount: '0',
        likes: 0,
        dislikes: 0,
        favs: 0,
        feedbacks: 0,
        isFav: false,
        quota: { limit: 1000, used: 0, unit: 'Tokens' },
        modelConfig: {
            modelId: nativeConfig.modelId,
            temperature: nativeConfig.temperature,
            systemPrompt: nativeConfig.systemPrompt,
            enableWebSearch: nativeConfig.enableWebSearch,
            enableCodeInterpreter: nativeConfig.enableCodeInterpreter,
            knowledgeBaseIds: nativeConfig.knowledgeFiles
        }
      });
      setIsSubmitting(false);
    }, 1500);
  };

  // --- External Workflow Input Helpers ---
  const addWorkflowInput = (type: WorkflowInputDef['type']) => {
    const newId = Date.now().toString();
    const defaults: Partial<WorkflowInputDef> = { id: newId, type, required: true };
    if (type === 'text') { defaults.label = '文本输入'; defaults.placeholder = '请输入...'; }
    else if (type === 'file') { defaults.label = '上传文件'; defaults.accept = '.pdf,.docx'; }
    else if (type === 'paragraph') { defaults.label = '长文本'; defaults.placeholder = '...'; }
    
    setExternalConfig(prev => ({
        ...prev,
        workflowInputs: [...prev.workflowInputs, defaults as WorkflowInputDef]
    }));
  };

  const removeWorkflowInput = (id: string) => {
    setExternalConfig(prev => ({
        ...prev,
        workflowInputs: prev.workflowInputs.filter(i => i.id !== id)
    }));
  };

  const updateWorkflowInput = (id: string, field: keyof WorkflowInputDef, value: any) => {
    setExternalConfig(prev => ({
        ...prev,
        workflowInputs: prev.workflowInputs.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  // --- Render Sections ---

  const renderSelectionScreen = () => (
    <div className="max-w-5xl mx-auto p-8 lg:p-12 animate-in fade-in duration-500">
       <div className="mb-12">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold mb-6">
            <ArrowLeft size={16} /> 返回应用广场
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">创建新应用</h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            您可以选择从零开始编排一个原生智能体，或者接入已有的外部应用服务。
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1: Native */}
          <div 
            onClick={() => setCreationType('native')}
            className="group relative bg-white border border-slate-200 rounded-3xl p-8 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
             
             <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-primary flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                   <Cpu size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">原生编排</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                   使用平台内置的模型（GPT-4, Claude 等）和知识库能力，快速构建对话机器人或助手。支持 Prompt 调试。
                </p>
                <ul className="space-y-3 mb-8">
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-primary" /> 内置 LLM 模型库</li>
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-primary" /> RAG 知识库支持</li>
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-primary" /> 联网搜索与代码解释器</li>
                </ul>
                <button className="px-6 py-3 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                   开始创建 &rarr;
                </button>
             </div>
          </div>

          {/* Option 2: External */}
          <div 
            onClick={() => setCreationType('external')}
            className="group relative bg-white border border-slate-200 rounded-3xl p-8 cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-100/50"></div>
             
             <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                   <Plug size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">接入外部应用</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                   将企业内部已有的 Dify 智能体或 n8n 工作流接入到 Nexus 统一门户中。
                </p>
                <ul className="space-y-3 mb-8">
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-indigo-500" /> Dify Agent / Workflow</li>
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-indigo-500" /> n8n Automation</li>
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-indigo-500" /> 支持自定义变量输入</li>
                </ul>
                <button className="px-6 py-3 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   开始接入 &rarr;
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  const renderBasicInfoSection = () => (
    <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="text-lg font-bold text-slate-800">基本信息</h3>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
          <div className="col-span-2">
             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">应用名称</label>
             <input 
               value={basicInfo.name}
               onChange={e => setBasicInfo({...basicInfo, name: e.target.value})}
               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
               placeholder="给应用起个响亮的名字"
             />
          </div>
          <div className="col-span-2">
             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">应用描述</label>
             <textarea 
               value={basicInfo.description}
               onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none h-24"
               placeholder="描述这个应用的功能、适用场景以及注意事项..."
             />
          </div>
          <div>
             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">所属部门</label>
             <select 
               value={basicInfo.category}
               onChange={e => setBasicInfo({...basicInfo, category: e.target.value})}
               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer"
             >
               <option>AI 基础架构组</option>
               <option>效率工具小组</option>
               <option>市场运营部</option>
               <option>平台研发部</option>
             </select>
          </div>
       </div>
    </section>
  );

  const renderExternalConfig = () => (
    <>
      {renderBasicInfoSection()}

      {/* Provider Selection */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-bold text-slate-800">选择接入源</h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
            {['dify', 'n8n'].map(p => (
                <div 
                  key={p}
                  onClick={() => setExternalConfig(prev => ({ ...prev, provider: p as ProviderType, mode: p === 'n8n' ? 'workflow' : 'chat' }))}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${externalConfig.provider === p ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                   <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center mb-3 text-slate-700">
                      {p === 'dify' ? <Bot size={20} /> : <Workflow size={20} />}
                   </div>
                   <h4 className="font-bold text-slate-900 capitalize">{p}</h4>
                   {externalConfig.provider === p && <div className="absolute top-4 right-4 text-indigo-500"><CheckCircle size={20} /></div>}
                </div>
            ))}
         </div>
      </section>

      {/* Connection Config */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="text-lg font-bold text-slate-800">连接配置</h3>
         </div>

         <div className="pl-11 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                     {externalConfig.mode === 'chat' ? <MessageSquare size={18} className="text-primary" /> : <Zap size={18} className="text-amber-500" />}
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm">交互模式</h4>
                     <p className="text-xs text-slate-500">
                       {externalConfig.mode === 'chat' ? '连续对话助手 (Agent)' : '表单触发任务 (Workflow)'}
                     </p>
                  </div>
               </div>
               <div className="flex bg-slate-200 p-1 rounded-lg">
                  <button onClick={() => setExternalConfig(prev => ({...prev, mode: 'chat'}))} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${externalConfig.mode === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>对话</button>
                  <button onClick={() => setExternalConfig(prev => ({...prev, mode: 'workflow'}))} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${externalConfig.mode === 'workflow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>任务流</button>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               <input 
                 value={externalConfig.apiEndpoint}
                 onChange={e => setExternalConfig(prev => ({...prev, apiEndpoint: e.target.value}))}
                 className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono text-sm"
                 placeholder="API Endpoint URL"
               />
               <input 
                 type="password"
                 value={externalConfig.apiKey}
                 onChange={e => setExternalConfig(prev => ({...prev, apiKey: e.target.value}))}
                 className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono text-sm"
                 placeholder="API Key"
               />
            </div>
            
            {/* Dynamic Inputs for Workflow Mode or Dify (Prompt Variables) */}
            {(externalConfig.mode === 'workflow' || externalConfig.provider === 'dify') && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                       {externalConfig.mode === 'workflow' ? '输入参数定义' : 'Prompt 变量定义'}
                    </h4>
                    <div className="space-y-3 mb-4">
                        {externalConfig.workflowInputs.map((input, idx) => (
                            <div key={input.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-xs font-mono font-bold text-slate-400">#{idx+1}</span>
                                <span className="text-xs font-bold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">{input.type}</span>
                                <input value={input.label} onChange={(e) => updateWorkflowInput(input.id, 'label', e.target.value)} className="flex-1 text-sm font-bold border-b border-transparent focus:border-primary outline-none" />
                                <button onClick={() => removeWorkflowInput(input.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {externalConfig.workflowInputs.length === 0 && <div className="text-center text-xs text-slate-400 py-2">暂无参数</div>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => addWorkflowInput('text')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-primary">Text</button>
                        <button onClick={() => addWorkflowInput('paragraph')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-primary">Paragraph</button>
                        <button onClick={() => addWorkflowInput('file')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-primary">File</button>
                    </div>
                </div>
            )}
         </div>
      </section>

      <div className="pl-11 pt-4 pb-20">
         <button 
           onClick={handleExternalSubmit}
           disabled={isSubmitting || !basicInfo.name}
           className="px-8 py-3.5 rounded-2xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-xl flex items-center gap-2"
         >
           {isSubmitting ? '正在连接...' : <>确认接入 <Plug size={16} /></>}
         </button>
      </div>
    </>
  );

  const renderNativeConfig = () => (
    <>
      {renderBasicInfoSection()}

      {/* Model & Prompt */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-bold text-slate-800">模型与设定</h3>
         </div>

         <div className="pl-11 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">选择模型</label>
                  <div className="relative">
                     <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <select 
                       value={nativeConfig.modelId}
                       onChange={e => setNativeConfig(prev => ({...prev, modelId: e.target.value}))}
                       className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none focus:border-primary appearance-none cursor-pointer"
                     >
                        <option value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</option>
                        <option value="claude-3-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                        <option value="gemini-pro">Gemini 1.5 Pro (Google)</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">温度 (创意度): {nativeConfig.temperature}</label>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={nativeConfig.temperature}
                    onChange={e => setNativeConfig(prev => ({...prev, temperature: parseFloat(e.target.value)}))}
                    className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                     <span>严谨 (0.0)</span>
                     <span>创意 (1.0)</span>
                  </div>
               </div>
            </div>

            <div>
               <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">系统提示词 (System Prompt)</label>
               <div className="relative">
                  <textarea 
                    value={nativeConfig.systemPrompt}
                    onChange={e => setNativeConfig(prev => ({...prev, systemPrompt: e.target.value}))}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-40 resize-none"
                    placeholder="你是一个专业的企业助手。请始终保持专业、客观的语气..."
                  />
                  <Sparkles size={16} className="absolute right-4 bottom-4 text-primary opacity-50" />
               </div>
               <p className="text-[10px] text-slate-400 mt-2">提示：清晰的指令能让 AI 表现更好。支持 Markdown。</p>
            </div>
         </div>
      </section>

      {/* Knowledge & Tools */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="text-lg font-bold text-slate-800">知识与能力</h3>
         </div>

         <div className="pl-11 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Database size={16} className="text-primary" /> 知识库 (RAG)</h4>
                
                {nativeConfig.knowledgeFiles.length > 0 ? (
                   <div className="space-y-2 mb-4">
                      {nativeConfig.knowledgeFiles.map((file, i) => (
                         <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                               <FileText size={16} className="text-slate-400" />
                               <span className="text-sm font-bold text-slate-700">{file}</span>
                            </div>
                            <button onClick={() => setNativeConfig(prev => ({...prev, knowledgeFiles: prev.knowledgeFiles.filter(f => f !== file)}))} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50 mb-4">
                      <p className="text-xs font-bold text-slate-400">暂无知识库文件</p>
                   </div>
                )}

                <div className="flex gap-3">
                   <button 
                     onClick={() => setNativeConfig(prev => ({...prev, knowledgeFiles: [...prev.knowledgeFiles, 'Employee_Handbook_2024.pdf']}))}
                     className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                   >
                      <Plus size={14} /> 上传文档
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setNativeConfig(prev => ({...prev, enableWebSearch: !prev.enableWebSearch}))}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${nativeConfig.enableWebSearch ? 'border-primary bg-primary-soft/50' : 'border-slate-100 bg-white'}`}
                >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nativeConfig.enableWebSearch ? 'bg-white text-primary' : 'bg-slate-100 text-slate-400'}`}>
                      <Search size={18} />
                   </div>
                   <div>
                      <h5 className="font-bold text-slate-800 text-sm">联网搜索</h5>
                      <p className="text-xs text-slate-500">允许 AI 搜索实时互联网信息。</p>
                   </div>
                   {nativeConfig.enableWebSearch && <CheckCircle size={18} className="ml-auto text-primary" />}
                </div>

                <div 
                  onClick={() => setNativeConfig(prev => ({...prev, enableCodeInterpreter: !prev.enableCodeInterpreter}))}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${nativeConfig.enableCodeInterpreter ? 'border-primary bg-primary-soft/50' : 'border-slate-100 bg-white'}`}
                >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nativeConfig.enableCodeInterpreter ? 'bg-white text-primary' : 'bg-slate-100 text-slate-400'}`}>
                      <Code2 size={18} />
                   </div>
                   <div>
                      <h5 className="font-bold text-slate-800 text-sm">代码解释器</h5>
                      <p className="text-xs text-slate-500">允许运行 Python 代码进行计算。</p>
                   </div>
                   {nativeConfig.enableCodeInterpreter && <CheckCircle size={18} className="ml-auto text-primary" />}
                </div>
            </div>
         </div>
      </section>

      <div className="pl-11 pt-4 pb-20">
         <button 
           onClick={handleNativeSubmit}
           disabled={isSubmitting || !basicInfo.name}
           className="px-8 py-3.5 rounded-2xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-xl flex items-center gap-2"
         >
           {isSubmitting ? '正在创建...' : <>创建智能体 <BrainCircuit size={16} /></>}
         </button>
      </div>
    </>
  );

  // --- Main Render ---

  if (creationType === 'selection') {
    return renderSelectionScreen();
  }

  // Preview Data Preparation
  const previewName = basicInfo.name || '未命名应用';
  const previewDesc = basicInfo.description || '暂无描述...';
  const isNative = creationType === 'native';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      
      {/* Left Panel: Configuration Form */}
      <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-white/50 backdrop-blur-sm relative">
         <div className="max-w-3xl mx-auto p-8 lg:p-12">
            
            {/* Nav Header */}
            <div className="mb-10 flex items-center justify-between">
               <div>
                 <button onClick={() => setCreationType('selection')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold mb-6">
                   <ArrowLeft size={16} /> 返回类型选择
                 </button>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    {isNative ? '创建原生智能体' : '接入外部应用'}
                 </h1>
                 <p className="text-slate-500 text-lg">
                    {isNative ? '编排 Prompt 并配置知识库。' : '配置 API 连接信息与参数。'}
                 </p>
               </div>
               <div className="hidden md:block">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isNative ? 'bg-primary/10 text-primary-dark border-primary/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                     {isNative ? 'Native Agent' : 'External App'}
                  </span>
               </div>
            </div>

            <div className="space-y-12">
               {isNative ? renderNativeConfig() : renderExternalConfig()}
            </div>
         </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="w-[420px] bg-slate-100/50 hidden xl:flex flex-col items-center justify-center p-8 border-l border-white/50 relative">
          <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
          
          <div className="mb-8 text-center">
             <h3 className="text-slate-400 font-extrabold uppercase tracking-widest text-xs mb-2">Live Preview</h3>
             <p className="text-slate-500 font-medium text-sm">该应用在应用广场中的展示效果</p>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-6 shadow-card w-full max-w-sm pointer-events-none ring-1 ring-slate-900/5">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-white/50 to-transparent rounded-3xl -z-10" />

             {/* Preview Header */}
             <div className="flex items-start justify-between mb-6">
                <div 
                   className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform"
                   style={{ backgroundColor: basicInfo.iconBg, color: '#1e293b', boxShadow: `0 8px 20px -6px ${basicInfo.iconBg}` }}
                >
                   {isNative ? <Cpu size={24} /> : (externalConfig.provider === 'n8n' ? <Workflow size={24} /> : <Bot size={24} />)}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider bg-slate-50 text-slate-400 border-slate-100">
                      {isNative ? '原生' : (externalConfig.mode === 'chat' ? '对话' : '自动化')}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50/50 px-2 py-1 rounded-md">
                       <Activity size={12} /> 0
                    </div>
                 </div>
             </div>

             <h3 className="text-xl font-extrabold text-slate-900 mb-3 line-clamp-1 pr-4">
                {previewName}
             </h3>
             
             <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 h-10">
                {previewDesc}
             </p>

             <div className="mt-auto mb-6 pt-5 border-t border-slate-100/60 flex items-center justify-between text-xs font-bold text-slate-400 -mx-2 px-2">
                <div className="flex items-center gap-2">
                   <div className="p-1 bg-white rounded-full shadow-sm border border-slate-100">
                      <Box size={12} className="text-slate-400" />
                   </div>
                   <span className="truncate max-w-[90px] text-slate-500">{isNative ? 'NATIVE' : externalConfig.provider.toUpperCase()}</span>
                </div>
                <div className="w-px h-3 bg-slate-200"></div>
                <div className="flex items-center gap-2">
                   <span className="truncate max-w-[90px] text-slate-500 text-right">{basicInfo.category}</span>
                </div>
             </div>

             {/* Fake Buttons */}
             <div className="flex items-center gap-3 opacity-50 grayscale">
                <div className="flex items-center bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                   <div className="px-3 py-2 text-xs font-bold text-slate-400">Like</div>
                   <div className="w-px h-4 bg-slate-100 mx-1"></div>
                   <div className="px-3 py-2 text-xs font-bold text-slate-400">Dislike</div>
                </div>
             </div>
          </div>

          <div className="mt-8 p-4 bg-white/60 rounded-xl border border-slate-200 text-xs text-slate-500 w-full max-w-sm">
             <div className="flex items-center gap-2 font-bold mb-2 text-slate-700">
                <Terminal size={14} /> 配置摘要
             </div>
             <div className="space-y-1 font-mono">
                {isNative ? (
                    <>
                        <div className="flex justify-between"><span>Type:</span> <span>Native Agent</span></div>
                        <div className="flex justify-between"><span>Model:</span> <span>{nativeConfig.modelId}</span></div>
                        <div className="flex justify-between"><span>Web Search:</span> <span>{nativeConfig.enableWebSearch ? 'ON' : 'OFF'}</span></div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between"><span>Type:</span> <span>External</span></div>
                        <div className="flex justify-between"><span>Provider:</span> <span>{externalConfig.provider}</span></div>
                        <div className="flex justify-between"><span>Mode:</span> <span>{externalConfig.mode}</span></div>
                    </>
                )}
             </div>
          </div>
      </div>

    </div>
  );
};