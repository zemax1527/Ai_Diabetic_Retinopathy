import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../../context/AuthContext'
import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react'

/**
 * GoogleAuthSuccess
 *
 * Frontend landing page after Google OAuth redirect from backend:
 * 1. Restores the session by hitting GET /api/auth/me using the HTTP-only cookie.
 * 2. Checks profile completeness:
 *    - Incomplete profile -> Navigates to /register?googleComplete=true to select role & complete profile.
 * 3. Checks verification status:
 *    - Pending verification (Doctor / Healthcare Worker) -> Navigates to /pending.
 * 4. Checks active account:
 *    - Active verified user -> Navigates to the corresponding dashboard.
 * 5. Handles failures gracefully with error diagnostics and action buttons.
 */
export default function GoogleAuthSuccess() {
  const { restoreSession } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'restoring' | 'redirecting' | 'error'>('restoring')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [targetDestination, setTargetDestination] = useState<string>('')

  const performSessionHydration = useCallback(async () => {
    setStatus('restoring')
    setErrorMessage('')

    try {
      const user = await restoreSession()

      if (!user) {
        setStatus('error')
        setErrorMessage('Unable to verify Google authentication credentials. Please try signing in again.')
        return
      }

      setStatus('redirecting')

      // 1. Incomplete profile: Route to multi-step profile completion
      if (user.isProfileComplete === false) {
        setTargetDestination('Profile Setup')
        navigate('/register?googleComplete=true', { replace: true })
        return
      }

      // 2. Pending administrative verification for healthcare workers and doctors
      if (user.role !== 'admin' && (user.isActive === false || user.verificationStatus === 'pending')) {
        setTargetDestination('Verification Pending Portal')
        navigate('/pending', {
          replace: true,
          state: {
            role: user.role,
            name: user.name,
          },
        })
        return
      }

      // 3. Fully active user: Route to their designated dashboard
      const dashboardPath = getDashboardPath(user.role)
      setTargetDestination(`${user.role.toUpperCase()} Dashboard`)
      navigate(dashboardPath, { replace: true })
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(
        err?.message || 'A network error occurred while verifying your Google session.'
      )
    }
  }, [restoreSession, navigate])

  useEffect(() => {
    performSessionHydration()
  }, [performSessionHydration])

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-[#F5FEFF] px-4 py-8"
      role="main"
      aria-live="polite"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_rgba(14,47,118,0.08)] border border-[rgba(14,47,118,0.1)] p-8 sm:p-10 flex flex-col items-center text-center">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0E2F76] to-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            D
          </div>
          <div className="text-left">
            <span className="font-black text-[#0D1B3E] text-lg leading-tight block">Drishti</span>
            <span className="text-[11px] text-[#2563EB] font-semibold uppercase tracking-wider block">e-Netra AI</span>
          </div>
        </div>

        {/* ── State: Restoring or Redirecting ── */}
        {(status === 'restoring' || status === 'redirecting') && (
          <div className="flex flex-col items-center w-full">
            {/* Google-accented animated spinner */}
            <div className="relative w-16 h-16 mb-5">
              <svg
                className="animate-spin w-16 h-16"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Loading authentication state"
              >
                <circle cx="28" cy="28" r="24" stroke="#E8EDF5" strokeWidth="5" />
                <path
                  d="M52 28 A24 24 0 0 1 28 52"
                  stroke="url(#googleGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="googleGrad" x1="28" y1="4" x2="52" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" />
                    <stop offset="0.33" stopColor="#34A853" />
                    <stop offset="0.66" stopColor="#FBBC05" />
                    <stop offset="1" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#0E2F76]/70" />
              </div>
            </div>

            <h1 className="text-xl font-extrabold text-[#0D1B3E] mb-2">
              {status === 'restoring' ? 'Authenticating with Google' : 'Session Verified!'}
            </h1>

            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
              {status === 'restoring'
                ? 'Validating security tokens and synchronizing account credentials…'
                : `Transferring to ${targetDestination || 'your workspace'}…`}
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#2563EB] ${
                  status === 'restoring' ? 'w-2/3 animate-pulse' : 'w-full transition-all duration-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* ── State: Authentication Error ── */}
        {status === 'error' && (
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-5 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-extrabold text-[#0D1B3E] mb-2">
              Authentication Notice
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {errorMessage || 'Unable to establish an authenticated session. Your Google login may have timed out.'}
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                type="button"
                onClick={performSessionHydration}
                className="w-full py-3 px-4 rounded-xl bg-[#0E2F76] hover:bg-[#1a4499] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Session Check</span>
              </button>

              <Link
                to="/login"
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Back to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer accessibility note */}
      <p className="mt-8 text-xs text-slate-400 text-center max-w-sm">
        Protected by Ayushman Bharat Digital Mission (ABDM) compliant security standards.
      </p>
    </main>
  )
}
