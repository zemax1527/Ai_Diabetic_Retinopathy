import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable button for authentication actions.
 * Features accessible focus states, spinner indicator, and clean tactile feedback.
 */
export default function AuthButton({
  children,
  type = 'submit',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
}) {
  const baseStyles = 'w-full inline-flex items-center justify-center gap-2 font-medium text-sm rounded-lg transition-all duration-150 cursor-pointer outline-none select-none';
  
  const sizeStyles = 'py-2.5 px-4 min-h-[40px]';

  const variants = {
    primary: 'bg-[#0C1E3C] hover:bg-[#071326] active:bg-[#050D1A] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-[#0284C7]/40 focus:ring-offset-2 disabled:bg-[#94A3B8] disabled:cursor-not-allowed',
    secondary: 'bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-[#0284C7]/30 focus:ring-offset-2 disabled:bg-[#94A3B8] disabled:cursor-not-allowed',
    outline: 'border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] hover:border-[#94A3B8] focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] disabled:opacity-60 disabled:cursor-not-allowed',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
      className={`${baseStyles} ${sizeStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
          <span>Processing…</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 text-current flex-shrink-0" aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
