import React from 'react';
import { Loader2, Eye } from 'lucide-react';

export default function LoadingState({
  message = 'Loading your screening information...',
  subtext = 'Please wait while we retrieve your retinal health data.',
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-12 text-center flex flex-col items-center justify-center min-h-[260px] ${className}`}
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0E2F76] flex items-center justify-center">
          <Eye className="w-7 h-7 text-[#2563EB]" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#0E2F76]" />
        </div>
      </div>

      <h4 className="text-base font-bold text-[#0D1B3E] mb-1">{message}</h4>
      <p className="text-xs text-[#718096] max-w-sm">{subtext}</p>
    </div>
  );
}
