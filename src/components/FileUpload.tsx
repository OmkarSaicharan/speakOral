import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onFileSelect: (url: string) => void;
  value?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  value, 
  accept = ".pdf", 
  maxSizeMB = 10,
  className 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload(file);
    }
  };

  const simulateUpload = (file: File) => {
    setUploading(true);
    // Simulate a file upload delay
    setTimeout(() => {
      // In a real app, you'd upload to Firebase Storage and get a URL
      const mockUrl = URL.createObjectURL(file);
      onFileSelect(mockUrl);
      setUploading(false);
    }, 1500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {value ? (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900 truncate max-w-[200px]">
              {value.startsWith('blob:') ? 'Selected File' : 'Attached PDF'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onFileSelect('')} className="text-emerald-600 hover:bg-emerald-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={handleFileChange}
          />
          <div className="bg-emerald-100 p-3 rounded-full mb-3">
            <Upload className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
          <p className="text-xs text-slate-500 mt-1">{accept.replace('.', '').toUpperCase()} files only (max {maxSizeMB}MB)</p>
          {uploading && (
            <div className="mt-4 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
              <span className="text-xs font-medium text-emerald-600">Uploading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
