import { useState } from 'react';
import { Award, Briefcase, Building, ShieldCheck, Stethoscope, Users, ArrowRight, ArrowLeft, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import AuthProgress from './AuthProgress';
import DocumentUploadCard from './DocumentUploadCard';

/**
 * ProfessionalDetailsStep
 * Pure JavaScript component.
 * Screen 5 & 6: Professional Qualification & Verification details
 * Tailored dynamically for Healthcare Worker vs Doctor.
 */
export default function ProfessionalDetailsStep({
  role,
  initialData,
  onComplete,
  onBack,
}) {
  const isDoctor = role === 'doctor';

  // Form State
  const [formData, setFormData] = useState({
    // Common / Worker fields
    workerType: initialData?.workerType || 'ASHA',
    qualification: initialData?.qualification || '',
    institutionName: initialData?.institutionName || '',
    yearOfCompletion: initialData?.yearOfCompletion || '',
    yearsOfExperience: initialData?.yearsOfExperience || '',
    employeeId: initialData?.employeeId || '',
    workplace: initialData?.workplace || '',
    department: initialData?.department || '',
    // Doctor-specific fields
    medicalRegistrationNumber: initialData?.medicalRegistrationNumber || '',
    // Document Uploads
    documents: initialData?.documents || {
      governmentId: null,
      qualificationCertificate: null,
      employmentProof: null,
      medicalRegistrationProof: null,
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDocumentChange = (docKey, fileData) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: fileData,
      },
    }));
    if (errors[docKey]) {
      setErrors((prev) => ({ ...prev, [docKey]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.qualification.trim()) {
      errs.qualification = isDoctor ? 'Medical qualification is required.' : 'Qualification is required.';
    }

    if (!formData.institutionName.trim()) {
      errs.institutionName = isDoctor ? 'Medical institution is required.' : 'Institution name is required.';
    }

    if (!formData.yearOfCompletion) {
      errs.yearOfCompletion = 'Year of completion is required.';
    }

    if (isDoctor) {
      if (!formData.medicalRegistrationNumber.trim()) {
        errs.medicalRegistrationNumber = 'Medical registration number (NMC/SMC) is required.';
      }
    } else {
      if (!formData.workerType) {
        errs.workerType = 'Worker type is required.';
      }
      if (!formData.employeeId.trim()) {
        errs.employeeId = 'Employee / Health ID is required.';
      }
    }

    if (!formData.workplace.trim()) {
      errs.workplace = isDoctor ? 'Workplace / Hospital is required.' : 'Workplace is required.';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required.';
    }

    // Document validation
    if (!formData.documents.governmentId) {
      errs.governmentId = 'Government ID is required for verification.';
    }
    if (!formData.documents.qualificationCertificate) {
      errs.qualificationCertificate = isDoctor
        ? 'Medical qualification certificate is required.'
        : 'Qualification certificate is required.';
    }
    if (isDoctor && !formData.documents.medicalRegistrationProof) {
      errs.medicalRegistrationProof = 'Medical council registration proof is required.';
    }
    if (!formData.documents.employmentProof) {
      errs.employmentProof = 'Employment proof / ID card is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onComplete(formData);
    }, 400);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 45 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col justify-center items-center py-3 sm:py-6 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 lg:p-7 my-auto">
        {/* Multi-Step Progress Indicator: Step 4 */}
        <AuthProgress currentStep={4} role={role} />

        {/* Dynamic Heading based on Doctor vs Healthcare Worker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5 shadow-xs">
              {isDoctor ? (
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Doctor Verification Portal
                </span>
              ) : (
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Healthcare Worker Portal
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
              {isDoctor ? 'Medical Professional Details' : 'Professional Details'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isDoctor
                ? 'Provide your medical credentials and registration for clinical verification.'
                : 'Provide your professional information and credentials for verification.'}
            </p>
          </div>

          {/* Badge indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl max-w-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 leading-snug">
              Protected by national health authority privacy standards.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* ── Section: Professional / Medical Information ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B3E] uppercase tracking-wider">
              {isDoctor ? (
                <>
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Medical Qualification & Practice</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>Professional Information</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* If Healthcare Worker: Worker Type */}
              {!isDoctor && (
                <div>
                  <label htmlFor="pro-workerType" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Worker Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pro-workerType"
                    value={formData.workerType}
                    onChange={(e) => handleChange('workerType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white transition-all outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 cursor-pointer"
                  >
                    <option value="ASHA">ASHA (Accredited Social Health Activist)</option>
                    <option value="ANM">ANM (Auxiliary Nurse Midwife)</option>
                    <option value="Health Worker">Health Worker (Community / Camp)</option>
                    <option value="Other">Other Primary Health Staff</option>
                  </select>
                </div>
              )}

              {/* Qualification */}
              <div>
                <label htmlFor="pro-qualification" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isDoctor ? 'Medical Qualification' : 'Qualification'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="pro-qualification"
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => handleChange('qualification', e.target.value)}
                  placeholder={isDoctor ? 'e.g. MBBS, MD Ophthalmology, MS' : 'e.g. ANM Diploma, GNM, B.Sc'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.qualification
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.qualification && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.qualification}</span>
                  </p>
                )}
              </div>

              {/* Institution Name */}
              <div>
                <label htmlFor="pro-institutionName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isDoctor ? 'Medical Institution' : 'Institution Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="pro-institutionName"
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => handleChange('institutionName', e.target.value)}
                  placeholder={isDoctor ? 'e.g. AIIMS New Delhi / King George Medical' : 'e.g. District Nursing School'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.institutionName
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.institutionName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.institutionName}</span>
                  </p>
                )}
              </div>

              {/* Year of Completion */}
              <div>
                <label htmlFor="pro-yearOfCompletion" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Year of Completion <span className="text-red-500">*</span>
                </label>
                <select
                  id="pro-yearOfCompletion"
                  value={formData.yearOfCompletion}
                  onChange={(e) => handleChange('yearOfCompletion', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white transition-all outline-none cursor-pointer ${
                    errors.yearOfCompletion
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                >
                  <option value="">Select Completion Year</option>
                  {years.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                {errors.yearOfCompletion && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.yearOfCompletion}</span>
                  </p>
                )}
              </div>

              {/* Doctor: Medical Registration Number */}
              {isDoctor && (
                <div>
                  <label htmlFor="pro-regNum" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Medical Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pro-regNum"
                    type="text"
                    value={formData.medicalRegistrationNumber}
                    onChange={(e) => handleChange('medicalRegistrationNumber', e.target.value)}
                    placeholder="e.g. MCI-2018-93821 or State Council Reg"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                      errors.medicalRegistrationNumber
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15'
                    }`}
                  />
                  {errors.medicalRegistrationNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.medicalRegistrationNumber}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Healthcare Worker: Employee ID */}
              {!isDoctor && (
                <div>
                  <label htmlFor="pro-employeeId" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employee ID / Health Worker ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pro-employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    placeholder="e.g. HW-UP-8849"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                      errors.employeeId
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15'
                    }`}
                  />
                  {errors.employeeId && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.employeeId}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Years of Experience */}
              <div>
                <label htmlFor="pro-experience" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Years of Experience
                </label>
                <select
                  id="pro-experience"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white transition-all outline-none focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15 cursor-pointer"
                >
                  <option value="">Select Experience</option>
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-3">1 – 3 years</option>
                  <option value="3-5">3 – 5 years</option>
                  <option value="5-10">5 – 10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              {/* Workplace / Hospital */}
              <div>
                <label htmlFor="pro-workplace" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isDoctor ? 'Workplace / Hospital' : 'Workplace'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="pro-workplace"
                    type="text"
                    value={formData.workplace}
                    onChange={(e) => handleChange('workplace', e.target.value)}
                    placeholder={isDoctor ? 'e.g. Apex Eye Hospital / District Hospital' : 'e.g. PHC Rampur / CHC Center'}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                      errors.workplace
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  />
                </div>
                {errors.workplace && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.workplace}</span>
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="pro-department" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  id="pro-department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder={isDoctor ? 'e.g. Ophthalmology / Retina Clinic' : 'e.g. Community Health / NCD Screening'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.department
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.department && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.department}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section: Verification Documents ── */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0D1B3E] uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-[#0E2F76]" />
                <span>Verification Documents</span>
              </div>
              <span className="text-xs text-slate-500">Supported: PDF, JPG, PNG (Max 5MB)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document 1: Government ID */}
              <DocumentUploadCard
                id="doc-gov-id"
                title="Government ID"
                description="Aadhaar, PAN, Voter ID, or Passport"
                required={true}
                uploadedFile={formData.documents.governmentId}
                onFileChange={(f) => handleDocumentChange('governmentId', f)}
                error={errors.governmentId}
              />

              {/* Document 2: Qualification Certificate */}
              <DocumentUploadCard
                id="doc-qual-cert"
                title={isDoctor ? 'Medical Qualification Certificate' : 'Qualification Certificate'}
                description={isDoctor ? 'MBBS / MD / MS Degree Certificate' : 'ANM / GNM / Nursing Diploma'}
                required={true}
                uploadedFile={formData.documents.qualificationCertificate}
                onFileChange={(f) => handleDocumentChange('qualificationCertificate', f)}
                error={errors.qualificationCertificate}
              />

              {/* Doctor Only: Medical Registration Proof */}
              {isDoctor && (
                <DocumentUploadCard
                  id="doc-reg-proof"
                  title="Medical Registration Proof"
                  description="NMC or State Medical Council Registration Certificate"
                  required={true}
                  uploadedFile={formData.documents.medicalRegistrationProof}
                  onFileChange={(f) => handleDocumentChange('medicalRegistrationProof', f)}
                  error={errors.medicalRegistrationProof}
                />
              )}

              {/* Document 3: Employment Proof */}
              <DocumentUploadCard
                id="doc-emp-proof"
                title="Employment Proof"
                description={isDoctor ? 'Hospital ID Card, Appointment Letter, or Practice Letter' : 'Health Centre ID Card or Duty Order'}
                required={true}
                uploadedFile={formData.documents.employmentProof}
                onFileChange={(f) => handleDocumentChange('employmentProof', f)}
                error={errors.employmentProof}
              />
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#0E2F76] hover:bg-[#1a4499] text-white font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Credentials...</span>
                </>
              ) : (
                <>
                  <span>Submit for Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
