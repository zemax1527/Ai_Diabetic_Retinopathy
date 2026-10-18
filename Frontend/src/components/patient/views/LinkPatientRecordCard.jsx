import React, { useState } from 'react';
import {
  Link2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '../common/Button';
import { claimPatientRecord } from '../../../api/patient';

export default function LinkPatientRecordCard({
  patient,
  onRecordClaimed,
  className = '',
}) {
  const isAlreadyLinked =
    patient?.registrationType === 'field_worker' &&
    patient?.claimStatus === 'claimed';

  const [expanded, setExpanded] = useState(!isAlreadyLinked);
  const [patientId, setPatientId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!patientId.trim()) {
      errors.patientId = 'Patient ID is required.';
    }
    if (!claimCode.trim()) {
      errors.claimCode = 'One-time claim code is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const cleanPatientId = patientId.trim().toUpperCase();
    const cleanClaimCode = claimCode.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanDob = dob.trim();

    const payload = {
      patientId: cleanPatientId,
      claimCode: cleanClaimCode,
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      ...(cleanDob ? { dateOfBirth: cleanDob } : {}),
    };

    try {
      const response = await claimPatientRecord(payload);
      const claimedProfile = response?.data || response;

      // Immediately wipe sensitive claim code from memory; never store in browser storage
      setClaimCode('');
      setSuccessMsg(
        response?.message ||
          'Patient record successfully claimed and linked to your account.'
      );
      setErrorMsg(null);
      setFieldErrors({});

      if (onRecordClaimed) {
        onRecordClaimed(claimedProfile);
      }
    } catch (err) {
      // Use generic error response pattern from backend to prevent account/ID enumeration
      const message =
        err?.message ||
        'Unable to claim this patient record. Verify the supplied details or contact support.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setClaimCode('');
    setPhone('');
    setDob('');
    setErrorMsg(null);
    setFieldErrors({});
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-[rgba(14,47,118,0.08)] p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
      id="link-patient-record-section"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0E2F76] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#0D1B3E]">
                Link Your Existing Patient Record
              </h3>
              {isAlreadyLinked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Linked
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              If a healthcare worker registered you during a camp or outreach
              visit, you can securely link that record to your e-Netra AI
              account.
            </p>
          </div>
        </div>

        {isAlreadyLinked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            icon={expanded ? ChevronUp : ChevronDown}
            iconPosition="right"
            className="self-start sm:self-center"
          >
            {expanded ? 'Hide Form' : 'Link Another Record'}
          </Button>
        )}
      </div>

      {/* Already Linked Info Banner */}
      {isAlreadyLinked && !expanded && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-[#0D1B3E] block">
                Outreach Record Linked: #{patient?.patientId || 'PAT-RECORD'}
              </span>
              <span className="text-slate-500 text-xs">
                Historical outreach screenings and clinical findings are active on this account.
              </span>
            </div>
          </div>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setExpanded(true)}
          >
            Manage Link
          </Button>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-150"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="space-y-0.5">
            <span>{successMsg}</span>
            <span className="text-xs font-normal text-emerald-700 block">
              Your historical screening results and patient records are now accessible in your portal.
            </span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-800 flex items-center gap-2.5 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Claim Form */}
      {expanded && (
        <form onSubmit={handleClaim} className="space-y-5" noValidate>
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-xs text-[#0E2F76] leading-relaxed">
              <strong>Security & Privacy:</strong> Enter the Patient ID and
              one-time Claim Code printed on your outreach slip. To prevent
              unauthorized access, your registered phone number or date of birth
              is verified before medical records are linked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient ID */}
            <div>
              <label
                htmlFor="claim-patient-id"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Patient ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="claim-patient-id"
                  name="patientId"
                  type="text"
                  required
                  placeholder="e.g. PAT-2026-0042"
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value.toUpperCase());
                    if (fieldErrors.patientId) {
                      setFieldErrors((prev) => ({ ...prev, patientId: null }));
                    }
                  }}
                  className={`w-full text-xs sm:text-sm p-2.5 rounded-xl border bg-slate-50 uppercase font-mono tracking-wider transition-colors ${
                    fieldErrors.patientId
                      ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500'
                      : 'border-slate-200 focus:bg-white focus:border-[#2563EB]'
                  }`}
                  aria-invalid={!!fieldErrors.patientId}
                  aria-describedby={
                    fieldErrors.patientId ? 'patient-id-error' : 'patient-id-help'
                  }
                />
              </div>
              {fieldErrors.patientId ? (
                <p
                  id="patient-id-error"
                  className="text-[11px] font-semibold text-rose-600 mt-1"
                >
                  {fieldErrors.patientId}
                </p>
              ) : (
                <p
                  id="patient-id-help"
                  className="text-[11px] text-slate-400 mt-1"
                >
                  Printed on your physical outreach camp card
                </p>
              )}
            </div>

            {/* One-Time Claim Code */}
            <div>
              <label
                htmlFor="claim-code"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                One-Time Claim Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="claim-code"
                  name="claimCode"
                  type="text"
                  required
                  placeholder="e.g. CLM-A1B2C3"
                  value={claimCode}
                  onChange={(e) => {
                    setClaimCode(e.target.value.toUpperCase());
                    if (fieldErrors.claimCode) {
                      setFieldErrors((prev) => ({ ...prev, claimCode: null }));
                    }
                  }}
                  className={`w-full text-xs sm:text-sm p-2.5 rounded-xl border bg-slate-50 uppercase font-mono tracking-wider transition-colors ${
                    fieldErrors.claimCode
                      ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500'
                      : 'border-slate-200 focus:bg-white focus:border-[#2563EB]'
                  }`}
                  aria-invalid={!!fieldErrors.claimCode}
                  aria-describedby={
                    fieldErrors.claimCode ? 'claim-code-error' : 'claim-code-help'
                  }
                  autoComplete="off"
                />
              </div>
              {fieldErrors.claimCode ? (
                <p
                  id="claim-code-error"
                  className="text-[11px] font-semibold text-rose-600 mt-1"
                >
                  {fieldErrors.claimCode}
                </p>
              ) : (
                <p
                  id="claim-code-help"
                  className="text-[11px] text-slate-400 mt-1"
                >
                  6-character security code (e.g. CLM-XXXXXX)
                </p>
              )}
            </div>

            {/* Registered Phone Number */}
            <div>
              <label
                htmlFor="claim-phone"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Registered Phone Number
              </label>
              <div className="relative">
                <input
                  id="claim-phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] transition-colors"
                  aria-describedby="claim-phone-help"
                />
              </div>
              <p id="claim-phone-help" className="text-[11px] text-slate-400 mt-1">
                Phone number given to the healthcare worker at the camp
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="claim-dob"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Date of Birth
              </label>
              <div className="relative">
                <input
                  id="claim-dob"
                  name="dateOfBirth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] transition-colors"
                  aria-describedby="claim-dob-help"
                />
              </div>
              <p id="claim-dob-help" className="text-[11px] text-slate-400 mt-1">
                Corroborates your identity against camp registration records
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleReset}
              disabled={loading}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={loading}
              icon={Link2}
              id="submit-claim-button"
            >
              Verify & Link Record
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
