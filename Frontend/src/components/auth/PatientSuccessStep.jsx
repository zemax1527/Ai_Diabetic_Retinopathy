import { CheckCircle2, Eye, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PatientSuccessStep
 * Pure JavaScript component.
 * Screen 9: Registration Success for Patients.
 * Clean, cheerful, reassuring healthcare success page with primary CTA "Go to Dashboard".
 */
export default function PatientSuccessStep({ personalData, onGoToDashboard }) {
  const navigate = useNavigate();
  const fullName = `${personalData?.firstName || ''} ${personalData?.lastName || ''}`.trim() || 'Patient';
  const drishtiId = `DRS-PAT-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleDashboard = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      navigate('/patient');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12 text-center">
        {/* Simple, beautiful success illustration */}
        <div className="relative flex items-center justify-center mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emerald-100 opacity-60 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full bg-emerald-50" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-teal-600/25">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight mb-2">
          You're all set!
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          Your Drishti account has been created successfully. You can now access your personalized eye care portal.
        </p>

        {/* Patient Health ID Card Preview */}
        <div className="bg-gradient-to-br from-[#0E2F76] to-[#1E40AF] text-white rounded-2xl p-5 mb-8 text-left shadow-md relative overflow-hidden">
          <div
            className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Eye className="w-4 h-4 text-sky-200" />
              </div>
              <span className="font-bold text-sm tracking-wide">Drishti Health ID</span>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-sky-200 uppercase tracking-wider font-semibold">Patient Name</div>
            <div className="text-lg font-bold text-white">{fullName}</div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-sky-100">
            <div>
              <span className="text-sky-300/80 block text-[10px]">Drishti Unique ID:</span>
              <span className="font-mono font-bold tracking-wider">{drishtiId}</span>
            </div>
            {personalData?.village && (
              <div className="text-right">
                <span className="text-sky-300/80 block text-[10px]">Location:</span>
                <span className="font-medium truncate max-w-[120px] block">{personalData.village}, {personalData.district}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reassuring Feature list */}
        <div className="grid grid-cols-2 gap-3 text-left mb-8">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700">Eye Screening Records</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700">AI Triage Reports</span>
          </div>
        </div>

        {/* Primary CTA: Go to Dashboard */}
        <button
          type="button"
          onClick={handleDashboard}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-[#0E2F76] hover:bg-[#1a4499] active:scale-[0.99] transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] cursor-pointer"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
