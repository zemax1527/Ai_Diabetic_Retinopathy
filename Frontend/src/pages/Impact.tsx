import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Hospital,
  Building2,
  Heart,
  ArrowDown,
  CheckCircle2,
  ChevronRight,
  Activity,
  Eye,
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const ecosystemNodes = [
  {
    icon: Users,
    label: 'Patient',
    sub: 'Community-level screening',
    color: '#0E2F76',
    position: 'top',
  },
  {
    icon: Heart,
    label: 'Healthcare Worker',
    sub: 'Field screening support',
    color: '#1a4499',
    position: 'left',
  },
  {
    icon: Stethoscope,
    label: 'Doctor',
    sub: 'Clinical review & referral',
    color: '#2563EB',
    position: 'right',
  },
  {
    icon: Hospital,
    label: 'District Hospital',
    sub: 'Specialist care',
    color: '#3B82F6',
    position: 'bottom-left',
  },
  {
    icon: Building2,
    label: 'Health Program',
    sub: 'Government & public health',
    color: '#60A5FA',
    position: 'bottom-right',
  },
];

const impactCards = [
  {
    label: 'Early Screening',
    desc: 'Support for identifying retinopathy indicators before vision-threatening complications occur.',
    icon: Eye,
  },
  {
    label: 'Explainable AI',
    desc: 'Visual explanations that make AI predictions more understandable to healthcare teams.',
    icon: Activity,
  },
  {
    label: 'District-Level Triage',
    desc: 'Structured screening workflows designed to support district-level health coordination.',
    icon: Building2,
  },
  {
    label: 'Healthcare Workflow',
    desc: 'Connecting screening results with doctors, healthcare workers, and referral pathways.',
    icon: Heart,
  },
];

const workflowSteps = [
  { label: 'Patient', sub: 'Community screening visit', icon: Users },
  { label: 'Retinal Screening', sub: 'Fundus image captured', icon: Eye },
  { label: 'AI Analysis', sub: 'Model inference & severity grading', icon: Activity },
  { label: 'Explainable Result', sub: 'Grad-CAM overlay + classification', icon: CheckCircle2 },
  { label: 'Healthcare Worker', sub: 'Reviews screening result', icon: Heart },
  { label: 'Doctor / Referral', sub: 'Clinical review & follow-up decision', icon: Stethoscope },
  { label: 'District-Level Triage', sub: 'Structured coordination & referral', icon: Building2 },
];

const environmentCards = [
  {
    icon: Users,
    title: 'Rural Screening',
    desc: 'Support screening workflows closer to communities, reducing the need for patients to travel to specialist centers for initial assessment.',
  },
  {
    icon: Heart,
    title: 'Healthcare Workers',
    desc: 'Provide structured screening information and visual AI explanations to field healthcare workers during community-level screening programs.',
  },
  {
    icon: Stethoscope,
    title: 'Doctors',
    desc: 'Help review screening results and explainability maps to support clinical decision-making and appropriate referral recommendations.',
  },
  {
    icon: Building2,
    title: 'District-Level Coordination',
    desc: 'Enable structured triage and referral workflows at the district level, connecting screening programs with specialist healthcare services.',
  },
];

