import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

// ── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'healthcare_worker' | 'doctor' | 'admin'

export interface AuthUser {
  id: string
  loginId?: string
  name: string
  email: string
  role: UserRole
  verificationStatus?: string
  isActive?: boolean
  isProfileComplete?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  login: (
    loginInput: string,
    password: string
  ) => Promise<{
    success: boolean
    user?: AuthUser
    error?: string
  }>
  loginWithGoogle: () => void
  restoreSession: () => Promise<AuthUser | null>
  completeProfile: (profileData: any) => Promise<{
    success: boolean
    user?: AuthUser
    error?: string
    redirectTo?: string
  }>
  loginAsDemo: (role: UserRole) => void
  logout: () => void
  register: (data: RegisterData) => Promise<{
    success: boolean
    user?: any
    error?: string
  }>
}

export interface RegisterData {
  role?: UserRole
  name?: string
  mobile?: string
  fullName?: {
    firstName: string
    lastName?: string
  }
  email: string
  password: string
  personalDetails?: any
  professionalDetails?: any
  verificationDetails?: any
}

// ── Token helpers ────────────────────────────────────────────────────────────
// Drishti uses HTTP-only cookies for authentication.
// These are kept only for compatibility if the backend ever returns a token.

const TOKEN_KEY = 'drishti_auth_token'

function saveToken(token: string | undefined) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// ── Role helpers ─────────────────────────────────────────────────────────────

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'patient':
      return '/patient'

    case 'healthcare_worker':
      return '/healthcare-worker'

    case 'doctor':
      return '/doctor'

    case 'admin':
      return '/admin'
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'patient':
      return 'Patient'

    case 'healthcare_worker':
      return 'Healthcare Worker'

    case 'doctor':
      return 'Doctor'

    case 'admin':
      return 'Administrator'
  }
}

// ── Demo users ───────────────────────────────────────────────────────────────

