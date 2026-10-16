import { Check } from 'lucide-react';

/**
 * AuthProgress
 * Pure JavaScript component.
 * Dynamically displays the registration journey based on the selected role:
 * - Patient: Account -> Role -> Personal Details -> Complete
 * - Healthcare Worker: Account -> Role -> Personal Details -> Professional Details -> Verification
 * - Doctor: Account -> Role -> Personal Details -> Professional Details -> Verification
 */
export default function AuthProgress({ currentStep, role }) {
  // Define steps according to role
  const isProfessional = role === 'healthcare_worker' || role === 'doctor';

  const steps = isProfessional
    ? [
        { id: 1, key: 'account', label: 'Account' },
        { id: 2, key: 'role', label: 'Role' },
        { id: 3, key: 'personal', label: 'Personal Details' },
        { id: 4, key: 'professional', label: 'Professional Details' },
        { id: 5, key: 'verification', label: 'Verification' },
      ]
    : [
        { id: 1, key: 'account', label: 'Account' },
        { id: 2, key: 'role', label: 'Role' },
        { id: 3, key: 'personal', label: 'Personal Details' },
        { id: 4, key: 'complete', label: 'Complete' },
      ];

  const currentStepObj = steps.find(s => s.id === currentStep) || steps[0];

  return (
    <div className="w-full mb-3.5 sm:mb-4">
      {/* Mobile step pill header */}
      <div className="sm:hidden flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#0E2F76] text-white text-[11px] font-bold flex items-center justify-center">
            {currentStep}
          </span>
          <span className="text-xs font-semibold text-[#0D1B3E]">
            {currentStepObj.label}
          </span>
        </div>
        <span className="text-[10px] font-medium text-slate-500">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      {/* Desktop / Tablet progress bar */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Background track line */}
        <div
          className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-slate-200 z-0"
          aria-hidden="true"
        />

        {/* Completed track line highlight */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] bg-[#0E2F76] transition-all duration-300 z-0"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100))}%`,
          }}
          aria-hidden="true"
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isFuture = currentStep < step.id;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center group"
            >
              {/* Step circle indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#0E2F76] text-white ring-4 ring-blue-50 shadow-sm'
                    : isCurrent
                    ? 'bg-white border-2 border-[#0E2F76] text-[#0E2F76] ring-4 ring-blue-100/70 shadow-sm font-extrabold'
                    : 'bg-white border border-slate-300 text-slate-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`text-[11px] mt-1.5 font-medium whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-[#0E2F76] font-bold'
                    : isCompleted
                    ? 'text-slate-700 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
