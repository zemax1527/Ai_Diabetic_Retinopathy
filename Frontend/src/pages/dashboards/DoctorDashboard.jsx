import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Eye,
  FileText,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Sliders,
  Layers2,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Hospital,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { fetchReviewQueue, submitClinicalReview } from '../../api/screenings';
import { adaptMongoScreening } from '../../services/screeningAdapter';

const DR_GRADES = [
  { grade: 0, label: 'Grade 0: No DR', desc: 'No microaneurysms or abnormalities observed' },
  { grade: 1, label: 'Grade 1: Mild NPDR', desc: 'Microaneurysms only' },
  { grade: 2, label: 'Grade 2: Moderate NPDR', desc: 'More than microaneurysms, less than severe' },
  { grade: 3, label: 'Grade 3: Severe NPDR', desc: '4-2-1 rule met, high risk of progression' },
  { grade: 4, label: 'Grade 4: Proliferative DR', desc: 'Neovascularization or vitreous hemorrhage' },
];

const REFERRAL_HOSPITALS = [
  'None (Follow-up in 12 months)',
  'District Civil Hospital — Ophthalmology Dept',
  'Regional Institute of Ophthalmology (RIO)',
  'AIIMS New Delhi — Dr. R.P. Centre for Ophthalmic Sciences',
  'Sankara Nethralaya Outreach Unit',
  'Aravind Eye Hospital Tele-Ophthalmology Center'
];

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Currently active case in clinical review workspace
  const [activeCase, setActiveCase] = useState(null);
  const [activeLayer, setActiveLayer] = useState('original'); // 'original' | 'heatmap' | 'gradcam' | 'lesion_overlay'

  // Clinical Review Form State
  const [clinicalGrade, setClinicalGrade] = useState(0);
  const [triageLevel, setTriageLevel] = useState('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [referralHospital, setReferralHospital] = useState(REFERRAL_HOSPITALS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load review queue from backend
  async function loadQueue() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchReviewQueue();
      const rawData = res?.data || [];
      if (Array.isArray(rawData)) {
        setQueue(rawData.map(adaptMongoScreening));
      }
    } catch (err) {
      console.error('Error fetching review queue:', err);
      setErrorMsg('Failed to load review queue. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  // When a case is opened for review, prefill state with AI suggestion
  function openReviewModal(screening) {
    setActiveCase(screening);
    const suggestedGrade = screening.classification?.grade ?? 0;
    setClinicalGrade(suggestedGrade);
    setTriageLevel(suggestedGrade >= 3 ? 'urgent' : suggestedGrade >= 1 ? 'priority' : 'routine');
    setClinicalNotes('');
    setReferralHospital(suggestedGrade >= 2 ? REFERRAL_HOSPITALS[1] : REFERRAL_HOSPITALS[0]);
    setActiveLayer('original');
    setReviewSuccessMsg('');
  }

  // Submit clinical review
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!activeCase?._id) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitClinicalReview(activeCase._id, {
        clinicalGrade: Number(clinicalGrade),
        clinicalNotes,
        triageLevel,
        referralHospital: referralHospital.startsWith('None') ? '' : referralHospital
      });

      setReviewSuccessMsg('Clinical review signed & saved successfully.');
      setTimeout(() => {
        setActiveCase(null);
        setReviewSuccessMsg('');
        loadQueue();
      }, 1400);
    } catch (err) {
      console.error('Failed to submit clinical review:', err);
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  // Filter queue by search & severity
  const filteredQueue = queue.filter(item => {
    const matchesSearch = !searchTerm ||
      (item.id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.raw?.userId?.fullName?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.raw?.userId?.fullName?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.raw?.userId?.loginId?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = selectedSeverity === 'all' ||
      String(item.classification?.grade) === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const urgentCount = queue.filter(item => (item.classification?.grade ?? 0) >= 3).length;
  const pendingCount = queue.length;

  return (
    <DashboardShell
      title="Doctor Review Console"
      subtitle="e-Netra AI • Ophthalmology Triage & Clinical Decision Support"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#4338CA] rounded-2xl p-5 sm:p-6 text-white mb-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, #93C5FD, transparent)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Stethoscope className="w-4 h-4 text-blue-200" />
              <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Clinical Decision Support</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome, Dr. {user?.fullName?.firstName || user?.name || 'Physician'}
            </h2>
            <p className="text-blue-100/80 text-xs sm:text-sm">
              Review AI-triaged diabetic retinopathy screening examinations and validate explainability heatmaps.
            </p>
          </div>
          <button
            onClick={loadQueue}
            className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
          <div className="text-xs text-slate-500">Screenings awaiting clinical sign-off</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Cases (Grade 3+)</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600">{urgentCount}</div>
          <div className="text-xs text-slate-500">Severe NPDR or Proliferative DR</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Triage SLA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">&lt; 24h</div>
          <div className="text-xs text-slate-500">Target turnaround for referable cases</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full md:w-auto text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All AI Severity Grades</option>
            <option value="0">Grade 0 — No DR</option>
            <option value="1">Grade 1 — Mild NPDR</option>
            <option value="2">Grade 2 — Moderate NPDR</option>
            <option value="3">Grade 3 — Severe NPDR</option>
            <option value="4">Grade 4 — Proliferative DR</option>
          </select>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Clinical Review Triage Queue</h3>
          <span className="text-xs text-slate-500 font-medium">{filteredQueue.length} cases</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading review queue...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">Review Queue Empty</p>
            <p className="text-xs text-slate-500">There are currently no pending screenings requiring doctor sign-off.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Screening ID</th>
                  <th className="py-3 px-4">Patient / Login ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">AI Finding</th>
                  <th className="py-3 px-4">Quality</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredQueue.map((item) => {
                  const patientUser = item.raw?.userId;
                  const patientName = patientUser?.fullName
                    ? `${patientUser.fullName.firstName} ${patientUser.fullName.lastName || ''}`.trim()
                    : 'Field Patient';
                  const loginId = patientUser?.loginId || item.id;
                  const grade = item.classification?.grade ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{patientName}</div>
                        <div className="text-xs text-slate-400 font-mono">{loginId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          grade >= 3
                            ? 'bg-red-100 text-red-800'
                            : grade >= 2
                            ? 'bg-amber-100 text-amber-800'
                            : grade === 1
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Grade {grade} • {item.classification?.label || 'Screening'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.quality?.status || 'Good'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openReviewModal(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1"
                        >
                          Review Case
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dual-Pane Clinical Review Workspace Modal ────────────────────── */}
      {activeCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Clinical Examination
                  </span>
                  <span className="font-mono text-xs text-slate-500">Case #{activeCase.id}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Patient: {activeCase.raw?.userId?.fullName?.firstName || 'Screening'} {activeCase.raw?.userId?.fullName?.lastName || ''} ({activeCase.raw?.userId?.loginId || 'ID'})
                </h3>
              </div>
              <button
                onClick={() => setActiveCase(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* Left Pane: Interactive Fundus & Heatmap Viewer (7 cols) */}
              <div className="lg:col-span-7 p-5 space-y-4 bg-slate-900 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Multimodal Retinal Viewer
                    </span>
                    <span className="text-xs text-slate-400">
                      Quality: {activeCase.quality?.status} ({Math.round((activeCase.quality?.score || 1) * 100)}%)
                    </span>
                  </div>

                  {/* Layer Selector Tabs */}
                  <div className="flex gap-1.5 p-1 bg-slate-800 rounded-xl mb-4 overflow-x-auto">
                    {[
                      { id: 'original', label: 'Original Scan', url: activeCase.images?.original, icon: Eye },
                      { id: 'heatmap', label: 'Grad-CAM Heatmap', url: activeCase.images?.heatmap, icon: Layers },
                      { id: 'gradcam', label: 'Attention Overlay', url: activeCase.images?.gradcam, icon: Sliders },
                      { id: 'lesion_overlay', label: 'Lesion Segmentation', url: activeCase.images?.lesionOverlay, icon: Layers2 },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveLayer(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          activeLayer === tab.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Image Display */}
                  <div className="relative aspect-4/3 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    {(() => {
                      let activeImg = activeCase.images?.original;
                      if (activeLayer === 'heatmap') activeImg = activeCase.images?.heatmap || activeCase.images?.original;
                      if (activeLayer === 'gradcam') activeImg = activeCase.images?.gradcam || activeCase.images?.original;
                      if (activeLayer === 'lesion_overlay') activeImg = activeCase.images?.lesionOverlay || activeCase.images?.original;

                      if (!activeImg) {
                        return (
                          <div className="text-slate-500 text-xs text-center p-6">
                            Image data not stored locally in this sandbox run.
                          </div>
                        );
                      }

                      return (
                        <img
                          src={activeImg}
                          alt="Retinal Fundus"
                          className="w-full h-full object-contain"
                        />
                      );
                    })()}

                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono text-slate-300">
                      Layer: {activeLayer.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Optical & Explainability Summary */}
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">XAI Method:</span>
                    <span className="font-mono text-blue-400">{activeCase.explainability?.method || 'Grad-CAM++'}</span>
                  </div>
                  {activeCase.explainability?.explanation && (
                    <p className="text-[11px] text-slate-400 italic">
                      "{activeCase.explainability.explanation}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right Pane: AI Classification & Clinical Review Form (5 cols) */}
              <div className="lg:col-span-5 p-5 sm:p-6 bg-white overflow-y-auto space-y-5">
                {/* AI Findings Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Model Evaluation
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900">
                      {activeCase.classification?.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {activeCase.classification?.confidence} Confidence
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    AI Decision: <strong>{activeCase.decision?.decision}</strong> {activeCase.decision?.referable ? '(Referable)' : '(Non-referable)'}
                  </div>
                </div>

                {/* Doctor Clinical Review Form */}
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Clinical Grade Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Doctor Confirmed DR Grade *
                    </label>
                    <select
                      value={clinicalGrade}
                      onChange={(e) => setClinicalGrade(Number(e.target.value))}
                      className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      required
                    >
                      {DR_GRADES.map(g => (
                        <option key={g.grade} value={g.grade}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {DR_GRADES[clinicalGrade]?.desc}
                    </p>
                  </div>

                  {/* Triage Urgency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Clinical Triage Urgency *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'routine', label: 'Routine', color: 'border-emerald-300 text-emerald-700' },
                        { id: 'priority', label: 'Priority', color: 'border-amber-300 text-amber-700' },
                        { id: 'urgent', label: 'Urgent', color: 'border-red-300 text-red-700' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTriageLevel(t.id)}
                          className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                            triageLevel === t.id
                              ? `${t.color} bg-slate-100 ring-2 ring-blue-500`
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Referral Hospital Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Referral Facility
                    </label>
                    <select
                      value={referralHospital}
                      onChange={(e) => setReferralHospital(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {REFERRAL_HOSPITALS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Clinical Findings / Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Clinical Findings & Recommendations
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="e.g., Confirmed microaneurysms in macula region. Advised strict glycemic control and repeat OCT within 3 months."
                      className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {reviewSuccessMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {reviewSuccessMsg}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCase(null)}
                      className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {submitting ? 'Signing Review...' : 'Sign & Complete Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
