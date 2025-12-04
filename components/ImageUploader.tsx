import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  image: string | null;
  onChange: (image: string | null, mimeType?: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string, file.type);
        };
        reader.readAsDataURL(file);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Reference Image (Optional)
      </label>
      
      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-yellow-500/50 transition-all duration-300"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-3 bg-slate-700 rounded-full mb-3 group-hover:bg-slate-600 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-yellow-400" />
            </div>
            <p className="mb-2 text-sm text-slate-400">
              <span className="font-semibold text-slate-300">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group">
          <img 
            src={image} 
            alt="Reference" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900/80 hover:bg-black text-white rounded-lg text-sm backdrop-blur-sm mr-2"
             >
                Change
             </button>
             <button
                onClick={clearImage}
                className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm"
             >
                <X className="w-5 h-5" />
             </button>
          </div>
           <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};
