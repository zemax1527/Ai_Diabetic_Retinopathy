import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, Info, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, type = 'result', className = '', size = 'md' }) {
  if (!status) return null;

  const text = String(status).trim();
  const lower = text.toLowerCase();

  // Color mapping based on medical status
  let badgeStyle = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: Info,
  };

  if (lower.includes('no dr') || lower.includes('no signs') || lower.includes('normal') || lower.includes('no follow-up')) {
    badgeStyle = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    };
  } else if (lower.includes('mild')) {
    badgeStyle = {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertCircle,
    };
  } else if (lower.includes('moderate')) {
    badgeStyle = {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      icon: AlertTriangle,
    };
  } else if (lower.includes('severe') || lower.includes('proliferative') || lower.includes('urgent')) {
    badgeStyle = {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: AlertTriangle,
    };
  } else if (lower.includes('completed') || lower.includes('reviewed') || lower.includes('confirmed')) {
    badgeStyle = {
      bg: 'bg-blue-50',
      text: 'text-[#0E2F76]',
      border: 'border-blue-200',
      dot: 'bg-[#2563EB]',
      icon: ShieldCheck,
    };
  } else if (lower.includes('doctor review') || lower.includes('recommended') || lower.includes('pending')) {
    badgeStyle = {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
      icon: Clock,
    };
  }

  const IconComponent = badgeStyle.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
}
