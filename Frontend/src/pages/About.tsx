import { Link } from 'react-router-dom';
import { Brain, Eye, Heart, ArrowRight, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const visionCards = [
  {
    icon: Brain,
    title: 'AI',
    desc: 'Intelligent retinal image analysis using deep learning, producing accurate and consistent severity classification across the DR spectrum.',
    gradient: 'from-[#0E2F76] to-[#2563EB]',
  },
  {
    icon: Eye,
    title: 'Explainability',
    desc: 'Visual understanding of AI predictions through Grad-CAM heatmaps, making model decisions more interpretable to healthcare teams.',
    gradient: 'from-[#2563EB] to-[#3B82F6]',
  },
  {
    icon: Heart,
    title: 'Healthcare',
    desc: 'Connecting screening insights with healthcare workflows — supporting patients, field workers, doctors, and district-level health coordination.',
    gradient: 'from-[#3B82F6] to-[#60A5FA]',
  },
];

const teamPrinciples = [
  {
    title: 'Explainability First',
    desc: 'Every AI prediction in Drishti comes with a visual explanation. Transparency is not optional — it is core to the platform.',
  },
  {
    title: 'Built for Real Use',
    desc: 'Designed for frontline healthcare environments, not controlled research settings. Drishti works in resource-constrained, real-world conditions.',
  },
  {
    title: 'Structured Output',
    desc: 'Results are structured for healthcare workflows — not just raw model outputs, but actionable screening information for the full care team.',
  },
  {
    title: 'Support, Not Replace',
    desc: 'Drishti is an AI support tool. Clinical judgment by qualified professionals remains central to all screening and referral decisions.',
  },
];

export default function About() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={ref}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal"><span className="badge">About Drishti</span></div>
          <h1
            className="reveal reveal-delay-1 mt-5 font-extrabold text-[#0D1B3E] text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1.08 }}
          >
            Building a More{' '}
            <span className="text-[#0E2F76]">Explainable</span>{' '}
            Future for Eye Screening
          </h1>
          <p className="reveal reveal-delay-2 mt-6 text-[#4A5568] text-base leading-relaxed max-w-2xl mx-auto">
            Drishti is a Smart India Hackathon 2026 project — an AI-assisted platform for diabetic retinopathy screening that combines retinal analysis, visual explainability, and healthcare workflow integration.
          </p>
        </div>
      </section>

      {/* ── Vision statement ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="reveal">
              <span className="badge mb-5">Our Vision</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
              >
                AI that explains itself
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed mb-5">
                Diabetic retinopathy is a leading cause of preventable blindness. Early detection is critical — but so is ensuring that AI-assisted screening tools are understandable, trustworthy, and integrated into real healthcare workflows.
              </p>
              <p className="text-[#4A5568] text-base leading-relaxed mb-5">
                Drishti is built around a simple principle: AI predictions should come with explanations. Every screening result includes a visual heatmap showing where the model focused, a confidence score, and a structured severity classification.
              </p>
              <p className="text-[#4A5568] text-base leading-relaxed">
                The platform is designed to support — not replace — healthcare professionals in making screening and referral decisions.
              </p>
            </div>

            <div className="reveal reveal-delay-2 grid grid-cols-1 gap-4">
              {teamPrinciples.map((p, i) => (
                <div
                  key={p.title}
                  className={`reveal reveal-delay-${i + 1} bg-[#F5FEFF] rounded-[20px] p-5 border border-[rgba(14,47,118,0.07)] flex items-start gap-4`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#0E2F76] flex-shrink-0 mt-2" />
                  <div>
                    <div className="font-bold text-[#0D1B3E] text-sm mb-1">{p.title}</div>
                    <div className="text-[#4A5568] text-xs leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Three pillars ── */}
      <section className="py-12 lg:py-16 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-8 reveal">
            <span className="badge mb-5">The Three Pillars</span>
            <h2
              className="font-bold text-[#0D1B3E]"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              What Drishti is built on
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visionCards.map((card, i) => (
              <div
                key={card.title}
                className={`reveal reveal-delay-${i + 1} feature-card bg-white rounded-[24px] p-6 border border-[rgba(14,47,118,0.07)] shadow-[var(--shadow-card)]`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-md`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-[#0D1B3E] text-lg mb-2">{card.title}</h3>
                <p className="text-[#4A5568] text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIH context ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0E2F76] to-[#1a4499] rounded-[28px] p-7 lg:p-10 relative overflow-hidden reveal">
            <div className="absolute inset-0 pointer-events-none opacity-20"
              style={{ background: 'radial-gradient(ellipse at 80% 20%, #60A5FA, transparent 60%)' }} />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-4 h-4 text-[#AAC0E1]" />
                  <span className="text-[#AAC0E1] text-xs font-semibold uppercase tracking-wider">Smart India Hackathon 2026</span>
                </div>
                <h2
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(22px, 2.5vw, 36px)', lineHeight: 1.2 }}
                >
                  Drishti — a hackathon project with real healthcare ambition
                </h2>
                <p className="text-[#AAC0E1]/80 text-base leading-relaxed">
                  Created for the Smart India Hackathon 2026, Drishti addresses the challenge of diabetic retinopathy screening at scale — bringing together AI, explainability, and healthcare workflow design into a unified platform concept.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: ShieldCheck, label: 'AI-Assisted Screening', desc: 'Deep learning for DR severity grading' },
                  { icon: Eye, label: 'Explainability Layer', desc: 'Grad-CAM visual attention maps' },
                  { icon: Heart, label: 'Healthcare Workflow', desc: 'Structured triage and referral support' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 bg-white/8 rounded-2xl p-4 border border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-white/12 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-[#AAC0E1]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.label}</div>
                      <div className="text-[#AAC0E1]/60 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-12 lg:py-16 bg-[#F5FEFF]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal">
            <h2
              className="font-extrabold text-[#0D1B3E] text-balance mb-5"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.1 }}
            >
              Making AI-Assisted Screening{' '}
              <span className="text-[#0E2F76]">More Understandable.</span>
            </h2>
            <p className="text-[#4A5568] text-base leading-relaxed max-w-xl mx-auto mb-8">
              Explore how Drishti brings retinal imaging, AI analysis, explainability, and healthcare workflows together.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/technology" className="btn-primary">
                Explore the Technology
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/how-it-works" className="btn-secondary">
                See How It Works
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
