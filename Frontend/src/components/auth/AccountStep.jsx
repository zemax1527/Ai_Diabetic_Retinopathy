import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import RetinalBrandGraphic from './RetinalBrandGraphic';
import AuthProgress from './AuthProgress';
import { checkEmailAvailability } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

// Google logo SVG – inline, no CDN dependency
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

/**
 * AccountStep
 * Pure JavaScript component.
 * Screen 1: Modern split-layout registration page.
 * Left: Drishti branding, retinal fundus art, trust indicators.
 * Right: Account creation card with progress indicator, First Name, Last Name, Email, Password, Confirm Password.
 */
export default function AccountStep({ initialData, onComplete }) {
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    confirmPassword: initialData?.confirmPassword || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setEmailChecked(false);
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Check email on blur
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setCheckingEmail(true);
    try {
      await checkEmailAvailability(email);
      setEmailChecked(true);
    } catch (err) {
      setEmailChecked(false);
      const isDuplicate =
        err?.status === 409 ||
        (err?.message && /already exists/i.test(err.message));
      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          email: 'An account with this email already exists. Please log in.',
        }));
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-400' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-400' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-slate-300' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length < 2) {
      errs.firstName = 'First name must be at least 2 characters.';
    }

    if (!formData.lastName.trim()) {
      errs.lastName = 'Last name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await checkEmailAvailability(formData.email.trim());
      setIsSubmitting(false);
      onComplete(formData);
    } catch (err) {
      setIsSubmitting(false);
      const isDuplicate =
        err?.status === 409 ||
        (err?.message && /already exists/i.test(err.message));

      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          email: 'An account with this email already exists. Please log in.',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          email: err?.message || 'Could not verify email. Please try again.',
        }));
      }
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F5FEFF] flex flex-col lg:flex-row">
      {/* ── LEFT PANEL (Branding & Retinal Visual) ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-[#0D1B3E] text-white flex-col justify-between p-6 xl:p-8 relative overflow-hidden h-full">
        {/* Subtle background glow */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0E2F76] via-[#2563EB] to-sky-400 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <span className="text-white font-extrabold text-lg tracking-tight">D</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">Drishti</span>
              <span className="text-[9px] text-sky-300 font-semibold tracking-widest uppercase">Healthcare AI Platform</span>
            </div>
          </Link>

          <div className="mt-4 xl:mt-6 max-w-md">
            <h1 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight leading-snug">
              Explainable diabetic retinopathy screening for better eye health.
            </h1>
            <p className="mt-2 text-slate-300 text-xs xl:text-sm leading-relaxed">
              Empowering primary care centres, field health workers, and specialist ophthalmologists with clinical-grade AI retinal triage.
            </p>
          </div>
        </div>

        {/* Retinal Fundus & Trust Badges */}
        <div className="relative z-10 my-auto py-2">
          <RetinalBrandGraphic />
        </div>

        {/* Left footer note */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Smart India Hackathon 2026</span>
          <span>MoHFW Compliant</span>
        </div>
      </div>

      {/* ── RIGHT PANEL (Registration Form) ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-4 sm:px-6 lg:px-8 xl:px-12 h-full lg:overflow-y-auto">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 lg:p-7 my-auto">
          {/* Subtle Progress Indicator: Step 1 Account */}
          <AuthProgress currentStep={1} role="patient" />

          {/* Card Header */}
          <div className="mb-4 text-left">
            <h2 className="text-xl sm:text-2xl font-black text-[#0D1B3E] tracking-tight">
              Create your Drishti account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Join Drishti to access diabetic eye screening and healthcare services.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* First Name & Last Name (Two columns on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-firstName"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reg-firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="e.g. Ramesh"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                      errors.firstName
                        ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.firstName}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-lastName"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reg-lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="e.g. Sharma"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                      errors.lastName
                        ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                        : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="ramesh.sharma@example.com"
                  autoComplete="email"
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                    errors.email
                      ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                      : emailChecked && !errors.email
                      ? 'border-emerald-400 bg-emerald-50/10 ring-2 ring-emerald-100'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                {checkingEmail && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
                {!checkingEmail && emailChecked && !errors.email && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {errors.email && (
                <div className="mt-1 text-xs text-red-600 flex items-center justify-between gap-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.email}</span>
                  </span>
                  {/already/i.test(errors.email) && (
                    <Link
                      to="/login"
                      className="underline font-bold text-[#0E2F76] hover:text-blue-800 flex-shrink-0 ml-auto"
                    >
                      Login here →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className={`w-full pl-9 pr-10 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                    errors.password
                      ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          step <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                    <span>Strength: <strong className="text-slate-700">{strength.label}</strong></span>
                    <span>Min. 8 characters</span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirmPassword"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`w-full pl-9 pr-10 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                    errors.confirmPassword
                      ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                      : 'border-slate-300 focus:border-[#0E2F76] focus:ring-2 focus:ring-[#0E2F76]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </p>
              )}

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button: Continue */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isSubmitting || checkingEmail}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm text-white bg-[#0E2F76] hover:bg-[#1a4499] active:scale-[0.99] transition-all shadow-[0_4px_16px_rgba(14,47,118,0.2)] hover:shadow-[0_6px_20px_rgba(14,47,118,0.3)] disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking email…</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* ── Google Sign-Up ── */}
            <div className="pt-1">
              {/* Divider */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">or sign up with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                id="google-register-btn"
                type="button"
                disabled={googleLoading}
                onClick={() => {
                  setGoogleLoading(true);
                  loginWithGoogle();
                }}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-xl border border-slate-300 bg-white
                  hover:bg-[#F7FAFF] hover:border-[#AAC0E1] hover:shadow-sm
                  active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-[#0E2F76] focus:ring-offset-2
                  transition-all duration-200 cursor-pointer shadow-sm"
                aria-label="Sign up with Google"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm font-semibold text-slate-700">
                  {googleLoading ? 'Redirecting…' : 'Sign up with Google'}
                </span>
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Fast signup — you will select your role (Patient, Health Worker, Doctor) next.
              </p>
            </div>

            {/* Secondary Login Link */}
            <div className="pt-0 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#0E2F76] hover:underline focus:outline-none focus:ring-1 focus:ring-[#0E2F76] rounded"
                >
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
