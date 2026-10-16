import React from 'react';

export default function SummaryCard({
  title,
  value,
  subtext,
  icon: Icon,
  accentColor = '#2563EB',
  badge = null,
  onClick = null,
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 sm:p-6 border border-[rgba(14,47,118,0.08)] shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#2563EB]/40' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}14` }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#0D1B3E] tracking-tight">
          {value}
        </div>
        {badge}
      </div>

      {subtext && (
        <div className="text-xs text-[#718096] font-medium flex items-center gap-1.5 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
