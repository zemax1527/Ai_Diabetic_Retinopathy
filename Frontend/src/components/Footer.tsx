import { Link } from 'react-router-dom';
import { Eye, ArrowUpRight } from 'lucide-react';

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Technology', to: '/technology' },
  { label: 'Explainable AI', to: '/explainable-ai' },
  { label: 'Impact', to: '/impact' },
  { label: 'About', to: '/about' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D1B3E] text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 group mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#AAC0E1] to-[#2563EB] flex items-center justify-center">
                <Eye className="w-4.5 h-4.5 text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-none tracking-tight">Drishti</div>
                <div className="text-[10px] font-medium text-[#AAC0E1]/70 leading-none mt-0.5 tracking-wide uppercase">AI-Powered Retinal Screening</div>
              </div>
            </Link>
            <p className="text-[#AAC0E1]/70 text-sm leading-relaxed max-w-xs">
              Explainable AI for Diabetic Retinopathy Screening & District-Level Triage.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs text-[#AAC0E1]/80 font-medium">
              Smart India Hackathon 2026
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-xs font-semibold text-[#AAC0E1]/50 uppercase tracking-widest mb-5">Navigation</div>
            <nav className="flex flex-col gap-3" aria-label="Footer navigation">
              {footerLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[#AAC0E1]/70 hover:text-white text-sm transition-colors duration-150 flex items-center gap-1.5 group w-fit"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              ))}
              <Link
                to="/login"
                className="text-[#AAC0E1]/90 hover:text-white text-sm font-semibold transition-colors duration-150 flex items-center gap-1.5 group w-fit mt-1 pt-2 border-t border-white/10"
              >
                Portal Sign In
                <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>
            </nav>
          </div>

          {/* About */}
          <div>
            <div className="text-xs font-semibold text-[#AAC0E1]/50 uppercase tracking-widest mb-5">Project</div>
            <div className="flex flex-col gap-3 text-sm text-[#AAC0E1]/70">
              <div>
                <div className="text-white/90 font-medium text-sm mb-1">Drishti Platform</div>
                <div className="text-[#AAC0E1]/60 text-xs leading-relaxed">
                  AI-assisted screening tool for early diabetic retinopathy detection with visual explainability.
                </div>
              </div>
              <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/8">
                <div className="text-xs text-[#AAC0E1]/50 mb-1">Disclaimer</div>
                <div className="text-xs text-[#AAC0E1]/50 leading-relaxed">
                  AI results support, and do not replace, clinical judgment. For demonstration purposes only.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#AAC0E1]/40">
            © 2026 Drishti. Smart India Hackathon 2026 Project.
          </div>
          <div className="text-xs text-[#AAC0E1]/40">
            Explainable AI · Retinal Screening · District-Level Triage
          </div>
        </div>
      </div>
    </footer>
  );
}
