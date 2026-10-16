import React from 'react';
import { Stethoscope, ArrowRight, Calendar } from 'lucide-react';
import Button from '../common/Button';

export default function RecommendationCard({
  recommendation,
  onRequestDoctorReview,
}) {
  if (!recommendation) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50/90 to-white rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-2xs space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0E2F76] flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0D1B3E]">Clinical Recommendation</h4>
          <span className="text-[11px] text-[#718096]">Guidance based on screening outcome</span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-blue-100/80">
        {recommendation}
      </p>

      {onRequestDoctorReview && (
        <div className="pt-1">
          <Button
            variant="accent"
            size="sm"
            onClick={onRequestDoctorReview}
            icon={Calendar}
          >
            Book / Request Doctor Review
          </Button>
        </div>
      )}
    </div>
  );
}
