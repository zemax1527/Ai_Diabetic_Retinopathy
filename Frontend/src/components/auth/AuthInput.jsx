import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable accessible form input for authentication screens.
 * Designed with compact vertical rhythm to prevent unnecessary viewport overflow.
 */
export default function AuthInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  autoComplete,
  disabled = false,
  className = '',
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center justify-between text-xs font-semibold text-[#1E293B] mb-1.5"
        >
          <span>
            {label}
            {required && <span className="text-[#DC2626] ml-0.5" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          name={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full text-sm rounded-lg border bg-white text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-150 outline-none
            ${Icon ? 'pl-9.5' : 'pl-3.5'} pr-3.5 py-2 sm:py-2.5
            ${error
              ? 'border-[#EF4444] text-[#B91C1C] focus:border-[#DC2626] focus:ring-2 focus:ring-[#EF4444]/20'
              : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20'
            }
            ${disabled ? 'bg-[#F1F5F9] cursor-not-allowed opacity-75' : ''}
          `}
        />
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium leading-tight"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
