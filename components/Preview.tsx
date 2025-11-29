import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { AlertCircle } from 'lucide-react';

interface PreviewProps {
  latex: string;
}

export const Preview: React.FC<PreviewProps> = ({ latex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);

    if (containerRef.current) {
      if (!latex || latex.trim() === '') {
        containerRef.current.innerHTML = '';
        return;
      }

      try {
        containerRef.current.innerHTML = '';
        katex.render(latex, containerRef.current, {
          throwOnError: true,
          displayMode: true,
          output: 'html',
          strict: false,
        });
      } catch (error: any) {
        // Extract a clean error message from KaTeX
        let msg = "Invalid LaTeX syntax";
        if (error && typeof error.message === 'string') {
          msg = error.message.replace("KaTeX parse error: ", "");
        }
        setErrorMessage(msg);
      }
    }
  }, [latex]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border-2 border-red-500 overflow-hidden relative transition-all duration-200 hover:shadow-xl">
      <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-red-100 flex justify-between items-center">
         <label className="text-sm font-bold text-red-700 tracking-wide">OUTPUT FORMULA</label>
         {errorMessage && (
           <span className="text-xs text-red-600 font-medium flex items-center gap-1 animate-pulse">
             <AlertCircle size={12} /> Error
           </span>
         )}
      </div>
      <div className="flex-1 w-full p-8 flex items-center justify-center overflow-auto bg-slate-50/50 relative min-h-[200px]">
        <div 
          ref={containerRef} 
          className={`text-xl md:text-2xl text-slate-800 transition-opacity duration-200 ${errorMessage ? 'opacity-0' : 'opacity-100'}`} 
        />
        
        {(!latex || latex.trim() === '') && !errorMessage && (
            <div className="text-slate-400 text-sm italic absolute pointer-events-none">
                Equation preview will appear here
            </div>
        )}

        {errorMessage && (
           <div className="absolute inset-0 flex items-center justify-center p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white/95 backdrop-blur-sm border border-red-200 rounded-xl p-5 shadow-xl max-w-md w-full">
                  <div className="flex gap-4 items-start">
                      <div className="bg-red-100 p-2 rounded-full shrink-0 text-red-600">
                           <AlertCircle size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-800 mb-1">Rendering Failed</h4>
                          <p className="text-sm text-slate-600 mb-3">We couldn't render this equation. Here is what went wrong:</p>
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs font-mono text-red-700 break-words whitespace-pre-wrap">
                              {errorMessage}
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};