import { Link } from 'react-router-dom';
import {
  Cpu,
  Layers,
  ZoomIn,
  Maximize2,
  Sliders,
  Sun,
  Palette,
  Target,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';


const preprocessingSteps = [
  { icon: CheckCircle2, label: 'Image Quality Validation', desc: 'Validates focus, illumination, and field coverage.' },
  { icon: ZoomIn, label: 'Cropping', desc: 'Isolates the circular retinal region of interest.' },
  { icon: Maximize2, label: 'Resizing', desc: 'Standardizes image dimensions for model input.' },
  { icon: Sliders, label: 'Noise Handling', desc: 'Reduces acquisition artifacts and noise.' },
  { icon: Sun, label: 'Brightness & Contrast', desc: 'Normalizes luminance for consistent visibility.' },
  { icon: Layers, label: 'Illumination Correction', desc: 'Corrects uneven retinal illumination patterns.' },
  { icon: Palette, label: 'Color Normalization', desc: 'Standardizes color distribution across images.' },
];

const drFeatures = [
  {
    title: 'Microaneurysms',
    desc: 'Small balloon-like swellings in the blood vessels of the retina, typically the earliest sign of diabetic retinopathy.',
    color: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    dot: '#EF4444',
  },
  {
    title: 'Haemorrhages',
    desc: 'Bleeding into the retina from damaged blood vessels. Dot and blot haemorrhages indicate progressive disease.',
    color: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.2)',
    dot: '#DC2626',
  },
  {
    title: 'Hard Exudates',
    desc: 'Deposits of lipid and protein that leak from damaged vessels, appearing as bright yellow-white patches on the retina.',
    color: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.2)',
    dot: '#EAB308',
  },
  {
    title: 'Cotton-Wool Spots',
    desc: 'Infarcts in the nerve fibre layer that appear as fluffy white patches, indicating disrupted blood supply.',
    color: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.25)',
    dot: '#94A3B8',
  },
];

const severityStages = [
  { label: 'No DR', desc: 'No detectable signs of diabetic retinopathy.', color: '#22C55E', width: '20%' },
  { label: 'Mild', desc: 'Microaneurysms only.', color: '#EAB308', width: '40%' },
  { label: 'Moderate', desc: 'More than just microaneurysms but less than severe.', color: '#F97316', width: '60%' },
  { label: 'Severe', desc: 'Extensive haemorrhages, venous beading, or IRMA.', color: '#EF4444', width: '#EF4444'.length > 0 ? '80%' : '80%' },
  { label: 'Proliferative DR', desc: 'Neovascularisation — the most advanced stage.', color: '#7C3AED', width: '100%' },
];

