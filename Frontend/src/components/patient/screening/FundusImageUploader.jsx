import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

export default function FundusImageUploader({
  onImageSelected,
  onOpenCamera,
  hasImage = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndHandleFile = (file) => {
    setUploadError(null);
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid file format. Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    // Check size limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB limit. Please choose a smaller fundus image.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageSelected(file, previewUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndHandleFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
      />

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-[#0284C7] bg-[#E0F2FE]/70 scale-[0.99]'
            : 'border-[#CBD5E1] hover:border-[#0284C7]/60 bg-[#F8FAFC] hover:bg-[#F1F5F9]'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#0E2F76]/8 text-[#0E2F76] flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8 text-[#2563EB]" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D1B3E]">
              {isDragOver ? 'Drop fundus image here' : 'Upload Retinal Fundus Image'}
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] mt-1 max-w-sm mx-auto">
              Drag and drop your image file here, or click to browse from your device
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 text-slate-600 text-xs font-semibold">
            <ImageIcon className="w-3.5 h-3.5" />
            Supported formats: JPG, JPEG, PNG (up to 15MB)
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Alternative: Use Camera Button */}
      {onOpenCamera && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">or</span>
          <Button
            variant="outline"
            size="md"
            onClick={onOpenCamera}
            icon={Camera}
            className="border-slate-200 hover:border-[#0E2F76]"
          >
            Use Device Camera
          </Button>
        </div>
      )}
    </div>
  );
}
