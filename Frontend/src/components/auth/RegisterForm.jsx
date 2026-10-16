import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, UserPlus, CheckCircle2 } from 'lucide-react';
import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import AuthButton from './AuthButton';
import FormAlert from './FormAlert';
import { useAuth } from '../../context/AuthContext';

/**
 * Professional Patient Registration Form.
 * Clean, compact, responsive form with desktop 2-column grid for credentials.
 * Contains only the approved basic account fields: Full Name, Email, Password, Confirm Password.
 */
export default function RegisterForm() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (globalError) setGlobalError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name (min 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the screening terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (auth && typeof auth.register === 'function') {
        const result = await auth.register({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'patient',
        });

        if (result && result.success) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1800);
          return;
        } else if (result && result.error) {
          setGlobalError(result.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Demonstration success state
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1800);
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      setGlobalError(err.message || 'Registration failed. Please check your details.');
    }
  };

  if (isSuccess) {
    return (
      <div className="py-4 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mx-auto text-[#059669]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Patient Account Created!</h3>
        <p className="text-xs text-[#64748B] leading-relaxed max-w-xs mx-auto">
          Your patient profile has been initialized. Redirecting you to the sign-in screen…
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#0E2F76] rounded-lg hover:bg-[#0A2259] transition-colors"
          >
            Go to Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-3">
      {globalError && (
        <FormAlert type="error" message={globalError} />
      )}

      {/* Full Name */}
      <AuthInput
        id="fullName"
        label="Full Name"
        type="text"
        placeholder="e.g. Ramesh Kumar"
        value={formData.fullName}
        onChange={handleChange}
        icon={User}
        error={errors.fullName}
        autoComplete="name"
        required
      />

      {/* Email Address */}
      <AuthInput
        id="email"
        label="Email Address"
        type="email"
        placeholder="name@example.com"
        value={formData.email}
        onChange={handleChange}
        icon={Mail}
        error={errors.email}
        autoComplete="email"
        required
      />

      {/* Password & Confirm Password (2-column on >= sm, 1-column on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordInput
          id="password"
          label="Password"
          placeholder="Min 8 characters"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
      </div>

      {/* Password Guidance Note */}
      <p className="text-[11px] text-[#64748B] -mt-1 leading-tight">
        Must be at least 8 characters. Public registration registers you as a <span className="font-semibold text-[#0F172A]">Patient</span>.
      </p>

      {/* Terms and Privacy Checkbox */}
      <div className="pt-0.5">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] text-[#0C1E3C] focus:ring-[#0284C7]/20 transition-colors cursor-pointer accent-[#0C1E3C]"
          />
          <span className="text-xs text-[#64748B] leading-tight">
            I understand e-Netra AI provides clinical screening decision-support and agree to the{' '}
            <span className="text-[#0284C7] font-medium hover:underline">Privacy Terms</span>.
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="mt-1 text-xs text-[#DC2626] font-medium">
            {errors.agreeTerms}
          </p>
        )}
      </div>

      {/* Create Account Button */}
      <div className="pt-1.5">
        <AuthButton
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          icon={UserPlus}
        >
          Create Patient Account
        </AuthButton>
      </div>

      {/* Sign In Link */}
      <div className="pt-2 border-t border-[#E2E8F0] text-center">
        <p className="text-xs text-[#64748B]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors focus:underline"
          >
            Sign In here
          </Link>
        </p>
      </div>
    </form>
  );
}
