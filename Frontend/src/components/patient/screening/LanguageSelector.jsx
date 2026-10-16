import React from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSelector({ selectedLanguage = 'English', onLanguageChange }) {
  const languages = [
    { code: 'English', label: 'English', native: 'English' },
    { code: 'Marathi', label: 'Marathi', native: 'मराठी' },
    { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <label htmlFor="screening-language" className="block text-xs font-bold text-[#0D1B3E]">
            Screening Report Language
          </label>
          <span className="text-[11px] text-[#718096]">
            Select your preferred language for the AI result explanation
          </span>
        </div>
      </div>

      <div className="relative sm:w-44">
        <select
          id="screening-language"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label} ({lang.native})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