export default function Technology() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={ref}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal"><span className="badge">Technology</span></div>
          <h1
            className="reveal reveal-delay-1 mt-5 font-extrabold text-[#0D1B3E] text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.1 }}
          >
            Inside the{' '}
            <span className="text-[#0E2F76]">Intelligence</span>{' '}
            Behind Drishti
          </h1>
          <p className="reveal reveal-delay-2 mt-5 text-[#4A5568] text-base leading-relaxed max-w-2xl mx-auto">
            From preprocessing to prediction, Drishti uses a structured AI pipeline designed for accurate and explainable retinal analysis.
          </p>
        </div>
      </section>

      {/* ── Image Processing ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="mb-8 reveal">
            <span className="badge mb-5">Stage 1</span>
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              Image Processing
            </h2>
            <p className="text-[#4A5568] text-base leading-relaxed max-w-xl">
              Before AI inference, each fundus image passes through a validated preprocessing pipeline to ensure consistent quality and representation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {preprocessingSteps.map((step, i) => (
              <div
                key={step.label}
                className={`reveal reveal-delay-${(i % 4) + 1} feature-card bg-[#F5FEFF] rounded-[20px] p-5 border border-[rgba(14,47,118,0.07)] flex flex-col gap-3`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[rgba(14,47,118,0.1)] shadow-sm flex items-center justify-center">
                  <step.icon className="w-4.5 h-4.5 text-[#0E2F76]" />
                </div>
                <div>
                  <div className="font-semibold text-[#0D1B3E] text-sm mb-1">{step.label}</div>
                  <div className="text-[#718096] text-xs leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Detection ── */}
      <section className="py-12 lg:py-16 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="reveal">
              <span className="badge mb-5">Stage 2</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
              >
                AI Detection
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-4">
                The AI model analyzes retinal patterns to identify features associated with diabetic retinopathy. The model processes the entire fundus image and produces a severity prediction along with feature-level attention maps.
              </p>
              <p className="text-[#4A5568] text-sm leading-relaxed">
                <span className="font-medium text-[#0D1B3E]">Note:</span> AI results are intended to support, not replace, clinical judgment. All screening outputs should be reviewed by qualified healthcare professionals.
              </p>
            </div>

            <div className="reveal reveal-delay-2 grid grid-cols-1 gap-4">
              {drFeatures.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`reveal reveal-delay-${i + 1} feature-card rounded-[20px] p-5 border flex items-start gap-4`}
                  style={{ background: feature.color, borderColor: feature.border }}
                >
                  <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: feature.dot }} />
                  <div>
                    <div className="font-semibold text-[#0D1B3E] text-sm mb-1">{feature.title}</div>
                    <div className="text-[#4A5568] text-xs leading-relaxed">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Severity Assessment ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center reveal">
            <span className="badge mb-5">Stage 3</span>
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              Severity Assessment
            </h2>
            <p className="text-[#4A5568] text-base leading-relaxed max-w-xl mx-auto">
              The model classifies retinopathy across five stages based on the International Clinical Diabetic Retinopathy scale.
            </p>
          </div>

          {/* Severity visual bar */}
          <div className="reveal mb-10">
            <div className="h-4 rounded-full severity-bar mb-5 shadow-sm" />
            <div className="flex justify-between text-xs font-medium text-[#4A5568]">
              <span>No DR</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
              <span>Proliferative DR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {severityStages.map((stage, i) => (
              <div
                key={stage.label}
                className={`reveal reveal-delay-${i + 1} flex items-center gap-5 bg-[#F5FEFF] rounded-[20px] p-5 border border-[rgba(14,47,118,0.07)]`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm"
                  style={{ background: stage.color }}
                >
                  {i}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#0D1B3E] text-sm mb-1">{stage.label}</div>
                  <div className="text-[#718096] text-xs leading-relaxed mb-2">{stage.desc}</div>
                  <div className="h-1.5 bg-[rgba(14,47,118,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: stage.width, background: stage.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-[rgba(14,47,118,0.04)] rounded-[20px] border border-[rgba(14,47,118,0.08)] flex items-start gap-3 reveal">
            <AlertCircle className="w-5 h-5 text-[#0E2F76] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#4A5568] leading-relaxed">
              <span className="font-semibold text-[#0D1B3E]">Clinical context:</span> Severity classification supports, and does not replace, clinical assessment by a qualified ophthalmologist. All AI outputs should be reviewed in the context of the patient's clinical history.
            </p>
          </div>
        </div>
      </section>

      {/* ── Model Architecture Overview ── */}
      <section className="py-12 lg:py-16 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="reveal">
              <span className="badge mb-5">Architecture</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.15 }}
              >
                The AI inference engine
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-6">
                Drishti's AI model is a convolutional neural network trained for multi-class diabetic retinopathy grading. The model produces both a class prediction and intermediate feature maps used for Grad-CAM explainability.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Cpu, label: 'Convolutional feature extraction' },
                  { icon: Target, label: 'Multi-class severity classification' },
                  { icon: Layers, label: 'Grad-CAM explainability layer' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[rgba(14,47,118,0.07)] flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[#0E2F76]" />
                    </div>
                    <span className="text-[#0D1B3E] text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal reveal-delay-2 bg-[#0D1B3E] rounded-[24px] p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-15"
                style={{ background: 'radial-gradient(ellipse at 70% 30%, #2563EB, transparent 60%)' }} />
              <div className="relative space-y-3">
                {[
                  { label: 'Input Layer', sub: '224×224 px fundus image', active: false },
                  { label: 'Conv Block 1-3', sub: 'Feature extraction', active: false },
                  { label: 'Conv Block 4-7', sub: 'Pattern recognition', active: false },
                  { label: 'Global Average Pool', sub: 'Spatial compression', active: false },
                  { label: 'Classification Head', sub: '5-class softmax output', active: true },
                  { label: 'Grad-CAM Layer', sub: 'Gradient visualization', active: false },
                ].map(layer => (
                  <div
                    key={layer.label}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      layer.active
                        ? 'bg-[rgba(37,99,235,0.2)] border-[rgba(37,99,235,0.4)]'
                        : 'bg-white/5 border-white/8'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white/90">{layer.label}</div>
                      <div className="text-xs text-[#AAC0E1]/60">{layer.sub}</div>
                    </div>
                    {layer.active && (
                      <span className="text-[10px] font-bold text-[#60A5FA] bg-[rgba(37,99,235,0.15)] px-2 py-0.5 rounded-full border border-[rgba(37,99,235,0.3)]">
                        Output
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 bg-white border-t border-[rgba(14,47,118,0.06)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center reveal">
          <h2 className="font-bold text-[#0D1B3E] text-2xl mb-4">
            See how Drishti explains its predictions
          </h2>
          <Link to="/explainable-ai" className="btn-primary inline-flex">
            Explore Explainability
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
