import React from 'react';
import { Eye, AlertTriangle, Calendar, Info, Check } from 'lucide-react';

export default function NotificationItem({ notification, onMarkAsRead, onClick }) {
  if (!notification) return null;

  const { title, message, type, time, read } = notification;

  const typeConfig = {
    result: {
      icon: Eye,
      bg: 'bg-blue-50',
      color: 'text-[#2563EB]',
    },
    alert: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
    reminder: {
      icon: Calendar,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
    info: {
      icon: Info,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
    },
  };

  const current = typeConfig[type] || typeConfig.info;
  const IconComponent = current.icon;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 relative ${
        read
          ? 'bg-white border-slate-100 hover:border-slate-200'
          : 'bg-blue-50/40 border-blue-100 hover:border-blue-200 shadow-2xs'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${current.bg} ${current.color}`}
      >
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <h4
            className={`text-sm font-semibold truncate ${
              read ? 'text-[#0D1B3E]' : 'text-[#0E2F76] font-bold'
            }`}
          >
            {title}
          </h4>
          {!read && (
            <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" title="Unread" />
          )}
        </div>
        <p className="text-xs text-[#718096] leading-relaxed line-clamp-2">{message}</p>
        <span className="text-[11px] text-slate-400 mt-1.5 block font-medium">{time}</span>
      </div>

      {!read && onMarkAsRead && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className="text-xs text-[#2563EB] hover:text-[#0E2F76] font-semibold shrink-0 p-1 rounded hover:bg-white transition-colors cursor-pointer"
          title="Mark as read"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
