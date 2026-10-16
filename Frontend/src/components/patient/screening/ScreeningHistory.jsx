import React from 'react';
import { History, Eye, Calendar, ArrowRight, ShieldCheck, PlusCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

export default function ScreeningHistory({
  screenings = [],
  onViewDetails,
  onStartNewScreening,
}) {
  if (!screenings || screenings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D1B3E]">Screening History</h2>
          <p className="text-xs sm:text-sm text-[#718096]">
            Past retinal screenings and explainable AI evaluations
          </p>
        </div>

        <EmptyState
          title="No previous screenings found."
          description="You haven't completed any eye screenings yet. Perform your first AI-assisted retinal screening to protect your vision."
          actionLabel="Start Screening"
          onAction={onStartNewScreening}
          icon={History}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Screening History</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Past retinal screenings and explainable AI evaluations
          </p>
        </div>

        {onStartNewScreening && (
          <Button
            variant="primary"
            size="sm"
            onClick={onStartNewScreening}
            icon={PlusCircle}
          >
            Start New Screening
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {screenings.map((item, index) => (
          <div
            key={item.id || index}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-[#0D1B3E] text-sm sm:text-base">
                    Screening #{item.id || `SCR-${index + 1}`}
                  </span>
                  {item.language && (
                    <span className="text-[11px] px-2 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {item.language}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#718096]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.date || 'Today'}</span>
                  {item.time && <span>• {item.time}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">
                  Result
                </span>
                <StatusBadge status={item.result || item.severity || 'Completed'} size="sm" />
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">
                  Status
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {item.status || 'Completed'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails && onViewDetails(item)}
                icon={ArrowRight}
                iconPosition="right"
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
