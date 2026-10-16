import React from 'react';
import { Gauge } from 'lucide-react';

export default function ConfidenceDisplay({ confidence }) {
  if (!confidence) return null;

  const numericValue = parseInt(String(confidence).replace('%', ''), 10) || 0;

  let colorClass = 'bg-[#2563EB]';
  if (numericValue >= 85) {
    colorClass = 'bg-emerald-600';
  } else if (numericValue >= 65) {
    colorClass = 'bg-blue-600';
  } else {
    colorClass = 'bg-amber-500';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-[#2563EB]" />
          AI Confidence Rating
        </span>
        <span className="text-base font-extrabold text-[#0D1B3E]">{confidence}</span>
      </div>

      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${Math.min(numericValue, 100)}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-400 mt-1.5">
        Represents the statistical confidence of the model evaluation based on clinical retinal features.
      </p>
    </div>
  );
}
