import React from 'react';
import { Info, Clock, ShieldCheck, Tag } from 'lucide-react';

export default function ResultSummary({ mappedResult }) {
  if (!mappedResult) return null;

  const { status, timestamp, date, additionalFields } = mappedResult;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2563EB]" />
          <h4 className="text-sm font-bold text-[#0D1B3E]">Screening Information</h4>
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {date} at {timestamp}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-400 block font-medium">Evaluation Status</span>
          <span className="text-xs font-bold text-[#0D1B3E] flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {status || 'Completed'}
          </span>
        </div>

        {additionalFields && additionalFields.length > 0 &&
          additionalFields.map((field, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium truncate">
                {field.key}
              </span>
              <span className="text-xs font-bold text-[#0D1B3E] block mt-0.5 truncate">
                {field.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
