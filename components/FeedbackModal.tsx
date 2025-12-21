import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { AppData } from '../types';

interface FeedbackModalProps {
  app: AppData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ app, isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState('');

  if (!isOpen || !app) return null;

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 transform transition-all">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            反馈：<span className="text-primary-hover">{app.name}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
           <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3">
             您的建议
           </label>
           <textarea
             className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
             placeholder="例如：输出太啰嗦了。能不能增加一个“仅摘要”模式？"
             value={text}
             onChange={(e) => setText(e.target.value)}
             autoFocus
           />
           <p className="mt-3 text-xs text-slate-400 leading-relaxed">
             您的反馈有助于我们提高模型的准确性和易用性。此反馈将匿名记录。
           </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg hover:bg-slate-800 flex items-center gap-2 transition-all transform active:scale-95"
          >
             提交反馈 <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};