import React from 'react';
import { EyeOff, PlusCircle } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No screenings yet',
  description = 'Start your first eye screening with Drishti.',
  icon: Icon = EyeOff,
  actionLabel = 'Start Screening →',
  onAction,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#0E2F76]/8 text-[#0E2F76] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-[#0D1B3E] mb-1.5">{title}</h3>
      <p className="text-sm text-[#718096] max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {onAction && actionLabel && (
        <Button variant="primary" size="md" onClick={onAction} icon={PlusCircle}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
