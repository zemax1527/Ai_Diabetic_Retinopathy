import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#0E2F76] text-white hover:bg-[#153e97] focus:ring-[#0E2F76]/40 shadow-sm shadow-[#0E2F76]/20',
    accent: 'bg-[#2563EB] text-white hover:bg-[#1d4ed8] focus:ring-[#2563EB]/40 shadow-sm shadow-[#2563EB]/25',
    teal: 'bg-[#059669] text-white hover:bg-[#047857] focus:ring-[#059669]/40 shadow-sm shadow-[#059669]/25',
    secondary: 'bg-[#F1F5F9] text-[#0D1B3E] hover:bg-[#E2E8F0] focus:ring-slate-300',
    outline: 'border border-[rgba(14,47,118,0.18)] text-[#0E2F76] bg-white hover:bg-[#F5FEFF] focus:ring-[#0E2F76]/20',
    ghost: 'text-[#4A5568] hover:text-[#0E2F76] hover:bg-[#0E2F76]/5 focus:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/40 shadow-sm shadow-rose-600/20',
    subtle: 'bg-[#0E2F76]/8 text-[#0E2F76] hover:bg-[#0E2F76]/15 focus:ring-[#0E2F76]/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
