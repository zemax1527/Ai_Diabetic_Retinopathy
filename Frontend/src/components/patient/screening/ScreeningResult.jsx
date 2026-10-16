import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Layers,
  ArrowLeft,
  RotateCcw,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Activity,
  Layers2,
  Stethoscope,
  Info,
  ShieldCheck,
  ExternalLink,
  Printer,
  Sliders,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function ScreeningResult({
  resultData,
  onStartNewScreening,
  onBackToDashboard,
  onRequestDoctorReview,
}) {
  // Available image layers: 'original' | 'heatmap' | 'gradcam' | 'lesion_overlay'
  const [activeImageView, setActiveImageView] = useState('original');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!resultData) return null;

  const classification = resultData.classification || {};
  const decision = resultData.decision || {};
  const explainability = resultData.explainability || {};
  const lesions = resultData.lesions || {};
  const images = resultData.images || {};
  const quality = resultData.quality || {};
  const technical = resultData.technical || {};

  const isReferable = decision.referable;
  const grade = classification.grade;
  const isHealthy = grade === 0 || String(classification.label || '').toLowerCase().includes('no dr');

  // Available image layers
  const imageLayers = [
    { id: 'original', label: 'Original Scan', url: images.original, icon: Eye },
    { id: 'heatmap', label: 'Heatmap', url: images.heatmap, icon: Layers },
    { id: 'gradcam', label: 'Attention Overlay', url: images.gradcam, icon: Sliders },
    { id: 'lesion_overlay', label: 'Lesions Overlay', url: images.lesionOverlay, icon: Layers2 },
  ].filter((layer) => Boolean(layer.url));

  // Active displayed image URL
  const activeLayer = imageLayers.find((l) => l.id === activeImageView) || imageLayers[0] || null;
  const currentImageUrl = activeLayer?.url || images.original || resultData.fundusImage || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#0E2F76] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            AI-Assisted Retinal Screening Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1B3E] tracking-tight">
            Screening Evaluation Details
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096] mt-1">
            <span>ID: <strong className="font-mono text-[#0E2F76]">{resultData.id}</strong></span>
            {resultData.filename && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-500">{resultData.filename}</span>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Quality: {quality.status || 'Good'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToDashboard}
            icon={ArrowLeft}
          >
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={Printer}
            className="hidden sm:inline-flex"
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onStartNewScreening}
            icon={RotateCcw}
          >
            New Screening
          </Button>
        </div>
      </div>

      {/* ── 1. Quality Verification Section ────────────────────────── */}
      {quality.checks && quality.checks.length > 0 && (
        <div className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D1B3E]">
                Automated Retinal Image Quality Check
              </h3>
            </div>
            {quality.fundusConfidence && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Fundus Confidence: {quality.fundusConfidence}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {quality.checks.map((chk, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-medium text-slate-600 truncate">{chk.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <span className="font-bold text-[#0D1B3E] text-[11px] truncate">{chk.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Primary Classification Card ─────────────────────────── */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
          !isReferable && isHealthy
            ? 'bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/5 border-emerald-200'
            : isReferable
            ? 'bg-gradient-to-br from-rose-500/10 via-white to-amber-500/5 border-rose-200'
            : 'bg-gradient-to-br from-amber-500/10 via-white to-blue-500/5 border-amber-200'
        }`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Diabetic Retinopathy Classification
            </span>
            {grade !== null && (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white border border-slate-200 text-[#0E2F76] shadow-2xs">
                Grade {grade} ({classification.label})
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight">
                {classification.label || 'Screening Complete'}
              </h2>
              <p className="text-xs sm:text-sm text-[#718096] mt-0.5">
                {grade === 0 && 'No signs of diabetic retinopathy observed in this capture.'}
                {grade === 1 && 'Early microvascular retinal markers identified (Grade 1 Mild DR).'}
                {grade === 2 && 'Moderate diabetic retinopathy changes detected.'}
                {grade >= 3 && 'Advanced diabetic retinopathy changes requiring specialist evaluation.'}
              </p>
            </div>

            {classification.confidence && (
              <div className="flex items-center gap-2 self-start sm:self-auto bg-white/90 px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Model Confidence:</span>
                <span className="text-lg font-black text-[#0D1B3E]">
                  {classification.confidence}
                </span>
              </div>
            )}
          </div>

          {/* Probabilities Distribution Bars */}
          {classification.probabilitiesList && classification.probabilitiesList.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                Full Diagnostic Probability Breakdown
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {classification.probabilitiesList.map((prob) => {
                  const isTopClass = prob.label === classification.label;
                  return (
                    <div
                      key={prob.label}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isTopClass
                          ? 'bg-blue-50 border-[#2563EB] shadow-xs'
                          : 'bg-white/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className={`truncate text-[11px] ${isTopClass ? 'font-bold text-[#0E2F76]' : 'font-medium text-slate-600'}`}>
                          {prob.label}
                        </span>
                        <span className="font-bold text-[#0D1B3E] text-[11px] ml-1">
                          {prob.percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isTopClass ? 'bg-[#2563EB]' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(prob.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Screening Decision & Referral Guidance ──────────────── */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isReferable
            ? 'bg-rose-50/80 border-rose-300'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isReferable ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isReferable ? (
              <AlertTriangle className="w-5 h-5 text-rose-700" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinical Referral Decision:
              </span>
              <span
                className={`text-sm sm:text-base font-extrabold ${
                  isReferable ? 'text-rose-900' : 'text-emerald-900'
                }`}
              >
                {decision.decision || (isReferable ? 'REFERABLE' : 'NON-REFERABLE')}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isReferable ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isReferable ? 'Specialist Consultation Recommended' : 'No Immediate Referral Needed'}
              </span>
            </div>

            {decision.reason && (
              <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                {decision.reason}
              </p>
            )}
          </div>
        </div>

        {isReferable && onRequestDoctorReview && (
          <Button
            variant="accent"
            size="md"
            onClick={onRequestDoctorReview}
            icon={Calendar}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            Book Doctor Review
          </Button>
        )}
      </div>

      {/* ── 4. Multi-Layer Image Visualization ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0D1B3E] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2563EB]" />
              Fundus Image & AI Visualization
            </h3>
            <p className="text-xs text-[#718096]">
              Interactive visualization layers from Drishti deep neural networks
            </p>
          </div>

          {/* Layer Selector Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 flex-wrap gap-1">
            {imageLayers.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeImageView === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveImageView(layer.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#0E2F76] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Frame */}
        <div className="flex flex-col items-center py-2">
          <div className="relative w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-md flex items-center justify-center">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Retinal Screening Visualization"
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Image preview not available</p>
              </div>
            )}

            {/* View description chip */}
            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-semibold text-white border border-white/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{activeLayer?.label || 'Fundus Image'}</span>
            </div>

            {/* Direct Open Link */}
            {currentImageUrl && (
              <a
                href={currentImageUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-3 right-3 bg-black/75 backdrop-blur-md p-1.5 rounded-lg text-white/80 hover:text-white border border-white/20 transition-colors"
                title="Open high-resolution image"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2 text-center">
            Toggle between Original Scan, AI Heatmap, Attention Overlay, and Lesions Overlay above.
          </p>
        </div>

        {/* Explainability findings */}
        {explainability.explanation && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0E2F76] block">
              AI Explainability ({explainability.method || 'Grad-CAM++'})
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {explainability.explanation}
            </p>
          </div>
        )}
      </div>

      {/* ── 5. Retinal Lesion Findings ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-base font-bold text-[#0D1B3E]">Retinal Lesion Detection</h3>
              <p className="text-xs text-[#718096]">Segmentation results for microvascular diabetic signs</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
            Total Lesions: {lesions.count}
          </span>
        </div>

        {lesions.summaryList && lesions.summaryList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lesions.summaryList.map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
              >
                <span className="text-xs text-slate-500 block font-medium truncate">
                  {item.displayName}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-black ${item.count > 0 ? 'text-amber-700' : 'text-[#0D1B3E]'}`}>
                    {item.count}
                  </span>
                  <span className="text-[10px] text-slate-400">detected</span>
                </div>
                {item.maxConfidence && item.count > 0 && (
                  <span className="text-[10px] text-slate-500 block">
                    Confidence: {item.maxConfidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No microaneurysms, hemorrhages, or exudate lesions identified.</span>
          </div>
        )}
      </div>

      {/* ── 6. Expandable Technical Details (For Doctor / Audit) ───── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Technical Details (For Healthcare Professionals & Verification)
            </span>
          </div>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Explainability Engine:</span>
                <span className="font-bold">{explainability.method || 'Grad-CAM++'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Lesion Model Architecture:</span>
                <span className="font-bold">{lesions.architecture || 'UNet + SEResNeXt50-32x4d'}</span>
              </div>
              {technical.senanur && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Senanur Safety Ensemble:</span>
                  <p className="text-[11px] font-bold text-slate-800">
                    {technical.senanur.model || 'Senanur 5-fold EfficientNet-B0 ONNX ensemble'}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Raw Score: {technical.senanur.raw_score} • Grade: {technical.senanur.grade} • Fold Spread: {technical.senanur.fold_spread}
                  </p>
                </div>
              )}
            </div>

            {/* Complete Raw Response Inspector */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl max-h-64 overflow-auto border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Raw API Payload:</span>
              <pre className="text-[11px] leading-tight">
                {JSON.stringify(resultData.raw, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Mandatory Medical Disclaimer ───────────────────────── */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Medical Disclaimer</strong>
          This AI-assisted screening result is intended to support screening and does not replace
          evaluation by a qualified healthcare professional.
        </p>
      </div>

      {/* ── 8. Bottom Action Buttons ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <Button
          variant="secondary"
          onClick={onBackToDashboard}
          icon={ArrowLeft}
          className="w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onRequestDoctorReview && (
            <Button
              variant="outline"
              onClick={onRequestDoctorReview}
              icon={Calendar}
              className="w-full sm:w-auto"
            >
              Book / Request Doctor Review
            </Button>
          )}

          <Button
            variant="primary"
            onClick={onStartNewScreening}
            icon={RotateCcw}
            className="w-full sm:w-auto"
          >
            Start New Screening
          </Button>
        </div>
      </div>
    </div>
  );
}
