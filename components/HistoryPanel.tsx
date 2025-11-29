
import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, ArrowRight, FileText, Image as ImageIcon } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
        <div className="flex justify-between items-center mb-5 px-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} /> Recent Generations
            </h3>
            <button 
                onClick={onClear} 
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            >
                <Trash2 size={12} /> Clear History
            </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {history.map((item) => {
                const isImage = item.prompt.toLowerCase().includes('image') || item.prompt === 'Image Generation';
                return (
                  <button
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="text-left bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:bg-white/90 dark:hover:bg-slate-800 hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-300 group ring-1 ring-black/5 dark:ring-white/5 flex flex-col h-full transform hover:-translate-y-1"
                  >
                      <div className="flex justify-between items-start mb-3 w-full">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isImage ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800'}`}>
                               {isImage ? <ImageIcon size={10} /> : <FileText size={10} />}
                               {isImage ? 'Image' : 'Text'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                               {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                      
                      <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm line-clamp-1 mb-2 w-full">
                          {item.prompt || "Input"}
                      </div>
                      
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50/80 dark:bg-black/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 w-full break-all mb-2">
                          {item.latex}
                      </div>

                      <div className="mt-auto flex justify-end">
                          <span className="text-xs text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                              LOAD <ArrowRight size={12} />
                          </span>
                      </div>
                  </button>
                );
            })}
        </div>
    </div>
  );
};
