import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Eye,
  FileText,
  Camera,
  Users,
  AlertCircle,
  Sparkles,
  PhoneCall,
  Mail,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Stethoscope,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * VerificationPendingDashboard
 * Pure JavaScript component.
 * Screen 8: Verification Pending Dashboard State.
 * Displays a restricted, polished dashboard when a Healthcare Worker or Doctor
 * logs in while verification is pending.
 * Includes status timeline: Application Submitted -> Under Review -> Approved -> Dashboard Access.
 */
export default function VerificationPendingDashboard() {
  const { user, loginAsDemo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pick up any data passed through navigation state, or fallback to sensible defaults
  const navState = location.state || {};
  const role = navState.role || user?.role || 'doctor';
  const isDoctor = role === 'doctor';
  const roleTitle = isDoctor ? 'Doctor / Ophthalmologist' : 'Healthcare Worker';
  const applicantName = navState.name || user?.name || (isDoctor ? 'Dr. Sharma' : 'Staff Worker');

  // Simulation mode for Smart India Hackathon presentation
  const [simulatedApproved, setSimulatedApproved] = useState(false);

  const handleSignOut = async () => {
    if (logout) await logout();
    navigate('/login', { replace: true });
  };

  const handleSimulateApproval = () => {
    setSimulatedApproved(true);
    // Switch auth demo user if appropriate
    if (loginAsDemo) {
      loginAsDemo(isDoctor ? 'doctor' : 'healthcare_worker');
    }
    setTimeout(() => {
      navigate(isDoctor ? '/doctor' : '/healthcare-worker');
    }, 900);
  };

  const timelineSteps = [
    {
      id: 1,
      title: 'Application Submitted',
      description: 'Credentials and identity documents uploaded',
      status: 'completed',
      date: 'Today',
    },
    {
      id: 2,
      title: 'Under Review',
      description: 'Institutional verification in progress by State Health Authority',
      status: 'current',
      date: 'In Progress',
    },
    {
      id: 3,
      title: 'Approved',
      description: 'Account authorization and digital clinical signature issued',
      status: 'upcoming',
      date: 'Pending',
    },
    {
      id: 4,
      title: 'Dashboard Access',
      description: 'Full unlocking of screening queue and AI Grad-CAM models',
      status: 'upcoming',
      date: 'Pending',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col">
      {/* ── Top Navigation Header ── */}
      <header className="bg-white border-b border-[rgba(14,47,118,0.08)] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0E2F76] to-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-sm">
              D
            </div>
            <div>
              <span className="font-extrabold text-[#0D1B3E] text-base leading-none block">Drishti</span>
              <span className="text-[10px] text-slate-500 font-medium">Healthcare Verification Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Review</span>
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-semibold text-slate-600 hover:text-[#0E2F76] px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Area ── */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#0E2F76] uppercase tracking-wider">
              {roleTitle} Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E] tracking-tight">
              Welcome to Drishti
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Applicant:</span>
            <strong className="text-slate-800 font-semibold">{applicantName}</strong>
          </div>
        </div>

        {/* ── Main Verification Card ── */}
        <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E]">
                    Your account is under verification
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Pending Review
                  </span>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Your professional credentials are currently being reviewed. Some features will remain unavailable until your account is approved.
                </p>
              </div>
            </div>

            {/* Quick stats / turnaround pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex sm:flex-col justify-between sm:justify-center gap-2 min-w-[190px]">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Target Verification
              </span>
              <span className="text-base font-extrabold text-[#0D1B3E]">
                Within 24 Hours
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Documents Logged
              </span>
            </div>
          </div>

          {/* ── Timeline: Application Submitted -> Under Review -> Approved -> Dashboard Access ── */}
          <div className="pt-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
              Verification Progress Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {timelineSteps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';

                return (
                  <div
                    key={step.id}
                    className={`relative rounded-2xl p-4 transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-950'
                        : isCurrent
                        ? 'bg-amber-50/70 border-2 border-amber-300 ring-2 ring-amber-100 shadow-sm'
                        : 'bg-slate-50/60 border border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-white ring-2 ring-amber-200 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                        {step.date}
                      </span>
                    </div>

                    <div className={`text-sm font-bold mb-1 ${isCurrent ? 'text-amber-900' : isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Restricted Feature Previews (Non-empty layout) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Screening Queue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Screening Queue
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            </div>
            <div className="text-2xl font-black text-slate-400 mb-1 blur-[1px]">
              18 Patients
            </div>
            <p className="text-xs text-slate-500">
              Community fundus scans waiting for your clinical review.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Unlocks immediately upon credential approval.
            </div>
          </div>

          {/* Card 2: AI Grad-CAM Engine */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                AI Retinal Heatmap Engine
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            </div>
            <div className="text-2xl font-black text-slate-400 mb-1 blur-[1px]">
              DeepLab + Grad-CAM
            </div>
            <p className="text-xs text-slate-500">
              Explainable heatmaps for microaneurysms and exudates.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Restricted to verified medical council registrants.
            </div>
          </div>

          {/* Card 3: Clinical Sign-off & Reports */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Diagnostic Sign-off
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            </div>
            <div className="text-2xl font-black text-slate-400 mb-1 blur-[1px]">
              Official Triage
            </div>
            <p className="text-xs text-slate-500">
              Digital signature authority for specialist referrals and treatment plans.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Requires administrative activation.
            </div>
          </div>
        </div>

        {/* ── Smart India Hackathon Demo Simulation Tool ── */}
        <div className="bg-gradient-to-r from-blue-900 to-[#0E2F76] text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Evaluation & Demo Mode
              </div>
              <h3 className="text-lg sm:text-xl font-bold">
                Test the Unlocked Professional Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-xl">
                For hackathon jury demonstration: Click below to simulate instant administrative verification approval and explore the full live dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateApproval}
              disabled={simulatedApproved}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer flex-shrink-0"
            >
              {simulatedApproved ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Approving Account...</span>
                </>
              ) : (
                <>
                  <span>Simulate Admin Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Help & Verification Support ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#0D1B3E]">
              Need expedited verification for a health camp?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact the Drishti Healthcare Nodal Desk with your application reference ID.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="mailto:verification@drishti.health.gov.in"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Contact Support</span>
            </a>
            <a
              href="tel:1800266393"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0E2F76] hover:bg-blue-100 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Toll-Free Helpline</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
