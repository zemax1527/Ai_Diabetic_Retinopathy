import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth, getDashboardPath } from '../../context/AuthContext';

/**
 * Public Login Page for Drishti.
 * Fits within standard desktop viewports (1366x768, 1440x900) without vertical overflow.
 */
export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to the user's appropriate route
  useEffect(() => {
    if (user && user.role) {
      if (user.isProfileComplete === false) {
        navigate('/register?googleComplete=true', { replace: true });
        return;
      }
      if (user.role !== 'admin' && (user.isActive === false || user.verificationStatus === 'pending')) {
        navigate('/pending', { replace: true });
        return;
      }
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  return (
    <AuthLayout
      variant="login"
      title="Welcome Back"
      subtitle="Sign in to access your screening workflow or clinical dashboard"
    >
      <LoginForm />
    </AuthLayout>
  );
}
