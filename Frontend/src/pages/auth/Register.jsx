import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DrishtiRegistrationFlow from './DrishtiRegistrationFlow';
import { useAuth, getDashboardPath } from '../../context/AuthContext';

/**
 * Public Multi-Step Registration Page for e-Netra AI / Drishti.
 * Renders the 5-step registration flow:
 * Step 1: Account credentials & email verification
 * Step 2: Role selection (Patient, Healthcare Worker, Doctor)
 * Step 3: Personal & demographic details
 * Step 4: Professional credentials & documents (HCW / Doctor) or Direct Activation (Patient)
 * Step 5: Health ID card (Patient) or Verification Submitted status (HCW / Doctor)
 */
export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialUserChecked = useRef(false);

  // If already logged in with complete profile when visiting /register, redirect to dashboard
  useEffect(() => {
    if (!initialUserChecked.current && user && user.role) {
      if (user.isProfileComplete === false) {
        // User is completing their profile (e.g. from Google OAuth)
        return;
      }
      initialUserChecked.current = true;
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  return <DrishtiRegistrationFlow />;
}
