
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { 
  Upload, Crop, ScanLine, Check, Download, 
  RotateCw, ZoomIn, ZoomOut, 
  ArrowRight, Minimize, Lock, Unlock, Move, X
} from 'lucide-react';
import { Point, getDefaultCorners, warpPerspective, resizeImage } from '../utils/perspective';

declare global {
  interface Window { Cropper: any; }
}

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, onClose, onConfirm }) => {
  // Modes: 'upload', 'editor', 'result'
  const [step, setStep] = useState<'upload' | 'editor' | 'result'>('upload');
  // Tabs: 'crop' (Standard), 'scan' (Perspective)
  const [activeTab, setActiveTab] = useState<'crop' | 'scan'>('crop');
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cropper Ref
  const cropperRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Scanner State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  
  // Resize State
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Reset on Close
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setImageSrc(null);
      setProcessedImage(null);
      setPoints([]);
      if(cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; }
    }
  }, [isOpen]);

  // Tab Switching Logic
  useEffect(() => {
    if (step === 'editor' && imageSrc) {
        if (activeTab === 'crop') {
            // Init Cropper
            if (imageRef.current) {
                if (cropperRef.current) cropperRef.current.destroy();
                cropperRef.current = new window.Cropper(imageRef.current, {
                    viewMode: 1, dragMode: 'move', autoCropArea: 0.8,
                    background: false, guides: true,
                });
            }
        } else {
            // Destroy Cropper if moving to Scan
            if (cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; }
            
            // Init Scanner Points if empty
            if (points.length === 0) {
                const img = new Image();
                img.onload = () => {
                    setPoints(getDefaultCorners(img.width, img.height));
                };
                img.src = imageSrc;
            }
        }
    }
  }, [activeTab, step, imageSrc]);

  // --- CAMSCANNER STYLE DRAWING LOGIC ---
  const drawScanner = useCallback((img: HTMLImageElement, currentPoints: Point[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure canvas resolution matches image
      if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
      }

      // 1. Draw Base Image
      ctx.drawImage(img, 0, 0);

      // 2. Draw "Mask" (Dim everything)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Cut out the Quad (Reveal Image)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      ctx.lineTo(currentPoints[1].x, currentPoints[1].y);
      ctx.lineTo(currentPoints[2].x, currentPoints[2].y);
      ctx.lineTo(currentPoints[3].x, currentPoints[3].y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0); // Draw image again inside clip to make it bright

      // 4. Draw Perspective Grid (3x3) inside the clip
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      
      // Interpolation helper
      const lerp = (p1: Point, p2: Point, t: number) => ({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t
      });

      // Draw Grid Lines
      for (let i = 1; i < 3; i++) {
          const t = i / 3;
          // Top to Bottom
          const ptTop = lerp(currentPoints[0], currentPoints[1], t);
          const ptBot = lerp(currentPoints[3], currentPoints[2], t);
          ctx.beginPath(); ctx.moveTo(ptTop.x, ptTop.y); ctx.lineTo(ptBot.x, ptBot.y); ctx.stroke();
          
          // Left to Right
          const ptLeft = lerp(currentPoints[0], currentPoints[3], t);
          const ptRight = lerp(currentPoints[1], currentPoints[2], t);
          ctx.beginPath(); ctx.moveTo(ptLeft.x, ptLeft.y); ctx.lineTo(ptRight.x, ptRight.y); ctx.stroke();
      }
      ctx.restore();

      // 5. Draw Border Lines (Thick Teal)
      ctx.strokeStyle = '#10b981'; // Brand Emerald
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      ctx.lineTo(currentPoints[1].x, currentPoints[1].y);
      ctx.lineTo(currentPoints[2].x, currentPoints[2].y);
      ctx.lineTo(currentPoints[3].x, currentPoints[3].y);
      ctx.closePath();
      ctx.stroke();

      // 6. Draw Corner Handles (Targets)
      currentPoints.forEach((p, i) => {
          // Outer Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fill();

          // Main Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Crosshair hint (optional, kept simple for now)
      });

  }, []);

  // Animate the canvas drawing
  useEffect(() => {
    if (activeTab === 'scan' && imageSrc && points.length === 4) {
        const img = new Image();
        img.onload = () => {
             window.requestAnimationFrame(() => drawScanner(img, points));
        };
        img.src = imageSrc;
    }
  }, [activeTab, points, imageSrc, drawScanner]);

  // Scanner Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTab !== 'scan') return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !canvasRef.current) return;
      
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Hit test radius
      const r = 40 * scaleX; 
      const idx = points.findIndex(p => Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < r);
      if (idx !== -1) setActivePoint(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activePoint === null || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      
      // Clamp to bounds
      const x = Math.max(0, Math.min(canvasRef.current.width, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(canvasRef.current.height, (e.clientY - rect.top) * scaleY));
      
      const newPoints = [...points];
      newPoints[activePoint] = { x, y };
      setPoints(newPoints);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setStep('editor');
            setPoints([]); // Reset points for new image
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const processEditor = async () => {
      setIsProcessing(true);
      // Small delay to allow UI to update
      setTimeout(async () => {
          if (activeTab === 'crop') {
              if (cropperRef.current) {
                 const canvas = cropperRef.current.getCroppedCanvas({ fillColor: '#fff' });
                 setProcessedImage(canvas.toDataURL('image/jpeg'));
                 setupResize(canvas.width, canvas.height);
              }
          } else {
              // Perspective Scan
              if (imageSrc) {
                 const result = await warpPerspective(imageSrc, points);
                 setProcessedImage(result);
                 const img = new Image();
                 img.onload = () => setupResize(img.width, img.height);
                 img.src = result;
              }
          }
          setStep('result');
          setIsProcessing(false);
      }, 50);
  };

  const setupResize = (w: number, h: number) => {
      setResizeW(w);
      setResizeH(h);
      setAspectRatio(w/h);
  };

  const handleResizeChange = (dim: 'w' | 'h', val: number) => {
      if (val < 1) return;
      if (dim === 'w') {
          setResizeW(val);
          if (lockAspectRatio) setResizeH(Math.round(val / aspectRatio));
      } else {
          setResizeH(val);
          if (lockAspectRatio) setResizeW(Math.round(val * aspectRatio));
      }
  };

  const finalize = async (action: 'download' | 'confirm') => {
      if (!processedImage) return;
      setIsProcessing(true);
      
      const finalUrl = await resizeImage(processedImage, resizeW, resizeH);
      
      if (action === 'download') {
          const link = document.createElement('a');
          link.href = finalUrl;
          link.download = "processed-image.jpg";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } else {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          onConfirm(new File([blob], "image.jpg", { type: "image/jpeg" }));
          onClose();
      }
      setIsProcessing(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Studio" className="max-w-5xl w-[95vw]">
      <div className="flex flex-col h-[80vh] md:h-[75vh]">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
             <div className="flex-1 flex flex-col items-center justify-center p-10 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/20 transition-all group"
                  onClick={() => document.getElementById('studio-upload')?.click()}>
                 <div className="bg-emerald-100 dark:bg-emerald-900/50 p-6 rounded-full mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"><Upload size={48}/></div>
                 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Upload Image</h3>
                 <p className="text-slate-400 dark:text-slate-500 mt-2">Crop or Scan Documents</p>
                 <input id="studio-upload" type="file" className="hidden" accept="image/*" onChange={handleFileSelect}/>
             </div>
        )}

        {/* STEP 2: EDITOR (Tabs) */}
        {step === 'editor' && (
           <div className="flex flex-col h-full">
               <div className="flex border-b border-slate-200 dark:border-slate-700 mb-0">
                   <button 
                      onClick={() => setActiveTab('crop')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'crop' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/50' : 'border-transparent text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                   >
                       <Crop size={18}/> Normal Crop
                   </button>
                   <button 
                      onClick={() => setActiveTab('scan')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'scan' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/50' : 'border-transparent text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                   >
                       <ScanLine size={18}/> Perspective Scan
                   </button>
               </div>
               
               <div className="flex-1 bg-slate-900 overflow-hidden relative flex items-center justify-center">
                   {activeTab === 'crop' ? (
                       <img ref={imageRef} src={imageSrc!} alt="Editor" className="max-h-full max-w-full block" />
                   ) : (
                       <div className="w-full h-full overflow-auto flex items-center justify-center relative bg-black">
                           <canvas 
                              ref={canvasRef} 
                              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setActivePoint(null)} onMouseLeave={() => setActivePoint(null)}
                              className="cursor-crosshair max-w-full max-h-full object-contain"
                           />
                           {points.length > 0 && (
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium pointer-events-none flex items-center gap-2 border border-white/20">
                                 <Move size={12} className="text-emerald-400" /> Drag green corners to document edges
                             </div>
                           )}
                       </div>
                   )}
               </div>

               <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                    <Button variant="ghost" onClick={() => { setImageSrc(null); setStep('upload'); }}>Back</Button>
                    <div className="flex gap-2">
                         {activeTab === 'crop' && (
                             <>
                                <Button variant="secondary" onClick={() => cropperRef.current?.rotate(90)} icon={<RotateCw size={16}/>}/>
                                <Button variant="secondary" onClick={() => cropperRef.current?.zoom(0.1)} icon={<ZoomIn size={16}/>}/>
                                <Button variant="secondary" onClick={() => cropperRef.current?.zoom(-0.1)} icon={<ZoomOut size={16}/>}/>
                             </>
                         )}
                         <Button 
                            variant="primary" 
                            onClick={processEditor} 
                            icon={activeTab === 'scan' ? <ScanLine size={18}/> : <ArrowRight size={18}/>}
                            isLoading={isProcessing}
                            className={activeTab === 'scan' ? '!bg-emerald-600 hover:!bg-emerald-700' : ''}
                         >
                             {activeTab === 'scan' ? 'Warp & Flatten' : 'Next'}
                         </Button>
                    </div>
               </div>
           </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && processedImage && (
            <div className="flex flex-col md:flex-row h-full md:overflow-hidden">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4 md:p-8 overflow-auto min-h-[300px]">
                    <img src={processedImage} alt="Result" className="max-w-full max-h-full object-contain shadow-2xl rounded-md border border-slate-200 dark:border-slate-700" />
                </div>
                
                <div className="w-full md:w-80 flex flex-col gap-6 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 p-6 shadow-xl z-10">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-lg mb-1">
                            <Minimize size={20} className="text-emerald-500"/> Finalize
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Review dimension and confirm.</p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dimensions</span>
                            <button onClick={() => setLockAspectRatio(!lockAspectRatio)} className={`text-xs px-2 py-1.5 rounded-md flex gap-1.5 transition-colors font-medium ${lockAspectRatio ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {lockAspectRatio ? <Lock size={12}/> : <Unlock size={12}/>} {lockAspectRatio ? 'Locked' : 'Unlocked'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase">Width (px)</label>
                                 <input type="number" value={resizeW} onChange={(e) => handleResizeChange('w', parseInt(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"/>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase">Height (px)</label>
                                 <input type="number" value={resizeH} onChange={(e) => handleResizeChange('h', parseInt(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"/>
                             </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <Button variant="secondary" onClick={() => finalize('download')} icon={<Download size={18}/>} className="w-full !py-3 !text-base" isLoading={isProcessing}>
                            Download Image
                        </Button>
                        <Button variant="primary" onClick={() => finalize('confirm')} icon={<Check size={18}/>} className="w-full !py-3 !text-base !bg-emerald-600 hover:!bg-emerald-700 shadow-lg shadow-emerald-500/20" isLoading={isProcessing}>
                            Confirm & Use
                        </Button>
                        <button onClick={() => setStep('editor')} className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2">Back to Editor</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};
