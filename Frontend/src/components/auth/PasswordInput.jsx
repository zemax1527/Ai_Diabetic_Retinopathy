import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Reusable password input with accessible show/hide toggle and compact layout.
 */
export default function PasswordInput({
  id,
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  error,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  helperText,
  rightHeaderAction,
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#1E293B]"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-0.5" aria-hidden="true">*</span>}
        </label>
        {rightHeaderAction}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center justify-center">
          <Lock className="w-4 h-4" aria-hidden="true" />
        </div>

        <input
          id={inputId}
          name={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full text-sm rounded-lg border bg-white text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-150 outline-none
            pl-9.5 pr-10 py-2 sm:py-2.5
            ${error
              ? 'border-[#EF4444] text-[#B91C1C] focus:border-[#DC2626] focus:ring-2 focus:ring-[#EF4444]/20'
              : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20'
            }
            ${disabled ? 'bg-[#F1F5F9] cursor-not-allowed opacity-75' : ''}
          `}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          tabIndex={0}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 p-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[#0284C7]/40 cursor-pointer disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#64748B] leading-tight">
          {helperText}
        </p>
      )}

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
