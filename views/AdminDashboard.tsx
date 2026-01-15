
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Download, CheckCircle,
  Search, PieChart,
  Layers, Activity,
  Sliders, Trash2, 
  BarChart2, DollarSign, Database, ArrowUpDown, 
  Cpu, Globe, UserCog, Edit3, X, Building2, Plus, Check, AlertTriangle, Shield, Crown, Wand2, Zap,
  ChevronRight, ChevronDown, FolderTree, Calculator, Info
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
  limit?: number | 'unlimited'; 
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
  assignedPolicyIds?: string[]; 
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
  children?: Department[]; 
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
    icon: <Crown size={14} />,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200 ring-amber-100',
    description: '拥有系统最高权限。',
    permissions: []
  },
  {
    key: 'admin',
    label: '管理员',
    icon: <Shield size={14} />,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200 ring-indigo-100',
    description: '负责运营管理。',
    permissions: []
  },
  {
    key: 'creator',
    label: '创建者',
    icon: <Wand2 size={14} />,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200 ring-purple-100',
    description: '具有 AI 应用开发权限。',
    permissions: []
  },
  {
    key: 'user',
    label: '普通用户',
    icon: <Users size={14} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200 ring-slate-100',
    description: '最终使用者。',
    permissions: []
  }
];

// Department Data with Hierarchy
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
  { id: 'd5', name: 'IT部', memberCount: 3 },
];

const INITIAL_POLICIES: Policy[] = [
  {
    id: 'p_std',
    name: '全员基础策略',
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
    name: '研发高频策略',
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
  },
  {
    id: 'p_vip',
    name: 'VIP 通道',
    description: '特定项目所需的额外配额叠加。',
    modelQuotas: [
      { modelId: 'gpt-4', limit: 2000 }, 
      { modelId: 'gpt-3.5', limit: 'unlimited' }
    ],
    targetAll: false,
    appliedDepartments: [],
    appliedUserIds: ['u1', 'u3']
  }
];

const INITIAL_USERS: User[] = [
  { 
    id: 'u0', name: 'Admin Root', email: 'root@corp.com', department: 'IT部', role: 'super_admin', status: 'active', lastActive: '刚刚',
    quotas: MOCK_APPS_REF.map(a => ({ appId: a.id, appName: a.name, used: 0, unit: '次/月', modelId: a.modelId }))
  },
  { 
    id: 'u1', name: '张三', email: 'zhangsan@corp.com', department: '企微产品线', role: 'creator', status: 'active', lastActive: '2分钟前',
    assignedPolicyIds: ['p_dev', 'p_vip'], 
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 2340, unit: '次/月', modelId: 'gpt-4' },
      { appId: 'weekly', appName: '周报助手', used: 4, unit: '次/月', modelId: 'gpt-3.5' },
    ]
  },
  { 
    id: 'u2', name: '李四', email: 'lisi@corp.com', department: '后端组', role: 'admin', status: 'active', lastActive: '10分钟前',
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 420, unit: '次/月', modelId: 'gpt-4' }, // Modified: High usage but within p_dev limit (500)
    ]
  },
  { 
    id: 'u3', name: '王五', email: 'wangwu@corp.com', department: '市场部', role: 'user', status: 'active', lastActive: '2小时前',
    assignedPolicyIds: ['p_vip'],
    quotas: [
      { appId: 'gpt', appName: 'General GPT', used: 1980, unit: '次/月', modelId: 'gpt-4' }, // Modified: Very close to p_vip limit (2000) -> Warning state
    ]
  },
  {
    id: 'u4', name: '赵六', email: 'zhaoliu@corp.com', department: '前端组', role: 'user', status: 'active', lastActive: '1天前',
    quotas: []
  },
  {
    id: 'u5', name: '孙七', email: 'sunqi@corp.com', department: 'SaaS产品线', role: 'user', status: 'active', lastActive: '3天前',
    quotas: []
  }
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

// Helper: Check if a department is or is a child of target department
const isDepartmentOrChild = (currentDept: string, targetDept: string, allDepts: Department[]): boolean => {
    if (currentDept === targetDept) return true;
    
    // Find the target department node
    const findDeptNode = (depts: Department[], name: string): Department | null => {
        for (const d of depts) {
            if (d.name === name) return d;
            if (d.children) {
                const found = findDeptNode(d.children, name);
                if (found) return found;
            }
        }
        return null;
    };

    const targetNode = findDeptNode(allDepts, targetDept);
    if (!targetNode || !targetNode.children) return false;

    // Check if currentDept is in targetNode's children recursively
    const isChild = (depts: Department[], name: string): boolean => {
        for (const d of depts) {
            if (d.name === name) return true;
            if (d.children && isChild(d.children, name)) return true;
        }
        return false;
    };

    return isChild(targetNode.children, currentDept);
};

