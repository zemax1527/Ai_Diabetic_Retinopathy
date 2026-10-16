import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * Must be nested inside <ProtectedRoute>.
 * Redirects users whose role is not in allowedRoles to /unauthorized.
 */
export default function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user } = useAuth();

  // Should never reach here without user (ProtectedRoute handles that),
  // but guard defensively.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
