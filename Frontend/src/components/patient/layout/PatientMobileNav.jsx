import React from 'react';
import { LayoutDashboard, Camera, History, Calendar, Menu } from 'lucide-react';

export default function PatientMobileNav({
  activeTab,
  onNavigate,
  onOpenDrawer,
}) {
  const items = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'screening', label: 'Screen', icon: Camera, center: true },
    { id: 'appointments', label: 'Appts', icon: Calendar },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[rgba(14,47,118,0.1)] px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'screening' && (activeTab === 'screening' || activeTab === 'result'));
          const Icon = item.icon;

          if (item.center) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate('screening')}
                className="flex flex-col items-center -mt-6 cursor-pointer group"
                aria-label="Start screening"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0E2F76] to-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-[#0E2F76]/30 group-active:scale-95 transition-transform border-4 border-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-[#0E2F76] mt-0.5">Screen</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-[#0E2F76]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className={`text-[10px] font-semibold ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </div>
    </div>
  );
}
