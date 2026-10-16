import React from 'react';
import {
  Camera,
  Eye,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import SummaryCard from '../common/SummaryCard';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

export default function OverviewView({
  patient,
  screenings = [],
  onStartScreening,
  onViewScreeningResult,
  onViewAllHistory,
  onRequestAppointment,
  onNavigateEducation,
}) {
  const patientName = patient?.fullName || patient?.firstName || patient?.name || 'Patient';
  const patientId = patient?.id || patient?._id || patient?.loginId || 'Not assigned';

  const hasScreenings = screenings && screenings.length > 0;
  const totalScreenings = screenings.length;
  const latestScreening = hasScreenings ? screenings[0] : null;

  const lastScreeningDate = latestScreening?.date || '—';
  const latestResultText = latestScreening?.result || latestScreening?.severity || (hasScreenings ? 'Completed' : 'No screenings yet');
  const requiresFollowUp = latestScreening?.requiresFollowUp || false;
  const followUpStatusText = latestScreening?.followUpStatusText || (hasScreenings ? 'No follow-up required' : 'Not applicable');

  const recentScreenings = screenings.slice(0, 3);

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* ── Welcome Section ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0C1E3C] via-[#102A54] to-[#0284C7] text-white p-5 sm:p-6 shadow-sm">
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-20 pointer-events-none blur-2xl"
          style={{ background: 'radial-gradient(circle, #38BDF8, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-[#BAE6FD] mb-2.5">
            <Sparkles className="w-3 h-3 text-[#38BDF8]" />
            Explainable AI Retinal Screening
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-1.5">
            Welcome back, {patientName}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-3 max-w-xl">
            Monitor your eye health with e-Netra AI. Regular screening and explainable AI insights protect vision against diabetic retinopathy.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur border border-white/10 text-xs font-mono text-cyan-200">
            <span className="text-blue-200 font-sans font-medium">Patient ID:</span>
            <span className="font-bold tracking-wider">{patientId}</span>
          </div>
        </div>
      </div>

      {/* ── Screening Summary (4 Cards) ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Screenings */}
        <SummaryCard
          title="Total Screenings"
          value={hasScreenings ? String(totalScreenings).padStart(2, '0') : '00'}
          subtext={hasScreenings ? 'Completed evaluations' : 'No screenings recorded'}
          icon={Activity}
          accentColor="#2563EB"
        />

        {/* Last Screening */}
        <SummaryCard
          title="Last Screening"
          value={lastScreeningDate}
          subtext={hasScreenings ? `Scan on record` : 'Awaiting first screening'}
          icon={Calendar}
          accentColor="#0E2F76"
        />

        {/* Latest Result */}
        <SummaryCard
          title="Latest Result"
          value={
            <span className="text-base sm:text-lg font-bold truncate block">
              {latestResultText}
            </span>
          }
          subtext={hasScreenings ? 'AI evaluation result' : 'Ready to screen'}
          icon={Eye}
          accentColor={requiresFollowUp ? '#D97706' : '#059669'}
          badge={hasScreenings ? <StatusBadge status={latestResultText} size="sm" /> : null}
        />

        {/* Follow-up Status */}
        <SummaryCard
          title="Follow-up Status"
          value={
            <span className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1">
              {followUpStatusText}
            </span>
          }
          subtext={requiresFollowUp ? 'Review suggested' : hasScreenings ? 'Current status' : 'None pending'}
          icon={requiresFollowUp ? AlertCircle : CheckCircle2}
          accentColor={requiresFollowUp ? '#D97706' : '#059669'}
        />
      </div>

      {/* ── Primary Action: Start New Screening ────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E2F76] via-[#1a4499] to-[#059669] p-6 sm:p-8 text-white shadow-lg">
        <div
          className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold text-cyan-200">
              <Camera className="w-3.5 h-3.5" />
              Primary Screening Action
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Start New Screening
            </h3>
            <p className="text-sm sm:text-base text-blue-50/90 leading-relaxed">
              Check your eye health with AI-assisted diabetic retinopathy screening.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onStartScreening}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-[#0E2F76] font-bold text-base shadow-lg shadow-black/15 hover:bg-blue-50 active:scale-98 transition-all cursor-pointer group"
            >
              <Camera className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform" />
              <span>Start Screening</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Screening Section ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0D1B3E]">Recent Screening</h3>
            <p className="text-xs text-[#718096]">Your diagnostic retinal screening records</p>
          </div>
          {hasScreenings && (
            <button
              type="button"
              onClick={onViewAllHistory}
              className="text-xs sm:text-sm font-semibold text-[#0E2F76] hover:text-[#2563EB] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {hasScreenings ? (
          <div className="space-y-3">
            {recentScreenings.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="font-bold text-[#0D1B3E] text-sm sm:text-base block">
                      Screening #{item.id || `SCR-${idx + 1}`}
                    </span>
                    <span className="text-xs text-[#718096] flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.date || 'Today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
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
                    onClick={() => onViewScreeningResult(item)}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    View Result
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No previous screenings found."
            description="You haven't completed any eye screenings yet. Check your eye health with an AI-assisted screening."
            actionLabel="Start Screening"
            onAction={onStartScreening}
            icon={Eye}
          />
        )}
      </div>

      {/* ── Health Information: Educational Section ────────────────── */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-lg font-bold text-[#0D1B3E]">About Diabetic Retinopathy</h3>
          </div>
          {onNavigateEducation && (
            <button
              type="button"
              onClick={onNavigateEducation}
              className="text-xs font-semibold text-[#0E2F76] hover:underline cursor-pointer"
            >
              Explore Guides →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="text-sm font-bold text-[#0D1B3E]">What is it?</h4>
            <p className="text-xs text-[#718096] leading-relaxed">
              Diabetic retinopathy occurs when chronic elevated blood sugar levels weaken the tiny, delicate blood vessels in the retina at the back of your eye.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="text-sm font-bold text-[#0D1B3E]">Why Early Screening?</h4>
            <p className="text-xs text-[#718096] leading-relaxed">
              In its early stages, retinopathy has zero warning signs or visual pain. Annual retinal imaging catches microvascular changes before vision is impaired.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="text-sm font-bold text-[#0D1B3E]">How Drishti AI Helps</h4>
            <p className="text-xs text-[#718096] leading-relaxed">
              Drishti uses explainable deep neural networks to assist in detecting signs like microaneurysms, giving you and your healthcare team timely insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
