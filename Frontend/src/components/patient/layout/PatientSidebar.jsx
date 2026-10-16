import React from 'react';
import {
  LayoutDashboard,
  Camera,
  History,
  Calendar,
  User,
  Bell,
  Settings,
  LogOut,
  Eye,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function PatientSidebar({
  activeTab,
  onNavigate,
  onLogout,
  unreadCount = 0,
  collapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'screening', label: 'Start Screening', icon: Camera, highlight: true },
    { id: 'history', label: 'Screening History', icon: History },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'education', label: 'Eye Health Education', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-full bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300 select-none ${
        isMobileDrawer
          ? 'w-72'
          : collapsed
          ? 'w-20'
          : 'w-64'
      }`}
    >
      {/* Brand & Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
        <div
          onClick={() => onNavigate('overview')}
          className={`flex items-center gap-2.5 cursor-pointer overflow-hidden ${
            collapsed && !isMobileDrawer ? 'justify-center w-full' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#0C1E3C] text-[#38BDF8] flex items-center justify-center shrink-0 shadow-xs">
            <Eye className="w-4.5 h-4.5 text-[#38BDF8]" strokeWidth={2.2} />
          </div>

          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-[#0C1E3C] text-sm tracking-tight">e-Netra</span>
                <span className="text-[9px] font-black text-[#0284C7] bg-[#E0F2FE] px-1 py-0.2 rounded tracking-wide leading-none">AI</span>
              </div>
              <span className="text-[9px] text-[#64748B] font-semibold tracking-wider block uppercase mt-0.5 leading-none">
                Patient Portal
              </span>
            </div>
          )}
        </div>

        {!isMobileDrawer && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden lg:flex items-center justify-center cursor-pointer ${
              collapsed ? 'hidden' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation items list - Scrolls independently if screen height is short */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1" aria-label="Patient navigation">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'screening' && (activeTab === 'screening' || activeTab === 'result'));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                if (isMobileDrawer && onCloseMobileDrawer) {
                  onCloseMobileDrawer();
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left relative ${
                isActive
                  ? 'bg-[#0C1E3C] text-white shadow-xs'
                  : item.highlight
                  ? 'text-[#0284C7] bg-[#E0F2FE] hover:bg-[#BAE6FD]/60'
                  : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              } ${collapsed && !isMobileDrawer ? 'justify-center px-0' : ''}`}
              title={collapsed && !isMobileDrawer ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive
                    ? 'text-[#38BDF8]'
                    : item.highlight
                    ? 'text-[#0284C7]'
                    : 'text-[#64748B]'
                }`}
              />

              {(!collapsed || isMobileDrawer) && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {(!collapsed || isMobileDrawer) && item.badge > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}

              {item.highlight && !isActive && (
                <Sparkles className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info / Logout button - Anchored at bottom */}
      <div className="shrink-0 p-3 border-t border-[#E2E8F0] space-y-2 bg-white">
        {(!collapsed || isMobileDrawer) && (
          <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="text-[10px] font-bold text-[#0F172A]">Clinical Protocol</span>
            </div>
            <p className="text-[9px] text-[#64748B] leading-tight">
              Explainable AI v2.4 • Optical Decision Support
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer ${
            collapsed && !isMobileDrawer ? 'justify-center px-0' : ''
          }`}
          title={collapsed && !isMobileDrawer ? 'Log Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#DC2626]" />
          {(!collapsed || isMobileDrawer) && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
