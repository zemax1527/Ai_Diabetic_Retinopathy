import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, Heart, Shield, Zap } from 'lucide-react';
import { useAuth, getDashboardPath, type UserRole } from '../../context/AuthContext';

const DEMO_ENTRIES: { role: UserRole; label: string; email: string; icon: typeof Users; color: string }[] = [
  {
    role: 'patient',
    label: 'Patient',
    email: 'patient@drishti.ai',
    icon: Users,
    color: '#2563EB',
  },
  {
    role: 'healthcare_worker',
    label: 'Healthcare Worker',
    email: 'worker@drishti.ai',
    icon: Heart,
    color: '#059669',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    email: 'doctor@drishti.ai',
    icon: Stethoscope,
    color: '#7C3AED',
  },
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@drishti.ai',
    icon: Shield,
    color: '#DC2626',
  },
];

export default function DemoLogin() {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = (role: UserRole) => {
    loginAsDemo(role);
    navigate(getDashboardPath(role));
  };

  return (
    <div className="mt-3">
      {/* Divider */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-px bg-[rgba(14,47,118,0.08)]" />
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(14,47,118,0.04)] border border-[rgba(14,47,118,0.07)]">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          <span className="text-[9px] font-semibold text-[#718096] uppercase tracking-wider whitespace-nowrap">
            Quick Demo Login
          </span>
        </div>
        <div className="flex-1 h-px bg-[rgba(14,47,118,0.08)]" />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {DEMO_ENTRIES.map(({ role, label, icon: Icon, color }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleDemo(role)}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[rgba(14,47,118,0.08)] bg-white hover:bg-[#F5FEFF] hover:border-[#0E2F76]/30 hover:shadow-xs transition-all text-left cursor-pointer"
            aria-label={`Sign in as ${label} demo`}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15` }}
            >
              <Icon className="w-3 h-3" style={{ color }} />
            </div>
            <span className="text-[11px] font-semibold text-[#0D1B3E] truncate">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
