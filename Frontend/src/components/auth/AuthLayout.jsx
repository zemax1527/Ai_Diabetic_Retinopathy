import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';

/**
 * e-Netra AI — Reusable Authentication Layout.
 * Uses clinical Navy-Obsidian (#0C1E3C), Precision Optic Teal (#0284C7 / #0D9488),
 * and clean Slate surfaces with 100dvh dynamic viewport sizing.
 */
export default function AuthLayout({
  children,
  variant = 'login', // 'login' | 'register'
  title,
  subtitle,
}) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#F8FAFC] flex flex-col lg:flex-row overflow-x-hidden text-[#0F172A]">
      {/* ── MOBILE BRAND HEADER (Visible < lg) ── */}
      <header className="lg:hidden w-full bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
        <Link to="/" className="flex items-center gap-2" aria-label="e-Netra AI — Home">
          <div className="w-7 h-7 rounded-lg bg-[#0C1E3C] flex items-center justify-center text-[#38BDF8] shadow-xs">
            <Eye className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[#0C1E3C] text-sm tracking-tight leading-none">e-Netra</span>
              <span className="text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] px-1 py-0.2 rounded tracking-wide leading-none">AI</span>
            </div>
            <span className="text-[9px] text-[#64748B] font-medium tracking-wider uppercase block leading-none mt-0.5">
              Retinal Screening
            </span>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      {/* ── LEFT HERO PANEL (Desktop >= lg) ── */}
      <section className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-[#0C1E3C] text-white flex-col justify-between p-6 xl:p-8 relative overflow-hidden shrink-0 select-none border-r border-[#1E293B]">
        {/* Subtle, restrained medical illumination */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle at 15% 15%, #0284C7 0%, transparent 40%), radial-gradient(circle at 90% 85%, #0D9488 0%, transparent 45%)',
          }}
          aria-hidden="true"
        />

        {/* Precision optic grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #E2E8F0 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        {/* Top: Logo & System Identity */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="e-Netra AI — Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0284C7] to-[#0A2259] flex items-center justify-center text-white shadow-sm border border-white/10 group-hover:scale-105 transition-transform">
              <Eye className="w-4.5 h-4.5 text-[#38BDF8]" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-white text-base tracking-tight">e-Netra</span>
                <span className="text-[10px] font-black text-[#0284C7] bg-[#E0F2FE] px-1 py-0.5 rounded tracking-wide leading-none">
                  AI
                </span>
              </div>
              <span className="text-[9px] font-semibold text-[#7DD3FC] tracking-widest uppercase block leading-none mt-1">
                Clinical Vision Triage
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Contextual Narrative & Retinal Fundus Graphic */}
        <div className="relative z-10 my-auto py-2 xl:py-4 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-[#BAE6FD] tracking-wide mb-3 w-fit">
            <Sparkles className="w-3 h-3 text-[#38BDF8]" />
            <span>AI-Assisted Retinal Screening Platform</span>
          </div>

          <h1 className="text-xl xl:text-2xl font-bold tracking-tight text-white leading-snug mb-2 text-balance">
            {variant === 'register'
              ? 'Empowering Frontline Diabetic Retinopathy Detection'
              : 'Explainable AI for Diabetic Retinopathy Screening'}
          </h1>

          <p className="text-xs xl:text-sm text-[#94A3B8] leading-relaxed mb-4 max-w-sm">
            {variant === 'register'
              ? 'Create a patient account to access fundus image assessments, monitor microvascular stability, and receive timely specialist referrals.'
              : 'Providing healthcare workers and ophthalmologists with instant optical quality filtration, 5-stage DR severity grading, and Grad-CAM++ lesion visualizations.'}
          </p>

          {/* Compact Retinal Optic Graphic */}
          <div className="w-24 h-24 xl:w-28 xl:h-28 relative my-2 mx-auto" aria-hidden="true">
            <div className="absolute inset-0 rounded-full bg-radial from-[#0284C7]/25 to-transparent blur-md" />
            <div
              className="absolute inset-1 rounded-full border border-white/20 shadow-inner flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #854d0e 0%, #451a03 50%, #071326 100%)',
              }}
            >
              {/* Retinal vessels SVG */}
              <svg className="w-full h-full opacity-70" viewBox="0 0 100 100">
                <circle cx="65" cy="45" r="7" fill="rgba(254, 240, 138, 0.65)" />
                <circle cx="65" cy="45" r="4" fill="rgba(254, 252, 232, 0.85)" />
                <path d="M65 45 Q50 50 35 60 Q25 70 20 80" stroke="#f87171" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                <path d="M65 45 Q50 38 35 30 Q25 25 15 28" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M65 45 Q75 52 82 62 Q88 70 90 80" stroke="#f87171" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="38" cy="52" r="3" fill="#991b1b" />
                <circle cx="30" cy="65" r="1.5" fill="#ef4444" />
                <circle cx="50" cy="72" r="1.5" fill="#ef4444" />
              </svg>

              {/* Grad-CAM++ Attention heatmap shimmer */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 55%, rgba(239, 68, 68, 0.35) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)',
                }}
              />
            </div>
            {/* Clinical status badge */}
            <div className="absolute -bottom-1 -right-2 bg-[#071326]/95 border border-white/20 rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-[#38BDF8] shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Grad-CAM++</span>
            </div>
          </div>

          {/* Three Compact Clinical Pillars */}
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {[
              { label: 'Optical Quality Filter', desc: 'Pre-check for blur, contrast & illumination' },
              { label: '5-Stage Severity Triage', desc: 'Classifies No DR through Proliferative DR' },
              { label: 'Explainable Lesion Maps', desc: 'Transparent visual evidence for specialists' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0" />
                <span className="text-xs text-[#E2E8F0] font-semibold">{item.label}:</span>
                <span className="text-xs text-[#94A3B8]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Clinical Governance Disclaimer */}
        <div className="relative z-10 pt-2 border-t border-white/10 text-[10px] text-[#64748B] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#38BDF8]" />
            Clinical Decision Support
          </span>
          <span>Non-diagnostic triage</span>
        </div>
      </section>

      {/* ── RIGHT FORM PANEL ── */}
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 lg:overflow-y-auto">
        {/* Top desktop nav link */}
        <div className="hidden lg:flex justify-end w-full max-w-[500px] mx-auto shrink-0 mb-1">
          <Link
            to="/"
            className="text-xs font-semibold text-[#64748B] hover:text-[#0C1E3C] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to e-Netra AI Home</span>
          </Link>
        </div>

        {/* Center: Form Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-2">
          {/* Header */}
          <div className="mb-4 sm:mb-5">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight leading-tight mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="w-full">
            {children}
          </div>
        </div>

        {/* Bottom Branding / System Footer */}
        <div className="w-full max-w-[440px] mx-auto text-center pt-3 text-[11px] text-[#94A3B8] shrink-0">
          e-Netra AI • Explainable Vision Screening & District Triage
        </div>
      </main>
    </div>
  );
}
