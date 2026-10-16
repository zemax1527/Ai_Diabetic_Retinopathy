import React from 'react';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

export default function ScreeningSubmit({
  onSubmit,
  isSubmitting = false,
  disabled = false,
  hasImage = false,
  hasUserId = true,
  onCancel,
}) {
  return (
    <div className="space-y-3">
      {!hasUserId && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Unable to identify the logged-in user. Please log in again.</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel & Back
          </Button>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={disabled || !hasImage || !hasUserId || isSubmitting}
          loading={isSubmitting}
          icon={Sparkles}
          className="w-full sm:w-auto ml-auto px-8 py-3.5 text-base font-bold shadow-md shadow-[#0E2F76]/20"
        >
          {isSubmitting ? 'Analyzing Retinal Image...' : 'Start AI Screening'}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#718096] pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Direct AI analysis • Data processed securely without unauthorized third parties</span>
      </div>
    </div>
  );
}
