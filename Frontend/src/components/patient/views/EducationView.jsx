import React, { useState } from 'react';
import { BookOpen, Eye, Activity, Camera, FileText, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { EDUCATION_ARTICLES } from '../data/patientMockData';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function EducationView() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const iconMap = {
    eye: Eye,
    activity: Activity,
    camera: Camera,
    'file-text': FileText,
    'alert-triangle': AlertTriangle,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="border-b border-slate-100 pb-3.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold mb-2 border border-[#BAE6FD]">
          <BookOpen className="w-3.5 h-3.5 text-[#0284C7]" />
          Patient Education Library
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
          Eye Health Education
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Understand diabetic retinopathy, preventive steps, and clinical screening guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDUCATION_ARTICLES.map((article) => {
          const Icon = iconMap[article.icon] || BookOpen;

          return (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 shadow-2xs hover:shadow-md hover:border-[#0284C7]/40 transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
                    {article.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0D1B3E] group-hover:text-[#2563EB] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#718096] mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <span>{article.readTime}</span>
                <span className="text-[#0E2F76] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Read Guide <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <Modal
          isOpen={Boolean(selectedArticle)}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          subtitle={selectedArticle.subtitle}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
              {selectedArticle.summary}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E2F76]">
                Key Facts
              </h4>
              <ul className="space-y-2">
                {selectedArticle.details.map((d, i) => (
                  <li key={i} className="text-xs sm:text-sm text-[#4A5568] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-2" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedArticle.tips && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Doctor's Practical Tips
                </h4>
                <ul className="space-y-1">
                  {selectedArticle.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-700">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedArticle(null)}>
                Close Guide
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
