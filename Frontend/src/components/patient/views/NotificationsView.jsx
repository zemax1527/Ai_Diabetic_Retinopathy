import React, { useState } from 'react';
import { Bell, CheckCheck, Eye } from 'lucide-react';
import NotificationItem from '../common/NotificationItem';
import Button from '../common/Button';

export default function NotificationsView({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filteredNotifs = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Notification Center</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Updates regarding screening outcomes, clinic visits, and health reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onMarkAllAsRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              icon={CheckCheck}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#0E2F76] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#0E2F76] text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkAsRead={onMarkAsRead}
              onClick={() => onSelectNotification && onSelectNotification(n)}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No notifications in this view.
          </div>
        )}
      </div>
    </div>
  );
}
