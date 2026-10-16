import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Settings,
  Activity,
  Eye,
  Check,
  X,
  Loader2,
  FileText,
  BarChart3,
  MapPin,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/dashboard/DashboardShell';
import {
  fetchPendingVerifications,
  fetchVerificationDetails,
  approveApplicant,
  rejectApplicant
} from '../../api/admin';
import { fetchAdminOverview, fetchDistrictAnalytics } from '../../api/screenings';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overview Metrics & District Analytics
  const [metrics, setMetrics] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    loadPending();
    loadAnalytics();
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetchPendingVerifications();
      setPendingUsers(res?.data ?? res ?? []);
    } catch (err) {
      console.error('Failed to load pending verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [overviewRes, districtRes] = await Promise.allSettled([
        fetchAdminOverview(),
        fetchDistrictAnalytics()
      ]);

      if (overviewRes.status === 'fulfilled') {
        setMetrics(overviewRes.value?.data || null);
      }
      if (districtRes.status === 'fulfilled') {
        setDistricts(districtRes.value?.data || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const res = await fetchVerificationDetails(userId);
      setSelectedUser(res?.data ?? res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const targetId = selectedUser.user?._id || selectedUser.id || selectedUser._id;
      const res = await approveApplicant(targetId);
      alert(`User approved! Login ID: ${res?.data?.loginId || res?.loginId || 'Generated'}`);
      setSelectedUser(null);
      loadAllAdminData();
    } catch (err) {
      alert('Failed to approve applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const targetId = selectedUser.user?._id || selectedUser.id || selectedUser._id;
      await rejectApplicant(targetId, rejectReason);
      alert('User rejected.');
      setSelectedUser(null);
      setShowRejectInput(false);
      setRejectReason('');
      loadAllAdminData();
    } catch (err) {
      alert('Failed to reject applicant');
    } finally {
      setActionLoading(false);
    }
  };

  const totalUsersCount = metrics?.users?.total ?? 0;
  const pendingApprovalsCount = metrics?.users?.pendingVerifications ?? pendingUsers.length;
  const totalScreeningsCount = metrics?.screenings?.total ?? 0;
  const referableCount = metrics?.screenings?.referable ?? 0;

  return (
    <DashboardShell
      title="System Administration"
      subtitle="e-Netra AI • Access Governance, Verification & District Analytics"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#B91C1C] rounded-2xl p-5 sm:p-6 text-white mb-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, #FCA5A5, transparent)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-red-200" />
              <span className="text-red-200 text-xs font-semibold uppercase tracking-wider">System Administration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome, {user?.fullName?.firstName || user?.name || 'Administrator'}
            </h2>
            <p className="text-red-100/80 text-xs sm:text-sm">
              Manage professional credential verification, monitor district screening rates, and enforce system security.
            </p>
          </div>
          <button
            onClick={loadAllAdminData}
            className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh All
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Enrolled Users', value: totalUsersCount, sub: `${metrics?.users?.patients ?? 0} Patients • ${metrics?.users?.doctors ?? 0} Doctors`, icon: Users, color: '#2563EB' },
          { label: 'Pending Approvals', value: pendingApprovalsCount, sub: 'Healthcare Workers & Doctors', icon: Activity, color: '#F97316' },
          { label: 'Total AI Screenings', value: totalScreeningsCount, sub: `${metrics?.screenings?.reviewed ?? 0} clinically reviewed`, icon: FileText, color: '#059669' },
          { label: 'Referable DR Cases', value: referableCount, sub: `${metrics?.screenings?.pendingReview ?? 0} in review queue`, icon: AlertTriangle, color: '#DC2626' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-0.5">{card.value}</div>
            <div className="text-xs text-slate-500">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Pending Verifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Professional Credential Verification</h3>
            <p className="text-xs text-slate-500 mt-0.5">Healthcare Workers and Doctors awaiting administrative authorization</p>
          </div>
          <button onClick={loadPending} className="text-xs font-semibold text-blue-600 hover:underline">
            Refresh List
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {['Applicant Name', 'Email', 'Role', 'Application Date', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No pending verifications found. All medical applicants have been processed.
                  </td>
                </tr>
              ) : pendingUsers.map(row => (
                <tr key={row._id || row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {row.fullName?.firstName} {row.fullName?.lastName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{row.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] capitalize">
                      {row.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleViewDetails(row._id || row.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                      disabled={detailsLoading}
                    >
                      {detailsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      Inspect Credentials
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* District Screening & Referral Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              District Outreach & Referral Metrics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Aggregated population screening volumes and referral rates across rural districts</p>
          </div>
          <button onClick={loadAnalytics} className="text-xs font-semibold text-blue-600 hover:underline">
            Refresh Metrics
          </button>
        </div>

        {analyticsLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading district analytics...</div>
        ) : districts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No district-level screening data recorded yet. As camp screenings are conducted, district metrics will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">District</th>
                  <th className="px-5 py-3">Total Screenings</th>
                  <th className="px-5 py-3">Referable Cases</th>
                  <th className="px-5 py-3">Referral Rate</th>
                  <th className="px-5 py-3">Severe / Proliferative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districts.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{d.district}</td>
                    <td className="px-5 py-3 text-slate-700">{d.totalScreenings}</td>
                    <td className="px-5 py-3 text-red-600 font-semibold">{d.referableCount}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs">
                        {d.referralRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {(d.grades?.severe || 0) + (d.grades?.proliferative || 0)} cases
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Medical Credential Inspection</h3>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs sm:text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Profile</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-[11px] text-slate-400">Full Name</p>
                    <p className="font-semibold text-slate-900">
                      {selectedUser.user?.fullName?.firstName || selectedUser.fullName?.firstName} {selectedUser.user?.fullName?.lastName || selectedUser.fullName?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Email Address</p>
                    <p className="font-semibold text-slate-900">{selectedUser.user?.email || selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Role Applied</p>
                    <p className="font-semibold text-blue-700 capitalize">{(selectedUser.user?.role || selectedUser.role)?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Status</p>
                    <p className="font-semibold text-amber-600 uppercase text-xs">Pending Verification</p>
                  </div>
                </div>
              </div>

              {selectedUser.profile && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Professional Credentials</h4>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-[11px] text-slate-400">Qualification</p>
                      <p className="font-semibold text-slate-900">{selectedUser.profile.qualification || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Specialization / Department</p>
                      <p className="font-semibold text-slate-900">{selectedUser.profile.specialization || selectedUser.profile.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Experience</p>
                      <p className="font-semibold text-slate-900">{selectedUser.profile.yearsOfExperience || 0} years</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Registration Number / ID</p>
                      <p className="font-mono font-bold text-slate-900">{selectedUser.profile.medicalRegistrationNumber || selectedUser.profile.employeeId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 sticky bottom-0">
              {showRejectInput ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection (e.g. Invalid medical council registration)"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  />
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-red-200"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject Application
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve & Issue Login ID
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
