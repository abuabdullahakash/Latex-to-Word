import React, { useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Upload, Download, Check, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// Declare global Cropper type since we are using CDN
declare global {
  interface Window {
    Cropper: any;
  }
}

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ isOpen, onClose, onConfirm }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<any>(null);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("image");

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      setImageSrc(null);
    }
  }, [isOpen]);

  // Initialize Cropper when imageSrc changes
  useEffect(() => {
    if (imageSrc && imageRef.current && isOpen) {
        // Destroy previous instance if exists
        if (cropperRef.current) {
            cropperRef.current.destroy();
        }

        // Initialize Cropper.js
        cropperRef.current = new window.Cropper(imageRef.current, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            background: false, // Cleaner look for glass modal
        });
    }
  }, [imageSrc, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name.split('.')[0]);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset input
      e.target.value = '';
    }
  };

  const getCroppedBlob = (): Promise<Blob | null> => {
      return new Promise((resolve) => {
          if (!cropperRef.current) return resolve(null);
          
          cropperRef.current.getCroppedCanvas({
              maxWidth: 2048,
              maxHeight: 2048,
              fillColor: '#fff',
          }).toBlob((blob: Blob) => {
              resolve(blob);
          }, 'image/png');
      });
  };

  const handleDownload = async () => {
      const blob = await getCroppedBlob();
      if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${uploadedFileName}-cropped.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }
  };

  const handleConfirm = async () => {
      const blob = await getCroppedBlob();
      if (blob) {
          const file = new File([blob], `${uploadedFileName}-cropped.png`, { type: 'image/png' });
          onConfirm(file);
          onClose();
      }
  };

  const rotate = (deg: number) => cropperRef.current?.rotate(deg);
  const zoom = (ratio: number) => cropperRef.current?.zoom(ratio);
  const reset = () => cropperRef.current?.reset();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Cropper Tool" className="max-w-4xl w-[90vw]">
      <div className="p-6 flex flex-col h-[70vh]">
        {!imageSrc ? (
           <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-emerald-50/30 transition-colors p-10 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
               <div className="bg-emerald-100 p-4 rounded-full mb-4">
                   <Upload size={32} className="text-emerald-600" />
               </div>
               <h3 className="text-lg font-semibold text-slate-700">Upload Image to Crop</h3>
               <p className="text-slate-400 text-sm mt-2">Click to browse your device</p>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileSelect}
               />
           </div>
        ) : (
           <div className="flex flex-col h-full gap-4">
               {/* Toolbar */}
               <div className="flex gap-2 justify-center pb-2">
                   <Button variant="secondary" onClick={() => zoom(0.1)} icon={<ZoomIn size={16}/>} className="!p-2" />
                   <Button variant="secondary" onClick={() => zoom(-0.1)} icon={<ZoomOut size={16}/>} className="!p-2" />
                   <Button variant="secondary" onClick={() => rotate(90)} icon={<RotateCw size={16}/>} className="!p-2" />
                   <Button variant="secondary" onClick={reset} icon={<RefreshCw size={16}/>} className="!p-2" />
                   <Button variant="ghost" onClick={() => setImageSrc(null)} className="ml-4 text-red-500 hover:text-red-600 hover:bg-red-50">Change Image</Button>
               </div>

               {/* Editor Area */}
               <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative">
                   <img ref={imageRef} src={imageSrc} alt="Source" className="max-w-full block" />
               </div>

               {/* Action Footer */}
               <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <Button variant="secondary" onClick={handleDownload} icon={<Download size={18} />}>
                        Download Crop
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirm} icon={<Check size={18} />}>
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