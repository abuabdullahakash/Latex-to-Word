
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700 w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${className}`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-0 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
