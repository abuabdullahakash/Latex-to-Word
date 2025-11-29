
import React from 'react';
import { Modal } from './Modal';
import { CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About" className="max-w-md">
      <div className="p-6 text-center space-y-6">
        <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-tr from-emerald-600 to-green-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-emerald-500/30">
              Σ
            </div>
        </div>
        
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">LaTeX to Word Bridge</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Version 1.0.0</p>
        </div>

        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            A powerful web-based tool designed to bridge the gap between LaTeX typesetting and Microsoft Word. 
            Convert complex equations, fix broken LaTeX code, and generate formulas from text or images using advanced AI.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left space-y-3 border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Key Features</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/> AI-Powered Generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/> Image to LaTeX (OCR)</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/> Instant Word-Ready Copy</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/> Smart Document Scanner</li>
            </ul>
        </div>
        
        <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
            &copy; {new Date().getFullYear()} Abu Abdullah Akash. All rights reserved.
        </div>
      </div>
    </Modal>
  );
};