// Helper: Get all policies applicable to a user
const getApplicablePoliciesForUser = (user: User, allPolicies: Policy[], allDepts: Department[]): Policy[] => {
  return allPolicies.filter(p => {
    // 1. Direct Assignment (High Priority)
    if (user.assignedPolicyIds?.includes(p.id)) return true;
    if (p.appliedUserIds.includes(user.id)) return true; 
    
    // 2. Department Assignment (Include Hierarchy)
    if (p.appliedDepartments.some(deptName => isDepartmentOrChild(user.department, deptName, allDepts))) return true;
    
    // 3. Global Target
    if (p.targetAll) return true;
    
    return false;
  });
};

// Helper: Calculate effective limit
const getEffectiveModelLimit = (modelId: string, policies: Policy[]): number | 'unlimited' => {
  let maxLimit: number = 0;
  let hasUnlimited = false;

  policies.forEach(p => {
    const quota = p.modelQuotas.find(mq => mq.modelId === modelId);
    if (quota) {
      if (quota.limit === 'unlimited') {
        hasUnlimited = true;
      } else {
        if (quota.limit > maxLimit) maxLimit = quota.limit;
      }
    }
  });

  return hasUnlimited ? 'unlimited' : maxLimit;
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

// 2. Department Selector Modal 
const DepartmentSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  selectedDepartments: string[];
  onConfirm: (selected: string[]) => void;
}> = ({ isOpen, onClose, departments, selectedDepartments, onConfirm }) => {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  useEffect(() => { if (isOpen) setTempSelected(selectedDepartments); }, [isOpen, selectedDepartments]);
  if (!isOpen) return null;
  const toggleSelection = (deptName: string) => {
    setTempSelected(prev => prev.includes(deptName) ? prev.filter(n => n !== deptName) : [...prev, deptName]);
  };
  const RecursiveDeptItem: React.FC<{ dept: Department; level: number }> = ({ dept, level }) => {
     const isSelected = tempSelected.includes(dept.name);
     const [isExpanded, setIsExpanded] = useState(true);
     const hasChildren = dept.children && dept.children.length > 0;
     return (
        <div className="select-none relative">
           {level > 0 && <div className="absolute border-l-2 border-slate-100 h-full" style={{ left: `${(level) * 20 + 7}px`, top: 0 }} />}
           <div className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group relative z-10`} style={{ paddingLeft: `${level * 20 + 8}px` }} onClick={() => toggleSelection(dept.name)}>
              {hasChildren ? (<button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-0.5 rounded hover:bg-slate-200 text-slate-400">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>) : (<div className="w-4 h-4"></div>)}
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>{isSelected && <Check size={12} className="text-white" strokeWidth={3} />}</div>
              <div className="flex items-center gap-2"><Building2 size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} /><span className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{dept.name}</span></div>
           </div>
           {hasChildren && isExpanded && <div>{dept.children!.map(child => (<RecursiveDeptItem key={child.id} dept={child} level={level + 1} />))}</div>}
        </div>
     );
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80"><h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><FolderTree size={18} className="text-indigo-600" />选择应用部门</h3><button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-full text-slate-400"><X size={18} /></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">{departments.map(dept => (<RecursiveDeptItem key={dept.id} dept={dept} level={0} />))}</div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button><button onClick={() => onConfirm(tempSelected)} className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">确认 ({tempSelected.length})</button></div>
      </div>
    </div>
  );
};

// 3. User Selector Modal
const UserSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  users: User[];
  selectedUserIds: string[];
  onConfirm: (selected: string[]) => void;
}> = ({ isOpen, onClose, departments, users, selectedUserIds, onConfirm }) => {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => { if (isOpen) { setTempSelected(selectedUserIds); setSearchQuery(''); } }, [isOpen, selectedUserIds]);
  if (!isOpen) return null;
  const toggleUser = (userId: string) => { setTempSelected(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]); };
  const RecursiveUserTree: React.FC<{ dept: Department; level: number }> = ({ dept, level }) => {
     const deptUsers = users.filter(u => u.department === dept.name);
     const filteredDeptUsers = deptUsers.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
     const hasChildren = dept.children && dept.children.length > 0;
     const [isExpanded, setIsExpanded] = useState(true);
     if (filteredDeptUsers.length === 0 && !hasChildren && searchQuery) return null;
     return (
        <div className="select-none relative">
            {level > 0 && <div className="absolute border-l-2 border-slate-100 h-full" style={{ left: `${(level) * 20 + 7}px`, top: 0 }} />}
           <div className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group relative z-10`} style={{ paddingLeft: `${level * 20 + 8}px` }} onClick={() => setIsExpanded(!isExpanded)}>
              {(hasChildren || filteredDeptUsers.length > 0) ? (<button className="p-0.5 rounded hover:bg-slate-200 text-slate-400">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>) : <div className="w-4 h-4"></div>}
              <div className="flex items-center gap-2 text-slate-600"><Building2 size={16} /><span className="text-sm font-bold">{dept.name}</span>{filteredDeptUsers.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">{filteredDeptUsers.length}</span>}</div>
           </div>
           {isExpanded && (<div>{filteredDeptUsers.map(user => { const isSelected = tempSelected.includes(user.id); return ( <div key={user.id} onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }} className={`flex items-center justify-between p-2 rounded-xl mb-1 cursor-pointer transition-all border relative z-10 ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`} style={{ marginLeft: `${(level + 1) * 20 + 20}px`, marginRight: '8px' }}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-50'}`}>{user.name.charAt(0)}</div><div><div className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{user.name}</div><div className="text-[10px] text-slate-400 leading-none font-medium">{user.email}</div></div></div><div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={12} className="text-white" strokeWidth={3} />}</div></div> ); })}{dept.children?.map(child => (<RecursiveUserTree key={child.id} dept={child} level={level + 1} />))}</div>)}
        </div>
     );
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[650px] ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 space-y-3"><div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-indigo-600" />选择特例用户</h3><button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-full text-slate-400"><X size={18} /></button></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all shadow-sm" placeholder="搜索用户姓名或邮箱..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">{departments.map(dept => (<RecursiveUserTree key={dept.id} dept={dept} level={0} />))}</div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button><button onClick={() => onConfirm(tempSelected)} className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">确认选择 ({tempSelected.length})</button></div>
      </div>
    </div>
  );
};

// 4. Policy Edit Modal
const PolicyEditModal: React.FC<{
  policy: Policy | null;
  departments: Department[];
  users: User[];
  policies: Policy[]; 
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: Policy) => void;
}> = ({ policy, departments, users, policies, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Policy>({ id: '', name: '', description: '', modelQuotas: [], appliedDepartments: [], appliedUserIds: [], targetAll: false });
  const [activeTab, setActiveTab] = useState<'basics' | 'assignments'>('basics');
  const [isDeptSelectorOpen, setIsDeptSelectorOpen] = useState(false);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  useEffect(() => {
    if (policy) { setFormData({ ...policy }); } 
    else { setFormData({ id: Date.now().toString(), name: '', description: '', modelQuotas: MOCK_MODELS.map(m => ({ modelId: m.id, limit: 100 })), targetAll: false, appliedDepartments: [], appliedUserIds: [] }); }
  }, [policy, isOpen]);
  if (!isOpen) return null;
  const handleQuotaChange = (modelId: string, limitStr: string) => { const newQuotas = [...formData.modelQuotas]; const index = newQuotas.findIndex(q => q.modelId === modelId); const newLimit = limitStr === 'unlimited' ? 'unlimited' : parseInt(limitStr) || 0; if (index >= 0) { newQuotas[index] = { ...newQuotas[index], limit: newLimit }; } else { newQuotas.push({ modelId, limit: newLimit }); } setFormData({ ...formData, modelQuotas: newQuotas }); };
  const removeDepartment = (deptName: string) => { setFormData({ ...formData, appliedDepartments: formData.appliedDepartments.filter(d => d !== deptName) }); };
  const toggleUser = (userId: string) => { setFormData({ ...formData, appliedUserIds: formData.appliedUserIds.includes(userId) ? formData.appliedUserIds.filter(id => id !== userId) : [...formData.appliedUserIds, userId] }); };
  
  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><div><h3 className="text-lg font-bold text-slate-900">{policy ? '编辑策略' : '创建新策略'}</h3><p className="text-sm text-slate-500 mt-0.5">定义模型配额及应用范围</p></div><button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
        <div className="flex border-b border-slate-100 px-6"><button onClick={() => setActiveTab('basics')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'basics' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>配额配置</button><button onClick={() => setActiveTab('assignments')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>应用范围</button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'basics' && (
            <>
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">策略基础</h4>
                <div><label className="block text-xs font-bold text-slate-600 mb-2">策略名称</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如：研发部专用策略" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-2">描述</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="简述该策略适用的场景..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none h-20 transition-all" /></div>
              </div>
              <div className="space-y-4 pt-2 border-t border-slate-100"><div className="flex items-center justify-between"><h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">模型额度限制 (月度)</h4></div><div className="space-y-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100">{MOCK_MODELS.map(model => { const quota = formData.modelQuotas.find(q => q.modelId === model.id); const limit = quota ? quota.limit : 0; const isUnlimited = limit === 'unlimited'; return ( <div key={model.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500"><Cpu size={14} /></div><div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{model.name}</span><span className="text-[10px] text-slate-400 font-medium">{model.provider}</span></div></div><div className="flex items-center gap-2"><div className="relative w-28"><input type="text" disabled={isUnlimited} value={isUnlimited ? '' : limit} onChange={(e) => handleQuotaChange(model.id, e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-right outline-none transition-all ${isUnlimited ? 'bg-slate-50 text-slate-400' : 'bg-white border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10'}`} placeholder={isUnlimited ? "∞" : "0"} />{!isUnlimited && <span className="absolute right-8 top-2.5 text-[10px] text-slate-400 pointer-events-none">次</span>}</div><button onClick={() => handleQuotaChange(model.id, isUnlimited ? '500' : 'unlimited')} className={`p-2 rounded-lg border transition-all ${isUnlimited ? 'bg-primary text-slate-900 border-primary shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'}`} title={isUnlimited ? "设为有限" : "设为无限"}><Activity size={16} /></button></div></div> ); })}</div></div>
            </>
          )}
          {activeTab === 'assignments' && (
             <div className="space-y-6">
               <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.targetAll ? 'border-primary bg-primary-soft text-primary-dark' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`} onClick={() => setFormData({...formData, targetAll: !formData.targetAll})}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.targetAll ? 'bg-white/50' : 'bg-slate-100'}`}><Globe size={20} className={formData.targetAll ? 'text-primary' : 'text-slate-400'} /></div><div><h4 className="text-sm font-bold">全员应用 (Global Scope)</h4><p className={`text-xs mt-0.5 ${formData.targetAll ? 'text-primary-dark/80' : 'text-slate-400'}`}>作为默认策略应用于所有未被特定规则覆盖的用户</p></div></div>{formData.targetAll ? (<div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></div>) : (<div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>)}</div>
               <div className={`space-y-3 transition-opacity ${formData.targetAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}><div className="flex justify-between items-end"><h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">应用部门 (部门级默认)</h4><button onClick={() => setIsDeptSelectorOpen(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1 transition-colors"><Plus size={14} /> 添加部门</button></div><div className="min-h-[100px] p-3 border border-slate-200 rounded-xl bg-slate-50/30">{formData.appliedDepartments.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-300 py-4"><FolderTree size={24} className="mb-2 opacity-50" /><span className="text-xs font-bold">暂无选择部门</span></div>) : (<div className="space-y-1">{formData.appliedDepartments.map(d => <div key={d} className="flex justify-between p-2 bg-white rounded border border-slate-200"><span>{d}</span><button onClick={() => removeDepartment(d)}><Trash2 size={14}/></button></div>)}</div>)}</div></div>
               <div className="w-full h-px bg-slate-100"></div>
               <div className="space-y-3"><div className="flex justify-between items-end"><div><h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">特例用户 (叠加策略)</h4><p className="text-[10px] text-slate-400 mt-1">注意：选中用户将叠加此策略的配额（取最大值），支持一人多策略。</p></div><button onClick={() => setIsUserSelectorOpen(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1 transition-colors"><Plus size={14} /> 添加用户</button></div><div className="min-h-[100px] p-3 border border-slate-200 rounded-xl bg-slate-50/30">{formData.appliedUserIds.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-300 py-4"><Users size={24} className="mb-2 opacity-50" /><span className="text-xs font-bold">暂无特例用户</span></div>) : (<div className="space-y-1">{formData.appliedUserIds.map(uid => <div key={uid} className="flex justify-between p-2 bg-white rounded border border-slate-200"><span>{users.find(u => u.id === uid)?.name}</span><button onClick={() => toggleUser(uid)}><Trash2 size={14}/></button></div>)}</div>)}</div></div>
             </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"><button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button><button onClick={() => onSave(formData)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl transition-all">保存策略</button></div>
      </div>
    </div>
    <DepartmentSelectorModal isOpen={isDeptSelectorOpen} onClose={() => setIsDeptSelectorOpen(false)} departments={departments} selectedDepartments={formData.appliedDepartments} onConfirm={(s) => { setFormData({...formData, appliedDepartments: s}); setIsDeptSelectorOpen(false); }} />
    <UserSelectorModal isOpen={isUserSelectorOpen} onClose={() => setIsUserSelectorOpen(false)} departments={departments} users={users} selectedUserIds={formData.appliedUserIds} onConfirm={(s) => { setFormData({...formData, appliedUserIds: s}); setIsUserSelectorOpen(false); }} />
    </>
  );
};

// 5. User Edit Modal
const UserEditModal: React.FC<{
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  policies: Policy[];
  roleConfigs: RoleDefinition[];
  allDepts: Department[]; // Added prop
}> = ({ user, isOpen, onClose, onSave, policies, roleConfigs, allDepts }) => {
  const [formData, setFormData] = useState<User | null>(null);

  useEffect(() => {
    if (user) setFormData({ ...user });
  }, [user]);

  if (!isOpen || !formData) return null;

  // Calculate current effective quotas for preview
  const activePolicies = getApplicablePoliciesForUser(formData, policies, allDepts);
  const effectiveQuotas = MOCK_MODELS.map(model => ({
      ...model,
      limit: getEffectiveModelLimit(model.id, activePolicies)
  }));

  // Calculate aggregated usage per model
  const getModelUsage = (modelId: string) => {
    if (!formData || !formData.quotas) return 0;
    return formData.quotas
      .filter(q => q.modelId === modelId)
      .reduce((sum, q) => sum + q.used, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">
         <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 border border-slate-300">
                  {formData.name.charAt(0)}
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900">{formData.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{formData.email}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* 1. Role Setting */}
            <div>
               <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield size={14} /> 角色权限配置
               </h4>
               <div className="grid grid-cols-2 gap-3">
                  {roleConfigs.map(role => (
                     <div 
                       key={role.key}
                       onClick={() => setFormData({ ...formData, role: role.key })}
                       className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${formData.role === role.key ? `bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200` : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                     >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.bg} ${role.color}`}>
                           {role.icon}
                        </div>
                        <div>
                           <div className={`text-sm font-bold ${formData.role === role.key ? 'text-indigo-900' : 'text-slate-700'}`}>{role.label}</div>
                           <div className="text-[10px] text-slate-400 leading-tight mt-0.5">基础权限</div>
                        </div>
                        {formData.role === role.key && <CheckCircle size={16} className="ml-auto text-indigo-600" />}
                     </div>
                  ))}
               </div>
            </div>

            {/* 2. Policy Assignment (Read-Only) */}
            <div>
               <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <Layers size={14} /> 关联配额策略 (多选)
                  </h4>
               </div>
               
               <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                  {activePolicies.length > 0 ? activePolicies.map(policy => {
                     // Check inheritance source for badge label
                     let badgeType = 'default';
                     let badgeLabel = '';
                     
                     if (formData.assignedPolicyIds?.includes(policy.id) || policy.appliedUserIds.includes(formData.id)) {
                        badgeType = 'direct';
                        badgeLabel = '特例';
                     } else if (policy.appliedDepartments.some(d => isDepartmentOrChild(formData.department, d, allDepts))) {
                        badgeType = 'dept';
                        badgeLabel = '继承';
                     } else if (policy.targetAll) {
                        badgeType = 'global';
                        badgeLabel = '全员';
                     }

                     return (
                        <div 
                           key={policy.id}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                               badgeType === 'direct' ? 'bg-white text-indigo-600 border-indigo-200' : 
                               'bg-white text-slate-600 border-slate-200'
                           }`}
                        >
                           {badgeType === 'direct' && <Check size={12} strokeWidth={3} className="text-indigo-600" />}
                           {badgeType !== 'direct' && <Check size={12} strokeWidth={3} className="text-slate-400" />}
                           {policy.name}
                           <span className={`text-[9px] px-1.5 py-0.5 rounded ml-1 font-extrabold ${
                               badgeType === 'direct' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                           }`}>
                               {badgeLabel}
                           </span>
                        </div>
                     );
                  }) : (
                      <span className="text-xs text-slate-400 font-medium pl-1 italic">暂无生效策略</span>
                  )}
               </div>
               <div className="mt-2 flex gap-1 text-[10px] text-slate-400 px-1">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <span>策略由系统根据用户部门或全局规则自动分配，或由管理员在策略配置中指定特例。此处仅做展示。</span>
               </div>
            </div>

            {/* 3. Effective Quota Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                     <Calculator size={14} /> 额度与使用量 (本月)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">实时计算</span>
               </div>
               
               <div className="grid grid-cols-10 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 px-2">
                  <div className="col-span-4">模型服务</div>
                  <div className="col-span-3 text-right">已使用</div>
                  <div className="col-span-3 text-right">策略限额</div>
               </div>

               <div className="space-y-1">
                  {effectiveQuotas.map(model => {
                      const used = getModelUsage(model.id);
                      const limit = model.limit;
                      const isUnlimited = limit === 'unlimited';
                      
                      return (
                          <div key={model.id} className="grid grid-cols-10 gap-2 items-center text-sm py-2 px-2 border-b border-slate-200/50 last:border-0 bg-white rounded-lg shadow-sm">
                             <div className="col-span-4 font-bold text-slate-700 truncate" title={model.name}>{model.name}</div>
                             <div className="col-span-3 text-right font-medium text-slate-500">
                                {used >= 1000 ? (used/1000).toFixed(1) + 'k' : used}
                             </div>
                             <div className={`col-span-3 text-right font-bold ${isUnlimited ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {isUnlimited ? '∞' : (limit as number) >= 1000 ? ((limit as number)/1000).toFixed(1) + 'k' : limit}
                             </div>
                          </div>
                      );
                  })}
               </div>
            </div>
         </div>

         <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={() => onSave(formData)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl transition-all">确认保存</button>
         </div>
      </div>
    </div>
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

  // User Editing State
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Multi-Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBatchRoleModalOpen, setIsBatchRoleModalOpen] = useState(false); // Can reuse standard logic or add simple
  const [batchRoleTarget, setBatchRoleTarget] = useState<UserRole>('user');

  // Helper: Get active policies for display/filtering logic
  const getUserActivePolicies = (user: User) => {
    return getApplicablePoliciesForUser(user, policies, departments);
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
    setPolicies(prev => {
      const exists = prev.find(p => p.id === newPolicy.id);
      if (exists) {
        return prev.map(p => p.id === newPolicy.id ? newPolicy : p);
      } else {
        return [...prev, newPolicy];
      }
    });

    setUsers(prev => prev.map(u => {
      const inNewPolicy = newPolicy.appliedUserIds.includes(u.id);
      let newAssignedIds = u.assignedPolicyIds || [];
      if (inNewPolicy) {
         if (!newAssignedIds.includes(newPolicy.id)) {
            newAssignedIds = [...newAssignedIds, newPolicy.id];
         }
      } else {
         newAssignedIds = newAssignedIds.filter(id => id !== newPolicy.id);
      }
      return { ...u, assignedPolicyIds: newAssignedIds };
    }));

    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const handleDeletePolicy = (id: string) => {
    const isUsed = policies.find(p => p.id === id)?.appliedDepartments.length! > 0 || policies.find(p => p.id === id)?.targetAll;
    if (isUsed) {
      alert("策略正在作为部门默认或全局策略使用，请先移除相关关联。");
      return;
    }
    setPolicies(prev => prev.filter(p => p.id !== id));
    setUsers(prev => prev.map(u => ({
        ...u,
        assignedPolicyIds: u.assignedPolicyIds?.filter(pid => pid !== id)
    })));
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

  // User Management Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
       setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
       setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
       prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserEditModalOpen(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setIsUserEditModalOpen(false);
    setEditingUser(null);
  };

  const handleBatchRoleUpdate = (role: UserRole) => {
     setUsers(prev => prev.map(u => 
        selectedUserIds.includes(u.id) ? { ...u, role: role } : u
     ));
     setSelectedUserIds([]); // Clear selection after action
  };

  // Export Functionality
  const handleExportOverview = () => {
    const isApp = overviewDimension === 'app';
    const data = isApp ? MOCK_USAGE_BY_APP : MOCK_USAGE_BY_DEPT;
    const headers = isApp 
      ? 'Application Name,Total Calls,Tokens Consumed,Estimated Cost (CNY)\n'
      : 'Department Name,Total Calls,Tokens Consumed,Estimated Cost (CNY)\n';
    const csvContent = data.reduce((acc, row) => {
      return acc + `${row.name},${row.calls},${row.tokens},${row.cost}\n`;
    }, headers);
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
      const matchesSearch = user.name.includes(searchQuery) || user.email.includes(searchQuery) || user.department.includes(searchQuery);
      let matchesPolicy = true;
      if (filterPolicy === 'special') {
          matchesPolicy = (user.assignedPolicyIds?.length || 0) > 0;
      } else if (filterPolicy !== 'all') {
         const activePolicies = getApplicablePoliciesForUser(user, policies, departments);
         matchesPolicy = activePolicies.some(p => p.id === filterPolicy);
      }
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
      <aside className="w-64 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl flex flex-col shadow-float py-6 hidden lg:flex flex-shrink-0 ring-1 ring-slate-900/5">
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
      <main className="flex-1 bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-float flex flex-col overflow-hidden relative ring-1 ring-slate-900/5">
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
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Toolbar */}
            <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center transition-all border-b border-white/50 bg-white/40 backdrop-blur-sm z-10">
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
               <div className="bg-white/80 border border-white/60 rounded-3xl shadow-sm overflow-hidden min-w-[1000px] ring-1 ring-slate-900/5 mt-4">
                 <table className="w-full text-left border-collapse table-auto">
                   <thead>
                     <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-400 backdrop-blur-sm">
                       <th className="p-5 pl-6 w-12">
                          <label className="flex items-center justify-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                               onChange={handleSelectAll}
                               className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" 
                             />
                          </label>
                       </th>
                       <th className="p-5 pl-2 text-xs font-extrabold uppercase tracking-wider">用户</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">角色 & 状态</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">部门 & 策略组合</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider">当前生效配额 (策略略最大值)</th>
                       <th className="p-5 text-xs font-extrabold uppercase tracking-wider text-right pr-6">操作</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100/50">
                     {filteredUsers.map((user) => {
                       const activePolicies = getApplicablePoliciesForUser(user, policies, departments);
                       const roleInfo = getRoleConfig(user.role);
                       
                       // Calculation Logic for Quota Health based on Effective Limits
                       let totalUsed = 0;
                       let totalLimit = 0;
                       let hasUnlimited = false;
                       let atLimitApps = 0;

                       user.quotas.forEach(q => {
                         const effectiveLimit = getEffectiveModelLimit(q.modelId, activePolicies);
                         totalUsed += q.used;
                         if (effectiveLimit === 'unlimited') {
                           hasUnlimited = true;
                         } else {
                           totalLimit += effectiveLimit;
                           if (q.used >= effectiveLimit) atLimitApps++;
                         }
                       });

                       const percent = (hasUnlimited || totalLimit === 0) ? (hasUnlimited ? 5 : 0) : Math.min(100, (totalUsed / totalLimit) * 100);
                       const isCritical = atLimitApps > 0;
                       const isWarning = !hasUnlimited && percent > 85;

                       let statusConfig = {
                         label: '状态正常',
                         className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                         barColor: 'bg-emerald-500'
                       };

                       if (hasUnlimited) {
                          statusConfig = { label: '无限畅用', className: 'bg-indigo-50 text-indigo-600 border-indigo-200', barColor: 'bg-indigo-500' };
                       } else if (isCritical) {
                         statusConfig = { label: '已超额', className: 'bg-red-50 text-red-600 border-red-200', barColor: 'bg-red-500' };
                       } else if (isWarning) {
                         statusConfig = { label: '额度异常', className: 'bg-orange-50 text-orange-600 border-orange-200', barColor: 'bg-orange-500' };
                       }
                       
                       const isSelected = selectedUserIds.includes(user.id);

                       return (
                         <tr 
                           key={user.id} 
                           className={`transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                           onClick={() => handleSelectUser(user.id)}
                         >
                           <td className="p-5 pl-6 align-middle" onClick={e => e.stopPropagation()}>
                               <label className="flex items-center justify-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleSelectUser(user.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" 
                                  />
                               </label>
                           </td>
                           <td className="p-5 pl-2 align-middle">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shadow-sm">
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
                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${roleInfo.bg} ${roleInfo.color}`}>
                                 {roleInfo.icon} {roleInfo.label}
                               </span>
                               {user.status === 'active' 
                                 ? <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 活跃</span>
                                 : <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 禁用</span>
                               }
                             </div>
                           </td>
                           <td className="p-5 align-middle">
                             <div className="flex flex-col gap-2">
                               <span className="text-sm font-bold text-slate-800">{user.department}</span>
                               <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                                 {activePolicies.length > 0 ? activePolicies.map(p => {
                                    const isDirect = p.appliedUserIds.includes(user.id) || user.assignedPolicyIds?.includes(p.id);
                                    const isDeptInherited = p.appliedDepartments.some(d => isDepartmentOrChild(user.department, d, departments));
                                    
                                    // Visual differentiation for source of policy
                                    let badgeStyle = "bg-slate-50 text-slate-500 border-slate-200 ring-slate-100";
                                    let icon = <Layers size={10} />;
                                    
                                    if (isDirect) {
                                        badgeStyle = "bg-indigo-50 text-indigo-600 border-indigo-200 ring-indigo-100"; // Specific assignment
                                        icon = <Zap size={10} />;
                                    } else if (p.id === 'p_dev') { // Example logic for R&D policy visual
                                        badgeStyle = "bg-blue-50 text-blue-600 border-blue-200 ring-blue-100";
                                    } else if (p.id === 'p_vip') {
                                        badgeStyle = "bg-amber-50 text-amber-600 border-amber-200 ring-amber-100";
                                        icon = <Crown size={10} />;
                                    }

                                    return (
                                       <span 
                                         key={p.id} 
                                         className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ring-1 ring-inset ${badgeStyle}`}
                                         title={isDirect ? "特例分配 (叠加)" : isDeptInherited ? "部门继承" : "全局默认"}
                                       >
                                          {icon}
                                          {p.name}
                                       </span>
                                    );
                                 }) : (
                                    <span className="text-[10px] text-slate-400 font-medium italic">无策略</span>
                                 )}
                               </div>
                             </div>
                           </td>
                           <td className="p-5 align-middle">
                              <div className="w-full max-w-[200px]">
                                 <div className="flex items-center justify-between mb-2">
                                     <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ring-1 ring-inset uppercase tracking-wide ${statusConfig.className}`}>
                                         {statusConfig.label}
                                     </span>
                                     <div className="text-xs font-bold text-slate-700">
                                         {formatNumber(totalUsed)} <span className="text-slate-400 font-medium">/ {hasUnlimited ? '∞' : formatNumber(totalLimit)}</span>
                                     </div>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/50">
                                    {hasUnlimited ? (
                                       <div className={`h-full w-full stripe-bg opacity-30 ${statusConfig.barColor}`}></div>
                                    ) : (
                                       <div className={`h-full rounded-full transition-all duration-500 ${statusConfig.barColor}`} style={{ width: `${percent}%` }}></div>
                                    )}
                                 </div>
                              </div>
                           </td>
                           <td className="p-5 align-middle text-right pr-6">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                 <Edit3 size={16} />
                              </button>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
            
            {/* Batch Action Bar */}
            {selectedUserIds.length > 0 && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-6 z-20 ring-1 ring-white/10">
                   <div className="flex items-center gap-2 text-sm font-bold border-r border-white/20 pr-6">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-slate-900 text-xs">{selectedUserIds.length}</div>
                      已选择用户
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">批量操作:</span>
                      <button 
                         onClick={() => setIsBatchRoleModalOpen(true)}
                         className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                      >
                         <UserCog size={14} /> 修改角色
                      </button>
                   </div>
                   <button onClick={() => setSelectedUserIds([])} className="ml-2 text-slate-400 hover:text-white"><X size={16} /></button>
               </div>
            )}
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
                         <div key={policy.id} className="group bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-card-hover transition-all ring-1 ring-slate-900/5">
                            <div className="flex justify-between items-start mb-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                    <Layers size={24} />
                                  </div>
                                  <div>
                                    <h3 className="font-extrabold text-slate-900 text-lg">{policy.name}</h3>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                                       {policy.targetAll ? (<span className="flex items-center gap-1 text-primary-dark"><Globe size={12} /> 全员应用</span>) : (<span className="flex items-center gap-1"><Building2 size={12} /> {deptCount} 部门</span>)}
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

      {/* Single User Edit Modal */}
      <UserEditModal 
        user={editingUser}
        isOpen={isUserEditModalOpen}
        onClose={() => setIsUserEditModalOpen(false)}
        onSave={handleSaveUser}
        policies={policies}
        roleConfigs={roleConfigs}
        allDepts={departments} // Pass departments for hierarchy check
      />

      {/* Simple Batch Role Modal */}
      {isBatchRoleModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 ring-1 ring-black/5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">批量修改角色</h3>
                <p className="text-sm text-slate-500 mb-4">将为选中的 <span className="font-bold text-slate-800">{selectedUserIds.length}</span> 名用户设置新角色：</p>
                <div className="space-y-2 mb-6">
                   {roleConfigs.map(role => (
                      <div 
                        key={role.key} 
                        onClick={() => setBatchRoleTarget(role.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${batchRoleTarget === role.key ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                      >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.bg} ${role.color}`}>{role.icon}</div>
                         <span className={`text-sm font-bold ${batchRoleTarget === role.key ? 'text-indigo-900' : 'text-slate-700'}`}>{role.label}</span>
                         {batchRoleTarget === role.key && <CheckCircle size={16} className="ml-auto text-indigo-600" />}
                      </div>
                   ))}
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setIsBatchRoleModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">取消</button>
                   <button 
                     onClick={() => { handleBatchRoleUpdate(batchRoleTarget); setIsBatchRoleModalOpen(false); }}
                     className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:bg-slate-800"
                   >
                      确认修改
                   </button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
};
