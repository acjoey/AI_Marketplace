import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Download, CheckCircle,
  Search, PieChart,
  Layers, Activity,
  Sliders, Trash2, 
  BarChart2, DollarSign, Database, ArrowUpDown, 
  Cpu, Globe, UserCog, Edit3, X, Building2, Plus, Check, AlertTriangle, Shield, Crown, Wand2, Zap,
  ChevronRight, ChevronDown, FolderTree
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

// --- Types & Interfaces for Admin ---

interface AppQuotaUsage {
  appId: string;
  appName: string;
  used: number;
  limit: number | 'unlimited'; 
  unit: string; 
  modelId: string; 
}

type UserRole = 'super_admin' | 'admin' | 'creator' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole; 
  status: 'active' | 'disabled';
  lastActive: string;
  assignedPolicyId?: string; 
  quotas: AppQuotaUsage[]; 
}

interface Policy {
  id: string;
  name: string;
  description: string;
  modelQuotas: { modelId: string; limit: number | 'unlimited' }[];
  targetAll?: boolean; 
  appliedDepartments: string[]; 
  appliedUserIds: string[]; 
}

interface Department {
  id: string;
  name: string;
  memberCount: number;
  children?: Department[]; // Added for hierarchy
}

interface RoleDefinition {
  key: UserRole;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  description: string;
  permissions: string[];
}

interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
}

// --- Constants ---

const MOCK_MODELS: ModelDefinition[] = [
  { id: 'gpt-4', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
];

const MOCK_APPS_REF = [
  { id: 'gpt', name: 'General GPT', modelId: 'gpt-4' },
  { id: 'weekly', name: '周报助手', modelId: 'gpt-3.5' },
  { id: 'copy', name: '营销文案', modelId: 'claude-3' },
  { id: 'review', name: '代码审查', modelId: 'gemini-pro' },
];

const COLORS = ['#00d0b0', '#6366f1', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'];

const INITIAL_ROLE_CONFIG: RoleDefinition[] = [
  {
    key: 'super_admin',
    label: '超级管理员',
    icon: <Crown size={16} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    description: '拥有系统最高权限。',
    permissions: []
  },
  {
    key: 'admin',
    label: '管理员',
    icon: <Shield size={16} />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
    description: '负责运营管理。',
    permissions: []
  },
  {
    key: 'creator',
    label: '创建者',
    icon: <Wand2 size={16} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    description: '具有 AI 应用开发权限。',
    permissions: []
  },
  {
    key: 'user',
    label: '普通用户',
    icon: <Users size={16} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    description: '最终使用者。',
    permissions: []
  }
];

// Updated Department Data with Hierarchy
const INITIAL_DEPARTMENTS: Department[] = [
  { 
    id: 'd1', name: '产品部', memberCount: 12,
    children: [
        { id: 'd1-1', name: '企微产品线', memberCount: 5 },
        { id: 'd1-2', name: 'SaaS产品线', memberCount: 7 }
    ] 
  },
  { 
    id: 'd2', name: '研发部', memberCount: 45,
    children: [
        { id: 'd2-1', name: '后端组', memberCount: 20 },
        { id: 'd2-2', name: '前端组', memberCount: 15 },
        { id: 'd2-3', name: '测试组', memberCount: 10 }
    ]
  },
  { id: 'd3', name: '市场部', memberCount: 8 },
  { id: 'd4', name: '人事部', memberCount: 5 },
];

const INITIAL_POLICIES: Policy[] = [
  {
    id: 'p_std',
    name: '全员基础策略 (Standard)',
    description: '适用于大多数行政和职能部门。',
    modelQuotas: [
      { modelId: 'gpt-4', limit: 50 }, 
      { modelId: 'gpt-3.5', limit: 1000 }, 
      { modelId: 'claude-3', limit: 50 }, 
      { modelId: 'gemini-pro', limit: 20 }
    ],
    targetAll: true,
    appliedDepartments: [],
    appliedUserIds: []
  },
  {
    id: 'p_dev',
    name: '研发高频策略 (Dev High)',
    description: '针对研发部门优化。',
    modelQuotas: [
      { modelId: 'gpt-4', limit: 500 }, 
      { modelId: 'gpt-3.5', limit: 5000 }, 
      { modelId: 'claude-3', limit: 500 }, 
      { modelId: 'gemini-pro', limit: 2000 }
    ],
    targetAll: false,
    appliedDepartments: ['研发部'],
    appliedUserIds: ['u1'] 
  }
];

const INITIAL_USERS: User[] = [
  { 
    id: 'u0', name: 'Admin Root', email: 'root@corp.com', department: 'IT部', role: 'super_admin', status: 'active', lastActive: '刚刚',
    quotas: MOCK_APPS_REF.map(a => ({ appId: a.id, appName: a.name, used: 0, limit: 'unlimited', unit: '次/月', modelId: a.modelId }))
  },
  { 
    id: 'u1', name: '张三', email: 'zhangsan@corp.com', department: '产品部', role: 'creator', status: 'active', lastActive: '2分钟前',
    assignedPolicyId: 'p_dev',
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 2340, limit: 5000, unit: '次/月', modelId: 'gpt-4' },
      { appId: 'weekly', appName: '周报助手', used: 4, limit: 100, unit: '次/月', modelId: 'gpt-3.5' },
    ]
  },
  { 
    id: 'u2', name: '李四', email: 'lisi@corp.com', department: '研发部', role: 'admin', status: 'active', lastActive: '10分钟前',
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 8900, limit: 5000, unit: '次/月', modelId: 'gpt-4' },
    ]
  },
  { 
    id: 'u3', name: '王五', email: 'wangwu@corp.com', department: '市场部', role: 'user', status: 'active', lastActive: '2小时前',
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 545, limit: 1000, unit: '次/月', modelId: 'gpt-4' },
    ]
  },
];

