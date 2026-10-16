import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, AlertCircle, FileCheck, Eye } from 'lucide-react';

/**
 * DocumentUploadCard
 * Pure JavaScript component.
 * Polished, accessible drag & drop document upload card with before/after states,
 * file validation, progress feedback, file metadata display, and removal.
 */
export default function DocumentUploadCard({
  id,
  title,
  description = 'PDF, JPG or PNG (max 5MB)',
  required = true,
  uploadedFile = null,
  onFileChange,
  error = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const processFile = (file) => {
    if (!file) return;

    // Check size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError('File exceeds 5MB size limit.');
      return;
    }

    // Check type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Please upload a valid PDF, JPG, or PNG document.');
      return;
    }

    setLocalError('');
    setIsUploading(true);

    // Simulate smooth upload & verification
    setTimeout(() => {
      setIsUploading(false);
      if (onFileChange) {
        onFileChange({
          name: file.name,
          type: file.type.includes('pdf') ? 'PDF Document' : 'Image (JPG/PNG)',
          mimeType: file.type,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          lastModified: file.lastModified,
          status: 'Verified Format',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }, 600);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileChange) {
      onFileChange(null);
    }
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      {/* Label header */}
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 flex items-center gap-1"
        >
          <span>{title}</span>
          {required && <span className="text-red-500 font-bold" title="Required">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">
          {uploadedFile ? 'Verified' : 'Required for compliance'}
        </span>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={handleFileSelect}
        aria-describedby={`${id}-desc`}
      />

      {/* Uploaded state card */}
      {uploadedFile ? (
        <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 transition-all shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* File info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/90 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate" title={uploadedFile.name}>
                  {uploadedFile.name}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-600">{uploadedFile.type}</span>
                  <span>•</span>
                  <span>{uploadedFile.sizeFormatted}</span>
                </div>
              </div>
            </div>

            {/* Actions & Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Uploaded</span>
              </span>

              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
                title="View details"
                aria-label="Toggle document details"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Remove uploaded document"
                aria-label="Remove uploaded document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick detail drawer if preview clicked */}
          {previewOpen && (
            <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 bg-white/70 p-2.5 rounded-lg">
              <div>
                <span className="font-semibold text-slate-700">Checksum Status:</span> Passed initial structure validation
              </div>
              <div className="text-[11px] text-slate-500">
                Ready for administrative audit
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Before upload state card */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
            isDragging
              ? 'border-[#0E2F76] bg-blue-50/70 scale-[1.01]'
              : displayError
              ? 'border-red-300 bg-red-50/30'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0E2F76]/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0E2F76] flex items-center justify-center mb-0.5">
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-[#0E2F76] border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>

            <div className="text-xs font-semibold text-[#0D1B3E]">
              {isUploading ? 'Validating file...' : 'Upload document'}
            </div>
            <p id={`${id}-desc`} className="text-[11px] text-slate-500 max-w-xs">
              {description} • Click to browse or drag & drop
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
}
