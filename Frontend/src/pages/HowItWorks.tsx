import { Camera, CheckSquare, Brain, Eye, Stethoscope, ArrowDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

const steps = [
  {
    num: '01',
    icon: Camera,
    title: 'Capture',
    short: 'Retinal image captured using a fundus camera.',
    detail: 'A non-mydriatic fundus camera captures a high-resolution photograph of the patient\'s retina. The image is the primary input for the AI screening pipeline.',
    color: '#0E2F76',
  },
  {
    num: '02',
    icon: CheckSquare,
    title: 'Image Quality Check',
    short: 'The system validates image quality before analysis.',
    detail: 'Automated quality assessment evaluates illumination, focus, field of view, and artifacts. Poor quality images are flagged before AI inference to ensure reliability.',
    color: '#1a4499',
  },
  {
    num: '03',
    icon: Brain,
    title: 'AI Analysis',
    short: 'AI analyzes retinal patterns and detects relevant DR indicators.',
    detail: 'A deep learning model processes the preprocessed fundus image, analyzing retinal features associated with diabetic retinopathy including microaneurysms, haemorrhages, and exudates.',
    color: '#2563EB',
  },
  {
    num: '04',
    icon: Eye,
    title: 'Explainable Result',
    short: 'The system produces prediction, confidence, and visual explanation.',
    detail: 'Grad-CAM generates a visual heatmap highlighting regions the model focused on. Severity classification and confidence score are reported alongside the explainability map.',
    color: '#3B82F6',
  },
  {
    num: '05',
    icon: Stethoscope,
    title: 'Clinical Triage',
    short: 'Results support healthcare workers and doctors in deciding appropriate follow-up.',
    detail: 'Structured screening results are presented to healthcare workers and doctors to support referral decisions and district-level triage workflows.',
    color: '#60A5FA',
  },
];

const pipelineStages = [
  { label: 'Fundus Image', sub: 'Input from fundus camera' },
  { label: 'Image Validation', sub: 'Quality assessment' },
  { label: 'Preprocessing', sub: 'Normalization & enhancement' },
  { label: 'AI Model', sub: 'Deep learning inference' },
  { label: 'Severity Classification', sub: 'DR stage detection' },
  { label: 'Explainability', sub: 'Grad-CAM heatmap' },
  { label: 'Screening Result', sub: 'Actionable output' },
];

export default function HowItWorks() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={ref}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal">
            <span className="badge">The Pipeline</span>
          </div>
          <h1
            className="reveal reveal-delay-1 mt-5 font-extrabold text-[#0D1B3E] text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.1 }}
          >
            From Retinal Image to{' '}
            <span className="text-[#0E2F76]">Actionable</span>{' '}
            Screening Insight
          </h1>
          <p className="reveal reveal-delay-2 mt-5 text-[#4A5568] text-base leading-relaxed max-w-2xl mx-auto">
            Drishti's screening pipeline takes a fundus photograph through structured stages — from quality validation and AI inference to visual explainability and clinical triage support.
          </p>
        </div>
      </section>

      {/* ── 5-Step Process ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <h2
              className="font-bold text-[#0D1B3E]"
              style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.2 }}
            >
              The Five-Stage Screening Pipeline
            </h2>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${(i % 3) + 1} feature-card w-full bg-[#F5FEFF] rounded-[24px] p-6 border border-[rgba(14,47,118,0.07)] flex flex-col justify-between gap-4`}
              >
                <div>
                  {/* Number + icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${step.color}, #60A5FA)` }}
                    >
                      {step.num}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white border border-[rgba(14,47,118,0.1)] shadow-sm flex items-center justify-center">
                      <step.icon className="w-4.5 h-4.5 text-[#0E2F76]" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0D1B3E] text-base mb-2">{step.title}</h3>
                    <p className="text-[#718096] text-xs leading-relaxed mb-3">{step.short}</p>
                    <p className="text-[#4A5568] text-xs leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Detailed step cards ── */}
      <section className="py-20 lg:py-28 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="badge mb-4">Deep Dive</span>
            <h2
              className="font-bold text-[#0D1B3E]"
              style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.2 }}
            >
              Each step in detail
            </h2>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${(i % 3) + 1} bg-white rounded-[24px] p-8 border border-[rgba(14,47,118,0.07)] shadow-[var(--shadow-card)] flex flex-col md:flex-row gap-6 items-start`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${step.color}, #60A5FA)` }}
                >
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-bold text-[#0D1B3E] text-xl">{step.title}</h3>
                    <div className="w-7 h-7 rounded-xl bg-[rgba(14,47,118,0.06)] flex items-center justify-center">
                      <step.icon className="w-3.5 h-3.5 text-[#0E2F76]" />
                    </div>
                  </div>
                  <p className="text-[#4A5568] text-base leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technical Pipeline Diagram ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="badge mb-5">Technical Overview</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.15 }}
              >
                The complete processing pipeline
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-6">
                Each stage in the pipeline is designed to ensure the AI model receives properly validated input and produces structured, explainable output for healthcare workflows.
              </p>
              <Link to="/technology" className="btn-primary inline-flex">
                Explore the Technology
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pipeline diagram */}
            <div className="reveal reveal-delay-2">
              <div className="bg-[#0D1B3E] rounded-[28px] p-8 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none opacity-20"
                  style={{ background: 'radial-gradient(ellipse at center, #2563EB, transparent 65%)' }} />

                <div className="relative flex flex-col items-center gap-0">
                  {pipelineStages.map((stage, i) => (
                    <div key={stage.label} className="flex flex-col items-center w-full">
                      <div className="bg-white/8 hover:bg-white/12 transition-colors rounded-2xl px-6 py-3.5 w-full border border-white/8 flex items-center justify-between group cursor-default">
                        <div>
                          <div className="text-white font-semibold text-sm">{stage.label}</div>
                          <div className="text-[#AAC0E1]/60 text-xs mt-0.5">{stage.sub}</div>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-[rgba(14,47,118,0.5)] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#AAC0E1]" />
                        </div>
                      </div>
                      {i < pipelineStages.length - 1 && (
                        <div className="flex flex-col items-center my-1">
                          <div className="w-px h-4 bg-gradient-to-b from-[#AAC0E1]/50 to-[#AAC0E1]/20" />
                          <ArrowDown className="w-3.5 h-3.5 text-[#AAC0E1]/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 lg:py-20 bg-[#F5FEFF] border-t border-[rgba(14,47,118,0.06)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal">
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 38px)' }}
            >
              Understand the AI behind the pipeline
            </h2>
            <p className="text-[#4A5568] text-base mb-7 max-w-lg mx-auto">
              Explore the technology powering Drishti's retinal analysis and explainability engine.
            </p>
            <Link to="/technology" className="btn-primary">
              View Technology
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
