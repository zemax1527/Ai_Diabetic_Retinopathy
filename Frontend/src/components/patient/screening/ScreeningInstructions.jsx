import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  Camera,
  SunMedium,
  Crosshair,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import Button from '../common/Button';

export default function ScreeningInstructions({ onContinue, onCancel }) {
  const instructions = [
    {
      title: 'Use a clear retinal/fundus image',
      description: 'Ensure the image clearly shows the internal back surface of the retina.',
      icon: Eye,
      positive: true,
    },
    {
      title: 'Make sure the eye is visible',
      description: 'The optic disc and retinal vascular network should be identifiable.',
      icon: FileCheck,
      positive: true,
    },
    {
      title: 'Avoid blurry images',
      description: 'Unfocused captures make it hard for the AI to detect fine microaneurysms.',
      icon: AlertTriangle,
      positive: false,
    },
    {
      title: 'Avoid excessive glare or reflection',
      description: 'Strong direct reflections or lens flashes obscure retinal blood vessels.',
      icon: SunMedium,
      positive: false,
    },
    {
      title: 'Keep the image properly centered',
      description: 'The macula or optic disc should be positioned near the center of the frame.',
      icon: Crosshair,
      positive: true,
    },
    {
      title: 'Upload the correct fundus image',
      description: 'Only upload posterior segment retinal photographs (JPG, JPEG, or PNG format).',
      icon: CheckCircle2,
      positive: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold mb-2 border border-[#BAE6FD]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
          Pre-Screening Quality Guidelines
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
          Retinal Screening Instructions
        </h2>
        <p className="text-sm text-[#718096] mt-1 leading-relaxed">
          Please review these simple recommendations to ensure our AI model can evaluate your scan
          with the highest accuracy.
        </p>
      </div>

      {/* Grid of Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {instructions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.positive
                  ? 'bg-slate-50/70 border-slate-200/80'
                  : 'bg-amber-50/40 border-amber-200/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.positive
                      ? 'bg-blue-100 text-[#0E2F76]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0D1B3E]">{item.title}</h3>
                  <p className="text-xs text-[#718096] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice box */}
      <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 flex items-start gap-3">
        <Camera className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#0E2F76] leading-relaxed">
          <strong>Ready to capture or upload?</strong> In the next step, you can select an existing image
          file from your device or use your device camera directly.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          icon={ArrowRight}
          iconPosition="right"
          className="w-full sm:w-auto ml-auto"
        >
          Continue to Image Upload
        </Button>
      </div>
    </div>
  );
}
