import { useState } from 'react';
import { User, Users, Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import AuthProgress from './AuthProgress';

/**
 * RoleSelectionStep
 * Pure JavaScript component.
 * Screen 2: Dedicated Role Selection page.
 * Presents 3 selectable role cards: Patient, Healthcare Worker, Doctor.
 * Admin is explicitly excluded.
 */
export default function RoleSelectionStep({ selectedRole: initialRole, onSelectRole, onBack }) {
  const [selectedRole, setSelectedRole] = useState(initialRole || 'patient');

  const roleOptions = [
    {
      id: 'patient',
      title: 'Patient',
      badge: 'Individual & Family Care',
      icon: User,
      description: 'Screen your eyes, view your screening history, and manage your health information.',
      cta: 'Continue as Patient',
      theme: {
        border: 'border-[#0E2F76]',
        bg: 'bg-blue-50/60',
        iconBg: 'bg-[#0E2F76]',
        iconText: 'text-white',
        ring: 'ring-2 ring-[#0E2F76]/20',
      },
      highlights: ['Personal Eye Health Record', 'AI Risk Assessment Summary', 'Direct Specialist Referral'],
    },
    {
      id: 'healthcare_worker',
      title: 'Healthcare Worker',
      badge: 'ASHA / ANM / Community Health',
      icon: Users,
      description: 'Conduct diabetic eye screening and manage patients in communities and healthcare camps.',
      cta: 'Continue as Healthcare Worker',
      theme: {
        border: 'border-teal-600',
        bg: 'bg-teal-50/60',
        iconBg: 'bg-teal-600',
        iconText: 'text-white',
        ring: 'ring-2 ring-teal-600/20',
      },
      highlights: ['Field Triage & Camp Screening', 'Offline-friendly Sync', 'Patient Roster Management'],
    },
    {
      id: 'doctor',
      title: 'Doctor',
      badge: 'Ophthalmologist / Clinician',
      icon: Stethoscope,
      description: 'Review screening results, referrals, and patient information.',
      cta: 'Continue as Doctor',
      theme: {
        border: 'border-indigo-600',
        bg: 'bg-indigo-50/60',
        iconBg: 'bg-indigo-600',
        iconText: 'text-white',
        ring: 'ring-2 ring-indigo-600/20',
      },
      highlights: ['Grad-CAM Heatmap Review', 'Diagnostic Sign-off & Reports', 'Tele-consultation Triage'],
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    onSelectRole(selectedRole);
  };

  const currentSelection = roleOptions.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col justify-center items-center py-3 sm:py-6 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 my-auto">
        {/* Progress indicator: Account (checked) -> 2 Role (active) -> 3 Personal Details */}
        <AuthProgress currentStep={2} role={selectedRole} />

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
            How will you use Drishti?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select your account type to configure your healthcare workflow.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-3.5">
          {roleOptions.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedRole(role.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRole(role.id);
                  }
                }}
                className={`relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 text-left outline-none ${
                  isSelected
                    ? `${role.theme.border} ${role.theme.bg} ${role.theme.ring} shadow-md`
                    : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top selection indicator check badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? `${role.theme.iconBg} ${role.theme.iconText} shadow-sm`
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#0E2F76] text-white shadow-xs'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Role title & badge */}
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    {role.badge}
                  </div>
                  <h3 className="text-base font-bold text-[#0D1B3E] mb-1">
                    {role.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-snug">
                    {role.description}
                  </p>

                  {/* Feature highlight bullet points */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                    {role.highlights.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected CTA indicator button */}
                <div className="mt-3">
                  <div
                    className={`w-full py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#0E2F76] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Role Notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Healthcare Worker & Doctor accounts require credential verification before clinical access.
          </span>
        </div>

        {/* Navigation Actions: Continue & Back */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-[#0E2F76] hover:bg-[#1a4499] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] cursor-pointer"
          >
            <span>{currentSelection ? currentSelection.cta : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
