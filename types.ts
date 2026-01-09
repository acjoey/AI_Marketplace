

export interface WorkflowInputDef {
  id: string;
  type: 'text' | 'paragraph' | 'file' | 'select';
  label: string;
  required: boolean;
  options?: string[]; // For 'select' type
  accept?: string; // For 'file' type, e.g., '.pdf,.docx'
  placeholder?: string;
}

export interface AppCapabilities {
  fileUpload: boolean;
  welcomeMessage: boolean; // 对话开场白开关
  citations: boolean; // 引用和归属
}

export interface AppData {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  tag: string;
  creator: string; 
  lastUpdater: string; 
  usersCount: string;
  likes: number;
  dislikes: number;
  favs: number;
  feedbacks: number;
  myVote: 'like' | 'dislike' | null;
  isFav: boolean;
  quota: {
    limit: number | 'unlimited';
    used: number;
    unit: string;
  };
  // Lifecycle Status
  status: 'draft' | 'published'; 

  // Mode: Determines interface (Chat vs Form)
  mode?: 'chat' | 'workflow';
  
  // External Integration
  provider?: 'dify' | 'n8n' | 'custom' | 'native'; // Added 'native'
  apiEndpoint?: string;
  
  // Workflow Specific
  workflowInputs?: WorkflowInputDef[];

  // Feature Flags
  capabilities?: AppCapabilities;
  
  // Custom Content
  welcomeMessage?: string; // Custom welcome message content

  // Native Agent Specific
  modelConfig?: {
    modelId: string;
    temperature: number;
    systemPrompt: string;
    enableWebSearch: boolean;
    enableCodeInterpreter: boolean;
    knowledgeBaseIds: string[];
  };
}

export type ViewState = 'marketplace' | 'chat' | 'workflow' | 'admin' | 'create-app' | 'workbench' | 'image-gen';

export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system'; // Added 'system'
  content: string;
  timestamp: number;
  attachments?: { name: string; type: string }[];
}

export interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  active: boolean;
  isPinned?: boolean;
}

export interface WorkflowRunResult {
  id: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: number;
  inputs: Record<string, any>;
  outputText?: string;
  outputFiles?: { name: string; url: string; size: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: number;
}