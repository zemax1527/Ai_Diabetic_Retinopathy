import React, { useState, useEffect } from 'react';
import { Eye, Sparkles, ShieldCheck, Activity, X } from 'lucide-react';
import Button from '../common/Button';

export default function ScreeningLoader({ onCancel }) {
  const [progress, setProgress] = useState(15);
  const [stageText, setStageText] = useState('Verifying retinal image quality...');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const stages = [
      { at: 15, text: 'Verifying retinal image quality...' },
      { at: 35, text: 'Detecting optic disc and vascular structures...' },
      { at: 55, text: 'Analyzing macular area and microaneurysm patterns...' },
      { at: 75, text: 'Computing explainability heatmap activations...' },
      { at: 88, text: 'Synthesizing explainable AI diagnostic report...' },
      { at: 96, text: 'Finalizing classification probabilities...' },
    ];

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        // Progressively advance bar up to 98%
        setProgress((curr) => {
          if (curr < 90) return Math.min(curr + 3, 90);
          if (curr < 98) return Math.min(curr + 1, 98);
          return 98;
        });

        // Update stage text based on seconds
        if (next >= 12) setStageText(stages[5].text);
        else if (next >= 9) setStageText(stages[4].text);
        else if (next >= 6) setStageText(stages[3].text);
        else if (next >= 4) setStageText(stages[2].text);
        else if (next >= 2) setStageText(stages[1].text);

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.1)] p-8 sm:p-14 text-center max-w-xl mx-auto shadow-md space-y-6 animate-in fade-in duration-200">
      {/* Animated Retinal Scanner Icon */}
      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-100/60 animate-ping opacity-60" />
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-[#0E2F76] to-[#2563EB] opacity-15" />

        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0E2F76] via-[#1a4499] to-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-[#0E2F76]/30">
          <Eye className="w-8 h-8 animate-pulse text-cyan-200" />
        </div>

        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
          <Sparkles className="w-4 h-4 text-[#2563EB] animate-spin" />
        </div>
      </div>

      {/* Main Text */}
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
          Analyzing your retinal image...
        </h3>
        <p className="text-sm text-[#718096] max-w-md mx-auto leading-relaxed">
          Drishti AI is processing the screening via deep learning models. This typically takes 10 to 30 seconds.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 max-w-md mx-auto">
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0E2F76] to-[#2563EB] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span className="flex items-center gap-1.5 text-[#0E2F76] truncate">
            <Activity className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span className="truncate">{stageText}</span>
          </span>
          <span className="font-bold text-[#0D1B3E] shrink-0">{progress}%</span>
        </div>
      </div>

      {/* Safety indicator & elapsed timer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Processing deep neural layers ({secondsElapsed}s)</span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Cancel and Return
          </button>
        )}
      </div>
    </div>
  );
}
