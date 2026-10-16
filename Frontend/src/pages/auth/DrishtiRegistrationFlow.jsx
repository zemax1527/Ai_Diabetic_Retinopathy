import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AccountStep from '../../components/auth/AccountStep';
import RoleSelectionStep from '../../components/auth/RoleSelectionStep';
import PersonalDetailsStep from '../../components/auth/PersonalDetailsStep';
import ProfessionalDetailsStep from '../../components/auth/ProfessionalDetailsStep';
import VerificationSubmittedStep from '../../components/auth/VerificationSubmittedStep';
import PatientSuccessStep from '../../components/auth/PatientSuccessStep';
import VerificationPendingDashboard from './VerificationPendingDashboard';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

/**
 * DrishtiRegistrationFlow
 * Pure JavaScript component.
 * Master controller for the complete multi-step Drishti registration journey:
 *
 * Standard Flow:
 * Patient:
 * Register (1 Account) -> Select Role (2 Role) -> Personal Details (3 Details) -> Registration Complete (4 Complete) -> Patient Dashboard
 * Healthcare Worker & Doctor:
 * Register (1 Account) -> Select Role (2 Role) -> Personal Details (3 Details) -> Professional Details (4 Pro) -> Verification Submitted (5 Submitted) -> Verification Pending Dashboard (6 Pending)
 *
 * Google OAuth Flow:
 * Skips Step 1 (already authenticated) -> Starts at Step 2 (Role) -> Step 3 (Details) -> Direct/Pro Completion via completeProfile()
 */
