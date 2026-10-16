import React from 'react';
import { Eye, Trash2, RefreshCw, CheckCircle2, FileImage } from 'lucide-react';
import Button from '../common/Button';

export default function ImagePreview({
  imageFile,
  previewUrl,
  selectedEye = 'Both Eyes',
  onEyeChange,
  onRemove,
  onReplace,
}) {
  if (!previewUrl && !imageFile) return null;

  const fileSizeKb = imageFile ? (imageFile.size / 1024).toFixed(1) : null;
  const fileName = imageFile?.name || 'Retinal Fundus Image';

  return (
    <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.1)] p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 text-[#2563EB]" />
          <h4 className="text-sm font-bold text-[#0D1B3E]">Selected Fundus Image</h4>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ready for Screening
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Preview Frame */}
        <div className="sm:col-span-5 flex justify-center">
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-md flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Fundus Scan Preview"
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
              {imageFile?.type?.split('/')[1]?.toUpperCase() || 'IMG'}
            </div>
          </div>
        </div>

        {/* Metadata & Controls */}
        <div className="sm:col-span-7 space-y-3.5">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Filename</p>
            <p className="text-sm font-bold text-[#0D1B3E] truncate">{fileName}</p>
            {fileSizeKb && (
              <p className="text-xs text-slate-500">File size: {fileSizeKb} KB</p>
            )}
          </div>

          {/* Eye Selection */}
          {onEyeChange && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Eye Being Screened
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Left Eye', 'Right Eye', 'Both Eyes'].map((eye) => (
                  <button
                    key={eye}
                    type="button"
                    onClick={() => onEyeChange(eye)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedEye === eye
                        ? 'bg-[#0E2F76] text-white border-[#0E2F76] shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {eye}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onReplace && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReplace}
                icon={RefreshCw}
              >
                Replace Image
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                icon={Trash2}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
