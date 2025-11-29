
import React from 'react';
import { Modal } from './Modal';
import { Moon, Sun, Check } from 'lucide-react';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ 
  isOpen, 
  onClose, 
  currentTheme, 
  onThemeChange, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  
  const themes = [
    { id: 'theme-emerald', name: 'Emerald', color: 'bg-emerald-500' },
    { id: 'theme-blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'theme-violet', name: 'Violet', color: 'bg-violet-500' },
    { id: 'theme-amber', name: 'Amber', color: 'bg-amber-500' },
    { id: 'theme-rose', name: 'Rose', color: 'bg-rose-500' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appearance" className="max-w-sm">
      <div className="p-6 space-y-6">
        
        {/* Mode Toggle */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Display Mode</label>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => !isDarkMode && onToggleDarkMode()}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isDarkMode ? 'border-brand-500 bg-brand-50/10 text-brand-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                >
                    <Moon size={20} /> Dark
                </button>
                <button 
                    onClick={() => isDarkMode && onToggleDarkMode()}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${!isDarkMode ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                >
                    <Sun size={20} /> Light
                </button>
            </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Accent Color</label>
            <div className="grid grid-cols-5 gap-3">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={`group relative h-10 w-10 rounded-full ${t.color} flex items-center justify-center shadow-sm transition-transform active:scale-95 ${currentTheme === t.id ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                        title={t.name}
                    >
                        {currentTheme === t.id && <Check size={16} className="text-white drop-shadow-md" />}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="pt-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
                Customizing your workspace...
            </p>
        </div>
      </div>
    </Modal>
  );
};
