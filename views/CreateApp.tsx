
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Globe, Zap, 
  MessageSquare, CheckCircle, 
  Terminal, Bot, Box, Workflow, Activity, Plus, Trash2,
  FileText, Cpu, Plug, 
  BrainCircuit, Database, Search, Code2, Sparkles, X,
  Key, Link, Settings2, Mic, Volume2, Lightbulb, Paperclip, AlertCircle, Loader2, ChevronRight, Edit3, 
  MessageCircle, HelpCircle, Quote, ShieldCheck, PenTool, LayoutGrid
} from 'lucide-react';
import { AppData, WorkflowInputDef } from '../types';

interface CreateAppProps {
  onBack: () => void;
  onSubmit: (app: Partial<AppData>) => void;
  initialData?: AppData | null;
}

type CreationType = 'selection' | 'external' | 'native';
type ProviderType = 'dify' | 'n8n' | 'custom';
type InteractionMode = 'chat' | 'workflow';
type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

// Available Icons for Selection
const AVAILABLE_ICONS = [
  { id: 'gpt', icon: <MessageSquare size={20} />, label: '对话' },
  { id: 'bot', icon: <Bot size={20} />, label: '机器人' },
  { id: 'workflow', icon: <Workflow size={20} />, label: '工作流' },
  { id: 'report', icon: <FileText size={20} />, label: '文档' },
  { id: 'copy', icon: <PenTool size={20} />, label: '创作' },
  { id: 'code', icon: <Code2 size={20} />, label: '代码' },
  { id: 'zap', icon: <Zap size={20} />, label: '通用' },
];

