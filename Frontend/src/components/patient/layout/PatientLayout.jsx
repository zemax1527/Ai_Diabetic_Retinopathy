import React, { useState } from 'react';
import PatientSidebar from './PatientSidebar';
import PatientHeader from './PatientHeader';
import PatientMobileNav from './PatientMobileNav';

export default function PatientLayout({
  patient,
  activeTab,
  onNavigate,
  onLogout,
  unreadCount = 0,
  notifications = [],
  children,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-[#F8FAFC] text-[#0F172A] antialiased">
      {/* Desktop / Tablet Sidebar */}
      <div className="hidden lg:block shrink-0 h-full">
        <PatientSidebar
          activeTab={activeTab}
          onNavigate={onNavigate}
          onLogout={onLogout}
          unreadCount={unreadCount}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Slide-over Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full">
            <PatientSidebar
              activeTab={activeTab}
              onNavigate={onNavigate}
              onLogout={onLogout}
              unreadCount={unreadCount}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Header - Anchored at the top, NEVER scrolls with content */}
        <PatientHeader
          patient={patient}
          unreadCount={unreadCount}
          notifications={notifications}
          activeTab={activeTab}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onToggleMobileMenu={() => setMobileDrawerOpen(true)}
        />

        {/* Page Content Viewport - ONLY this container scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-20 lg:pb-12" id="main-content">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <PatientMobileNav
        activeTab={activeTab}
        onNavigate={onNavigate}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}
