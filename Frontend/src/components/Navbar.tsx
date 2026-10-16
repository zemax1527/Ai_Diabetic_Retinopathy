import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Eye, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth, getDashboardPath, getRoleLabel } from '../context/AuthContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Technology', to: '/technology' },
  { label: 'Explainable AI', to: '/explainable-ai' },
  { label: 'Impact', to: '/impact' },
  { label: 'About', to: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'navbar-blur shadow-sm border-b border-[rgba(14,47,118,0.06)]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" aria-label="e-Netra AI - Home">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0C1E3C] to-[#0284C7] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Eye className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#38BDF8] border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#0C1E3C] text-lg leading-none tracking-tight">e-Netra</span>
                  <span className="text-[10px] font-black text-[#0284C7] bg-[#E0F2FE] px-1 py-0.5 rounded tracking-wide leading-none">AI</span>
                </div>
                <div className="text-[10px] font-medium text-[#64748B] leading-none mt-1 tracking-wide uppercase">AI Retinal Screening</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(link.to)
                      ? 'text-[#0E2F76] bg-[rgba(14,47,118,0.07)]'
                      : 'text-[#4A5568] hover:text-[#0E2F76] hover:bg-[rgba(14,47,118,0.05)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA / Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={getDashboardPath(user.role)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#0E2F76] bg-[rgba(14,47,118,0.06)] hover:bg-[rgba(14,47,118,0.1)] transition-colors border border-[rgba(14,47,118,0.1)]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0E2F76]" />
                    <span>Dashboard</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0E2F76] text-white uppercase tracking-wider font-bold">
                      {getRoleLabel(user.role)}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-[#718096] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#0E2F76] hover:bg-[rgba(14,47,118,0.06)] transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link to="/technology" className="btn-primary text-sm py-2.5 px-5">
                    Explore Drishti
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-[#0D1B3E] hover:bg-[rgba(14,47,118,0.06)] transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-[rgba(13,27,62,0.4)] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-[rgba(14,47,118,0.06)] flex items-center justify-between">
            <span className="font-bold text-[#0D1B3E] text-base">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-[#718096] hover:text-[#0D1B3E] hover:bg-[rgba(14,47,118,0.06)]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive(link.to)
                    ? 'text-[#0E2F76] bg-[rgba(14,47,118,0.07)]'
                    : 'text-[#4A5568] hover:text-[#0E2F76] hover:bg-[rgba(14,47,118,0.05)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-[rgba(14,47,118,0.08)] flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={getDashboardPath(user.role)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(14,47,118,0.06)] text-[#0E2F76] font-semibold text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Go to Dashboard
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0E2F76] text-white">
                      {getRoleLabel(user.role)}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({user.name})
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[rgba(14,47,118,0.2)] text-[#0E2F76] font-semibold text-sm hover:bg-[rgba(14,47,118,0.04)]"
                  >
                    <LogIn className="w-4 h-4" />
                    Portal Sign In
                  </Link>
                  <Link to="/technology" className="btn-primary w-full justify-center">
                    Explore Drishti
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
