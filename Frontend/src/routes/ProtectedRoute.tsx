import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard that:
 * 1. Waits for session initialization (prevents false /login bounce on refresh).
 * 2. Redirects unauthenticated users to /login preserving target route.
 * 3. Redirects users with incomplete profiles to registration completion flow.
 * 4. Redirects pending/unverified professionals to /pending.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  // If session is still being checked, show accessible loading screen
  if (isLoading || !isInitialized) {
    return (
      <main
        id="main-content"
        className="min-h-screen flex flex-col items-center justify-center bg-[#F5FEFF]"
        aria-label="Loading protected content"
      >
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(14,47,118,0.08)]">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-[#0E2F76] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying session credentials…</p>
        </div>
      </main>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Profile incomplete (e.g. fresh Google OAuth sign-in)
  if (user.isProfileComplete === false) {
    return <Navigate to="/register?googleComplete=true" replace />;
  }

  // Pending verification for Healthcare Workers and Doctors
  if (user.role !== 'admin' && (user.isActive === false || user.verificationStatus === 'pending')) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}

