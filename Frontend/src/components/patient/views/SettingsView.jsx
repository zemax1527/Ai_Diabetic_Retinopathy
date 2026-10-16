import React, { useState } from 'react';
import { Globe, Bell, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

export default function SettingsView({ onLogout }) {
  const [language, setLanguage] = useState('English');
  const [screeningNotifs, setScreeningNotifs] = useState(true);
  const [apptNotifs, setApptNotifs] = useState(true);
  const [resultNotifs, setResultNotifs] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="border-b border-slate-100 pb-3.5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Account & System Settings</h2>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Configure your language preferences, notification alerts, and security settings
        </p>
      </div>

      {savedToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Language Section */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D1B3E]">Language Preferences</h3>
            <p className="text-xs text-[#718096]">Choose your default interface and report language</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { id: 'English', label: 'English', native: 'Default' },
            { id: 'Marathi', label: 'Marathi', native: 'मराठी' },
            { id: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setLanguage(l.id);
                handleSave();
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                language === l.id
                  ? 'bg-blue-50/70 border-[#2563EB] shadow-2xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="block text-sm font-bold text-[#0D1B3E]">{l.label}</span>
              <span className="block text-xs text-[#718096] mt-0.5">{l.native}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D1B3E]">Notification Alerts</h3>
            <p className="text-xs text-[#718096]">Manage what updates you receive</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {[
            {
              id: 'screening',
              title: 'Screening notifications',
              desc: 'Get notified when an AI retinal screening starts and finishes processing.',
              checked: screeningNotifs,
              toggle: () => setScreeningNotifs(!screeningNotifs),
            },
            {
              id: 'result',
              title: 'Result notifications',
              desc: 'Receive alerts when doctor review notes or verified results are published.',
              checked: resultNotifs,
              toggle: () => setResultNotifs(!resultNotifs),
            },
            {
              id: 'appointment',
              title: 'Appointment notifications',
              desc: 'Reminders for upcoming clinical eye visits and follow-ups.',
              checked: apptNotifs,
              toggle: () => setApptNotifs(!apptNotifs),
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={item.toggle}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-colors"
            >
              <div className="pr-4">
                <span className="text-sm font-bold text-[#0D1B3E] block">{item.title}</span>
                <span className="text-xs text-[#718096] block mt-0.5">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.toggle}
                className="w-4 h-4 accent-[#0E2F76] rounded cursor-pointer shrink-0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D1B3E]">Privacy & Clinical Security</h3>
            <p className="text-xs text-[#718096]">Retinal health information safeguards</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2">
          <p>
            <strong>Data Confidentiality:</strong> Retinal fundus scans are processed securely for AI explainability and clinical triage. Your medical records remain encrypted.
          </p>
          <p>
            <strong>AI Decision Support:</strong> AI evaluations are validated through ophthalmologist decision support frameworks.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Session Management</span>
          <Button
            variant="danger"
            size="sm"
            onClick={onLogout}
            icon={LogOut}
          >
            Log Out of Drishti
          </Button>
        </div>
      </div>
    </div>
  );
}
