/**
 * API Endpoint paths — Production Confirmed
 *
 * Centralizes all active backend routes for e-Netra AI.
 */

export const ENDPOINTS = {
  // --- Auth ---
  AUTH_ME:             '/api/auth/me',
  AUTH_PROFILE:        '/api/auth/profile',
  AUTH_GOOGLE:         '/api/auth/google',
  AUTH_LOGIN:          '/api/auth/login',
  AUTH_LOGOUT:         '/api/auth/logout',
  AUTH_REGISTER:       '/api/auth/register',
  AUTH_CHECK_EMAIL:    '/api/auth/check-email',
  AUTH_COMPLETE_PROFILE: '/api/auth/complete-profile',

  // --- Patients ---
  PATIENT_PROFILE_ME:  '/api/patients/me',
  PATIENTS_LIST:       '/api/patients',
  PATIENTS_REGISTER:   '/api/patients',
  PATIENT_CLAIM:       '/api/patients/claim',
  PATIENT_DETAIL:      (id) => `/api/patients/${id}`,

  // --- Screenings ---
  SCREENINGS_SYNC:     '/api/screenings/sync',
  SCREENINGS_MY:       '/api/screenings/my',
  SCREENING_DETAIL:    (id) => `/api/screenings/${id}`,
  SCREENINGS_PATIENT:  (patientId) => `/api/screenings/patient/${patientId}`,

  // --- Clinical Review (Doctor) ---
  REVIEWS_QUEUE:       '/api/reviews/queue',
  REVIEW_SUBMIT:       (screeningId) => `/api/reviews/${screeningId}`,
  REVIEWS_HISTORY:     '/api/reviews/history',

  // --- Admin ---
  ADMIN_PENDING_VERIFICATIONS: '/api/v1/admin/verification/pending',
  ADMIN_VERIFICATION_DETAILS: (id) => `/api/v1/admin/verification/${id}`,
  ADMIN_APPROVE_APPLICANT: (id) => `/api/v1/admin/verification/${id}/approve`,
  ADMIN_REJECT_APPLICANT: (id) => `/api/v1/admin/verification/${id}/reject`,
  ADMIN_ANALYTICS_OVERVIEW: '/api/v1/admin/analytics/overview',
  ADMIN_ANALYTICS_DISTRICTS: '/api/v1/admin/analytics/districts',
  ADMIN_AUDIT_LOG: '/api/v1/admin/audit-logs',
};