export default function Impact() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <main id="main-content" ref={ref}>
      {/* ── Hero ── */}
      <section className="gradient-hero pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <div className="reveal"><span className="badge">Healthcare Impact</span></div>
          <h1
            className="reveal reveal-delay-1 mt-5 font-extrabold text-[#0D1B3E] text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.1 }}
          >
            Connecting Screening With{' '}
            <span className="text-[#0E2F76]">Healthcare Decisions</span>
          </h1>
          <p className="reveal reveal-delay-2 mt-5 text-[#4A5568] text-base leading-relaxed max-w-2xl mx-auto">
            Drishti is designed for real healthcare environments — supporting patients, healthcare workers, doctors, and district-level health programs through structured AI-assisted screening.
          </p>
        </div>
      </section>

      {/* ── Visual Ecosystem ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-8 reveal">
            <span className="badge mb-5">Ecosystem</span>
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              The Drishti Ecosystem
            </h2>
            <p className="text-[#4A5568] text-base max-w-xl mx-auto">
              Drishti connects all stakeholders in the diabetic retinopathy screening pathway.
            </p>
          </div>

          {/* Ecosystem diagram */}
          <div className="reveal reveal-delay-2 bg-[#F5FEFF] rounded-[24px] p-6 lg:p-8 border border-[rgba(14,47,118,0.07)]">
            {/* Central node */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#0E2F76] to-[#2563EB] flex flex-col items-center justify-center shadow-lg mb-6">
                <Eye className="w-7 h-7 text-white mb-1" />
                <span className="text-white text-[10px] font-bold tracking-wider">DRISHTI</span>
              </div>

              {/* Spoke connections */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {ecosystemNodes.map((node, i) => (
                  <div
                    key={node.label}
                    className={`reveal reveal-delay-${i + 1} feature-card flex flex-col items-center gap-3 bg-white rounded-[20px] p-5 border border-[rgba(14,47,118,0.07)] shadow-sm text-center`}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${node.color}, #60A5FA)` }}
                    >
                      <node.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#0D1B3E] text-sm">{node.label}</div>
                      <div className="text-[#718096] text-xs mt-0.5">{node.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow flow ── */}
      <section className="py-12 lg:py-16 gradient-subtle">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="reveal">
              <span className="badge mb-5">Workflow</span>
              <h2
                className="font-bold text-[#0D1B3E] mb-5"
                style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.15 }}
              >
                End-to-end screening workflow
              </h2>
              <p className="text-[#4A5568] text-base leading-relaxed">
                From the moment a patient arrives for screening to district-level triage coordination, Drishti supports every step in the process with AI-assisted analysis and structured outputs.
              </p>
            </div>

            <div className="reveal reveal-delay-2">
              <div className="reveal reveal-delay-2 bg-white rounded-[24px] p-5 border border-[rgba(14,47,118,0.07)] shadow-[var(--shadow-elevated)]">
                {workflowSteps.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0E2F76] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      {i < workflowSteps.length - 1 && (
                        <div className="flex flex-col items-center my-1">
                          <div className="w-px h-5 bg-gradient-to-b from-[#AAC0E1] to-transparent" />
                          <ArrowDown className="w-3 h-3 text-[#AAC0E1]/50" />
                        </div>
                      )}
                    </div>
                    <div className="pb-4">
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

      {/* ── Impact cards ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-8 reveal">
            <span className="badge mb-5">Impact Areas</span>
            <h2
              className="font-bold text-[#0D1B3E] mb-4"
              style={{ fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.15 }}
            >
              What Drishti Enables
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {impactCards.map((card, i) => (
              <div
                key={card.label}
                className={`reveal reveal-delay-${i + 1} feature-card bg-[#F5FEFF] rounded-[20px] p-5 border border-[rgba(14,47,118,0.07)] flex flex-col gap-3`}
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0E2F76] to-[#2563EB] flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0D1B3E] text-base mb-2">{card.label}</h3>
                  <p className="text-[#4A5568] text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Designed for real environments ── */}
      <section className="py-12 lg:py-16 bg-[#0D1B3E] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, #2563EB, transparent)' }} />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-8 reveal">
            <h2
              className="font-bold text-white mb-4"
              style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', lineHeight: 1.15 }}
            >
              Designed for Real Healthcare Environments
            </h2>
            <p className="text-[#AAC0E1]/70 text-base max-w-xl mx-auto">
              Drishti is built for the realities of frontline healthcare delivery across diverse settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {environmentCards.map((card, i) => (
              <div
                key={card.title}
                className={`reveal reveal-delay-${i + 1} bg-white/5 border border-white/8 rounded-[20px] p-5 hover:bg-white/8 transition-colors`}
              >
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <card.icon className="w-5 h-5 text-[#AAC0E1]" />
                </div>
                <h3 className="font-bold text-white text-lg mb-3">{card.title}</h3>
                <p className="text-[#AAC0E1]/70 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 reveal reveal-delay-4">
            <Link to="/about" className="btn-primary">
              Learn About Our Vision
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
