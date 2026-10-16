import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Eye, ShieldAlert } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Screening Error',
  message = 'Unable to process the image. Please try again.',
  onRetry,
  onBack,
  onPreviewResult,
}) {
  return (
    <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-bold text-[#0D1B3E]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#718096] max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        {onBack && (
          <Button variant="secondary" size="md" onClick={onBack} icon={ArrowLeft} className="w-full sm:w-auto">
            Back
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" size="md" onClick={onRetry} icon={RefreshCw} className="w-full sm:w-auto">
            Retry Request
          </Button>
        )}
      </div>

      {onPreviewResult && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">
            Is the AI backend currently processing or offline? You can preview the Result Page structure:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviewResult}
            icon={Eye}
            className="w-full sm:w-auto text-[#0E2F76]"
          >
            Preview Result Page (AI Contract Demo)
          </Button>
        </div>
      )}
    </div>
  );
}
