
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Delete, Equal, Settings2, Calculator as CalcIcon } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState(false);
  const [layout, setLayout] = useState<'standard' | 'math'>('standard');

  const handlePress = (val: string) => {
    setError(false);
    setDisplay(prev => prev + val);
  };

  const handleClear = () => {
    setDisplay('');
    setResult('');
    setError(false);
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      if (!display) return;

      // Sanitize and Replace visual tokens with JS Math functions
      let expression = display
        // Constants
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/∞/g, 'Infinity')
        // Functions
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        // Power operator replacement (JS uses **)
        .replace(/\^/g, '**')
        // Logic Operators
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=')
        .replace(/≠/g, '!==')
        .replace(/=/g, '==='); // Logic check

      // Strict validation: allow only safe characters
      // numbers, operators, brackets, whitespace, Math.functions, comparisons
      // Note: Variables (alpha, x, y) will fail this check or eval, which is intended for a numeric calculator
      if (!/^[\d\.\+\-\*\/\(\)\sMathPIEInfinity\.\,\w<>=!]+$/.test(expression)) {
          throw new Error("Invalid/Symbolic");
      }

      // Safe Evaluation
      // eslint-disable-next-line no-new-func
      const evalResult = new Function('return ' + expression)();
      
      if (typeof evalResult === 'boolean') {
          setResult(evalResult.toString());
      } else if (!isFinite(evalResult) || isNaN(evalResult)) {
          setResult("Error");
          setError(true);
      } else {
          // Format result to avoid long decimals (max 10 precision)
          const formatted = parseFloat(evalResult.toPrecision(10)).toString(); 
          setResult(formatted);
      }
    } catch (e) {
      setResult('Error');
      setError(true);
    }
  };

  // Styles matching Glassmorphism with Dark Mode support
  const btnClass = "h-11 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all shadow-sm active:scale-95 flex items-center justify-center text-sm select-none backdrop-blur-sm";
  const opClass = "h-11 rounded-lg font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-all shadow-sm active:scale-95 flex items-center justify-center select-none backdrop-blur-sm";
  const fnClass = "h-11 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm active:scale-95 flex items-center justify-center text-xs select-none backdrop-blur-sm";
  const varClass = "h-11 rounded-lg font-serif italic font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all shadow-sm active:scale-95 flex items-center justify-center text-sm select-none backdrop-blur-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scientific Calculator" className="max-w-sm">
      <div className="p-6">
        
        {/* Layout Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg mb-5 border border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setLayout('standard')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${layout === 'standard' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <CalcIcon size={14} /> Standard
            </button>
            <button 
                onClick={() => setLayout('math')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${layout === 'math' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Settings2 size={14} /> Math Keys
            </button>
        </div>

        {/* Display Screen */}
        <div className={`bg-slate-50 dark:bg-slate-950 border ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-slate-300 dark:border-slate-700'} rounded-xl p-4 mb-5 text-right shadow-inner min-h-[100px] flex flex-col justify-center transition-colors`}>
            <div className="text-slate-500 dark:text-slate-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap h-6 tracking-wide font-mono">
                {display || '0'}
            </div>
            <div className={`text-3xl font-bold ${error ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'} overflow-hidden text-ellipsis whitespace-nowrap font-mono mt-1`}>
                {result || (display ? '=' : '')}
            </div>
        </div>

        {/* Standard Layout */}
        {layout === 'standard' && (
            <div className="grid grid-cols-5 gap-2.5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Row 1: Clear & Delete */}
            <button onClick={handleClear} className={`${btnClass} col-span-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40`}>AC</button>
            <button onClick={handleBackspace} className={`${btnClass} col-span-2`}><Delete size={18} /></button>
            <button onClick={() => handlePress('/')} className={opClass}>÷</button>

            {/* Row 2: Trig + Brackets */}
            <button onClick={() => handlePress('sin(')} className={fnClass}>sin</button>
            <button onClick={() => handlePress('cos(')} className={fnClass}>cos</button>
            <button onClick={() => handlePress('tan(')} className={fnClass}>tan</button>
            <button onClick={() => handlePress('(')} className={fnClass}>(</button>
            <button onClick={() => handlePress(')')} className={fnClass}>)</button>

            {/* Row 3: Roots/Logs + Multiply */}
            <button onClick={() => handlePress('sqrt(')} className={fnClass}>√</button>
            <button onClick={() => handlePress('^')} className={fnClass}>^</button>
            <button onClick={() => handlePress('log(')} className={fnClass}>log</button>
            <button onClick={() => handlePress('ln(')} className={fnClass}>ln</button>
            <button onClick={() => handlePress('*')} className={opClass}>×</button>

            {/* Row 4: Numbers + Minus */}
            <button onClick={() => handlePress('7')} className={btnClass}>7</button>
            <button onClick={() => handlePress('8')} className={btnClass}>8</button>
            <button onClick={() => handlePress('9')} className={btnClass}>9</button>
            <button onClick={() => handlePress('π')} className={fnClass}>π</button>
            <button onClick={() => handlePress('-')} className={opClass}>-</button>

            {/* Row 5: Numbers + Plus */}
            <button onClick={() => handlePress('4')} className={btnClass}>4</button>
            <button onClick={() => handlePress('5')} className={btnClass}>5</button>
            <button onClick={() => handlePress('6')} className={btnClass}>6</button>
            <button onClick={() => handlePress('e')} className={fnClass}>e</button>
            <button onClick={() => handlePress('+')} className={opClass}>+</button>

            {/* Row 6: Numbers + Equals */}
            <button onClick={() => handlePress('1')} className={btnClass}>1</button>
            <button onClick={() => handlePress('2')} className={btnClass}>2</button>
            <button onClick={() => handlePress('3')} className={btnClass}>3</button>
            <div className="row-span-2">
                <button onClick={handleCalculate} className={`${opClass} h-full w-full bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 border-transparent hover:text-white shadow-md hover:shadow-lg`}>
                    <Equal size={24} />
                </button>
            </div>
            <button onClick={() => handlePress('0')} className={`${btnClass} col-span-2`}>0</button>
            <button onClick={() => handlePress('.')} className={btnClass}>.</button>
            </div>
        )}

        {/* Math Keyboard Layout */}
        {layout === 'math' && (
            <div className="grid grid-cols-5 gap-2.5 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Row 1: Greek Letters */}
                <button onClick={() => handlePress('α')} className={varClass}>α</button>
                <button onClick={() => handlePress('β')} className={varClass}>β</button>
                <button onClick={() => handlePress('γ')} className={varClass}>γ</button>
                <button onClick={() => handlePress('θ')} className={varClass}>θ</button>
                <button onClick={() => handlePress('Δ')} className={varClass}>Δ</button>
                
                {/* Row 2: Variables & Constants */}
                <button onClick={() => handlePress('x')} className={varClass}>x</button>
                <button onClick={() => handlePress('y')} className={varClass}>y</button>
                <button onClick={() => handlePress('z')} className={varClass}>z</button>
                <button onClick={() => handlePress('π')} className={fnClass}>π</button>
                <button onClick={() => handlePress('∞')} className={fnClass}>∞</button>

                {/* Row 3: Logic Operators */}
                <button onClick={() => handlePress('<')} className={fnClass}>&lt;</button>
                <button onClick={() => handlePress('>')} className={fnClass}>&gt;</button>
                <button onClick={() => handlePress('≤')} className={fnClass}>≤</button>
                <button onClick={() => handlePress('≥')} className={fnClass}>≥</button>
                <button onClick={() => handlePress('≠')} className={fnClass}>≠</button>

                {/* Row 4: Math Ops */}
                <button onClick={() => handlePress('^')} className={opClass}>^</button>
                <button onClick={() => handlePress('sqrt(')} className={opClass}>√</button>
                <button onClick={() => handlePress('(')} className={opClass}>(</button>
                <button onClick={() => handlePress(')')} className={opClass}>)</button>
                <button onClick={handleBackspace} className={`${btnClass} bg-red-50 text-red-500 border-red-100`}><Delete size={18}/></button>

                {/* Row 5: Numpad Short */}
                <button onClick={() => handlePress('7')} className={btnClass}>7</button>
                <button onClick={() => handlePress('8')} className={btnClass}>8</button>
                <button onClick={() => handlePress('9')} className={btnClass}>9</button>
                <button onClick={() => handlePress('+')} className={opClass}>+</button>
                <button onClick={() => handlePress('-')} className={opClass}>-</button>
                
                 {/* Row 6: Numpad Short */}
                <button onClick={() => handlePress('4')} className={btnClass}>4</button>
                <button onClick={() => handlePress('5')} className={btnClass}>5</button>
                <button onClick={() => handlePress('6')} className={btnClass}>6</button>
                <button onClick={() => handlePress('*')} className={opClass}>×</button>
                <button onClick={() => handlePress('/')} className={opClass}>÷</button>

                 {/* Row 7: Bottom */}
                <button onClick={() => handlePress('1')} className={btnClass}>1</button>
                <button onClick={() => handlePress('2')} className={btnClass}>2</button>
                <button onClick={() => handlePress('3')} className={btnClass}>3</button>
                <button onClick={() => handlePress('0')} className={btnClass}>0</button>
                <button onClick={handleCalculate} className={`${opClass} bg-emerald-500 text-white`}><Equal size={20}/></button>
            </div>
        )}
      </div>
    </Modal>
  );
};
