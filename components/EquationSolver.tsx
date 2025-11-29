
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Calculator, ArrowRight, AlertCircle, X } from 'lucide-react';
import katex from 'katex';

declare global {
  interface Window {
    nerdamer: any;
  }
}

interface EquationSolverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EquationSolver: React.FC<EquationSolverProps> = ({ isOpen, onClose }) => {
  const [equation, setEquation] = useState('');
  const [variable, setVariable] = useState('x');
  const [resultLatex, setResultLatex] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);

  // Clear state when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResultLatex(null);
    }
  }, [isOpen]);

  // Render LaTeX when result changes
  useEffect(() => {
    if (resultLatex && resultRef.current) {
      try {
        katex.render(resultLatex, resultRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (e) {
        console.error("KaTeX render error", e);
      }
    }
  }, [resultLatex]);

  const handleSolve = () => {
    if (!equation.trim()) return;
    setError(null);
    setResultLatex(null);

    try {
      if (!window.nerdamer) {
        throw new Error("Solver engine not loaded.");
      }

      // Solve the equation
      const sol = window.nerdamer.solve(equation, variable);
      
      // Convert to LaTeX
      // The result might be a list of solutions
      const latex = sol.toTeX();
      
      setResultLatex(`${variable} = ${latex}`);
    } catch (e: any) {
      console.error(e);
      setError("Could not solve equation. Please check the syntax.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Algebraic Solver" className="max-w-md">
      <div className="p-6 space-y-6">
        
        {/* Info Box */}
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 rounded-xl p-4 flex gap-3">
          <div className="bg-brand-100 dark:bg-brand-900/50 p-2 rounded-full h-fit text-brand-600 dark:text-brand-400">
             <Calculator size={18} />
          </div>
          <div className="text-sm text-brand-800 dark:text-brand-200">
             <p className="font-bold mb-1">Symbolic Solver</p>
             <p className="opacity-90 leading-relaxed">Enter an algebraic equation to find its roots step-by-step. Supports polynomials, simple trig, and more.</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Equation</label>
                <input 
                    type="text" 
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    placeholder="e.g. x^2 + 5x + 6 = 0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-mono"
                />
            </div>
            
            <div className="flex items-end gap-3">
                <div className="w-24 shrink-0">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Variable</label>
                    <input 
                        type="text" 
                        value={variable}
                        onChange={(e) => setVariable(e.target.value)}
                        placeholder="x"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-mono text-center"
                    />
                </div>
                <Button 
                    variant="primary" 
                    onClick={handleSolve} 
                    className="flex-1 !h-[50px] !rounded-xl text-base"
                    disabled={!equation.trim()}
                    icon={<ArrowRight size={18} />}
                >
                    Solve
                </Button>
            </div>
        </div>

        {/* Error */}
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-800/30">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {/* Result Area */}
        {resultLatex && (
            <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                 <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase block">Solution</label>
                 <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex items-center justify-center min-h-[100px] overflow-x-auto">
                      <div ref={resultRef} className="text-lg text-slate-800 dark:text-slate-100"></div>
                 </div>
            </div>
        )}

      </div>
    </Modal>
  );
};
