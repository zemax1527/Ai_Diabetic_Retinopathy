import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Eye,
  Brain,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

// ─── Product Mockup ───────────────────────────────────────────────────────────

function FundusEye({ size = 160 }: { size?: number }) {
  return (
    <div
      className="fundus-ring flex-shrink-0 relative"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Retinal vessels (SVG overlay) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 160 160"
        style={{ borderRadius: '50%', opacity: 0.6 }}
      >
        {/* Optic disc */}
        <circle cx="98" cy="72" r="14" fill="rgba(255,220,140,0.55)" />
        <circle cx="98" cy="72" r="9" fill="rgba(255,240,180,0.7)" />
        {/* Main vessels */}
        <path d="M 98 72 Q 75 80 55 95 Q 42 105 35 120" stroke="rgba(180,50,30,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 98 72 Q 80 60 60 50 Q 45 43 30 45" stroke="rgba(160,40,20,0.65)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 98 72 Q 115 78 128 90 Q 138 100 140 115" stroke="rgba(190,55,35,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 98 72 Q 110 58 120 45 Q 128 35 132 25" stroke="rgba(170,45,25,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Fovea */}
        <circle cx="62" cy="82" r="5" fill="rgba(90,20,5,0.8)" />
        <circle cx="62" cy="82" r="2.5" fill="rgba(60,10,0,0.9)" />
        {/* Microaneurysms (pathological) */}
        <circle cx="50" cy="100" r="2.5" fill="rgba(220,60,30,0.8)" />
        <circle cx="75" cy="110" r="2" fill="rgba(220,60,30,0.75)" />
        <circle cx="40" cy="75" r="2" fill="rgba(220,60,30,0.7)" />
        {/* Exudates */}
        <circle cx="110" cy="95" r="4" fill="rgba(255,240,120,0.55)" />
        <circle cx="120" cy="88" r="3" fill="rgba(255,240,120,0.5)" />
      </svg>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto px-1 sm:px-0">
      {/* Floating cards - only shown on extra-large screens to prevent viewport overflow */}
      <div
        className="absolute xl:-left-6 2xl:-left-12 top-16 z-10 glass-card rounded-2xl px-4 py-3 animate-float-slow hidden xl:flex items-center gap-3 shadow-lg"
        aria-hidden="true"
      >
        <div className="w-8 h-8 rounded-xl bg-[rgba(14,47,118,0.1)] flex items-center justify-center">
          <Brain className="w-4 h-4 text-[#0E2F76]" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">AI Analysis</div>
          <div className="text-xs font-bold text-[#0D1B3E]">Processing Image</div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
      </div>

      <div
        className="absolute xl:-right-6 2xl:-right-10 top-24 z-10 glass-card rounded-2xl px-4 py-3 animate-float-medium hidden xl:flex flex-col gap-1 shadow-lg"
        aria-hidden="true"
      >
        <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Severity</div>
        <div className="text-sm font-bold text-[#F97316]">Moderate DR</div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-14 bg-[#F0F7FF] rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-gradient-to-r from-[#EAB308] to-[#F97316] rounded-full" />
          </div>
          <span className="text-[10px] text-[#4A5568]">Moderate</span>
        </div>
      </div>

      <div
        className="absolute xl:-right-4 2xl:-right-6 bottom-20 z-10 glass-card rounded-2xl px-4 py-3 animate-float-slow hidden xl:flex flex-col gap-1.5 shadow-lg"
        aria-hidden="true"
        style={{ animationDelay: '1s' }}
      >
        <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Confidence</div>
        <div className="text-xl font-black text-[#0E2F76]">94.2<span className="text-sm font-semibold">%</span></div>
        <div className="text-[10px] text-[#22C55E] font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> High confidence
        </div>
      </div>

      <div
        className="absolute xl:-left-4 2xl:-left-8 bottom-32 z-10 glass-card rounded-2xl px-4 py-3 animate-float-fast hidden xl:flex items-center gap-3 shadow-lg"
        aria-hidden="true"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="w-8 h-8 rounded-xl bg-[rgba(14,47,118,0.08)] flex items-center justify-center">
          <Eye className="w-4 h-4 text-[#0E2F76]" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Explainable Result</div>
          <div className="text-xs font-bold text-[#0D1B3E]">Grad-CAM Active</div>
        </div>
      </div>

      {/* Browser window mockup */}
      <div
        className="bg-white rounded-2xl sm:rounded-[28px] shadow-[0_24px_64px_rgba(14,47,118,0.12),_0_6px_20px_rgba(14,47,118,0.06)] border border-[rgba(14,47,118,0.06)] overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="bg-[#F8FAFC] border-b border-[rgba(14,47,118,0.06)] px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBE2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 bg-white rounded-lg border border-[rgba(14,47,118,0.08)] px-3 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 text-[#AAC0E1]">
              <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
            </div>
            <span className="text-[11px] text-[#4A5568] font-mono">drishti.ai/screening/analysis</span>
          </div>
          <div className="text-[10px] text-[#AAC0E1] font-medium">Drishti v1.0</div>
        </div>

        {/* App header bar */}
        <div className="bg-[#0D1B3E] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#AAC0E1]" />
            <span className="text-white font-semibold text-sm">Drishti Screening System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[11px] text-[#AAC0E1]">System Online</span>
          </div>
        </div>

        {/* Main content */}
        <div className="p-3.5 sm:p-5 bg-[#F5FEFF]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Patient info + image */}
            <div className="md:col-span-1 flex flex-col gap-4">
              {/* Patient info card */}
              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider mb-3">Patient Summary</div>
                <div className="space-y-2">
                  {[
                    { label: 'ID', value: 'DRN-2024-0847' },
                    { label: 'Eye', value: 'Right (OD)' },
                    { label: 'Camera', value: 'Fundus 45°' },
                    { label: 'Image Quality', value: 'Good' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-[11px] text-[#718096]">{item.label}</span>
                      <span className="text-[11px] font-semibold text-[#0D1B3E]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fundus image card */}
              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm flex flex-col items-center gap-3">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider self-start">Fundus Image</div>
                <FundusEye size={120} />
                <div className="text-[10px] text-[#718096]">Right Eye · 45° Field of View</div>
              </div>
            </div>

            {/* Center: Analysis result */}
            <div className="md:col-span-1 flex flex-col gap-4">
              {/* Prediction */}
              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider mb-3">AI Prediction</div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#0D1B3E]">Moderate DR</span>
                  <span className="px-2 py-0.5 bg-[rgba(249,115,22,0.1)] text-[#F97316] rounded-full text-[10px] font-bold">Stage 3</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#718096]">Confidence</span>
                    <span className="font-semibold text-[#0D1B3E]">94.2%</span>
                  </div>
                  <div className="h-2 bg-[#F0F7FF] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0E2F76] to-[#2563EB] rounded-full transition-all duration-1000" style={{ width: '94.2%' }} />
                  </div>
                </div>
              </div>

              {/* Severity scale */}
              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider mb-3">DR Severity Classification</div>
                <div className="space-y-1.5">
                  {['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative'].map((stage, i) => (
                    <div key={stage} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${i === 2 ? 'bg-[rgba(249,115,22,0.08)]' : ''}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        i === 0 ? 'bg-[#22C55E]' :
                        i === 1 ? 'bg-[#EAB308]' :
                        i === 2 ? 'bg-[#F97316]' :
                        i === 3 ? 'bg-[#EF4444]' : 'bg-[#7C3AED]'
                      }`} />
                      <span className={`text-[10px] ${i === 2 ? 'font-bold text-[#F97316]' : 'text-[#718096]'}`}>{stage}</span>
                      {i === 2 && <span className="ml-auto text-[9px] font-semibold text-[#F97316] bg-[rgba(249,115,22,0.1)] px-1.5 py-0.5 rounded-full">Detected</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Explainability heatmap */}
            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm flex-1">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider mb-3">Explainability (Grad-CAM)</div>
                <div className="relative flex items-center justify-center">
                  <FundusEye size={110} />
                  <div className="heatmap-overlay absolute inset-0 flex items-center justify-center" style={{ borderRadius: '50%', width: 110, height: 110, margin: 'auto' }} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #22C55E, #EAB308, #F97316, #EF4444)' }} />
                  <div className="flex justify-between w-full text-[9px] text-[#718096] absolute">
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-[#718096] mt-1">
                  <span>Low attention</span>
                  <span>High attention</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[rgba(14,47,118,0.06)] shadow-sm">
                <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider mb-2">Screening Status</div>
                <div className="flex items-center gap-2 p-2 bg-[rgba(249,115,22,0.06)] rounded-xl border border-[rgba(249,115,22,0.12)]">
                  <Activity className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-[#F97316]">Referral Suggested</div>
                    <div className="text-[9px] text-[#718096]">Ophthalmology consultation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature cards ────────────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    title: 'Explainable AI',
    desc: 'Visual Grad-CAM heatmaps show where the model focuses, making AI decisions more transparent.',
  },
  {
    icon: Eye,
    title: 'Retinal Analysis',
    desc: 'Analyzes fundus images for DR indicators including microaneurysms, haemorrhages, and exudates.',
  },
  {
    icon: Activity,
    title: 'Severity Grading',
    desc: 'Classifies diabetic retinopathy from No DR to Proliferative across a five-stage severity scale.',
  },
  {
    icon: Layers,
    title: 'Healthcare Workflow',
    desc: 'Structured results that support healthcare workers and doctors during screening and triage.',
  },
];

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={sectionRef}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="reveal animate-slide-up">
              <span className="badge">
                <Sparkles className="w-3 h-3" />
                Explainable AI · Retinal Screening · Rural Healthcare
              </span>
            </div>

            {/* Headline */}
            <h1
              className="reveal reveal-delay-1 mt-6 font-extrabold tracking-tight text-[#0D1B3E] text-balance break-words"
              style={{ fontSize: 'clamp(30px, 5.5vw, 68px)', lineHeight: 1.1 }}
            >
              AI-Powered Eye Screening,{' '}
              <br className="hidden md:block" />
              Built to Make{' '}
              <span className="text-[#0E2F76]">Early Detection</span>{' '}
              Smarter.
            </h1>

            {/* Subheading */}
            <p className="reveal reveal-delay-2 mt-6 text-lg text-[#4A5568] leading-relaxed max-w-2xl mx-auto">
              Drishti combines retinal image analysis, explainable AI, and healthcare workflows to support early diabetic retinopathy screening and district-level triage.
            </p>

            {/* CTAs */}
            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/technology" className="btn-primary">
                Explore Drishti
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/how-it-works" className="btn-secondary">
                <Play className="w-4 h-4" />
                See How It Works
              </Link>
            </div>

            {/* Trust badges */}
            <div className="reveal reveal-delay-4 mt-10 flex flex-wrap items-center justify-center gap-6 text-[13px] text-[#718096]">
              {[
                { icon: ShieldCheck, label: 'Smart India Hackathon 2026' },
                { icon: CheckCircle2, label: 'Explainable AI' },
                { icon: TrendingUp, label: 'District-Level Triage' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-[#0E2F76]/70" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product mockup */}
          <div className="reveal reveal-delay-5 mt-16 lg:mt-20">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ── Feature overview ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="badge mb-4">Core Capabilities</span>
            <h2
              className="font-bold text-[#0D1B3E] text-balance"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.15 }}
            >
              Everything needed for intelligent{' '}
              <span className="text-[#0E2F76]">retinal screening</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${i + 1} feature-card bg-[#F5FEFF] rounded-[24px] p-6 border border-[rgba(14,47,118,0.07)]`}
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-[rgba(14,47,118,0.1)] shadow-sm flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#0E2F76]" />
                </div>
                <h3 className="font-bold text-[#0D1B3E] text-base mb-2">{f.title}</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works teaser ── */}
      <section className="py-20 lg:py-28 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="badge mb-5">The Process</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5 text-balance"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', lineHeight: 1.15 }}
              >
                From retinal image to actionable{' '}
                <span className="text-[#0E2F76]">screening insight</span>
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-8">
                Drishti takes a fundus photograph through a validated pipeline: image quality assessment, AI analysis, severity classification, visual explainability, and structured clinical support.
              </p>
              <Link to="/how-it-works" className="btn-primary inline-flex">
                See Full Process
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="reveal reveal-delay-2">
              <div className="bg-white rounded-[28px] p-6 border border-[rgba(14,47,118,0.07)] shadow-[var(--shadow-elevated)]">
                {[
                  { num: '01', label: 'Capture', sub: 'Fundus camera image acquisition', color: '#0E2F76' },
                  { num: '02', label: 'Quality Check', sub: 'Automated image validation', color: '#1a4499' },
                  { num: '03', label: 'AI Analysis', sub: 'Deep learning model inference', color: '#2563EB' },
                  { num: '04', label: 'Explainability', sub: 'Grad-CAM visual explanation', color: '#3B82F6' },
                  { num: '05', label: 'Clinical Triage', sub: 'Structured healthcare workflow', color: '#60A5FA' },
                ].map((step, i, arr) => (
                  <div key={step.num} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background: step.color }}
                      >
                        {step.num}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-px h-7 bg-gradient-to-b from-[#AAC0E1] to-transparent my-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <div className="font-semibold text-[#0D1B3E] text-sm">{step.label}</div>
                      <div className="text-[#718096] text-xs mt-0.5">{step.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── XAI teaser ── */}
      <section className="py-20 lg:py-28 bg-[#0D1B3E] overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }} />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="reveal">
              <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#AAC0E1', borderColor: 'rgba(255,255,255,0.15)' }}>
                Explainability
              </span>
            </div>
            <h2
              className="reveal reveal-delay-1 mt-5 font-bold text-white text-balance"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.12 }}
            >
              Don't just predict.{' '}
              <span className="text-[#AAC0E1]">Explain.</span>
            </h2>
            <p className="reveal reveal-delay-2 mt-5 text-[#AAC0E1]/80 text-base leading-relaxed">
              Drishti shows where the AI model focuses using visual heatmaps, making results more understandable for healthcare workers and doctors.
            </p>
            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/explainable-ai" className="btn-primary">
                Explore Explainability
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/technology" className="btn-secondary" style={{ color: '#AAC0E1', borderColor: 'rgba(170,192,225,0.3)' }}>
                View Technology
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact CTA ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal">
            <span className="badge mb-5">Impact</span>
            <h2
              className="font-bold text-[#0D1B3E] text-balance mb-5"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', lineHeight: 1.15 }}
            >
              Connecting screening with{' '}
              <span className="text-[#0E2F76]">healthcare decisions</span>
            </h2>
            <p className="text-[#4A5568] text-base leading-relaxed max-w-xl mx-auto mb-8">
              From patient to doctor to district hospital — Drishti supports structured triage and referral workflows in real healthcare environments.
            </p>
            <Link to="/impact" className="btn-primary">
              See the Impact
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
