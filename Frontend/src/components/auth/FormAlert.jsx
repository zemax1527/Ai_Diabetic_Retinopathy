import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

/**
 * Reusable alert message banner for form validation and system feedback.
 */
export default function FormAlert({
  type = 'error',
  message,
  className = '',
}) {
  if (!message) return null;

  const configs = {
    error: {
      container: 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]',
      icon: AlertCircle,
      iconColor: 'text-[#DC2626]',
    },
    success: {
      container: 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]',
      icon: CheckCircle2,
      iconColor: 'text-[#16A34A]',
    },
    info: {
      container: 'bg-[#F0F9FF] border-[#BAE6FD] text-[#075985]',
      icon: Info,
      iconColor: 'text-[#0284C7]',
    },
  };

  const config = configs[type] || configs.error;
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${config.container} ${className}`}
    >
      <IconComponent className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
      <div className="flex-1 font-medium">{message}</div>
    </div>
  );
}
