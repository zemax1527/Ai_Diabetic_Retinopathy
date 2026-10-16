import { CheckCircle2, Clock, ShieldCheck, ArrowRight, FileText, Building2 } from 'lucide-react';

/**
 * VerificationSubmittedStep
 * Pure JavaScript component.
 * Screen 7: Dedicated status page after submitting professional qualification.
 * Shows large success/check illustration, clean non-technical status card,
 * and primary CTA "Continue" to access the restricted dashboard preview state.
 */
export default function VerificationSubmittedStep({
  role,
  personalData,
  professionalData,
  onContinue,
}) {
  const isDoctor = role === 'doctor';
  const roleName = isDoctor ? 'Doctor' : 'Healthcare Worker';
  const fullName = `${personalData?.firstName || ''} ${personalData?.lastName || ''}`.trim() || 'Professional';
  const referenceId = `DRS-2026-${isDoctor ? 'DOC' : 'HW'}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12 text-center">
        {/* Large Success Illustration with Soft Ripple Rings */}
        <div className="relative flex items-center justify-center mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emerald-100 opacity-60 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full bg-emerald-50" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>
        </div>

        {/* Heading & Description */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight mb-2">
          Application Submitted
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          Your professional details have been submitted successfully. Our administrator will review your information before activating your professional account.
        </p>

        {/* Status Card (Professional & Non-Technical) */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 mb-8 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Account Status
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Verification Pending</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            You will be able to access your professional dashboard after approval.
          </p>

          {/* Submission summary breakdown */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/70 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-800">{fullName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Designation / Role:</span>
              <span className="font-semibold text-[#0E2F76]">{roleName}</span>
            </div>
            {professionalData?.workplace && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">Affiliation:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {professionalData.workplace}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Application Reference:</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {referenceId}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
              <span className="text-slate-500">Estimated Review Time:</span>
              <span className="font-medium text-emerald-700">24 – 48 Hours</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button: Continue */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[#0E2F76] hover:bg-[#1a4499] active:scale-[0.99] transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Footer info */}
        <p className="mt-4 text-xs text-slate-400">
          A confirmation SMS and email have been dispatched to your registered contact.
        </p>
      </div>
    </div>
  );
}
