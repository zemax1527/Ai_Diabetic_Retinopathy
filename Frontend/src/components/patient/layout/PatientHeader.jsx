import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function PatientHeader({
  patient,
  unreadCount = 0,
  notifications = [],
  activeTab,
  onNavigate,
  onLogout,
  onToggleMobileMenu,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const patientName = patient?.fullName || patient?.firstName || 'Patient';
  const patientId = patient?.id || 'DR-PAT-2026-0042';

  return (
    <header className="h-16 shrink-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left: Hamburger (mobile) + Greeting / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#0C1E3C] hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-[#0F172A] tracking-tight truncate">
              Good morning, {patientName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              Active Account
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
            <span>Clinical retinal monitoring with e-Netra AI.</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-[#0C1E3C] bg-[#F1F5F9] px-1.5 py-0.2 rounded text-[10px] font-mono">
              ID: {patientId}
            </span>
          </div>
        </div>
      </div>

        {/* Right: Notifications + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#0E2F76] hover:bg-[#0E2F76]/6 transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-[#2563EB] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[rgba(14,47,118,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0D1B3E]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] bg-blue-100 text-[#0E2F76] px-1.5 py-0.2 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      onNavigate('notifications');
                    }}
                    className="text-xs text-[#2563EB] hover:text-[#0E2F76] font-semibold cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        onNavigate('notifications');
                      }}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5 ${
                        n.read ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0E2F76] flex items-center justify-center shrink-0 mt-0.5">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0D1B3E] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#718096] line-clamp-1">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      onNavigate('notifications');
                    }}
                    className="text-xs font-semibold text-[#0E2F76] hover:underline cursor-pointer"
                  >
                    Open Notification Center →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Patient Avatar & Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              aria-label="User account menu"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E2F76] to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-[#0D1B3E] leading-tight">
                  {patientName}
                </span>
                <span className="block text-[11px] text-slate-500 font-medium leading-tight">
                  Patient
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[rgba(14,47,118,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-[#0D1B3E]">{patientName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{patient?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {patientId}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0E2F76] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0E2F76] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Account Settings
                  </button>
                </div>

                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </header>
  );
}
