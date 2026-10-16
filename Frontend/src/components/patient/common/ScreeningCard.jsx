import React from 'react';
import { Calendar, Eye, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Button from './Button';

export default function ScreeningCard({ screening, onViewResult, compact = false }) {
  if (!screening) return null;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left side: Date & ID */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#0E2F76]/8 text-[#0E2F76] flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-[#0D1B3E] text-sm sm:text-base">
              Screening #{screening.id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
              {screening.eye || 'Both Eyes'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#718096]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {screening.date}
            </span>
            {screening.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {screening.time}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Result & Severity */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-[#718096] font-semibold mb-0.5">
            AI Screening Result
          </span>
          <StatusBadge status={screening.result || screening.severity} size="md" />
        </div>

        {screening.status && (
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#718096] font-semibold mb-0.5">
              Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {screening.status}
            </span>
          </div>
        )}
      </div>

      {/* Right: CTA button */}
      <div className="pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewResult && onViewResult(screening)}
          icon={ArrowRight}
          iconPosition="right"
          className="w-full sm:w-auto"
        >
          View Result
        </Button>
      </div>
    </div>
  );
}
