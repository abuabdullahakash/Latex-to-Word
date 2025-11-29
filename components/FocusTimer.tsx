
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Play, Pause, RotateCcw, Coffee, Zap, Brain } from 'lucide-react';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODES = {
  focus: { label: 'Focus', minutes: 25, icon: Zap, color: 'emerald' },
  short: { label: 'Short', minutes: 5, icon: Coffee, color: 'indigo' },
  long: { label: 'Long', minutes: 15, icon: Brain, color: 'blue' }
};

export const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  
  const originalTitle = useRef(document.title);
  
  // Calculate total time for progress bar
  const totalTime = MODES[mode].minutes * 60;
  const progressPercent = Math.max(0, (timeLeft / totalTime) * 100);

  // Sound Effect helper
  const playAlert = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playAlert();
      document.title = "⏰ Time's Up!";
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Sync Title
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const { m, s } = formatTime(timeLeft);
      document.title = `(${m}:${s}) Focus Timer`;
    } else if (!isActive && timeLeft > 0) {
       document.title = originalTitle.current;
    }
    return () => { document.title = originalTitle.current; };
  }, [timeLeft, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return { m, s };
  };

  const setPreset = (type: 'focus' | 'short' | 'long') => {
    setIsActive(false);
    setMode(type);
    setTimeLeft(MODES[type].minutes * 60);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
    document.title = originalTitle.current;
  };

  const { m, s } = formatTime(timeLeft);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Focus Timer" className="max-w-sm">
      <div className="p-6 flex flex-col items-center">
        
        {/* Digital Clock Display */}
        <div className={`relative mb-8 w-full transition-all duration-500 rounded-2xl overflow-hidden ${isActive ? 'shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-105' : 'shadow-none'}`}>
            <div className={`text-7xl font-mono font-bold tracking-tighter flex items-center justify-center px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border transition-colors duration-300 ${isActive ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100'}`}>
                <span className="drop-shadow-sm">{m}</span>
                <span className={`mx-1 text-emerald-500 ${isActive ? 'animate-pulse' : 'opacity-50'}`}>:</span>
                <span className="drop-shadow-sm">{s}</span>
            </div>
            
            {/* Status Badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm px-3 py-0.5 rounded-full border border-slate-100 dark:border-slate-600 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-300 shadow-sm transition-all duration-300">
                {isActive ? 'Running' : 'Paused'}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-700">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${progressPercent}%` }} 
                />
            </div>
        </div>

        {/* Presets */}
        <div className="flex gap-3 mb-8 w-full">
            {(Object.keys(MODES) as Array<keyof typeof MODES>).map((key) => {
                const isSelected = mode === key;
                const { label, minutes, icon: Icon } = MODES[key];
                
                // Dynamic colors based on selection
                let activeClass = "";
                if (key === 'focus') activeClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400";
                if (key === 'short') activeClass = "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400";
                if (key === 'long') activeClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400";

                return (
                    <button 
                        key={key}
                        onClick={() => setPreset(key)}
                        className={`flex-1 flex flex-col items-center py-3 rounded-xl border transition-all duration-300 transform ${isSelected ? `${activeClass} scale-105 shadow-md` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750 hover:-translate-y-1'}`}
                    >
                        <Icon size={18} className={`mb-1.5 ${isSelected ? 'animate-bounce' : ''}`}/>
                        <span className="text-xs font-bold">{label}</span>
                        <span className="text-[10px] opacity-70">{minutes}m</span>
                    </button>
                );
            })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full">
            <Button 
                onClick={toggleTimer} 
                variant={isActive ? 'secondary' : 'primary'} 
                className={`flex-1 !h-12 !text-lg !rounded-xl transition-all duration-300 ${isActive ? '' : '!bg-emerald-600 hover:!bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5'}`}
            >
                {isActive ? <><Pause size={20} className="mr-2"/> Pause</> : <><Play size={20} className="mr-2"/> Start</>}
            </Button>
            <button 
                onClick={resetTimer}
                className="h-12 w-12 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:rotate-90"
                title="Reset"
            >
                <RotateCcw size={20} />
            </button>
        </div>

      </div>
    </Modal>
  );
};
