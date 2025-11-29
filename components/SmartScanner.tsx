
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Upload, ScanLine, Check, Download, ArrowRight, Move, Minimize, Lock, Unlock } from 'lucide-react';
import { Point, getDefaultCorners, warpPerspective, resizeImage } from '../utils/perspective';

interface SmartScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export const SmartScanner: React.FC<SmartScannerProps> = ({ isOpen, onClose, onConfirm }) => {
  const [step, setStep] = useState<'upload' | 'crop' | 'result'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [warpedImage, setWarpedImage] = useState<string | null>(null);
  
  // Resizing state
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setImageSrc(null);
      setWarpedImage(null);
    }
  }, [isOpen]);

  // Load image for canvas drawing
  useEffect(() => {
    if (imageSrc && step === 'crop') {
      const img = new Image();
      img.onload = () => {
        imageObjRef.current = img;
        // Initialize points
        setPoints(getDefaultCorners(img.width, img.height));
        draw();
      };
      img.src = imageSrc;
    }
  }, [imageSrc, step]);

  // Draw loop
  const draw = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas sizing (fit within modal)
    const containerW = Math.min(window.innerWidth * 0.8, 600);
    const scale = containerW / img.width;
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw Image
    ctx.drawImage(img, 0, 0);

    // Draw Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    // Cut out the quad (hole)
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.fill('evenodd');

    // Draw Lines
    ctx.strokeStyle = '#22c55e'; // Brand green
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.stroke();

    // Draw Handles
    points.forEach((p, i) => {
        ctx.beginPath();
        // Larger visual radius for easier grabbing
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText((i+1).toString(), p.x - 4, p.y + 4);
    });
  };

  useEffect(() => {
      if(step === 'crop') draw();
  }, [points]);

  // Canvas Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !imageObjRef.current) return;
    
    // Scale coordinates back to image size
    const scaleX = imageObjRef.current.width / rect.width;
    const scaleY = imageObjRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find closest point with generous threshold
    const threshold = 50 * scaleX;
    const idx = points.findIndex(p => Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold);
    if (idx !== -1) setActivePoint(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activePoint === null || !canvasRef.current || !imageObjRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageObjRef.current.width / rect.width;
    const scaleY = imageObjRef.current.height / rect.height;
    
    const x = Math.max(0, Math.min(imageObjRef.current.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(imageObjRef.current.height, (e.clientY - rect.top) * scaleY));

    const newPoints = [...points];
    newPoints[activePoint] = { x, y };
    setPoints(newPoints);
  };

  const handleMouseUp = () => setActivePoint(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setStep('crop');
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const processWarp = async () => {
      if(!imageSrc) return;
      const warped = await warpPerspective(imageSrc, points);
      setWarpedImage(warped);
      
      // Init resize values
      const img = new Image();
      img.onload = () => {
          setResizeW(img.width);
          setResizeH(img.height);
          setAspectRatio(img.width / img.height);
      };
      img.src = warped;
      setStep('result');
  };

  const handleResizeChange = (dim: 'w' | 'h', val: number) => {
      if(isNaN(val) || val < 1) return;
      
      if(dim === 'w') {
          setResizeW(val);
          if (lockAspectRatio) {
            setResizeH(Math.round(val / aspectRatio));
          }
      } else {
          setResizeH(val);
          if (lockAspectRatio) {
            setResizeW(Math.round(val * aspectRatio));
          }
      }
  };

  const handleFinalConfirm = async () => {
      if(!warpedImage) return;
      const finalUrl = await resizeImage(warpedImage, resizeW, resizeH);
      const res = await fetch(finalUrl);
      const blob = await res.blob();
      const file = new File([blob], "scanned-doc.jpg", { type: "image/jpeg" });
      onConfirm(file);
      onClose();
  };

  const handleDownload = async () => {
      if(!warpedImage) return;
      const finalUrl = await resizeImage(warpedImage, resizeW, resizeH);
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = "scanned-document.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Smart Perspective Scanner" className="max-w-4xl w-[95vw]">
      <div className="p-6 min-h-[60vh] flex flex-col">
        
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
             <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-emerald-50/30 transition-colors p-10 cursor-pointer group"
                onClick={() => document.getElementById('scanner-upload')?.click()}>
               <div className="bg-emerald-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                   <ScanLine size={48} className="text-emerald-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-700">Upload Document</h3>
               <p className="text-slate-400 mt-2">Auto-flatten and straighten slanted images</p>
               <input id="scanner-upload" type="file" className="hidden" accept="image/*" onChange={handleFileSelect}/>
           </div>
        )}

        {/* STEP 2: CROP/WARP */}
        {step === 'crop' && (
            <div className="flex flex-col items-center gap-4 flex-1">
                <div className="bg-slate-100 p-2 rounded-lg text-sm text-slate-600 flex gap-2">
                    <Move size={16}/> Drag the 4 green corners to match the document edges
                </div>
                <div className="relative overflow-hidden rounded-lg shadow-lg border border-slate-200 bg-slate-900 max-h-[50vh]">
                     <canvas 
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="cursor-crosshair w-full h-auto max-w-full"
                        style={{ maxHeight: '50vh', objectFit: 'contain' }}
                     />
                </div>
                <div className="flex justify-end w-full pt-4 border-t border-slate-200 mt-auto">
                    <Button onClick={processWarp} icon={<ArrowRight size={18}/>}>Warp & Flatten</Button>
                </div>
            </div>
        )}

        {/* STEP 3: RESIZE & RESULT */}
        {step === 'result' && warpedImage && (
            <div className="flex flex-col sm:flex-row gap-8 flex-1">
                {/* Preview */}
                <div className="flex-1 bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-slate-200 shadow-inner">
                    <img src={warpedImage} alt="Warped" className="max-h-[50vh] object-contain shadow-lg rounded" />
                </div>
                
                {/* Controls */}
                <div className="w-full sm:w-72 flex flex-col gap-6">
                    <div className="bg-white/60 p-5 rounded-xl border border-white/50 shadow-sm">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Minimize size={18} className="text-emerald-600"/> Resize Output
                        </h4>
                        
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Dimensions</span>
                            <button 
                                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${lockAspectRatio ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                                title="Toggle Aspect Ratio Lock"
                            >
                                {lockAspectRatio ? <Lock size={12}/> : <Unlock size={12}/>}
                                {lockAspectRatio ? 'Locked' : 'Unlocked'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Width (px)</label>
                                <input 
                                    type="number" 
                                    value={resizeW} 
                                    onChange={(e) => handleResizeChange('w', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Height (px)</label>
                                <input 
                                    type="number" 
                                    value={resizeH} 
                                    onChange={(e) => handleResizeChange('h', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <Button variant="secondary" onClick={handleDownload} icon={<Download size={18}/>} className="w-full">
                            Download Image
                        </Button>
                        <Button variant="primary" onClick={handleFinalConfirm} icon={<Check size={18}/>} className="w-full">
                            Confirm & Use
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};