const DEMO_USERS: Record<UserRole, AuthUser> = {
  patient: {
    id: 'demo-p',
    loginId: 'DEMO-P',
    name: 'Aryan Mehta',
    email: 'patient@drishti.ai',
    role: 'patient',
  },

  doctor: {
    id: 'demo-d',
    loginId: 'DEMO-D',
    name: 'Dr. Priya Sharma',
    email: 'doctor@drishti.ai',
    role: 'doctor',
  },

  healthcare_worker: {
    id: 'demo-hw',
    loginId: 'DEMO-HW',
    name: 'Riya Patel',
    email: 'worker@drishti.ai',
    role: 'healthcare_worker',
  },

  admin: {
    id: 'demo-a',
    loginId: 'DEMO-A',
    name: 'Admin User',
    email: 'admin@drishti.ai',
    role: 'admin',
  },
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // ── Session restoration ───────────────────────────────────────────────────

  const restoreSession = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const data = await api.get(ENDPOINTS.AUTH_ME) as {
        user?: {
          id: string
          loginId?: string
          fullName: { firstName: string; lastName?: string }
          email: string
          role: UserRole
          verificationStatus?: string
          isActive?: boolean
          isProfileComplete?: boolean
        }
      }

      if (!data?.user) {
        setUser(null)
        return null
      }

      const authUser: AuthUser = {
        id: data.user.id,
        loginId: data.user.loginId || '',
        name: [data.user.fullName?.firstName, data.user.fullName?.lastName]
          .filter(Boolean)
          .join(' ') || data.user.email,
        email: data.user.email,
        role: data.user.role,
        verificationStatus: data.user.verificationStatus,
        isActive: data.user.isActive,
        isProfileComplete: data.user.isProfileComplete ?? true
      }

      setUser(authUser)
      return authUser
    } catch {
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  // Attempt session restore on mount (works after Google OAuth redirect)
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (
    loginInput: string,
    password: string,
  ): Promise<{
    success: boolean
    user?: AuthUser
    error?: string
  }> => {
    setIsLoading(true)

    try {
      const data = await api.post(
        ENDPOINTS.AUTH_LOGIN,
        {
          loginInput: loginInput.trim(),
          password,
        }
      ) as {
        token?: string
        access_token?: string
        user?: {
          id: string
          loginId: string
          fullName: {
            firstName: string
            lastName?: string
          }
          email: string
          role: UserRole
        }
      }

      if (!data.user) {
        throw new ApiError(
          500,
          'Invalid login response from server.',
          data
        )
      }

      const authUser: AuthUser = {
        id: data.user.id,
        loginId: data.user.loginId,
        name: [
          data.user.fullName?.firstName,
          data.user.fullName?.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        email: data.user.email,
        role: data.user.role,
      }

      // Backend currently uses HTTP-only cookie authentication.
      // This only handles a token if the backend happens to return one.
      saveToken(data.token ?? data.access_token)

      setUser(authUser)

      return {
        success: true,
        user: authUser,
      }
    } catch (err: unknown) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Network error. Please check your connection.'

      return {
        success: false,
        error: message,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(() => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
    window.location.href = `${BASE_URL}/api/auth/google`
  }, [])

  // ── Demo login ────────────────────────────────────────────────────────────

  const loginAsDemo = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role])
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.AUTH_LOGOUT, {})
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AUTH] Logout error:', err)
      }
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(async (
    data: RegisterData,
  ): Promise<{
    success: boolean
    user?: any
    error?: string
  }> => {
    setIsLoading(true)

    try {
      const payload: Record<string, any> = { ...data }
      if (!payload.fullName && payload.name) {
        const parts = String(payload.name).trim().split(/\s+/)
        payload.fullName = {
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || ''
        }
      }
      if (!payload.role) {
        payload.role = 'patient'
      }
      if (!payload.personalDetails && payload.mobile) {
        payload.personalDetails = { phone: payload.mobile }
      }

      const response = await api.post(
        ENDPOINTS.AUTH_REGISTER,
        payload
      ) as {
        status?: string
        message?: string
        user?: {
          id: string
          loginId?: string
          fullName?: {
            firstName: string
            lastName?: string
          }
          email: string
          role: UserRole
          verificationStatus?: string
          isActive?: boolean
        }
      }

      if (response?.user && response.user.isActive) {
        const authUser: AuthUser = {
          id: response.user.id,
          loginId: response.user.loginId || '',
          name: [
            response.user.fullName?.firstName,
            response.user.fullName?.lastName,
          ]
            .filter(Boolean)
            .join(' '),
          email: response.user.email,
          role: response.user.role,
        }
        setUser(authUser)
      }

      return {
        success: true,
        user: response?.user,
      }
    } catch (err: unknown) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Network error. Please check your connection.'

      return {
        success: false,
        error: message,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Complete Profile (for Google OAuth or incomplete setups) ───────────────

  const completeProfile = useCallback(async (
    profileData: any
  ): Promise<{
    success: boolean
    user?: AuthUser
    error?: string
    redirectTo?: string
  }> => {
    setIsLoading(true)

    try {
      const response = await api.post(
        ENDPOINTS.AUTH_COMPLETE_PROFILE,
        profileData
      ) as {
        status?: string
        message?: string
        user?: {
          id: string
          loginId?: string
          fullName?: { firstName: string; lastName?: string }
          email: string
          role: UserRole
          verificationStatus?: string
          isActive?: boolean
          isProfileComplete?: boolean
        }
        redirectTo?: string
      }

      if (response?.user) {
        const authUser: AuthUser = {
          id: response.user.id,
          loginId: response.user.loginId || '',
          name: [
            response.user.fullName?.firstName,
            response.user.fullName?.lastName,
          ]
            .filter(Boolean)
            .join(' ') || response.user.email,
          email: response.user.email,
          role: response.user.role,
          verificationStatus: response.user.verificationStatus,
          isActive: response.user.isActive,
          isProfileComplete: response.user.isProfileComplete ?? true,
        }

        setUser(authUser)

        return {
          success: true,
          user: authUser,
          redirectTo: response.redirectTo,
        }
      }

      return {
        success: false,
        error: 'Unexpected server response while completing profile.',
      }
    } catch (err: unknown) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Network error. Please check your connection.'

      return {
        success: false,
        error: message,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitialized,
        login,
        loginWithGoogle,
        restoreSession,
        completeProfile,
        loginAsDemo,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return ctx
}