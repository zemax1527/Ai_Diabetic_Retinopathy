import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LogIn, CheckCircle2 } from 'lucide-react';
import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import AuthButton from './AuthButton';
import FormAlert from './FormAlert';
import { useAuth, getDashboardPath } from '../../context/AuthContext';

/**
 * Professional, compact Login Form for Drishti.
 * Fits within standard 1366x768 and 1440x900 desktop viewports without vertical overflow.
 */
export default function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth(); // optional context connection

  const [formData, setFormData] = useState({
    loginInput: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear errors on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (globalError) setGlobalError('');
  };

  const validate = () => {
    const newErrors = {};
    const input = formData.loginInput.trim();

    if (!input) {
      newErrors.loginInput = 'Please enter your email or Login ID';
    } else if (input.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
      newErrors.loginInput = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setForgotNotice(false);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (auth && typeof auth.login === 'function') {
        const result = await auth.login(formData.loginInput, formData.password);
        if (result && result.success && result.user) {
          navigate(getDashboardPath(result.user.role), { replace: true });
          return;
        } else if (result && result.error) {
          setGlobalError(result.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Demo/Visual presentation fallback if backend is offline or credentials fail
      setTimeout(() => {
        setIsSubmitting(false);
        // Inform user gracefully if backend is not actively responding with this demo user
        setGlobalError('Backend authentication check complete. For role-based review, please verify your credentials with the administrator.');
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      setGlobalError(err.message || 'Unable to sign in. Please verify your connection.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-3.5">
      {globalError && (
        <FormAlert type="error" message={globalError} />
      )}

      {globalError && globalError.toLowerCase().includes('pending admin approval') && (
        <div className="text-center py-1">
          <Link
            to="/pending"
            className="text-xs font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1"
          >
            Check status in Verification Pending Portal &rarr;
          </Link>
        </div>
      )}

      {forgotNotice && (
        <FormAlert
          type="info"
          message="Password reset is managed by the District Health Administrator. Please contact your system administrator or PHC coordinator."
        />
      )}

      {/* Email or Login ID */}
      <AuthInput
        id="loginInput"
        label="Email or Login ID"
        type="text"
        placeholder="name@example.com or PAT-8291"
        value={formData.loginInput}
        onChange={handleChange}
        icon={Mail}
        error={errors.loginInput}
        autoComplete="username"
        required
      />

      {/* Password with Forgot Password action */}
      <PasswordInput
        id="password"
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        autoComplete="current-password"
        required
        rightHeaderAction={
          <button
            type="button"
            onClick={() => setForgotNotice(true)}
            className="text-[11px] font-medium text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer outline-none focus:underline"
          >
            Forgot password?
          </button>
        }
      />

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 rounded border-[#CBD5E1] text-[#0C1E3C] focus:ring-[#0284C7]/20 transition-colors cursor-pointer accent-[#0C1E3C]"
          />
          <span className="text-xs text-[#64748B] font-medium">Remember on this device</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <AuthButton
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          icon={LogIn}
        >
          Sign In to e-Netra AI
        </AuthButton>
      </div>

      {/* Social Divider */}
      <div className="relative my-2.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2E8F0]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white px-2.5 text-[#94A3B8] font-semibold tracking-wider">or continue with</span>
        </div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={() => auth?.loginWithGoogle && auth.loginWithGoogle()}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E2F76]/20"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Register Link */}
      <div className="pt-2 border-t border-[#E2E8F0] text-center">
        <p className="text-xs text-[#64748B]">
          New patient needing screening?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors focus:underline"
          >
            Create Patient Account
          </Link>
        </p>
      </div>
    </form>
  );
}
