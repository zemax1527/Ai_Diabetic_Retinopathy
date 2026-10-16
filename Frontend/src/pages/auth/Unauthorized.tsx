import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth, getDashboardPath } from '../../context/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex items-center justify-center px-5">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(14,47,118,0.05) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center shadow-md">
              <ShieldX className="w-9 h-9 text-red-400" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
              <span className="text-white font-black text-[9px]">!</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#0D1B3E] mb-3 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-[#718096] text-sm leading-relaxed mb-2 max-w-sm mx-auto">
          You don't have permission to access this area.
        </p>
        {user && (
          <p className="text-xs text-[#AAC0E1] mb-7">
            Signed in as <span className="font-semibold text-[#0E2F76]">{user.name}</span>
            {' '}·{' '}
            <span className="capitalize">{user.role.replace('_', ' ')}</span>
          </p>
        )}
        {!user && <div className="mb-7" />}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {user && (
            <button
              type="button"
              onClick={() => navigate(getDashboardPath(user.role))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E2F76] text-white text-sm font-semibold
                hover:bg-[#1a4499] transition-all shadow-[0_4px_14px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_18px_rgba(14,47,118,0.28)]
                focus:outline-none focus:ring-2 focus:ring-[#0E2F76] focus:ring-offset-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(14,47,118,0.18)] text-[#0E2F76] text-sm font-semibold
              hover:bg-[rgba(14,47,118,0.04)] transition-all
              focus:outline-none focus:ring-2 focus:ring-[#0E2F76] focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Footer label */}
        <p className="mt-10 text-xs text-[#AAC0E1]">Drishti · Smart India Hackathon 2026</p>
      </div>
    </div>
  );
}