export const CreateApp: React.FC<CreateAppProps> = ({ onBack, onSubmit, initialData }) => {
  // Determine initial creation type based on initialData
  const getInitialCreationType = (): CreationType => {
      if (!initialData) return 'selection';
      return initialData.provider === 'native' ? 'native' : 'external';
  };

  const [creationType, setCreationType] = useState<CreationType>(getInitialCreationType());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Form State
  const [basicInfo, setBasicInfo] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    icon: initialData?.icon || 'zap', // Added icon state
    iconBg: initialData?.iconBg || '#e0f2fe',
    category: '效率工具小组',
  });

  // External Form State
  const [externalConfig, setExternalConfig] = useState({
    provider: (initialData?.provider === 'native' ? 'dify' : initialData?.provider || 'dify') as ProviderType,
    mode: (initialData?.mode || 'chat') as InteractionMode,
    apiEndpoint: initialData?.apiEndpoint || 'http://agent.esrcloud.com/v1',
    apiKey: '', // No masking/desensitization
    workflowInputs: initialData?.workflowInputs || [] as WorkflowInputDef[],
  });

  // Connection Test State - Auto set to success if editing existing external app
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
      initialData && initialData.provider !== 'native' ? 'success' : 'idle'
  );
  const [detectedCount, setDetectedCount] = useState(initialData?.workflowInputs?.length || 0);

  // Capabilities State
  const [capabilities, setCapabilities] = useState({
    welcomeMessage: initialData?.capabilities?.welcomeMessage || false,
    fileUpload: initialData?.capabilities?.fileUpload || false,
    citations: initialData?.capabilities?.citations || false,
  });

  // Custom Content State
  const [welcomeMessageContent, setWelcomeMessageContent] = useState(initialData?.welcomeMessage || '');

  // Native Form State
  const [nativeConfig, setNativeConfig] = useState({
    modelId: initialData?.modelConfig?.modelId || 'gpt-4-turbo',
    temperature: initialData?.modelConfig?.temperature || 0.7,
    systemPrompt: initialData?.modelConfig?.systemPrompt || '',
    enableWebSearch: initialData?.modelConfig?.enableWebSearch || false,
    enableCodeInterpreter: initialData?.modelConfig?.enableCodeInterpreter || false,
    knowledgeFiles: initialData?.modelConfig?.knowledgeBaseIds || [] as string[],
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
        // icon: Use basicInfo.icon instead of hardcoding
        tag: externalConfig.mode === 'chat' ? '对话' : '自动化',
        // Preserve existing stats if editing, otherwise defaults
        usersCount: initialData?.usersCount || '0',
        likes: initialData?.likes || 0,
        dislikes: initialData?.dislikes || 0,
        favs: initialData?.favs || 0,
        feedbacks: initialData?.feedbacks || 0,
        isFav: initialData?.isFav || false,
        quota: initialData?.quota || { limit: 100, used: 0, unit: '次' },
        workflowInputs: externalConfig.workflowInputs, // Keep strictly defined variables
        capabilities: capabilities, // Save capabilities separately
        welcomeMessage: capabilities.welcomeMessage ? welcomeMessageContent : undefined
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
        mode: 'chat',
        // icon: Use basicInfo.icon
        tag: '对话', // Native is always chat type
        // Preserve existing stats if editing
        usersCount: initialData?.usersCount || '0',
        likes: initialData?.likes || 0,
        dislikes: initialData?.dislikes || 0,
        favs: initialData?.favs || 0,
        feedbacks: initialData?.feedbacks || 0,
        isFav: initialData?.isFav || false,
        quota: initialData?.quota || { limit: 1000, used: 0, unit: 'Tokens' },
        capabilities: { ...capabilities, fileUpload: true }, // Native always supports file upload (RAG/Analysis)
        welcomeMessage: capabilities.welcomeMessage ? welcomeMessageContent : undefined,
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

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    
    // Simulate API Call delay
    setTimeout(() => {
        setConnectionStatus('success');
        
        // Mock fetched variables based on provider
        const mockInputs: WorkflowInputDef[] = externalConfig.provider === 'dify' 
          ? [
              { id: 'var_1', type: 'text', label: 'query', required: true, placeholder: '用户输入的问题' },
              { id: 'var_2', type: 'select', label: 'style', required: false, options: ['Creative', 'Precise', 'Balanced'], placeholder: '回答风格' }
            ]
          : [
              { id: 'var_n1', type: 'text', label: 'webhook_payload', required: true, placeholder: 'JSON Payload' },
              { id: 'var_n2', type: 'text', label: 'email', required: true, placeholder: 'Recipient Email' }
            ];

        // Mock capabilities detection for External Providers
        if (externalConfig.provider === 'dify') {
            setCapabilities({
                welcomeMessage: true,
                fileUpload: true,
                citations: false
            });
            setWelcomeMessageContent("你好！我是接入的 Dify 智能体，请问有什么可以帮你？");
        } else {
             // n8n or others often don't have these conversational features in the same way, defaulting to off
            setCapabilities({
                welcomeMessage: false,
                fileUpload: false,
                citations: false
            });
            setWelcomeMessageContent("");
        }
        
        setExternalConfig(prev => ({
            ...prev,
            workflowInputs: mockInputs
        }));
        setDetectedCount(mockInputs.length);
    }, 1500);
  };

  // --- External Workflow Input Helpers ---
  const updateWorkflowInput = (id: string, field: keyof WorkflowInputDef, value: any) => {
    setExternalConfig(prev => ({
        ...prev,
        workflowInputs: prev.workflowInputs.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const toggleCapability = (key: keyof typeof capabilities) => {
    setCapabilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Capability Config Definition ---
  const capabilityDefinitions = [
    {
      id: 'welcomeMessage',
      label: '对话开场白',
      description: '在对话型应用中，让 AI 主动说第一段话可以拉近与用户间的距离。',
      icon: <MessageCircle size={18} className="text-white" />,
      iconBg: 'bg-blue-500',
    },
    {
      id: 'fileUpload',
      label: '文件上传',
      description: '支持 document 格式解析', 
      icon: <FileText size={18} className="text-white" />,
      iconBg: 'bg-blue-600',
    },
    {
      id: 'citations',
      label: '引用和归属',
      description: '显示源文档和生成内容的归属部分。',
      icon: <Quote size={18} className="text-white" />,
      iconBg: 'bg-orange-500',
    }
  ];

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
                   <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle size={16} className="text-indigo-500" /> 自动同步变量配置</li>
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
          
          {/* Icon Selector */}
          <div className="col-span-2">
             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">应用图标</label>
             <div className="flex flex-wrap gap-3">
               {AVAILABLE_ICONS.map(item => (
                 <div 
                   key={item.id}
                   onClick={() => setBasicInfo({...basicInfo, icon: item.id})}
                   className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                     basicInfo.icon === item.id 
                       ? 'bg-slate-800 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                       : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                   }`}
                 >
                    {item.icon}
                    <span className="text-sm font-bold">{item.label}</span>
                 </div>
               ))}
             </div>
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
       </div>
    </section>
  );

  const renderCapabilitiesSection = (readOnly: boolean = false) => (
    <div className="pl-11 grid grid-cols-1 gap-3">
        {capabilityDefinitions.map(cap => {
            const isEnabled = capabilities[cap.id as keyof typeof capabilities];
            return (
                <div key={cap.id} className={`flex flex-col p-4 bg-white border rounded-xl shadow-sm transition-all ${isEnabled ? 'border-primary/30 ring-1 ring-primary/10 bg-slate-50/50' : 'border-slate-200 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-lg flex-shrink-0 ${cap.iconBg} ${!isEnabled && readOnly ? 'grayscale opacity-50' : ''}`}>
                                {cap.icon}
                            </div>
                            <div className="pt-0.5">
                                <h4 className={`font-bold text-sm mb-1 ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>{cap.label}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{cap.description}</p>
                            </div>
                        </div>
                        
                        {readOnly ? (
                           <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                 {isEnabled ? '已启用' : '未启用'}
                              </span>
                              {isEnabled && <span className="text-[9px] text-slate-400 mt-1">源端配置</span>}
                           </div>
                        ) : (
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={isEnabled}
                                    onChange={() => toggleCapability(cap.id as keyof typeof capabilities)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        )}
                    </div>

                    {/* Extended UI for Welcome Message when enabled */}
                    {cap.id === 'welcomeMessage' && isEnabled && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60 pl-[52px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">开场白内容 {readOnly && "(同步自 Dify)"}</label>
                            <textarea
                                value={welcomeMessageContent}
                                onChange={(e) => !readOnly && setWelcomeMessageContent(e.target.value)}
                                disabled={readOnly}
                                className={`w-full p-3 rounded-xl border text-sm font-medium text-slate-700 focus:ring-4 outline-none transition-all resize-none h-24 placeholder:text-slate-400 ${readOnly ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus:ring-primary/10'}`}
                                placeholder="请输入 AI 的第一句问候语..."
                            />
                        </div>
                    )}

                    {/* Extended UI for File Upload when enabled */}
                    {cap.id === 'fileUpload' && isEnabled && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-8 pl-[52px]">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">支持的文件类型</span>
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">document</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">最大上传数</span>
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">3</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );

  const renderExternalConfig = () => (
    <>
      {renderBasicInfoSection()}

      {/* App Type Selection */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-50">
          <div className="pl-11">
             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">应用类型</label>
             <div className="flex gap-4">
                <div 
                  onClick={() => setExternalConfig(prev => ({...prev, mode: 'chat'}))}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${externalConfig.mode === 'chat' ? 'border-primary bg-primary-soft/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${externalConfig.mode === 'chat' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">对话 (Chat)</div>
                        <div className="text-xs text-slate-400">一问一答形式</div>
                    </div>
                    {externalConfig.mode === 'chat' && <CheckCircle size={16} className="ml-auto text-primary" />}
                </div>

                <div 
                  onClick={() => setExternalConfig(prev => ({...prev, mode: 'workflow'}))}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${externalConfig.mode === 'workflow' ? 'border-primary bg-primary-soft/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${externalConfig.mode === 'workflow' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Workflow size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">自动化 (Workflow)</div>
                        <div className="text-xs text-slate-400">流程编排执行</div>
                    </div>
                     {externalConfig.mode === 'workflow' && <CheckCircle size={16} className="ml-auto text-primary" />}
                </div>
             </div>
          </div>
      </section>

      {/* Provider Selection (Dropdown) */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-bold text-slate-800">选择接入源</h3>
         </div>

         <div className="pl-11">
             <div className="relative">
                <Plug className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={externalConfig.provider}
                  onChange={(e) => {
                     const p = e.target.value as ProviderType;
                     // Only update provider, do not force change mode
                     setExternalConfig(prev => ({ ...prev, provider: p }));
                     setConnectionStatus('idle'); 
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer transition-all"
                >
                   <option value="dify">Dify Agent / Workflow</option>
                   <option value="n8n">n8n Automation</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
             </div>
             
             {/* Provider Description */}
             <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-white border border-slate-100 text-indigo-500 shadow-sm">
                     {externalConfig.provider === 'dify' ? <Bot size={20} /> : <Workflow size={20} />}
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                      {externalConfig.provider === 'dify' ? 'Dify.AI' : 'n8n Workflow'}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                       {externalConfig.provider === 'dify' 
                          ? 'Dify 是一个开源的 LLM 应用开发平台。接入 Dify 应用后，可直接复用其编排好的提示词、知识库和插件能力。'
                          : 'n8n 是一个可扩展的工作流自动化工具。接入 n8n 后，可通过 Webhook 触发复杂的业务流程自动化。'
                       }
                    </p>
                 </div>
             </div>
         </div>
      </section>

      {/* Connection Config & Fetch */}
      <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="text-lg font-bold text-slate-800">API 连接配置</h3>
         </div>

         <div className="pl-11 space-y-6">
            
            {/* 3.1 Endpoint & Key Form */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-5">
                <div>
                   <label className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      <Link size={12} /> API Endpoint
                   </label>
                   <input 
                     value={externalConfig.apiEndpoint}
                     onChange={e => setExternalConfig(prev => ({...prev, apiEndpoint: e.target.value}))}
                     className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono text-sm text-slate-600 focus:text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                     placeholder="http://api.example.com/v1"
                   />
                </div>
                
                <div>
                   <label className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      <Key size={12} /> API Key
                   </label>
                   <input 
                     type="text"
                     value={externalConfig.apiKey}
                     onChange={e => setExternalConfig(prev => ({...prev, apiKey: e.target.value}))}
                     className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono text-sm text-slate-600 focus:text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                     placeholder="sk-........................"
                   />
                </div>

                <button 
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing' || !externalConfig.apiEndpoint}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${connectionStatus === 'testing' ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]'}`}
                >
                   {connectionStatus === 'testing' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> 正在连接并获取配置...
                      </>
                   ) : (
                      <>
                        <Zap size={16} fill="currentColor" /> 测试连接并获取配置
                      </>
                   )}
                </button>

                {connectionStatus === 'success' && (
                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                         <CheckCircle size={14} className="text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-emerald-700">连接成功! 已获取到 {detectedCount} 个变量配置</span>
                   </div>
                )}
                 {connectionStatus === 'error' && (
                   <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                         <AlertCircle size={14} className="text-red-600" />
                      </div>
                      <span className="text-sm font-bold text-red-700">连接失败，请检查 Endpoint 或 Key 是否正确</span>
                   </div>
                )}
            </div>

            {/* 3.2 Detected Variables */}
            {connectionStatus === 'success' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                       <h3 className="text-lg font-bold text-slate-800">检测到的变量字段</h3>
                    </div>

                    <div className="pl-11 space-y-3">
                       {externalConfig.workflowInputs.length === 0 ? (
                          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                             <p className="text-sm font-medium text-slate-400">未检测到需要输入的变量</p>
                          </div>
                       ) : (
                          externalConfig.workflowInputs.map((input, idx) => (
                             <div key={input.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-start">
                                   <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-mono font-bold rounded uppercase border border-indigo-100">
                                         {input.label}
                                      </span>
                                      {input.required && <span className="text-red-500 text-xs font-bold">*</span>}
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{input.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <input 
                                     value={input.label} // Editing the displayed label
                                     onChange={(e) => updateWorkflowInput(input.id, 'label', e.target.value)}
                                     className="font-bold text-slate-700 text-sm border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none bg-transparent transition-colors w-full"
                                     placeholder="Display Name"
                                   />
                                   <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {input.options && (
                                   <div className="text-xs text-slate-400 flex gap-1 items-center">
                                      <span>选项:</span> {input.options.join(', ')}
                                   </div>
                                )}
                             </div>
                          ))
                       )}
                    </div>
                </div>
            )}

            {/* 3.3 Function Config */}
            {connectionStatus === 'success' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">5</div>
                       <h3 className="text-lg font-bold text-slate-800">功能配置 (已同步)</h3>
                    </div>

                    {renderCapabilitiesSection(true)} 
                </div>
            )}
         </div>
      </section>

      <div className="pl-11 pt-4 pb-20">
         <button 
           onClick={handleExternalSubmit}
           disabled={isSubmitting || !basicInfo.name || connectionStatus !== 'success'}
           className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all ${isSubmitting || !basicInfo.name || connectionStatus !== 'success' ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5'}`}
         >
           {isSubmitting ? '正在保存...' : <>{initialData ? '保存修改' : '确认接入并创建'} <Plug size={16} /></>}
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
                       onChange={e => setNativeConfig(prev => ({...prev,modelId: e.target.value}))}
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
           {isSubmitting ? '正在创建...' : <>{initialData ? '保存修改' : '创建智能体'} <BrainCircuit size={16} /></>}
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
  const previewIcon = AVAILABLE_ICONS.find(i => i.id === basicInfo.icon)?.icon || <Zap size={24} />;

  // Logic to determine badge style in preview
  const isWorkflow = !isNative && externalConfig.mode === 'workflow';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      
      {/* Left Panel: Configuration Form */}
      <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-white/50 backdrop-blur-sm relative">
         <div className="max-w-3xl mx-auto p-8 lg:p-12">
            
            {/* Nav Header */}
            <div className="mb-10 flex items-center justify-between">
               <div>
                 <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold mb-6">
                   <ArrowLeft size={16} /> 返回{initialData ? '工作台' : '类型选择'}
                 </button>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    {initialData ? '编辑应用配置' : (isNative ? '创建原生智能体' : '接入外部应用')}
                 </h1>
                 <p className="text-slate-500 text-lg">
                    {isNative ? '编排 Prompt 并配置知识库。' : '配置 API 连接信息以获取变量。'}
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
                   {/* Preview Icon from State */}
                   {previewIcon}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {/* Badge: App Type (Chat vs Workflow) */}
                    {isWorkflow ? (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold border border-purple-100 bg-purple-50 text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                           <Workflow size={12} /> 自动化
                        </span>
                    ) : (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold border border-emerald-100 bg-emerald-50 text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                           <MessageSquare size={12} /> 对话
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50/50 px-2 py-1 rounded-md">
                       <Activity size={12} /> {initialData?.usersCount || 0}
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
                        <div className="flex justify-between"><span>Vars Detected:</span> <span>{detectedCount}</span></div>
                        <div className="flex justify-between"><span>Connection:</span> <span className={connectionStatus === 'success' ? 'text-emerald-500' : 'text-slate-400'}>{connectionStatus.toUpperCase()}</span></div>
                    </>
                )}
             </div>
          </div>
      </div>

    </div>
  );
};
