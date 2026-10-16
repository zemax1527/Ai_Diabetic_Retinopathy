import { Link } from 'react-router-dom';
import { Eye, Brain, ShieldCheck, ChevronRight, Target, Layers, AlertCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

function FundusEyeLarge({ showHeatmap = false }: { showHeatmap?: boolean }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '100%' }}>
      <div className="absolute inset-0 fundus-ring" aria-hidden="true">
        {/* Retinal SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 300"
          style={{ borderRadius: '50%', opacity: 0.65 }}
        >
          <circle cx="183" cy="135" r="26" fill="rgba(255,220,140,0.55)" />
          <circle cx="183" cy="135" r="17" fill="rgba(255,240,180,0.7)" />
          <path d="M 183 135 Q 140 150 103 178 Q 79 197 65 225" stroke="rgba(180,50,30,0.7)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <path d="M 183 135 Q 150 112 113 93 Q 84 80 56 84" stroke="rgba(160,40,20,0.65)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 183 135 Q 215 145 240 168 Q 259 187 263 215" stroke="rgba(190,55,35,0.6)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 183 135 Q 207 108 225 84 Q 240 64 248 46" stroke="rgba(170,45,25,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 183 135 Q 155 125 135 100 Q 118 78 116 52" stroke="rgba(170,45,25,0.45)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="116" cy="154" r="9" fill="rgba(90,20,5,0.8)" />
          <circle cx="116" cy="154" r="4.5" fill="rgba(60,10,0,0.9)" />
          <circle cx="94" cy="188" r="4.5" fill="rgba(220,60,30,0.85)" />
          <circle cx="140" cy="207" r="3.5" fill="rgba(220,60,30,0.8)" />
          <circle cx="75" cy="140" r="3.5" fill="rgba(220,60,30,0.75)" />
          <circle cx="168" cy="215" r="3" fill="rgba(220,60,30,0.7)" />
          <circle cx="205" cy="178" r="7" fill="rgba(255,240,120,0.6)" />
          <circle cx="225" cy="165" r="5.5" fill="rgba(255,240,120,0.55)" />
          <circle cx="195" cy="195" r="4.5" fill="rgba(255,240,120,0.5)" />
          <circle cx="55" cy="100" r="7" fill="rgba(255,255,255,0.15)" />
          <circle cx="240" cy="130" r="6" fill="rgba(255,255,255,0.12)" />
        </svg>

        {/* Heatmap overlay */}
        {showHeatmap && (
          <div
            className="absolute inset-0"
            style={{
              borderRadius: '50%',
              background: `
                radial-gradient(ellipse 38% 28% at 35% 55%, rgba(239, 68, 68, 0.72) 0%, rgba(249, 115, 22, 0.5) 30%, rgba(234, 179, 8, 0.25) 55%, transparent 75%),
                radial-gradient(ellipse 22% 18% at 67% 45%, rgba(239, 68, 68, 0.6) 0%, rgba(249, 115, 22, 0.35) 35%, transparent 60%),
                radial-gradient(ellipse 18% 14% at 28% 70%, rgba(234, 179, 8, 0.55) 0%, rgba(249, 115, 22, 0.3) 40%, transparent 60%),
                radial-gradient(ellipse 14% 12% at 72% 62%, rgba(234, 179, 8, 0.45) 0%, transparent 55%),
                radial-gradient(ellipse 10% 8% at 47% 30%, rgba(249, 115, 22, 0.35) 0%, transparent 50%)
              `,
              mixBlendMode: 'multiply',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

const xaiCards = [
  {
    icon: Eye,
    title: 'Transparent',
    desc: 'Understand why the model generated a particular result. Visual heatmaps show which retinal regions influenced the prediction.',
  },
  {
    icon: Target,
    title: 'Interpretable',
    desc: 'Visual explanations make AI outputs easier to review. Healthcare workers can see where the model is focusing its attention.',
  },
  {
    icon: ShieldCheck,
    title: 'Trustworthy Workflow',
    desc: 'Supports healthcare professionals during screening and triage. Explainability adds a layer of transparency to AI-assisted decisions.',
  },
];

const gradcamSteps = [
  { num: '01', label: 'Forward pass', desc: 'Image is passed through the CNN to produce a prediction.' },
  { num: '02', label: 'Gradient computation', desc: 'Gradients of the class score with respect to feature maps are computed.' },
  { num: '03', label: 'Heatmap generation', desc: 'Weighted feature maps are combined to create a spatial attention heatmap.' },
  { num: '04', label: 'Overlay', desc: 'The heatmap is resized and overlaid on the original fundus image for interpretation.' },
];

export default function ExplainableAI() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={ref}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal"><span className="badge">Explainability</span></div>
          <h1
            className="reveal reveal-delay-1 mt-5 font-extrabold text-[#0D1B3E] text-balance"
            style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1.08 }}
          >
            Don't Just Predict.
            <br />
            <span className="text-[#0E2F76]">Explain.</span>
          </h1>
          <p className="reveal reveal-delay-2 mt-6 text-[#4A5568] text-base leading-relaxed max-w-2xl mx-auto">
            Drishti is designed to make AI-assisted screening results easier to understand by showing where the model is focusing during retinal analysis.
          </p>
        </div>
      </section>

      {/* ── Split-screen heatmap comparison ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2
              className="font-bold text-[#0D1B3E]"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              Retinal Image vs Explainability Heatmap
            </h2>
            <p className="text-[#4A5568] text-base mt-3 max-w-lg mx-auto">
              The same fundus image — before and after Grad-CAM attention overlay. Red regions indicate areas of highest model attention.
            </p>
          </div>

          <div className="reveal reveal-delay-2 relative pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {/* Original image */}
              <div className="relative">
                <div className="bg-[#0D1B3E] rounded-[28px] p-6 lg:p-8 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 30%, #2563EB, transparent 50%)' }} />
                  <div className="relative">
                    <div className="text-xs font-semibold text-[#AAC0E1]/60 uppercase tracking-wider mb-5">Original Fundus Image</div>
                    <div className="max-w-[280px] mx-auto">
                      <FundusEyeLarge showHeatmap={false} />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="text-xs text-[#AAC0E1]/60">Right Eye · 45° FOV</div>
                      <div className="text-xs font-medium text-[#AAC0E1] bg-white/8 px-2.5 py-1 rounded-full">No overlay</div>
                    </div>
                  </div>
                </div>

                {/* Label card */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2.5 sm:gap-3 shadow-lg max-w-[calc(100%-32px)] whitespace-nowrap">
                  <Eye className="w-4 h-4 text-[#0E2F76] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Input Image</div>
                    <div className="text-xs font-bold text-[#0D1B3E] truncate">Raw fundus photograph</div>
                  </div>
                </div>
              </div>

              {/* Heatmap image */}
              <div className="relative mt-8 md:mt-0">
                <div className="bg-[#0D1B3E] rounded-[28px] p-6 lg:p-8 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 30%, #EF4444, transparent 50%)' }} />
                  <div className="relative">
                    <div className="text-xs font-semibold text-[#AAC0E1]/60 uppercase tracking-wider mb-5">Grad-CAM Explainability Overlay</div>
                    <div className="max-w-[280px] mx-auto">
                      <FundusEyeLarge showHeatmap={true} />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="text-xs text-[#AAC0E1]/60">AI attention regions</div>
                      <div className="text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">Heatmap active</div>
                    </div>
                  </div>
                </div>

                {/* Floating explanation cards */}
                <div className="absolute -top-4 right-2 sm:-right-4 glass-card rounded-2xl px-4 py-3 shadow-lg animate-float-slow hidden sm:block">
                  <div className="text-[9px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Model Focus</div>
                  <div className="text-xs font-bold text-[#EF4444]">High Attention Region</div>
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex flex-col gap-1.5 shadow-lg max-w-[calc(100%-32px)] whitespace-nowrap">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Brain className="w-4 h-4 text-[#0E2F76] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Prediction</div>
                      <div className="text-xs font-bold text-[#F97316]">Moderate DR</div>
                    </div>
                    <div className="ml-1 sm:ml-2 border-l border-[rgba(14,47,118,0.1)] pl-2 sm:pl-3">
                      <div className="text-[10px] font-semibold text-[#0E2F76]/60 uppercase tracking-wider">Confidence</div>
                      <div className="text-xs font-bold text-[#0E2F76]">94.2%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap legend */}
            <div className="mt-12 flex items-center gap-4 justify-center">
              <span className="text-sm text-[#718096]">Low attention</span>
              <div
                className="flex-1 max-w-xs h-3 rounded-full"
                style={{ background: 'linear-gradient(90deg, #22C55E, #EAB308, #F97316, #EF4444)' }}
              />
              <span className="text-sm text-[#718096]">High attention</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Grad-CAM works ── */}
      <section className="py-20 lg:py-28 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="badge mb-5">Technique</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.15 }}
              >
                How Grad-CAM works
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-6">
                Gradient-weighted Class Activation Mapping (Grad-CAM) produces visual explanations for CNN predictions. It uses the gradients of the target class flowing into the final convolutional layer to create a localization map highlighting important regions.
              </p>
              <div className="p-4 bg-[rgba(14,47,118,0.04)] rounded-2xl border border-[rgba(14,47,118,0.08)] flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#0E2F76] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#4A5568] leading-relaxed">
                  Grad-CAM explanations highlight model attention areas. They do not guarantee clinical accuracy and should be interpreted by qualified professionals.
                </p>
              </div>
            </div>

            <div className="reveal reveal-delay-2 space-y-4">
              {gradcamSteps.map((step, i) => (
                <div key={step.num} className={`reveal reveal-delay-${i + 1} flex items-start gap-4 bg-white rounded-2xl p-5 border border-[rgba(14,47,118,0.07)] shadow-sm`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E2F76] to-[#2563EB] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0D1B3E] text-sm mb-1">{step.label}</div>
                    <div className="text-[#718096] text-xs leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why explainability matters ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="badge mb-5">Why It Matters</span>
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              Why Explainability Matters
            </h2>
            <p className="text-[#4A5568] text-base max-w-xl mx-auto leading-relaxed">
              In healthcare AI, understanding why a model produced a result is as important as the result itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {xaiCards.map((card, i) => (
              <div
                key={card.title}
                className={`reveal reveal-delay-${i + 1} feature-card bg-[#F5FEFF] rounded-[24px] p-8 border border-[rgba(14,47,118,0.07)]`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[rgba(14,47,118,0.1)] shadow-sm flex items-center justify-center mb-5">
                  <card.icon className="w-5.5 h-5.5 text-[#0E2F76]" />
                </div>
                <h3 className="font-bold text-[#0D1B3E] text-lg mb-3">{card.title}</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explainability pipeline ── */}
      <section className="py-20 lg:py-28 bg-[#0D1B3E] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }} />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-14 reveal">
            <h2
              className="font-bold text-white"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              Explainability in the pipeline
            </h2>
            <p className="text-[#AAC0E1]/70 text-base mt-4 max-w-lg mx-auto">
              Explainability is embedded directly into Drishti's inference pipeline — not added as an afterthought.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 reveal reveal-delay-2">
            {[
              { label: 'Fundus Image', icon: Eye },
              { label: 'Preprocessing', icon: Layers },
              { label: 'CNN Inference', icon: Brain },
              { label: 'Class Score', icon: Target },
              { label: 'Grad-CAM', icon: Eye },
              { label: 'Visual Output', icon: ShieldCheck },
            ].map((item, i) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#AAC0E1]" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80">{item.label}</div>
                  <div className="text-[9px] text-[#AAC0E1]/50 mt-0.5">Stage {i + 1}</div>
                </div>
                {i < 5 && (
                  <div className="hidden lg:block absolute" style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center reveal reveal-delay-3">
            <Link to="/impact" className="btn-primary">
              See the Impact
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
