
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Plus, X, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react';

interface InputGeneratorProps {
  onGenerate: (text: string, image: File | null) => void;
  onDirectInput?: (text: string) => void;
  isProcessing: boolean;
  externalImage?: File | null;
}

export const InputGenerator: React.FC<InputGeneratorProps> = ({ onGenerate, onDirectInput, isProcessing, externalImage }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle External Image (e.g., from Scanner/Cropper)
  useEffect(() => {
    if (externalImage) {
        setImage(externalImage);
        setImagePreview(URL.createObjectURL(externalImage));
        // Optional: Auto-scroll to view
        fileInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [externalImage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = ''; 
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // 1. Image Paste
    if (e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        return;
      }
    }

    // 2. Direct LaTeX Input
    const text = e.clipboardData.getData('text');
    if (onDirectInput && text) {
        const trimmed = text.trim();
        if (
            trimmed.startsWith('\\') || 
            trimmed.startsWith('$') || 
            trimmed.includes('\\begin{') ||
            (trimmed.includes('=') && trimmed.includes('^'))
        ) {
            onDirectInput(trimmed);
        }
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setPrompt('');
    removeImage();
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  return (
    <div className={`
      flex flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-xl rounded-2xl border border-white/50 dark:border-slate-700
      overflow-hidden transition-all duration-300 hover:shadow-2xl ring-1 ring-black/5 dark:ring-white/5
      ${isDragging ? 'ring-2 ring-brand-400 bg-brand-50/50 dark:bg-brand-900/20' : ''}
    `}>
      {/* Card Header */}
      <div className="px-8 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-slate-800/40">
        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">
          Input Formula
        </label>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium px-2 py-1 bg-white/60 dark:bg-slate-800/60 rounded-md border border-white/50 dark:border-slate-600 flex items-center gap-1">
           <Sparkles size={10} className="text-brand-500"/> AI Powered
        </div>
      </div>

      {/* Input Area */}
      <div 
        className="relative flex-1 p-6"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Clear Button - Shows only when there is content */}
        {(prompt || image) && !isProcessing && (
            <button
                onClick={handleClear}
                className="absolute top-3 right-5 p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
                title="Clear input"
            >
                <Trash2 size={16} />
            </button>
        )}

        <textarea
          className="w-full min-h-[140px] p-0 text-lg text-slate-700 dark:text-slate-200 resize-y focus:outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 font-light leading-relaxed"
          placeholder="Type your formula description (e.g. 'Quadratic Formula') or Paste an image (Ctrl+V)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPaste={handlePaste}
          disabled={isProcessing}
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-4 relative inline-block group animate-in fade-in zoom-in duration-300">
            <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm bg-slate-50/50 dark:bg-slate-800/50 p-1">
              <img src={imagePreview} alt="Preview" className="h-36 w-auto object-contain rounded-lg" />
            </div>
            <button 
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 shadow-md hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                title="Remove image"
            >
                <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 bg-white/30 dark:bg-slate-800/30 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
        <div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-4 py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-slate-700 border border-transparent hover:border-brand-100 active:scale-95 transform duration-150"
            disabled={isProcessing}
          >
            <ImageIcon size={18} />
            <span className="hidden sm:inline">Add Image</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>

        <Button 
          onClick={() => onGenerate(prompt, image)} 
          isLoading={isProcessing} 
          disabled={(!prompt.trim() && !image) || isProcessing}
          icon={<Sparkles size={16} />}
          variant="primary"
          className="!rounded-xl !px-6 !py-2.5 shadow-lg shadow-brand-500/20"
        >
          Generate
        </Button>
      </div>
    </div>
  );
};
