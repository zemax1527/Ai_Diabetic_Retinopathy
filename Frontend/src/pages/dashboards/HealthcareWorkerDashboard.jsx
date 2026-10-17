import React, { useState, useEffect } from 'react';
import {
  Heart,
  Camera,
  ClipboardList,
  Search,
  PlusCircle,
  UserPlus,
  Eye,
  CheckCircle2,
  Calendar,
  Phone,
  MapPin,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  FileText,
  UserCheck,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/dashboard/DashboardShell';
import PatientScreeningFlow from '../../components/patient/screening/PatientScreeningFlow';
import { registerFieldPatient, fetchFieldPatients, syncScreeningToBackend } from '../../api/screenings';

export default function HealthcareWorkerDashboard() {
  const { user } = useAuth();

  // Active view: 'queue' | 'screening'
  const [activeView, setActiveView] = useState('queue');

  // Patients list in field camp
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected patient for assisted screening
  const [assistedPatient, setAssistedPatient] = useState(null);

  // Register New Patient Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'female',
    dateOfBirth: '',
    village: '',
    district: '',
    state: '',
    diabetesStatus: 'yes',
    diabetesDuration: ''
  });

  // Recent assisted screening result
  const [completedResult, setCompletedResult] = useState(null);

  // Load field patients from backend
  async function loadPatients() {
    setLoadingPatients(true);
    try {
      const res = await fetchFieldPatients({ search: searchTerm });
      const list = res?.data || [];
      if (Array.isArray(list)) {
        setPatients(list);
      }
    } catch (err) {
      console.error('Failed to load field patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, [searchTerm]);

  // Submit new patient registration
  async function handleRegisterPatient(e) {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      setRegError('First name is required');
      return;
    }

    setRegistering(true);
    setRegError('');
    setRegSuccess('');

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: {
          village: formData.village.trim(),
          district: formData.district.trim(),
          state: formData.state.trim()
        },
        diabetesStatus: formData.diabetesStatus,
        diabetesDuration: formData.diabetesDuration ? Number(formData.diabetesDuration) : undefined
      };

      const res = await registerFieldPatient(payload);
      const newPatientData = res?.data;

      setRegSuccess(`Patient enrolled! Assigned Login ID: ${newPatientData?.patientId || newPatientData?.user?.loginId || 'GENERATED'}`);
      
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess('');
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          gender: 'female',
          dateOfBirth: '',
          village: '',
          district: '',
          state: '',
          diabetesStatus: 'yes',
          diabetesDuration: ''
        });
        loadPatients();
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
      setRegError(err.message || 'Failed to register patient');
    } finally {
      setRegistering(false);
    }
  }

  // Handle assisted screening completed
  async function handleAssistedScreeningCompleted(screeningResult) {
    setCompletedResult(screeningResult);

    // Save to backend with assisted patient ID and healthcare worker context.
    // For field patients (no user account) and registered patients, target PatientProfile ID is the primary identifier.
    const targetPatientId =
      assistedPatient?._id ||
      assistedPatient?.profileId ||
      assistedPatient?.patientId ||
      assistedPatient?.profile?._id ||
      assistedPatient?.user?._id ||
      assistedPatient?.id;

    try {
      await syncScreeningToBackend(screeningResult, targetPatientId);
    } catch (err) {
      console.error('Failed to sync assisted screening:', err);
    }
  }

  // If Healthcare Worker is running an assisted screening flow:
  if (activeView === 'screening' && assistedPatient) {
    const assistedPatientName =
      `${assistedPatient.fullName?.firstName || assistedPatient.profile?.fullName?.firstName || assistedPatient.user?.fullName?.firstName || assistedPatient.userId?.fullName?.firstName || ''} ${assistedPatient.fullName?.lastName || assistedPatient.profile?.fullName?.lastName || assistedPatient.user?.fullName?.lastName || assistedPatient.userId?.fullName?.lastName || ''}`.trim() || 'Patient';
    const assistedPatientId =
      assistedPatient.patientId ||
      assistedPatient.profile?.patientId ||
      assistedPatient.user?.loginId ||
      assistedPatient.userId?.loginId ||
      'ID';
    const assistedProfileId =
      assistedPatient._id ||
      assistedPatient.profileId ||
      assistedPatient.profile?._id ||
      assistedPatient.user?._id ||
      assistedPatient.userId?._id ||
      assistedPatient.id;

    return (
      <DashboardShell
        title="Assisted Field Screening"
        subtitle={`Screening for: ${assistedPatientName} (${assistedPatientId})`}
      >
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Conducting Assisted Screening as Healthcare Worker</span>
          </div>
          <button
            onClick={() => {
              setActiveView('queue');
              setAssistedPatient(null);
              loadPatients();
            }}
            className="text-xs text-blue-700 font-bold hover:underline"
          >
            ← Exit to Camp Roster
          </button>
        </div>

        <PatientScreeningFlow
          currentUser={{
            id: assistedProfileId,
            profileId: assistedProfileId,
            patientId: assistedPatientId,
            loginId: assistedPatientId,
            name: assistedPatientName
          }}
          onScreeningCompleted={handleAssistedScreeningCompleted}
          onBackToDashboard={() => {
            setActiveView('queue');
            setAssistedPatient(null);
            loadPatients();
          }}
          onRequestDoctorReview={() => {
            setActiveView('queue');
            setAssistedPatient(null);
            loadPatients();
          }}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Healthcare Worker Portal"
      subtitle="e-Netra AI • Rural Outreach Camp & Assisted Screening Operations"
    >
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#047857] via-[#059669] to-[#0D9488] rounded-2xl p-5 sm:p-6 text-white mb-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, #6EE7B7, transparent)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Heart className="w-4 h-4 text-emerald-200" />
              <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Outreach Operations</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome, {user?.fullName?.firstName || user?.name || 'Healthcare Worker'}
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm">
              Register village camp participants and capture fundus scans for instant AI tele-screening.
            </p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="self-start md:self-auto px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            Enroll New Patient
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Camp Enrollees</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{patients.length}</div>
          <div className="text-xs text-slate-500">Patients registered in this outreach region</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Screening Device</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">Active</div>
          <div className="text-xs text-slate-500">FastAPI DR Inference service connected</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tele-Review Hub</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">Online</div>
          <div className="text-xs text-slate-500">Automated triage queue dispatch enabled</div>
        </div>
      </div>

      {/* Search and Table Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Outreach Patient Roster</h3>
            <p className="text-xs text-slate-500">Select a patient to initiate an AI-assisted fundus screening</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Patients Table */}
        {loadingPatients ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading field roster...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">No Patients Found</p>
            <p className="text-xs text-slate-500">Click "Enroll New Patient" above to register an outreach camp participant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Login ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Diabetes Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {patients.map((item) => {
                  const pUser = item.user || item.userId;
                  const pProfile = item.profile || item;
                  const firstName = item.fullName?.firstName || pProfile?.fullName?.firstName || pUser?.fullName?.firstName || '';
                  const lastName = item.fullName?.lastName || pProfile?.fullName?.lastName || pUser?.fullName?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim() || 'Patient';
                  const displayLoginId = item.patientId || pProfile?.patientId || pUser?.loginId || 'PAT-LOCAL';
                  const rowKey = item._id || pProfile?._id || pUser?._id || displayLoginId;

                  return (
                    <tr key={rowKey} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-700">
                        {displayLoginId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {fullName}
                        {(pProfile?.phone || item.phone) && (
                          <div className="text-[11px] font-normal text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {pProfile?.phone || item.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="capitalize">{pProfile?.gender || item.gender || 'N/A'}</span>
                        {(pProfile?.dateOfBirth || item.dateOfBirth) && (
                          <span className="text-slate-400 ml-1 text-xs">
                            (DOB: {new Date(pProfile?.dateOfBirth || item.dateOfBirth).toLocaleDateString()})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {(pProfile?.address?.village || item.address?.village) ? `${pProfile?.address?.village || item.address?.village}, ` : ''}
                        {pProfile?.address?.district || item.address?.district || 'Rural Center'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          (pProfile?.diabetesStatus || item.diabetesStatus) === 'yes'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {(pProfile?.diabetesStatus || item.diabetesStatus) === 'yes' ? 'Diabetic' : 'Unknown / Non-diabetic'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setAssistedPatient(item);
                            setActiveView('screening');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Screen Fundus
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

      {/* ── Enroll Patient Modal ────────────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Outreach Camp Registration</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Enroll New Field Patient
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Patil"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Ralegan"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Ahmednagar"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diabetes Diagnosed?
                  </label>
                  <select
                    value={formData.diabetesStatus}
                    onChange={(e) => setFormData({ ...formData, diabetesStatus: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="yes">Yes (Confirmed)</option>
                    <option value="no">No</option>
                    <option value="unknown">Unknown / Suspected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.diabetesDuration}
                    onChange={(e) => setFormData({ ...formData, diabetesDuration: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {regSuccess}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  {registering ? 'Enrolling Patient...' : 'Enroll & Generate Login ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
