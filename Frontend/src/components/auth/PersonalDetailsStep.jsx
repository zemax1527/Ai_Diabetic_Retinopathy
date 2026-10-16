import { useState } from 'react';
import { User, Phone, MapPin, Calendar, HeartPulse, ArrowRight, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import AuthProgress from './AuthProgress';

/**
 * PersonalDetailsStep
 * Pure JavaScript component.
 * Screen 3 & 4: Personal details form for Patient, Healthcare Worker, and Doctor.
 * Includes Basic Information and Address sections.
 * Displays "Diabetes Information" ONLY for Patients.
 * Primary CTA:
 * - "Complete Profile" for Patient
 * - "Continue to Professional Details" for Healthcare Worker & Doctor.
 */
export default function PersonalDetailsStep({
  role,
  initialData,
  onComplete,
  onBack,
}) {
  const isPatient = role === 'patient';

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    // Address
    village: initialData?.village || '',
    district: initialData?.district || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    // Patient-only diabetes fields
    hasDiabetes: initialData?.hasDiabetes || '',
    diabetesDuration: initialData?.diabetesDuration || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi NCR', 'Jammu & Kashmir', 'Ladakh'
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!formData.dob) errs.dob = 'Date of birth is required.';
    if (!formData.gender) errs.gender = 'Please select your gender.';

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.village.trim()) errs.village = 'Village / Locality is required.';
    if (!formData.district.trim()) errs.district = 'District is required.';
    if (!formData.state) errs.state = 'State is required.';

    if (!formData.pincode.trim()) {
      errs.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Pincode must be 6 digits.';
    }

    // Patient-specific validation
    if (isPatient) {
      if (!formData.hasDiabetes) {
        errs.hasDiabetes = 'Please specify if you have diabetes.';
      } else if (formData.hasDiabetes === 'yes' && !formData.diabetesDuration) {
        errs.diabetesDuration = 'Please specify how long you have had diabetes.';
      }
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
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5FEFF] flex flex-col justify-center items-center py-3 sm:py-6 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 lg:p-7 my-auto">
        {/* Dynamic Multi-Step Progress Indicator */}
        <AuthProgress currentStep={3} role={role} />

        {/* Heading & Subtitle */}
        <div className="text-left mb-3.5 pb-2.5 border-b border-slate-100">
          <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
            Tell us about yourself
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            This information helps us create your healthcare profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* ── Section: Basic Information ── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B3E] uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-[#0E2F76]" />
              <span>Basic Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* First Name */}
              <div>
                <label htmlFor="pd-firstName" className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="pd-firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="e.g. Ramesh"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.firstName
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.firstName}</span>
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="pd-lastName" className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="pd-lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Sharma"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.lastName
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="pd-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="pd-dob"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                      errors.dob
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  />
                </div>
                {errors.dob && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.dob}</span>
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="pd-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="pd-gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 bg-white transition-all outline-none cursor-pointer ${
                    errors.gender
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.gender}</span>
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="sm:col-span-2">
                <label htmlFor="pd-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-medium">
                    +91
                  </span>
                  <input
                    id="pd-phone"
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className={`w-full px-3 py-2 rounded-r-xl border text-sm text-slate-800 transition-all outline-none ${
                      errors.phone
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section: Address ── */}
          <div className="space-y-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B3E] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#0E2F76]" />
              <span>Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Village / Town */}
              <div>
                <label htmlFor="pd-village" className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  id="pd-village"
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleChange('village', e.target.value)}
                  placeholder="e.g. Rampur or Sector 4"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.village
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.village && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.village}</span>
                  </p>
                )}
              </div>

              {/* District */}
              <div>
                <label htmlFor="pd-district" className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  id="pd-district"
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="e.g. Varanasi"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.district
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.district}</span>
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="pd-state" className="block text-xs font-semibold text-slate-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="pd-state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 bg-white transition-all outline-none cursor-pointer ${
                    errors.state
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                >
                  <option value="">Select State</option>
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.state}</span>
                  </p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pd-pincode" className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  id="pd-pincode"
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit pincode"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 transition-all outline-none ${
                    errors.pincode
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.pincode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Patient-only Section: Diabetes Information ── */}
          {isPatient && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 bg-blue-50/30 p-3 sm:p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B3E] uppercase tracking-wider">
                <HeartPulse className="w-3.5 h-3.5 text-[#0E2F76]" />
                <span>Diabetes Information</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Do you have diabetes? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'dont_know', label: "Don't know" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('hasDiabetes', option.value)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        formData.hasDiabetes === option.value
                          ? 'border-[#0E2F76] bg-[#0E2F76] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.hasDiabetes && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.hasDiabetes}</span>
                  </p>
                )}
              </div>

              {/* Revealed Duration Input if "Yes" */}
              {formData.hasDiabetes === 'yes' && (
                <div className="pt-1 animate-fadeIn">
                  <label htmlFor="pd-duration" className="block text-xs font-semibold text-slate-700 mb-1">
                    How long have you had diabetes? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pd-duration"
                    value={formData.diabetesDuration}
                    onChange={(e) => handleChange('diabetesDuration', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 bg-white transition-all outline-none cursor-pointer ${
                      errors.diabetesDuration
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  >
                    <option value="">Select Duration</option>
                    <option value="under_1_year">Less than 1 year</option>
                    <option value="1_to_5_years">1 – 5 years</option>
                    <option value="5_to_10_years">5 – 10 years</option>
                    <option value="more_than_10_years">More than 10 years</option>
                  </select>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Knowing duration helps calculate retinopathy risk thresholds.
                  </p>
                  {errors.diabetesDuration && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.diabetesDuration}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-[#0E2F76] hover:bg-[#1a4499] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] cursor-pointer"
            >
              <span>{isPatient ? 'Complete Profile' : 'Continue to Professional Details'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