export default function DrishtiRegistrationFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, completeProfile, user, isInitialized } = useAuth();

  // If navigating from Google OAuth success (?googleComplete=true), start directly at step 2 (Role Selection).
  // Otherwise start at step 1 (AccountStep).
  const [currentStep, setCurrentStep] = useState(() => searchParams.get('googleComplete') === 'true' ? 2 : 1);
  const [stepInitialised, setStepInitialised] = useState(false);

  // Derived: is this a Google OAuth profile-completion flow?
  // True when: URL has ?googleComplete=true OR user exists but has no profile yet.
  const isGoogleCompletion = Boolean(
    searchParams.get('googleComplete') === 'true' ||
    (user && user.isProfileComplete === false)
  );

  // Selected role: 'patient' | 'healthcare_worker' | 'doctor'
  const [selectedRole, setSelectedRole] = useState('patient');

  // Multi-step collected data
  const [registrationData, setRegistrationData] = useState({
    account: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    personal: {
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      phone: '',
      village: '',
      district: '',
      state: '',
      pincode: '',
      hasDiabetes: '',
      diabetesDuration: '',
    },
    professional: {
      workerType: 'ASHA',
      qualification: '',
      institutionName: '',
      yearOfCompletion: '',
      yearsOfExperience: '',
      employeeId: '',
      workplace: '',
      department: '',
      medicalRegistrationNumber: '',
      documents: {
        governmentId: null,
        qualificationCertificate: null,
        employmentProof: null,
        medicalRegistrationProof: null,
      },
    },
  });

  const [submitError, setSubmitError] = useState('');

  // After AuthContext finishes initialising, jump to the correct starting step
  // and prefill Google account details if this is an OAuth completion flow.
  useEffect(() => {
    if (!isInitialized) return; // wait for session check to complete
    if (stepInitialised) return; // only run once

    setStepInitialised(true);

    if (isGoogleCompletion && user) {
      // Prefill from Google account
      const parts = (user.name || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      setRegistrationData((prev) => ({
        ...prev,
        account: {
          ...prev.account,
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
        },
        personal: {
          ...prev.personal,
          firstName: firstName,
          lastName: lastName,
        },
      }));

      // Skip account-creation step — Google has already authenticated them
      setCurrentStep(2);
    }
    // For standard registration: stay at step 1 (AccountStep)
  }, [isInitialized, stepInitialised, isGoogleCompletion, user]);

  // ── Step 1: Account Step complete ──
  const handleAccountComplete = (accountData) => {
    setSubmitError('');
    setRegistrationData((prev) => ({
      ...prev,
      account: accountData,
      personal: {
        ...prev.personal,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
      },
    }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 2: Role Selection complete ──
  const handleRoleSelect = (role) => {
    setSubmitError('');
    setSelectedRole(role);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 3: Personal Details complete ──
  const handlePersonalComplete = async (personalData) => {
    setSubmitError('');
    setRegistrationData((prev) => ({
      ...prev,
      personal: personalData,
    }));

    if (selectedRole === 'patient') {
      const firstName = personalData.firstName || registrationData.account.firstName || user?.name?.split(' ')[0] || '';
      const lastName = personalData.lastName || registrationData.account.lastName || user?.name?.split(' ').slice(1).join(' ') || '';

      const personalDetails = {
        dateOfBirth: personalData.dob || undefined,
        gender: personalData.gender ? personalData.gender.toLowerCase() : undefined,
        phone: personalData.phone ? personalData.phone.trim() : undefined,
        address: {
          village: personalData.village?.trim() || '',
          district: personalData.district?.trim() || '',
          state: personalData.state?.trim() || '',
          pincode: personalData.pincode?.trim() || '',
        },
        diabetesStatus: personalData.hasDiabetes === 'yes' ? 'yes' : personalData.hasDiabetes === 'no' ? 'no' : 'unknown',
        diabetesDuration: personalData.diabetesDuration ? Number(personalData.diabetesDuration) : undefined,
      };

      if (isGoogleCompletion) {
        // Complete Google authenticated profile
        const res = await completeProfile({
          role: 'patient',
          fullName: { firstName, lastName },
          personalDetails,
        });

        if (!res.success) {
          setSubmitError(res.error || 'Failed to complete patient profile.');
          return;
        }

        setRegistrationData((prev) => ({
          ...prev,
          personal: {
            ...personalData,
            loginId: res.user?.loginId,
          },
        }));
      } else {
        // Standard user registration
        const payload = {
          role: 'patient',
          fullName: { firstName, lastName },
          email: registrationData.account.email.trim(),
          password: registrationData.account.password,
          personalDetails,
        };

        const res = await register(payload);
        if (!res.success) {
          setSubmitError(res.error || 'Failed to register patient account.');
          return;
        }

        setRegistrationData((prev) => ({
          ...prev,
          personal: {
            ...personalData,
            loginId: res.user?.loginId,
          },
        }));
      }

      setCurrentStep(4);
    } else {
      // Healthcare Worker or Doctor -> Step 4 is Professional Details Screen
      setCurrentStep(4);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 4 (Pro): Professional Details complete ──
  const handleProfessionalComplete = async (proData) => {
    setSubmitError('');
    setRegistrationData((prev) => ({
      ...prev,
      professional: proData,
    }));

    let proPayload = {};
    let verPayload = {};

    if (selectedRole === 'healthcare_worker') {
      proPayload = {
        designation: proData.workerType || 'Healthcare Worker',
        department: proData.department?.trim() || undefined,
        qualification: proData.qualification?.trim() || 'Health Worker Certification',
        yearsOfExperience: proData.yearsOfExperience ? Number(proData.yearsOfExperience) : 0,
        employeeId: proData.employeeId?.trim() || undefined,
        institution: {
          name: proData.institutionName?.trim() || proData.workplace?.trim() || 'Community Health Center',
        },
      };
      verPayload = {
        idProof: proData.documents?.governmentId?.name || 'Govt_ID_Submitted',
        employmentProof: proData.documents?.employmentProof?.name || 'Employment_Proof_Submitted',
        qualificationCertificate: proData.documents?.qualificationCertificate?.name || 'Certificate_Submitted',
      };
    } else if (selectedRole === 'doctor') {
      proPayload = {
        qualification: proData.qualification?.trim() || 'MBBS',
        yearsOfExperience: proData.yearsOfExperience ? Number(proData.yearsOfExperience) : 0,
        institution: {
          name: proData.institutionName?.trim() || proData.workplace?.trim() || 'Hospital Clinic',
        },
        specialization: proData.department?.trim() || 'Ophthalmology',
      };
      verPayload = {
        medicalRegistrationNumber: proData.medicalRegistrationNumber?.trim() || 'MCI-REG-PENDING',
        registrationCouncil: proData.registrationCouncil?.trim() || 'Medical Council of India',
        registrationYear: proData.yearOfCompletion ? Number(proData.yearOfCompletion) : new Date().getFullYear(),
        documents: {
          idProof: proData.documents?.governmentId?.name || 'Doctor_Govt_ID',
          medicalDegree: proData.documents?.qualificationCertificate?.name || 'Medical_Degree_Submitted',
          medicalRegistrationCertificate: proData.documents?.medicalRegistrationProof?.name || 'MCI_Registration_Cert',
          experienceCertificate: proData.documents?.employmentProof?.name || 'Experience_Cert',
        },
      };
    }

    const firstName = registrationData.personal.firstName || registrationData.account.firstName || user?.name?.split(' ')[0] || '';
    const lastName = registrationData.personal.lastName || registrationData.account.lastName || user?.name?.split(' ').slice(1).join(' ') || '';

    const personalDetails = {
      dateOfBirth: registrationData.personal.dob || undefined,
      gender: registrationData.personal.gender ? registrationData.personal.gender.toLowerCase() : undefined,
      phone: registrationData.personal.phone ? registrationData.personal.phone.trim() : undefined,
      address: {
        village: registrationData.personal.village?.trim() || '',
        district: registrationData.personal.district?.trim() || '',
        state: registrationData.personal.state?.trim() || '',
        pincode: registrationData.personal.pincode?.trim() || '',
      },
    };

    if (isGoogleCompletion) {
      const res = await completeProfile({
        role: selectedRole,
        fullName: { firstName, lastName },
        personalDetails,
        professionalDetails: proPayload,
        verificationDetails: verPayload,
      });

      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit verification application.');
        return;
      }

      setRegistrationData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          referenceId: res.user?.id
            ? `DRS-${selectedRole === 'doctor' ? 'DOC' : 'HW'}-${res.user.id.slice(-6).toUpperCase()}`
            : undefined,
        },
        professional: proData,
      }));
    } else {
      const payload = {
        role: selectedRole,
        fullName: { firstName, lastName },
        email: registrationData.account.email.trim(),
        password: registrationData.account.password,
        personalDetails,
        professionalDetails: proPayload,
        verificationDetails: verPayload,
      };

      const res = await register(payload);
      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit verification application.');
        return;
      }

      setRegistrationData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          referenceId: res.user?.id
            ? `DRS-${selectedRole === 'doctor' ? 'DOC' : 'HW'}-${res.user.id.slice(-6).toUpperCase()}`
            : undefined,
        },
        professional: proData,
      }));
    }

    // Move to Step 5: Verification Submitted Screen
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 5: Verification Submitted "Continue" ──
  const handleSubmittedContinue = () => {
    // Navigate directly to the Verification Pending Dashboard
    navigate('/pending', {
      replace: true,
      state: {
        role: selectedRole,
        name: `${registrationData.personal.firstName} ${registrationData.personal.lastName}`.trim(),
        workplace: registrationData.professional.workplace || registrationData.professional.institutionName,
      },
    });
  };

  // ── Back Handlers ──
  const handleBackToAccount = () => {
    if (isGoogleCompletion) {
      navigate('/login');
      return;
    }
    setSubmitError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToRole = () => {
    setSubmitError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPersonal = () => {
    setSubmitError('');
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main id="main-content" className="w-full min-h-screen bg-[#F5FEFF]">
      {/* Loading guard: when Google completion mode but session not yet hydrated, show spinner */}
      {!isInitialized && searchParams.get('googleComplete') === 'true' ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,47,118,0.06)] border border-[rgba(14,47,118,0.08)]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0E2F76] rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Preparing your profile setup…</p>
          </div>
        </div>
      ) : (
        <>
          {/* Banner for Google OAuth onboarding */}
          {isGoogleCompletion && (
            <div className="bg-[#0E2F76] text-white py-2.5 px-4 text-xs font-medium text-center shadow-xs flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>
                Google account verified ({user?.email || 'authenticated'}). Please select your portal role and complete your profile below.
              </span>
            </div>
          )}

          {submitError && (
            <div className="max-w-2xl mx-auto pt-4 px-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center justify-between">
                <span>{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError('')}
                  className="text-xs font-semibold underline text-red-800 hover:text-red-900 cursor-pointer ml-3"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
        <AccountStep
          initialData={registrationData.account}
          onComplete={handleAccountComplete}
        />
      )}

      {currentStep === 2 && (
        <RoleSelectionStep
          selectedRole={selectedRole}
          onSelectRole={handleRoleSelect}
          onBack={handleBackToAccount}
        />
      )}

      {currentStep === 3 && (
        <PersonalDetailsStep
          role={selectedRole}
          initialData={registrationData.personal}
          onComplete={handlePersonalComplete}
          onBack={handleBackToRole}
        />
      )}

      {/* Step 4: Branch depending on role */}
      {currentStep === 4 && selectedRole === 'patient' && (
        <PatientSuccessStep
          personalData={registrationData.personal}
          onGoToDashboard={() => navigate('/patient', { replace: true })}
        />
      )}

      {currentStep === 4 && (selectedRole === 'healthcare_worker' || selectedRole === 'doctor') && (
        <ProfessionalDetailsStep
          role={selectedRole}
          initialData={registrationData.professional}
          onComplete={handleProfessionalComplete}
          onBack={handleBackToPersonal}
        />
      )}

      {/* Step 5: Verification Submitted Screen for professionals */}
      {currentStep === 5 && (
        <VerificationSubmittedStep
          role={selectedRole}
          personalData={registrationData.personal}
          professionalData={registrationData.professional}
          onContinue={handleSubmittedContinue}
        />
      )}

      {/* Step 6: Direct Verification Pending Dashboard preview if rendered within flow */}
      {currentStep === 6 && (
        <VerificationPendingDashboard />
      )}
        </>
      )}
    </main>
  );
}
