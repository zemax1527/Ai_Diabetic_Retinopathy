import { Link } from 'react-router-dom';
import { TimerOff, Eye, LogIn } from 'lucide-react';

export default function SessionExpired() {
  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col items-center justify-center px-5">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(14,47,118,0.05), transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0E2F76] to-[#2563EB] flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#0D1B3E] text-base">Drishti</span>
        </Link>

        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-18 h-18 rounded-2xl bg-[rgba(14,47,118,0.06)] border-2 border-[rgba(14,47,118,0.1)] flex items-center justify-center shadow-sm p-4">
            <TimerOff className="w-8 h-8 text-[#0E2F76]/60" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#0D1B3E] mb-3 tracking-tight">
          Your Session Has Expired
        </h1>
        <p className="text-[#718096] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          For your security, you've been signed out due to inactivity. Please sign in again to continue.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0E2F76] text-white text-sm font-semibold
            hover:bg-[#1a4499] transition-all
            shadow-[0_4px_14px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_18px_rgba(14,47,118,0.28)]
            focus:outline-none focus:ring-2 focus:ring-[#0E2F76] focus:ring-offset-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In Again
        </Link>

        <p className="mt-10 text-xs text-[#AAC0E1]">Drishti · Smart India Hackathon 2026</p>
      </div>
    </div>
  );
}
