import React, { useState, useEffect, useMemo } from 'react';
import { LatexEditor } from './components/LatexEditor';
import { InputGenerator } from './components/InputGenerator';
import { Button } from './components/Button';
import { HistoryPanel } from './components/HistoryPanel';
import { Calculator } from './components/Calculator';
import { ImageEditor } from './components/ImageEditor';
import { FocusTimer } from './components/FocusTimer';
import { AboutModal } from './components/AboutModal';
import { ThemeSettings } from './components/ThemeSettings';
import { EquationSolver } from './components/EquationSolver';
import { 
  ClipboardCopy, 
  Download, 
  Wrench, 
  BookOpen,
  Info,
  Calculator as CalculatorIcon,
  Image as ImageIcon,
  Timer,
  Github,
  Linkedin,
  Facebook,
  Palette,
  Sigma
} from 'lucide-react';
import { latexToMathML, copyToWordClipboard, downloadAsDocFile } from './utils/mathUtils';
import { fixBrokenLatex, generateLatexFromDescription, generateLatexFromImage, explainEquation } from './services/geminiService';
import { ToastNotification, HistoryItem } from './types';

const App: React.FC = () => {
  const [latex, setLatex] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  
  // Feature States
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showSolver, setShowSolver] = useState(false);
  const [processedImage, setProcessedImage] = useState<File | null>(null);

  // Theme States
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || 'theme-emerald');

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply Dark Mode
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }

    // Apply Accent Color
    const colors = ['theme-emerald', 'theme-blue', 'theme-violet', 'theme-amber', 'theme-rose'];
    root.classList.remove(...colors);
    root.classList.add(themeColor);
    localStorage.setItem('themeColor', themeColor);
  }, [isDarkMode, themeColor]);

  useEffect(() => {
    const saved = localStorage.getItem('mathHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error("Failed to parse history"); }
    }
  }, []);

  const addToHistory = (prompt: string, resultLatex: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      latex: resultLatex,
      timestamp: Date.now()
    };
    const updated = [newItem, ...history].slice(0, 5); 
    setHistory(updated);
    localStorage.setItem('mathHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('mathHistory');
    showToast("History cleared", "info");
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setLatex(item.latex);
    showToast("Restored from history", "info");
    document.getElementById('latex-editor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- SAFE MATHML GENERATION (Prevents Crash) ---
  const mathML = useMemo(() => {
    try {
      if (!latex) return "";
      return latexToMathML(latex);
    } catch (error) {
      console.warn("MathML generation failed temporarily", error);
      return ""; // Returns empty string instead of crashing
    }
  }, [latex]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ id: Date.now().toString(), message, type });
  };

  // --- HELPER TO CLEAN API OUTPUT ---
  const cleanLatexOutput = (text: string) => {
    // Removes ```latex and ``` markers that cause crashes
    return text.replace(/```latex/gi, '').replace(/```/g, '').trim();
  };

  const handleGenerate = async (prompt: string, image: File | null) => {
    if (!prompt.trim() && !image) return;
    
    try {
      setIsProcessing(true);
      setLatex(""); // Reset state to prevent conflict
      let generated = "";

      if (image) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
             try {
               const base64String = reader.result as string;
               const base64Data = base64String.split(',')[1];
               const mimeType = image.type;
               generated = await generateLatexFromImage(base64Data, mimeType, prompt);
               resolve();
             } catch(e) { reject(e); }
          };
          reader.onerror = reject;
        });
      } else {
        generated = await generateLatexFromDescription(prompt);
      }

      // Clean the output before setting state
      const safeLatex = cleanLatexOutput(generated);
      
      setLatex(safeLatex);
      addToHistory(prompt || "Image Generation", safeLatex);
      showToast("Formula Generated Successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to generate formula.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToWord = async () => {
    if (!latex.trim()) return;
    try {
      setIsProcessing(true);
      if (!mathML) throw new Error("Failed to convert to MathML");
      await copyToWordClipboard(mathML, latex);
      showToast("Copied! Paste directly into Word.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to copy. Try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!latex.trim()) return;
    try {
      downloadAsDocFile(mathML, 'MyEquation');
      showToast("Download started.", "success");
    } catch (error) {
      showToast("Download failed.", "error");
    }
  };

  const handleAiFix = async () => {
    if (!latex.trim()) return;
    try {
      setIsProcessing(true);
      const result = await fixBrokenLatex(latex);
      const safeLatex = cleanLatexOutput(result.latex);
      setLatex(safeLatex);
      showToast("Fixed LaTeX code!", "success");
      setExplanation(result.explanation);
    } catch (error) {
      showToast("Failed to fix LaTeX via AI.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExplain = async () => {
      if(!latex.trim()) return;
      try {
          setIsProcessing(true);
          const text = await explainEquation(latex);
          setExplanation(text);
      } catch(e) {
          showToast("Could not explain.", "error");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDirectInput = (text: string) => {
     setLatex(text);
     addToHistory("Direct Input", text);
     showToast("LaTeX detected and loaded!", "info");
  };

  const handleImageStudioConfirm = (file: File) => {
      setProcessedImage(file);
      showToast("Image ready for processing!", "success");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden transition-colors duration-500 bg-fixed">
      
      {/* HEADER */}
      <header className="py-4 px-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-40 border-b border-white/40 dark:border-slate-700/50 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          <div 
            className="flex items-center space-x-3 group cursor-pointer" 
            onClick={() => window.location.reload()}
            title="Reload App"
          >
            <div className="h-10 w-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              Σ
            </div>
            <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-100 tracking-tight group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
              LaTeX to Word
            </h1>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button 
                onClick={() => setShowImageStudio(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
                <ImageIcon size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
                <span className="hidden sm:inline">Image Studio</span>
            </button>
            <button 
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
                <CalculatorIcon size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
                <span className="hidden sm:inline">Calculator</span>
            </button>
             <button 
                onClick={() => setShowSolver(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
                <Sigma size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
                <span className="hidden sm:inline">Solver</span>
            </button>
            <button 
                onClick={() => setShowTimer(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
                <Timer size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
                <span className="hidden sm:inline">Timer</span>
            </button>
             <button 
                onClick={() => setShowThemeSettings(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-3 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                title="Theme Settings"
            >
                <Palette size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </button>
             <button 
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-brand-100 dark:border-slate-700 px-3 py-2 rounded-xl text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                title="About"
            >
                <Info size={18} className="group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 relative z-10">
        
        {/* INPUT SECTION */}
        <section className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <InputGenerator 
            onGenerate={handleGenerate} 
            onDirectInput={handleDirectInput}
            isProcessing={isProcessing}
            externalImage={processedImage}
          />
        </section>

        {/* OUTPUT SECTION */}
        <section id="latex-editor-section" className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <LatexEditor 
            value={latex} 
            onChange={setLatex} 
            isProcessing={isProcessing}
            title="GENERATED FORMULA"
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                  onClick={handleCopyToWord} 
                  icon={<ClipboardCopy size={20} />}
                  disabled={!latex.trim()}
                  isLoading={isProcessing}
                  variant="primary"
                  className="w-full sm:w-auto !py-3 !px-8 !text-base !rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transform transition-all duration-200 hover:-translate-y-0.5"
              >
                Copy for Word
              </Button>
              <Button 
                  variant="secondary" 
                  onClick={handleDownload} 
                  icon={<Download size={20} />}
                  disabled={!latex.trim()}
                  className="w-full sm:w-auto !py-3 !px-8 !text-base !rounded-xl border-white/60 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 backdrop-blur-sm"
              >
                Download .doc
              </Button>
              
               <div className="flex-1 hidden sm:block"></div>

              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                  <Button 
                      variant="ghost" 
                      onClick={handleAiFix} 
                      icon={<Wrench size={18} />}
                      isLoading={isProcessing}
                      title="Fix broken LaTeX"
                      disabled={!latex.trim()}
                      className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-slate-800"
                  >
                  Fix
                  </Button>
                  <Button 
                      variant="ghost"
                      onClick={handleExplain}
                      icon={<BookOpen size={18} />}
                      title="Explain this equation"
                      disabled={!latex.trim()}
                      className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-slate-800"
                  >
                      Explain
                  </Button>
              </div>
          </div>
        </section>

        {/* HISTORY SECTION */}
        <section className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <HistoryPanel 
            history={history} 
            onSelect={restoreHistoryItem} 
            onClear={clearHistory}
          />
        </section>

        {/* INSIGHT CARD */}
        {explanation && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Info size={18} className="text-brand-500" /> 
                        Equation Insight
                    </h3>
                    <button onClick={() => setExplanation(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{explanation}</p>
            </div>
        )}

      </main>

      {/* FOOTER - Animated Social Links */}
      <footer className="py-10 mt-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-t border-white/40 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
           <div className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">
              Developed by <span className="text-slate-700 dark:text-slate-200 font-bold">Abu Abdullah Akash</span>
           </div>
           
           <div className="flex items-center gap-6">
              <a 
                href="https://github.com/abuabdullahakash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-110 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800"
                title="GitHub"
              >
                  <Github size={24} />
              </a>
              <a 
                href="https://www.linkedin.com/in/akash-wpexpert/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#0077b5] transition-all duration-300 hover:scale-110 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800"
                title="LinkedIn"
              >
                  <Linkedin size={24} />
              </a>
              <a 
                href="https://www.facebook.com/share/1BcWM4FSCK/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#1877F2] transition-all duration-300 hover:scale-110 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800"
                title="Facebook"
              >
                  <Facebook size={24} />
              </a>
           </div>
           
           <div className="text-xs text-slate-300 dark:text-slate-600">
              © {new Date().getFullYear()} LaTeX to Word Bridge. All rights reserved.
           </div>
        </div>
      </footer>

      {/* MODALS */}
      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
      
      <EquationSolver isOpen={showSolver} onClose={() => setShowSolver(false)} />

      <ImageEditor 
        isOpen={showImageStudio} 
        onClose={() => setShowImageStudio(false)}
        onConfirm={handleImageStudioConfirm}
      />

      <FocusTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
      />

      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
      
      <ThemeSettings 
        isOpen={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
        currentTheme={themeColor}
        onThemeChange={setThemeColor}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* TOASTS */}
      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-white text-sm font-semibold flex items-center space-x-3 animate-in slide-in-from-bottom-5 duration-300 z-50 ${
          notification.type === 'success' ? 'bg-brand-600' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-slate-800 dark:bg-slate-700'
        }`}>
            {notification.type === 'success' && <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>}
            <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
