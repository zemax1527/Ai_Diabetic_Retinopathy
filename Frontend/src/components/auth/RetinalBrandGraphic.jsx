import { ShieldCheck, Cpu, UserCheck } from 'lucide-react';

/**
 * RetinalBrandGraphic
 * Pure JavaScript component.
 * Subtle, modern retinal fundus-inspired graphic with gentle pulse
 * and 3 key healthcare trust indicators.
 */
export default function RetinalBrandGraphic() {
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Retinal Fundus Graphic */}
      <div className="relative w-36 h-36 xl:w-48 xl:h-48 flex items-center justify-center my-2 xl:my-4" aria-hidden="true">
        {/* Outer ambient glow */}
        <div
          className="absolute inset-0 rounded-full opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #38BDF8 0%, #0E2F76 65%, transparent 75%)',
            animationDuration: '3.5s',
          }}
        />

        {/* Retinal Fundus disk */}
        <div
          className="relative w-30 h-30 xl:w-40 xl:h-40 rounded-full overflow-hidden shadow-2xl border border-sky-400/20"
          style={{
            background: 'radial-gradient(circle at 35% 38%, #164e63 0%, #0c4a6e 35%, #082f49 70%, #031525 100%)',
          }}
        >
          {/* Fundus vessels and anatomy SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="vesselGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.6" />
              </linearGradient>
              <radialGradient id="opticDiscGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="maculaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#082F49" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0E7490" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Subtle retinal grid ring */}
            <circle cx="80" cy="80" r="68" fill="none" stroke="#38BDF8" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.35" />
            <circle cx="80" cy="80" r="46" fill="none" stroke="#2DD4BF" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.25" />

            {/* Optic Disc */}
            <circle cx="108" cy="72" r="14" fill="url(#opticDiscGrad)" />
            <circle cx="108" cy="72" r="8" fill="#FEF3C7" opacity="0.8" />

            {/* Macular Center */}
            <circle cx="62" cy="84" r="10" fill="url(#maculaGrad)" />
            <circle cx="62" cy="84" r="2.5" fill="#38BDF8" opacity="0.7" />

            {/* Superior temporal vessel branches */}
            <path
              d="M108 72 C96 52, 74 38, 48 42 C36 44, 24 54, 18 64"
              stroke="url(#vesselGrad)"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M84 46 C76 34, 60 28, 46 30"
              stroke="#38BDF8"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Inferior temporal vessel branches */}
            <path
              d="M108 72 C98 94, 76 114, 52 118 C38 120, 26 112, 18 100"
              stroke="url(#vesselGrad)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M82 108 C74 122, 58 130, 42 126"
              stroke="#2DD4BF"
              strokeWidth="1.1"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />

            {/* Nasal vessel branches */}
            <path
              d="M108 72 C124 64, 138 68, 148 76"
              stroke="#38BDF8"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M108 72 C126 82, 136 94, 144 104"
              stroke="#2DD4BF"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* AI target screening box over macula */}
            <rect
              x="50"
              y="72"
              width="24"
              height="24"
              rx="4"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.85"
            />
            <circle cx="50" cy="72" r="1.5" fill="#2DD4BF" />
            <circle cx="74" cy="72" r="1.5" fill="#2DD4BF" />
            <circle cx="50" cy="96" r="1.5" fill="#2DD4BF" />
            <circle cx="74" cy="96" r="1.5" fill="#2DD4BF" />
          </svg>

          {/* Calming AI Heat Shimmer */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 40% 55%, rgba(45, 212, 191, 0.22) 0%, rgba(56, 189, 248, 0.12) 40%, transparent 70%)',
            }}
          />
        </div>

        {/* Small floating status chips */}
        <div className="absolute -top-1 -right-2 bg-slate-900/90 backdrop-blur-md border border-sky-400/30 text-sky-200 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Grad-CAM Ready</span>
        </div>

        <div className="absolute -bottom-2 -left-2 bg-slate-900/90 backdrop-blur-md border border-teal-400/30 text-teal-200 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
          <span>AI Triage Active</span>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="w-full mt-3 space-y-2">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-left">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center flex-shrink-0 text-sky-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white text-xs font-semibold">Secure & Private</div>
            <div className="text-slate-300/70 text-[11px]">ABDM & DPDP Act compliance ready</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-left">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0 text-teal-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white text-xs font-semibold">AI-Assisted Screening</div>
            <div className="text-slate-300/70 text-[11px]">Explainable diabetic retinopathy classification</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-left">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0 text-indigo-300">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white text-xs font-semibold">Healthcare Professional Review</div>
            <div className="text-slate-300/70 text-[11px]">Clinician verified diagnostics & triage</div>
          </div>
        </div>
      </div>
    </div>
  );
}
