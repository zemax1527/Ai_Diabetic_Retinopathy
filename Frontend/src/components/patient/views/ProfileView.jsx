import React, { useState } from 'react';
import { Edit2, KeyRound, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { updatePatientProfile } from '../../../api/patient';

function extractFormData(patient) {
  let firstName = '';
  let lastName = '';

  if (patient?.fullName && typeof patient.fullName === 'object') {
    firstName = patient.fullName.firstName || '';
    lastName = patient.fullName.lastName || '';
  } else if (typeof patient?.fullName === 'string') {
    const parts = patient.fullName.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  } else {
    firstName = patient?.firstName || '';
    lastName = patient?.lastName || '';
  }

  const rawGender = (patient?.gender || patient?.personalDetails?.gender || 'Male').toLowerCase();
  const gender = rawGender === 'female' ? 'Female' : rawGender === 'other' ? 'Other' : 'Male';

  let dob = '1982-05-14';
  if (patient?.dateOfBirth) {
    try {
      dob = new Date(patient.dateOfBirth).toISOString().split('T')[0];
    } catch {
      dob = '1982-05-14';
    }
  } else if (patient?.dob) {
    dob = patient.dob;
  }

  let hasDiabetes = 'Yes';
  if (patient?.diabetesStatus) {
    if (patient.diabetesStatus === 'yes') hasDiabetes = 'Yes';
    else if (patient.diabetesStatus === 'no') hasDiabetes = 'No';
    else hasDiabetes = 'Pre-diabetic';
  } else if (patient?.hasDiabetes) {
    hasDiabetes = patient.hasDiabetes;
  }

  let diabetesDuration = '4 Years';
  if (patient?.diabetesDuration !== undefined && patient?.diabetesDuration !== null) {
    diabetesDuration = typeof patient.diabetesDuration === 'number'
      ? `${patient.diabetesDuration} Years`
      : String(patient.diabetesDuration);
  }

  return {
    firstName,
    lastName,
    phone: patient?.phone || patient?.personalDetails?.phone || '',
    gender,
    dob,
    hasDiabetes,
    diabetesDuration,
    village: patient?.address?.village || patient?.village || patient?.personalDetails?.village || '',
    district: patient?.address?.district || patient?.district || patient?.personalDetails?.district || '',
  };
}

export default function ProfileView({ patient, onProfileUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form fields initialized with current patient profile
  const [prevPatient, setPrevPatient] = useState(patient);
  const [formData, setFormData] = useState(() => extractFormData(patient));

  // Sync form data during render when patient prop updates externally and not editing
  if (patient !== prevPatient) {
    setPrevPatient(patient);
    if (!isEditing) {
      setFormData(extractFormData(patient));
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);

    const durationNum = parseInt(String(formData.diabetesDuration).replace(/\D+/g, ''), 10);

    const payload = {
      fullName: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      },
      phone: formData.phone.trim(),
      gender: (formData.gender || 'other').toLowerCase(),
      address: {
        village: formData.village.trim(),
        district: formData.district.trim(),
        state: patient?.address?.state || 'Maharashtra',
        pincode: patient?.address?.pincode || '',
      },
      diabetesStatus:
        formData.hasDiabetes === 'Yes'
          ? 'yes'
          : formData.hasDiabetes === 'No'
          ? 'no'
          : 'unknown',
      diabetesDuration: isNaN(durationNum) ? 0 : durationNum,
    };

    if (formData.dob) {
      payload.dateOfBirth = formData.dob;
    }

    try {
      const res = await updatePatientProfile(payload);
      const updatedProfile = res?.data || res;
      setSaveSuccess(true);
      setIsEditing(false);
      if (onProfileUpdated) {
        const combinedFullName = `${formData.firstName} ${formData.lastName}`.trim();
        onProfileUpdated({
          ...patient,
          ...updatedProfile,
          fullName: combinedFullName || updatedProfile?.fullName || patient?.fullName,
          name: combinedFullName || patient?.name,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update patient profile:', err);
      setErrorMsg(err?.message || 'Failed to update profile. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = typeof patient?.fullName === 'object'
    ? `${patient.fullName.firstName || ''} ${patient.fullName.lastName || ''}`.trim()
    : (patient?.fullName || `${formData.firstName} ${formData.lastName}`.trim() || 'Patient');
  const avatarInitial = (displayName || 'P').charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Patient Profile</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage your personal and medical information
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg(null);
                setIsEditing(true);
              }}
              icon={Edit2}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setErrorMsg(null);
                setFormData(extractFormData(patient));
              }}
              icon={X}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPasswordModalOpen(true)}
            icon={KeyRound}
          >
            Change Password
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header with avatar & ID */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0E2F76] to-[#2563EB] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {avatarInitial}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0D1B3E]">
              {displayName}
            </h3>
            <p className="text-xs text-[#718096] flex items-center gap-2 mt-0.5">
              <span>Patient ID: <strong className="font-mono text-[#0E2F76]">{patient?.patientId || patient?.id || 'DR-PAT-2026-0042'}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                Verified Patient
              </span>
            </p>
          </div>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E2F76] mb-3">
                Edit Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E2F76] mb-3">
                Edit Medical Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Has Diabetes?</label>
                  <select
                    value={formData.hasDiabetes}
                    onChange={(e) => setFormData({ ...formData, hasDiabetes: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Pre-diabetic">Pre-diabetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Diabetes Duration</label>
                  <input
                    type="text"
                    value={formData.diabetesDuration}
                    onChange={(e) => setFormData({ ...formData, diabetesDuration: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Village / Town</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                  setFormData(extractFormData(patient));
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={saving} icon={Save}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Personal Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">First Name</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.firstName || '—'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Last Name</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.lastName || '—'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Email Address</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5 truncate">
                    {patient?.email || '—'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Phone Number</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.phone || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Medical Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Date of Birth / Age</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {patient?.dob || '14 May 1982'} ({patient?.age || '44 yrs'})
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Gender</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.gender}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Diabetes Status</span>
                  <span className="text-sm font-bold text-amber-700 block mt-0.5">
                    {formData.hasDiabetes} (Diagnosed)
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Diabetes Duration</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.diabetesDuration}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Residential Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Village / Town</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.village || 'Shivajinagar'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">District & State</span>
                  <span className="text-sm font-bold text-[#0D1B3E] block mt-0.5">
                    {formData.district || 'Pune'}, Maharashtra
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        subtitle="Ensure your account is protected with a secure password"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsPasswordModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
