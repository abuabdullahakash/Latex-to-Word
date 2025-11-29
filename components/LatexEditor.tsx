
import React from 'react';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  isProcessing?: boolean;
  title?: string;
}

export const LatexEditor: React.FC<LatexEditorProps> = ({ 
  value, 
  onChange, 
  isProcessing, 
  title = "GENERATED FORMULA"
}) => {
  return (
    <div className="flex flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-xl rounded-2xl border border-white/50 dark:border-slate-700 overflow-hidden transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5 hover:shadow-2xl">
      <div className="bg-white/40 dark:bg-slate-800/40 px-8 py-5 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">
          {title}
        </label>
      </div>
      
      <div className="relative flex-1 group min-h-[180px] bg-slate-50/30 dark:bg-black/20">
        <textarea
          className="w-full h-full p-8 font-mono text-base text-slate-700 dark:text-slate-200 leading-relaxed resize-none focus:outline-none focus:bg-white/50 dark:focus:bg-slate-800/50 transition-colors bg-transparent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isProcessing}
          placeholder="Generated LaTeX code will appear here..."
          spellCheck={false}
        />
        <div className="absolute bottom-4 right-6 text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none group-focus-within:text-brand-500 transition-colors">
          Supports amsmath
        </div>
      </div>
    </div>
  );
};
