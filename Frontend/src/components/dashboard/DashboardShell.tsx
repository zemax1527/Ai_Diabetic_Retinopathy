import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Eye, LogOut, Users, Stethoscope, Heart, Shield,
  LayoutDashboard, Activity, Menu, X, ArrowLeft,
} from 'lucide-react';
import { useAuth, type UserRole } from '../../context/AuthContext';

// ── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  icon: typeof Users;
  color: string;
  bgLight: string;
  borderColor: string;
  navItems: { label: string; href: string; icon: typeof Activity }[];
}> = {
  patient: {
    label: 'Patient',
    icon: Users,
    color: '#2563EB',
    bgLight: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.2)',
    navItems: [
      { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
      { label: 'My Screenings', href: '/patient', icon: Activity },
    ],
  },
  healthcare_worker: {
    label: 'Healthcare Worker',
    icon: Heart,
    color: '#059669',
    bgLight: 'rgba(5,150,105,0.08)',
    borderColor: 'rgba(5,150,105,0.2)',
    navItems: [
      { label: 'Dashboard', href: '/healthcare-worker', icon: LayoutDashboard },
      { label: 'Screening Queue', href: '/healthcare-worker', icon: Activity },
    ],
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    color: '#7C3AED',
    bgLight: 'rgba(124,58,237,0.08)',
    borderColor: 'rgba(124,58,237,0.2)',
    navItems: [
      { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
      { label: 'Review Queue', href: '/doctor', icon: Activity },
    ],
  },
  admin: {
    label: 'Administrator',
    icon: Shield,
    color: '#DC2626',
    bgLight: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
    navItems: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'User Management', href: '/admin', icon: Users },
    ],
  },
};

// ── Dashboard Shell ──────────────────────────────────────────────────────────

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  if (!user) return null;

  const cfg = ROLE_CONFIG[user.role];
  const RoleIcon = cfg.icon;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full justify-between">
      {/* Top Section: Logo + Role + Navigation */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Logo */}
        <div className="h-16 shrink-0 px-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="e-Netra AI — Home">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Eye className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-white text-sm tracking-tight">e-Netra</span>
                <span className="text-[9px] font-black text-[#0284C7] bg-[#E0F2FE] px-1 py-0.2 rounded tracking-wide leading-none">
                  AI
                </span>
              </div>
              <div className="text-[9px] text-[#7DD3FC] leading-none mt-1 tracking-wider uppercase font-semibold">
                Clinical Workspace
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden text-white/60 hover:text-white p-1 rounded-lg cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="shrink-0 px-4 py-3">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
            style={{ background: cfg.bgLight, borderColor: cfg.borderColor }}
          >
            <RoleIcon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
            <div>
              <div className="text-[9px] text-[#94A3B8] uppercase tracking-wider font-bold">Portal Access</div>
              <div className="text-white text-xs font-semibold leading-tight">{cfg.label}</div>
            </div>
          </div>
        </div>

        {/* Nav list - Scrolls if screen height is constrained */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-1" aria-label="Dashboard navigation">
          {cfg.navItems.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/8 text-xs sm:text-sm font-semibold transition-all group"
            >
              <item.icon className="w-4 h-4 flex-shrink-0 text-[#7DD3FC] group-hover:scale-105 transition-transform" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-white/10">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* User block & Logout - Anchored at bottom */}
      <div className="shrink-0 p-3 border-t border-white/10 bg-[#071326]/60">
        <div className="flex items-center gap-2.5 mb-2.5 px-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs"
            style={{ background: `linear-gradient(135deg, ${cfg.color}, #0C1E3C)` }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate leading-tight">{user.name}</div>
            <div className="text-[#94A3B8] text-[10px] truncate">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#F87171] hover:text-white hover:bg-[#DC2626]/20 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-[#F8FAFC] text-[#0F172A] antialiased">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 h-full shrink-0 bg-[#0C1E3C] border-r border-[#1E293B] text-white select-none z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-[#0C1E3C] text-white shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Main Workspace Column ── */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Top bar - Frozen at the top */}
        <header className="h-16 shrink-0 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 md:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#0C1E3C] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[#0F172A] text-sm sm:text-base leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-[#64748B] text-xs truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: cfg.bgLight, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold hover:bg-[#FEF2F2] hover:border-[#FCA5A5] hover:text-[#DC2626] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Area - ONLY this container scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-16" id="main-content">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