const MOCK_USAGE_BY_APP = [
  { name: 'General GPT', calls: 14500, tokens: 4500, cost: 1200 },
  { name: '周报助手', calls: 3200, tokens: 800, cost: 320 },
  { name: '营销文案', calls: 5600, tokens: 2100, cost: 580 },
  { name: '代码审查', calls: 8900, tokens: 6700, cost: 2400 },
];

const MOCK_USAGE_BY_DEPT = [
  { name: '研发部', calls: 12000, tokens: 7800, cost: 2800 },
  { name: '市场部', calls: 6500, tokens: 2300, cost: 650 },
  { name: '产品部', calls: 5400, tokens: 1800, cost: 520 },
  { name: '人事部', calls: 1200, tokens: 400, cost: 120 },
];

const applyPolicyToQuotas = (quotas: AppQuotaUsage[], policy?: Policy): AppQuotaUsage[] => {
  if (!policy) return quotas;
  return quotas.map(quota => {
    const limitConfig = policy.modelQuotas.find(mq => mq.modelId === quota.modelId);
    return limitConfig ? { ...quota, limit: limitConfig.limit } : quota;
  });
};

// --- Sub-Components ---

// 1. Role Edit Modal
const RoleEditModal: React.FC<{
  role: RoleDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRole: RoleDefinition) => void;
}> = ({ role, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<RoleDefinition | null>(null);

  useEffect(() => {
    if (role) setFormData({ ...role });
  }, [role]);

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-100 ring-1 ring-black/5">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${formData.bg} ${formData.color}`}>
                {formData.icon}
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900">配置角色</h3>
               <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{formData.key}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4">
           <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">显示名称</label>
              <input 
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">描述</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none h-24 transition-all"
              />
           </div>
           <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700 font-medium flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>注意：权限集目前由系统硬编码锁定，无法修改。此处仅可调整显示的名称与描述。</span>
           </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={() => onSave(formData)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl transition-all">保存配置</button>
        </div>
      </div>
    </div>
  );
};

// 2. Department Selector Modal (NEW)
const DepartmentSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  selectedDepartments: string[]; // List of department NAMES (as per current app logic)
  onConfirm: (selected: string[]) => void;
}> = ({ isOpen, onClose, departments, selectedDepartments, onConfirm }) => {
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setTempSelected(selectedDepartments);
  }, [isOpen, selectedDepartments]);

  if (!isOpen) return null;

  const toggleSelection = (deptName: string) => {
    setTempSelected(prev => 
      prev.includes(deptName) 
        ? prev.filter(n => n !== deptName)
        : [...prev, deptName]
    );
  };

  const RecursiveDeptItem: React.FC<{ dept: Department; level: number }> = ({ dept, level }) => {
     const isSelected = tempSelected.includes(dept.name);
     const [isExpanded, setIsExpanded] = useState(true);
     const hasChildren = dept.children && dept.children.length > 0;

     return (
        <div className="select-none">
           <div 
             className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group`}
             style={{ paddingLeft: `${level * 20 + 8}px` }}
             onClick={() => toggleSelection(dept.name)}
           >
              {hasChildren ? (
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                   className="p-0.5 rounded hover:bg-slate-200 text-slate-400"
                 >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                 </button>
              ) : (
                 <div className="w-4 h-4"></div> // Spacer
              )}
              
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                 {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              
              <div className="flex items-center gap-2">
                 <Building2 size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                 <span className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{dept.name}</span>
              </div>
           </div>
           
           {hasChildren && isExpanded && (
              <div>
                 {dept.children!.map(child => (
                    <RecursiveDeptItem key={child.id} dept={child} level={level + 1} />
                 ))}
              </div>
           )}
        </div>
     );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderTree size={18} className="text-indigo-600" />
            选择应用部门
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-full text-slate-400"><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
           {departments.map(dept => (
              <RecursiveDeptItem key={dept.id} dept={dept} level={0} />
           ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
            <button 
              onClick={() => onConfirm(tempSelected)} 
              className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              确认 ({tempSelected.length})
            </button>
        </div>
      </div>
    </div>
  );
};


// 3. Policy Edit Modal
const PolicyEditModal: React.FC<{
  policy: Policy | null;
  departments: Department[];
  users: User[];
  policies: Policy[]; 
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: Policy) => void;
}> = ({ policy, departments, users, policies, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Policy>({
    id: '', name: '', description: '', modelQuotas: [], appliedDepartments: [], appliedUserIds: [], targetAll: false
  });
  const [activeTab, setActiveTab] = useState<'basics' | 'assignments'>('basics');
  const [userSearch, setUserSearch] = useState('');
  
  // New State for Department Selector
  const [isDeptSelectorOpen, setIsDeptSelectorOpen] = useState(false);

  useEffect(() => {
    if (policy) {
      setFormData({ ...policy });
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        description: '',
        modelQuotas: MOCK_MODELS.map(m => ({ modelId: m.id, limit: 100 })),
        targetAll: false,
        appliedDepartments: [],
        appliedUserIds: []
      });
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleQuotaChange = (modelId: string, limitStr: string) => {
    const newQuotas = [...formData.modelQuotas];
    const index = newQuotas.findIndex(q => q.modelId === modelId);
    const newLimit = limitStr === 'unlimited' ? 'unlimited' : parseInt(limitStr) || 0;
    
    if (index >= 0) {
      newQuotas[index] = { ...newQuotas[index], limit: newLimit };
    } else {
      newQuotas.push({ modelId, limit: newLimit });
    }
    setFormData({ ...formData, modelQuotas: newQuotas });
  };

  // Modified: Toggle removed, now just handles removing specific deps
  const removeDepartment = (deptName: string) => {
    const newDepts = formData.appliedDepartments.filter(d => d !== deptName);
    setFormData({ ...formData, appliedDepartments: newDepts });
  };

  // Modified: Handle confirmation from modal
  const handleDeptConfirm = (selected: string[]) => {
      setFormData({ ...formData, appliedDepartments: selected });
      setIsDeptSelectorOpen(false);
  };

  const toggleUser = (userId: string) => {
    const newUsers = formData.appliedUserIds.includes(userId)
      ? formData.appliedUserIds.filter(id => id !== userId)
      : [...formData.appliedUserIds, userId];
    setFormData({ ...formData, appliedUserIds: newUsers });
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  // Get selected user objects for display
  const selectedUserObjects = users.filter(u => formData.appliedUserIds.includes(u.id));

  // Helper to render tree of SELECTED items only
  const renderSelectedTree = (nodes: Department[], level = 0): React.ReactNode => {
      return nodes.map(node => {
          const isSelected = formData.appliedDepartments.includes(node.name);
          // Check if any children (deep) are selected to decide if we show this parent container
          const hasSelectedDescendant = (n: Department): boolean => {
              if (n.children) {
                  return n.children.some(c => formData.appliedDepartments.includes(c.name) || hasSelectedDescendant(c));
              }
              return false;
          };
          
          const showNode = isSelected || hasSelectedDescendant(node);

          if (!showNode) return null;

          return (
              <div key={node.id} className="relative">
                  {/* Vertical line connector for children */}
                  {level > 0 && (
                      <div className="absolute left-[-14px] top-0 bottom-0 w-px bg-slate-200"></div>
                  )}
                  {level > 0 && (
                      <div className="absolute left-[-14px] top-3.5 w-3 h-px bg-slate-200"></div>
                  )}

                  <div 
                      className={`flex items-center justify-between p-2 rounded-lg mb-1 border ${isSelected ? 'bg-indigo-50 border-indigo-100' : 'bg-transparent border-transparent'}`}
                      style={{ marginLeft: level > 0 ? '4px' : '0' }}
                  >
                      <div className="flex items-center gap-2">
                           <Building2 size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-300'} />
                           <span className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{node.name}</span>
                      </div>
                      {isSelected && (
                          <button 
                            onClick={() => removeDepartment(node.name)}
                            className="p-1 hover:bg-red-100 rounded text-slate-300 hover:text-red-500 transition-colors"
                          >
                             <Trash2 size={14} />
                          </button>
                      )}
                  </div>
                  {node.children && (
                      <div className="pl-6 border-l border-slate-100/0 ml-2">
                          {renderSelectedTree(node.children, level + 1)}
                      </div>
                  )}
              </div>
          );
      });
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{policy ? '编辑策略' : '创建新策略'}</h3>
            <p className="text-sm text-slate-500 mt-0.5">定义模型配额及应用范围</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 px-6">
           <button 
             onClick={() => setActiveTab('basics')} 
             className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'basics' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           >
             配额配置
           </button>
           <button 
             onClick={() => setActiveTab('assignments')} 
             className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           >
             应用范围
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'basics' && (
            <>
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">策略基础</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">策略名称</label>
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="例如：研发部专用策略"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">描述</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="简述该策略适用的场景..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none h-20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">模型额度限制 (月度)</h4>
                </div>
                
                <div className="space-y-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                  {MOCK_MODELS.map(model => {
                    const quota = formData.modelQuotas.find(q => q.modelId === model.id);
                    const limit = quota ? quota.limit : 0;
                    const isUnlimited = limit === 'unlimited';

                    return (
                      <div key={model.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500">
                              <Cpu size={14} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-700">{model.name}</span>
                               <span className="text-[10px] text-slate-400 font-medium">{model.provider}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative w-28">
                                <input 
                                  type="text" 
                                  disabled={isUnlimited}
                                  value={isUnlimited ? '' : limit}
                                  onChange={(e) => handleQuotaChange(model.id, e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-right outline-none transition-all ${isUnlimited ? 'bg-slate-50 text-slate-400' : 'bg-white border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10'}`}
                                  placeholder={isUnlimited ? "∞" : "0"}
                                />
                                {!isUnlimited && <span className="absolute right-8 top-2.5 text-[10px] text-slate-400 pointer-events-none">次</span>}
                            </div>
                            <button 
                                onClick={() => handleQuotaChange(model.id, isUnlimited ? '500' : 'unlimited')}
                                className={`p-2 rounded-lg border transition-all ${isUnlimited ? 'bg-primary text-slate-900 border-primary shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'}`}
                                title={isUnlimited ? "设为有限" : "设为无限"}
                            >
                              <Activity size={16} />
                            </button>
                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
             <div className="space-y-6">
               
               {/* 1. Global Scope */}
               <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.targetAll ? 'border-primary bg-primary-soft text-primary-dark' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`} onClick={() => setFormData({...formData, targetAll: !formData.targetAll})}>
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.targetAll ? 'bg-white/50' : 'bg-slate-100'}`}>
                        <Globe size={20} className={formData.targetAll ? 'text-primary' : 'text-slate-400'} />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold">全员应用 (Global Scope)</h4>
                        <p className={`text-xs mt-0.5 ${formData.targetAll ? 'text-primary-dark/80' : 'text-slate-400'}`}>作为默认策略应用于所有未被特定规则覆盖的用户</p>
                     </div>
                  </div>
                  {formData.targetAll ? (
                     <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></div>
                  ) : (
                     <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                  )}
               </div>

               {/* 2. Department Selector - Modified for Tree View & Add Button */}
               <div className={`space-y-3 transition-opacity ${formData.targetAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex justify-between items-end">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">应用部门 (部门级默认)</h4>
                      <button 
                        onClick={() => setIsDeptSelectorOpen(true)}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1 transition-colors"
                      >
                         <Plus size={14} /> 添加部门
                      </button>
                  </div>
                  
                  {/* Tree Display of Selected */}
                  <div className="min-h-[100px] p-3 border border-slate-200 rounded-xl bg-slate-50/30">
                     {formData.appliedDepartments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-4">
                           <FolderTree size={24} className="mb-2 opacity-50" />
                           <span className="text-xs font-bold">暂无选择部门</span>
                        </div>
                     ) : (
                        <div className="space-y-1">
                           {renderSelectedTree(departments)}
                        </div>
                     )}
                  </div>
               </div>

               <div className="w-full h-px bg-slate-100"></div>

               {/* 3. User Selector */}
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">特例用户 (强制分配 - 优先级最高)</h4>
                        <p className="text-[10px] text-slate-400 mt-1">注意：选中已被其他策略绑定的用户，将自动将其迁移至此策略。</p>
                    </div>
                  </div>
                  
                  {/* Selected Users Display - NEW */}
                  {selectedUserObjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedUserObjects.map(user => (
                        <div key={user.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm animate-in fade-in zoom-in duration-200">
                           <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {user.name.charAt(0)}
                           </div>
                           <span className="text-xs font-bold text-slate-700">{user.name}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}
                             className="ml-1 p-0.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                           >
                              <X size={12} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input 
                       className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400"
                       placeholder="搜索用户添加..."
                       value={userSearch}
                       onChange={(e) => setUserSearch(e.target.value)}
                     />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                     {filteredUsers.length === 0 && <div className="text-center py-4 text-xs text-slate-400">无匹配用户</div>}
                     {filteredUsers.map(user => {
                       const isSelected = formData.appliedUserIds.includes(user.id);
                       
                       // Check if user is assigned to ANOTHER policy (Logic: User has assignedID, and it's NOT current form ID)
                       const assignedToOtherId = user.assignedPolicyId && user.assignedPolicyId !== formData.id ? user.assignedPolicyId : null;
                       // Look up the name from policies prop
                       const otherPolicyName = assignedToOtherId ? policies.find(p => p.id === assignedToOtherId)?.name : null;

                       return (
                         <div 
                           key={user.id}
                           onClick={() => toggleUser(user.id)}
                           className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                         >
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                                 {user.name.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                    {otherPolicyName && !isSelected && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-0.5" title="点击选择将强制更改其策略">
                                            <AlertTriangle size={8} /> 已绑定: {otherPolicyName}
                                        </span>
                                    )}
                                 </div>
                                 <span className="text-[10px] text-slate-400">{user.email}</span>
                               </div>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                               {isSelected && <Check size={10} className="text-white" />}
                            </div>
                         </div>
                       )
                     })}
                  </div>
               </div>
             </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={() => onSave(formData)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl transition-all">保存策略</button>
        </div>
      </div>
    </div>
    
    <DepartmentSelectorModal 
        isOpen={isDeptSelectorOpen}
        onClose={() => setIsDeptSelectorOpen(false)}
        departments={departments}
        selectedDepartments={formData.appliedDepartments}
        onConfirm={handleDeptConfirm}
    />
    </>
  );
};


// --- Main Component ---

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'policies'>('overview');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [roleConfigs, setRoleConfigs] = useState<RoleDefinition[]>(INITIAL_ROLE_CONFIG);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPolicy, setFilterPolicy] = useState('all');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  
  // Overview Tab State
  const [overviewDimension, setOverviewDimension] = useState<'app' | 'department'>('app');
  
  // Modal States
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  // Helper
  const getPolicyByDept = (deptName: string) => {
    // Priority 2: Department Assignment
    const deptPolicy = policies.find(p => p.appliedDepartments.includes(deptName));
    if (deptPolicy) return deptPolicy;

    // Priority 3: Global Assignment (targetAll)
    const globalPolicy = policies.find(p => p.targetAll);
    return globalPolicy || null;
  };

  const getActivePolicyForUser = (user: User) => {
     // Priority 1: Direct Assignment (Stored in User ID Check inside Policy or assignedPolicyId override)
     if (user.assignedPolicyId) {
       return policies.find(p => p.id === user.assignedPolicyId) || null;
     }
     return getPolicyByDept(user.department);
  };

  const getRoleConfig = (roleKey: UserRole) => {
    return roleConfigs.find(r => r.key === roleKey) || roleConfigs[3]; // default to user
  };

  // Handlers
  const handleOpenPolicy = (policy?: Policy) => {
    setEditingPolicy(policy || null);
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = (newPolicy: Policy) => {
    // 1. Update Policies List (Enforce Mutually Exclusive User Assignments)
    setPolicies(prev => {
      // Determine if the policy already exists
      const exists = prev.find(p => p.id === newPolicy.id);
      
      let updatedPolicies = prev;
      
      if (exists) {
        // Update existing
        updatedPolicies = prev.map(p => {
           if (p.id === newPolicy.id) return newPolicy;
           
           // CRITICAL LOGIC: If 'newPolicy' claims users, remove them from 'p'
           const conflictUsers = p.appliedUserIds.filter(uid => newPolicy.appliedUserIds.includes(uid));
           if (conflictUsers.length > 0) {
               return {
                   ...p,
                   appliedUserIds: p.appliedUserIds.filter(uid => !newPolicy.appliedUserIds.includes(uid))
               };
           }
           return p;
        });
      } else {
        // Add new policy
        // Also need to clean other policies if the new policy claims existing users
        const othersCleaned = prev.map(p => {
            const conflictUsers = p.appliedUserIds.filter(uid => newPolicy.appliedUserIds.includes(uid));
            if (conflictUsers.length > 0) {
                return {
                    ...p,
                    appliedUserIds: p.appliedUserIds.filter(uid => !newPolicy.appliedUserIds.includes(uid))
                };
            }
            return p;
        });
        updatedPolicies = [...othersCleaned, newPolicy];
      }
      return updatedPolicies;
    });

    // 2. Cascade Update Users based on Assignments
    // We do this based on the *newPolicy* data primarily, but we also rely on the *updated policies* list logic conceptually.
    // However, since we update state asynchronously, we calculate the logic here.
    
    setUsers(prev => prev.map(u => {
      let assignedPolicyId = u.assignedPolicyId;

      // Logic A: If user is in the NEW policy's explicit list -> Force assign to new policy
      if (newPolicy.appliedUserIds.includes(u.id)) {
         assignedPolicyId = newPolicy.id;
      } 
      // Logic B: If user WAS assigned to this policy ID, but is NO LONGER in the list -> Remove assignment
      else if (u.assignedPolicyId === newPolicy.id && !newPolicy.appliedUserIds.includes(u.id)) {
         assignedPolicyId = undefined; 
      }
      // Logic C: User was assigned to ANOTHER policy, but that policy just lost the user in step 1?
      // Actually, since we update `assignedPolicyId` based on `newPolicy.appliedUserIds.includes(u.id)`,
      // if they are moved, Logic A handles it.
      
      // Re-evaluate effective quota (Visual refresh)
      let effectivePolicy = null;
      if (assignedPolicyId) {
         effectivePolicy = (assignedPolicyId === newPolicy.id) ? newPolicy : policies.find(p => p.id === assignedPolicyId);
         // Note: `policies` here is stale (previous state), but for IDs other than newPolicy, config hasn't changed aside from appliedUserIds list.
         // Since we trust assignedPolicyId ID, it's fine.
      }
      
      if (!effectivePolicy) {
         if (newPolicy.appliedDepartments.includes(u.department)) {
            effectivePolicy = newPolicy;
         } else {
            effectivePolicy = policies.find(p => p.id !== newPolicy.id && p.appliedDepartments.includes(u.department));
         }
      }

      if (!effectivePolicy) {
         if (newPolicy.targetAll) {
            effectivePolicy = newPolicy;
         } else {
            effectivePolicy = policies.find(p => p.id !== newPolicy.id && p.targetAll);
         }
      }

      return { 
        ...u, 
        assignedPolicyId,
        quotas: applyPolicyToQuotas(u.quotas, effectivePolicy || undefined)
      };
    }));

    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const handleDeletePolicy = (id: string) => {
    const isUsed = users.some(u => u.assignedPolicyId === id) || policies.find(p => p.id === id)?.appliedDepartments.length! > 0 || policies.find(p => p.id === id)?.targetAll;
    
    if (isUsed) {
      alert("策略正在被使用（部门默认、特例用户或作为全局策略），请先移除相关关联。");
      return;
    }
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenRoleEdit = (role: RoleDefinition) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (updatedRole: RoleDefinition) => {
    setRoleConfigs(prev => prev.map(r => r.key === updatedRole.key ? updatedRole : r));
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  // Export Functionality
  const handleExportOverview = () => {
    const isApp = overviewDimension === 'app';
    const data = isApp ? MOCK_USAGE_BY_APP : MOCK_USAGE_BY_DEPT;
    
    // Headers
    const headers = isApp 
      ? 'Application Name,Total Calls,Tokens Consumed,Estimated Cost (CNY)\n'
      : 'Department Name,Total Calls,Tokens Consumed,Estimated Cost (CNY)\n';

    // Rows
    const csvContent = data.reduce((acc, row) => {
      return acc + `${row.name},${row.calls},${row.tokens},${row.cost}\n`;
    }, headers);

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_export_${isApp ? 'apps' : 'departments'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Basic Search
      const matchesSearch = user.name.includes(searchQuery) || user.email.includes(searchQuery) || user.department.includes(searchQuery);
      
      // Policy Filter
      let matchesPolicy = true;
      if (filterPolicy === 'special') {
          matchesPolicy = !!user.assignedPolicyId;
      } else if (filterPolicy !== 'all') {
         const activePolicy = getActivePolicyForUser(user);
         matchesPolicy = activePolicy?.id === filterPolicy;
      }

      // Role Filter
      let matchesRole = true;
      if (filterRole !== 'all') {
        matchesRole = user.role === filterRole;
      }

      return matchesSearch && matchesPolicy && matchesRole;
    });
  }, [users, searchQuery, filterPolicy, filterRole, departments, policies]);

  // Helper to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const chartDataForDimension = overviewDimension === 'app' ? MOCK_USAGE_BY_APP : MOCK_USAGE_BY_DEPT;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 p-6 gap-6 overflow-hidden">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl flex flex-col shadow-float py-6 hidden lg:flex flex-shrink-0">
         <div className="px-6 mb-8">
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
               管理后台
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-bold pl-4">ENTERPRISE EDITION</p>
         </div>
         <nav className="flex-1 space-y-1 px-4">
             <button 
               onClick={() => setActiveTab('overview')}
               className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                 activeTab === 'overview' ? 'bg-primary text-slate-900 shadow-glow shadow-primary/30' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
               }`}
             >
               <PieChart size={18} /> 数据概览
             </button>
             <button 
               onClick={() => setActiveTab('users')}
               className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                 activeTab === 'users' ? 'bg-primary text-slate-900 shadow-glow shadow-primary/30' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
               }`}
             >
               <Users size={18} /> 用户管理
             </button>
             <div className="pt-6 mt-6 border-t border-slate-200/50">
                <div className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">系统配置</div>
                <button 
                  onClick={() => setActiveTab('policies')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === 'policies' ? 'bg-primary text-slate-900 shadow-glow shadow-primary/30' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <Sliders size={18} /> 策略配置
                </button>
             </div>
         </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-float flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none -z-10" />

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
           <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                   <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">数据概览</h2>
                   <p className="text-sm font-medium text-slate-500 mt-2">实时监控全平台的 AI 资源使用情况与成本分布。</p>
                </div>
                <div className="flex gap-3 items-center">
                   <button 
                     onClick={handleExportOverview}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                   >
                     <Download size={14} />
                     导出明细
                   </button>
                   <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                     <button 
                       onClick={() => setOverviewDimension('app')} 
                       className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${overviewDimension === 'app' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       按应用
                     </button>
                     <button 
                       onClick={() => setOverviewDimension('department')}
                       className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${overviewDimension === 'department' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       按部门
                     </button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-300 relative overflow-hidden transition-transform hover:-translate-y-1">
                   <Activity className="absolute right-6 top-6 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" size={64} />
                   <div className="relative z-10">
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">总调用次数 (30天)</p>
                      <h3 className="text-4xl font-extrabold tracking-tight">32.2 k</h3>
                      <div className="mt-4 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md text-emerald-300">
                        <ArrowUpDown size={12} className="rotate-45" /> +12.5%
                      </div>
                   </div>
                </div>
                <div className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-indigo-100/50 relative overflow-hidden transition-transform hover:-translate-y-1">
                   <Database className="absolute right-6 top-6 text-indigo-100 group-hover:text-indigo-200 transition-colors duration-500" size={64} />
                   <div className="relative z-10">
                      <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">Token 总消耗</p>
                      <h3 className="text-4xl font-extrabold tracking-tight text-slate-900">15.4 M</h3>
                       <div className="mt-4 text-xs font-bold bg-indigo-50 w-fit px-3 py-1 rounded-full flex items-center gap-1.5 text-indigo-600">
                        <ArrowUpDown size={12} className="rotate-45" /> +8.2%
                      </div>
                   </div>
                </div>
                <div className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-orange-100/50 relative overflow-hidden transition-transform hover:-translate-y-1">
                   <DollarSign className="absolute right-6 top-6 text-orange-100 group-hover:text-orange-200 transition-colors duration-500" size={64} />
                   <div className="relative z-10">
                      <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">预估成本 (CNY)</p>
                      <h3 className="text-4xl font-extrabold tracking-tight text-slate-900">¥ 4,090</h3>
                       <div className="mt-4 text-xs font-bold bg-orange-50 w-fit px-3 py-1 rounded-full flex items-center gap-1.5 text-orange-600">
                        <ArrowUpDown size={12} className="rotate-45" /> +5.4%
                      </div>
                   </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                 {/* Bar Chart */}
                 <div className="bg-white/80 border border-white/50 rounded-3xl p-8 shadow-card">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                       <BarChart2 size={18} className="text-primary" />
                       调用次数与 Token 消耗
                    </h3>
                    <div className="h-72 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataForDimension} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} dy={10} />
                             <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                             <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                             <RechartsTooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px 16px'}}
                                labelStyle={{fontWeight: 'bold', color: '#1e293b', marginBottom: '8px'}}
                             />
                             <Legend wrapperStyle={{paddingTop: '20px'}} />
                             <Bar yAxisId="left" dataKey="calls" name="调用次数" fill="#00d0b0" radius={[6, 6, 6, 6]} barSize={24} />
                             <Bar yAxisId="right" dataKey="tokens" name="Tokens (k)" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={24} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Pie Chart */}
                 <div className="bg-white/80 border border-white/50 rounded-3xl p-8 shadow-card">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                       <PieChart size={18} className="text-orange-500" />
                       成本分布占比
                    </h3>
                    <div className="h-72 w-full flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                             <Pie
                                data={chartDataForDimension}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={8}
                                dataKey="cost"
                                nameKey="name"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                             >
                                {chartDataForDimension.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                             </Pie>
                             <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                             <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                          </RechartsPieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Tab: User Management */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center transition-all border-b border-white/50">
                <div className="flex gap-3 w-full md:w-auto items-center">
                   <div className="relative flex-1 md:w-60 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text"
                        placeholder="搜索用户..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                      />
                   </div>
                   
                   <select 
                     value={filterRole}
                     onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
                     className={`px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 text-sm font-bold focus:outline-none focus:border-primary cursor-pointer hover:border-slate-300 shadow-sm ${filterRole !== 'all' ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : ''}`}
                   >
                     <option value="all">所有角色</option>
                     <option value="super_admin">超级管理员</option>
                     <option value="admin">管理员</option>
                     <option value="creator">创建者</option>
                     <option value="user">普通用户</option>
                   </select>

                   <select 
                     value={filterPolicy}
                     onChange={(e) => setFilterPolicy(e.target.value)}
                     className={`px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 text-sm font-bold focus:outline-none focus:border-primary cursor-pointer hover:border-slate-300 shadow-sm ${filterPolicy === 'special' ? 'text-primary-dark border-primary/30 bg-primary-soft' : ''}`}
                   >
                     <option value="all">所有策略</option>
                     <option value="special" className="font-bold">★ 特例用户 (不跟随部门)</option>
                     {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-x-auto p-6 pt-0">
               <div className="bg-white/80 border border-white/50 rounded-3xl shadow-sm overflow-hidden min-w-[1000px]">
                 <table className="w-full text-left border-collapse table-auto">
                   <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                       <th className="p-5 pl-8 text-xs font-extrabold uppercase tracking-wider">用户</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">角色 & 状态</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">部门 & 策略</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">当前配额健康度 (按模型)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredUsers.map((user) => {
                       const activePolicy = getActivePolicyForUser(user);
                       const isOverride = !!user.assignedPolicyId;
                       const roleInfo = getRoleConfig(user.role);
                       
                       // Calculation Logic for Quota Health
                       let totalUsed = 0;
                       let totalLimit = 0;
                       let hasUnlimited = false;
                       const atLimitApps = user.quotas.filter(q => q.limit !== 'unlimited' && q.used >= q.limit).length;

                       user.quotas.forEach(q => {
                         totalUsed += q.used;
                         if (q.limit === 'unlimited') {
                           hasUnlimited = true;
                         } else {
                           totalLimit += q.limit;
                         }
                       });

                       const percent = totalLimit > 0 ? Math.min(100, (totalUsed / totalLimit) * 100) : 0;
                       
                       return (
                         <tr 
                           key={user.id} 
                           className="hover:bg-slate-50 transition-colors"
                         >
                           <td className="p-5 pl-8 align-middle">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                 {user.name.charAt(0)}
                               </div>
                               <div>
                                 <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                                 <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                               </div>
                             </div>
                           </td>
                           <td className="p-5 align-middle">
                             <div className="flex flex-col items-start gap-1.5">
                               <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${roleInfo.bg} ${roleInfo.color}`}>
                                 {roleInfo.icon} {roleInfo.label}
                               </span>
                               {user.status === 'active' 
                                 ? <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 活跃</span>
                                 : <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 禁用</span>
                               }
                             </div>
                           </td>
                           <td className="p-5 align-middle">
                             <div className="flex flex-col gap-1">
                               <span className="text-sm font-bold text-slate-700">{user.department}</span>
                               <div className="flex items-center gap-2">
                                 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${isOverride ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    <Layers size={10} /> {activePolicy?.name || '无策略'}
                                 </span>
                                 {isOverride && <span className="text-[10px] text-indigo-400 font-bold" title="该用户有特定策略覆盖">(覆盖)</span>}
                               </div>
                             </div>
                           </td>
                           <td className="p-5 align-middle">
                              <div className="w-full max-w-[140px]">
                                 <div className="flex justify-between items-end text-xs mb-1.5">
                                   <span className="font-bold text-slate-700">{formatNumber(totalUsed)}</span>
                                   {hasUnlimited ? <Zap size={10} className="text-primary" fill="currentColor" /> : <span className="text-slate-400 font-medium">/ {formatNumber(totalLimit)}</span>}
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    {hasUnlimited ? (
                                       <div className="h-full w-full bg-primary/40 stripe-bg"></div>
                                    ) : (
                                       <div 
                                         className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                                         style={{ width: `${percent}%` }}
                                       ></div>
                                    )}
                                 </div>
                                 {atLimitApps > 0 && <span className="text-[10px] text-red-500 font-bold mt-1 block">{atLimitApps} 应用超限</span>}
                              </div>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* Tab: Policies */}
        {activeTab === 'policies' && (
           <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex justify-between items-center">
                 <div>
                   <h2 className="text-2xl font-extrabold text-slate-900">策略配置</h2>
                   <p className="text-sm font-medium text-slate-500 mt-1">定义全局配额模板，供部门或特定用户复用。</p>
                 </div>
                 <button onClick={() => handleOpenPolicy()} className="px-5 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5"><Plus size={18} /> 创建新策略</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 pt-0">
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {policies.map(policy => {
                       const deptCount = policy.appliedDepartments.length;
                       const userCount = policy.appliedUserIds.length;
                       
                       return (
                         <div key={policy.id} className="group bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-card-hover transition-all">
                            <div className="flex justify-between items-start mb-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300">
                                    <Layers size={24} />
                                  </div>
                                  <div>
                                    <h3 className="font-extrabold text-slate-900 text-lg">{policy.name}</h3>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                                       {policy.targetAll ? (
                                           <span className="flex items-center gap-1 text-primary-dark"><Globe size={12} /> 全员应用</span>
                                       ) : (
                                          <span className="flex items-center gap-1"><Building2 size={12} /> {deptCount} 部门</span>
                                       )}
                                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                       <span className="flex items-center gap-1"><Users size={12} /> {userCount} 特例用户</span>
                                    </div>
                                  </div>
                                </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleOpenPolicy(policy)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-primary transition-colors"><Edit3 size={18} /></button>
                                 <button onClick={() => handleDeletePolicy(policy.id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                               </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 min-h-[80px]">
                              <p className="text-sm text-slate-500 leading-relaxed font-medium">{policy.description || '暂无描述'}</p>
                            </div>
                            
                            <div className="space-y-3">
                               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">配额详情 (Top 4)</p>
                               <div className="flex flex-wrap gap-2">
                                 {policy.modelQuotas.slice(0, 4).map(q => (
                                   <div key={q.modelId} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                                      <span className="text-slate-400">{MOCK_MODELS.find(m => m.id === q.modelId)?.name}:</span>
                                      <span className={q.limit === 'unlimited' ? 'text-primary' : 'text-slate-900'}>{q.limit === 'unlimited' ? '∞' : q.limit}</span>
                                   </div>
                                 ))}
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        )}

      </main>

      {/* Modals */}
      
      <RoleEditModal 
        role={editingRole}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSave={handleSaveRole}
      />

      <PolicyEditModal 
        policy={editingPolicy}
        departments={departments}
        users={users}
        policies={policies} // Passed policies prop
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onSave={handleSavePolicy}
      />

    </div>
  );
};