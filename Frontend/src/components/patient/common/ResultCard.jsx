import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, Download, Layers, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Button from './Button';

export default function ResultCard({
  screening,
  onBackToDashboard,
  onViewHistory,
  onDownloadReport,
  onOpenDetailedExplanation,
}) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (!screening) return null;

  const isNoDR = (screening.severity || screening.result || '').toLowerCase().includes('no dr');
  const confidence = screening.confidence || '94%';

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#718096] font-semibold">
            Screening Report Overview
          </span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D1B3E]">
              Screening #{screening.id}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-[#0E2F76] border border-blue-200">
              {screening.eye || 'Both Eyes'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm text-[#718096]">
          <div>
            <span className="text-slate-400 block text-[11px]">Screening Date</span>
            <span className="font-semibold text-slate-700">{screening.date}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[11px]">Verification</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {screening.status || 'Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Result Banner Card */}
      <div
        className={`rounded-2xl p-6 sm:p-8 border shadow-sm transition-all ${
          isNoDR
            ? 'bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/5 border-emerald-200'
            : 'bg-gradient-to-br from-amber-500/10 via-white to-blue-500/5 border-amber-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-bold text-[#0E2F76]">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              AI-Assisted Screening Result
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1B3E] tracking-tight">
              {isNoDR
                ? 'No signs of diabetic retinopathy detected'
                : 'Mild signs of diabetic retinopathy detected'}
            </h1>

            <p className="text-sm sm:text-base text-[#4A5568] leading-relaxed max-w-2xl">
              {screening.clinicalGuidance ||
                (isNoDR
                  ? 'Your retinal scan shows healthy blood vessels with no signs of microaneurysms or bleeding. Continue annual routine checks.'
                  : 'Early microvascular changes detected. An in-person consultation with an eye doctor is recommended for close monitoring.')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Severity Grade</span>
                <StatusBadge status={screening.severity || screening.result} size="lg" />
              </div>

              <div className="h-9 w-px bg-slate-200 hidden sm:block" />

              <div>
                <span className="text-xs text-slate-500 block mb-1">AI Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 sm:w-36 bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full ${isNoDR ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${confidence.replace('%', '')}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#0D1B3E]">{confidence}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up recommendation chip */}
          <div className="bg-white/90 backdrop-blur rounded-xl p-4 border border-slate-200 shadow-2xs md:max-w-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Follow-up Status
            </span>
            <div className="flex items-center gap-2 mb-2">
              {screening.requiresFollowUp ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-sm font-bold text-amber-800">
                    Doctor review recommended
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-emerald-800">
                    No follow-up required at this time
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-[#718096] leading-relaxed">
              {screening.followUpStatusText ||
                (screening.requiresFollowUp
                  ? 'We suggest booking a consultation within 3 months.'
                  : 'Maintain routine annual eye checkups.')}
            </p>
          </div>
        </div>
      </div>

      {/* Retinal Fundus Image & AI Explanation Section */}
      <div className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#0D1B3E] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2563EB]" />
              Fundus Image & AI Explanation
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] mt-0.5">
              High-resolution retinal capture analyzed by Drishti deep neural network.
            </p>
          </div>

          {/* Toggle between Original and AI Highlighted */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowHeatmap(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !showHeatmap
                  ? 'bg-white text-[#0E2F76] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Retinal View
            </button>
            <button
              type="button"
              onClick={() => setShowHeatmap(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                showHeatmap
                  ? 'bg-[#0E2F76] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              AI-Highlighted Areas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Fundus Visual Box */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-md">
              {/* Fundus Base Image */}
              <img
                src={screening.fundusImage}
                alt="Retinal Fundus Image"
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Heatmap Overlay with Transition */}
              {showHeatmap && (
                <div className="absolute inset-0 transition-opacity duration-300">
                  <img
                    src={screening.heatmapImage}
                    alt="AI Highlighted Heatmap"
                    className="w-full h-full object-cover mix-blend-screen opacity-90 select-none pointer-events-none"
                  />
                </div>
              )}

              {/* Active Badge on Image */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-semibold text-white border border-white/20 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    showHeatmap ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                {showHeatmap ? 'AI-highlighted areas active' : 'Standard retinal capture'}
              </div>

              {/* Eye label */}
              <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white border border-white/20">
                {screening.eye || 'Fundus Scan'}
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 text-center">
              Use the toggle buttons above to inspect the AI-highlighted areas on the retina.
            </p>
          </div>

          {/* Explanation & Findings Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0E2F76] block mb-1">
                Visual Findings
              </span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {screening.findingsSummary || 'Retinal vascular architecture is within normal parameters.'}
              </p>
            </div>

            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1">
                Patient-Friendly Explanation
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">
                {screening.highlightedDescription ||
                  'The AI looked for tiny widened vessels (microaneurysms), light spots, and bleeding around the central seeing area (macula).'}
              </p>
            </div>

            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                icon={ExternalLink}
                iconPosition="right"
                onClick={onOpenDetailedExplanation}
                className="w-full sm:w-auto"
              >
                View Detailed Explanation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Clinical Disclaimer</strong>
          This AI-assisted screening supports clinical assessment and does not replace evaluation by a
          qualified healthcare professional. Always consult an ophthalmologist for a comprehensive
          clinical diagnosis and treatment plan.
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto"
          >
            ← Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={onViewHistory}
            className="w-full sm:w-auto"
          >
            View History
          </Button>
        </div>

        <Button
          variant="primary"
          icon={Download}
          onClick={onDownloadReport}
          className="w-full sm:w-auto"
        >
          Download Report
        </Button>
      </div>
    </div>
  );
}
