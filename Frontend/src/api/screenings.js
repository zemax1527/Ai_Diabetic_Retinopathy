import { api } from './client.js';
import { ENDPOINTS } from './endpoints.js';

/**
 * Persist AI screening result to MongoDB
 */
export async function syncScreeningToBackend(screeningData, patientId = null, rawAiResponse = null) {
  return api.post(ENDPOINTS.SCREENINGS_SYNC, {
    screeningData,
    patientId,
    rawAiResponse: rawAiResponse || screeningData?.raw || screeningData?.rawAiResponse || null
  });
}

/**
 * Fetch screening history for logged in patient
 */
export async function fetchMyScreenings() {
  return api.get(ENDPOINTS.SCREENINGS_MY);
}

/**
 * Fetch a single screening by ID
 */
export async function fetchScreeningById(id) {
  return api.get(ENDPOINTS.SCREENING_DETAIL(id));
}

/**
 * Fetch clinical review queue for doctors
 */
export async function fetchReviewQueue(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${ENDPOINTS.REVIEWS_QUEUE}?${query}` : ENDPOINTS.REVIEWS_QUEUE;
  return api.get(url);
}

/**
 * Submit clinical review
 */
export async function submitClinicalReview(screeningId, reviewData) {
  return api.post(ENDPOINTS.REVIEW_SUBMIT(screeningId), reviewData);
}

/**
 * Healthcare worker: register a new patient in outreach camp
 */
export async function registerFieldPatient(patientData) {
  return api.post(ENDPOINTS.PATIENTS_REGISTER, patientData);
}

/**
 * Search patients for outreach / doctor lookup
 */
export async function fetchFieldPatients(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${ENDPOINTS.PATIENTS_LIST}?${query}` : ENDPOINTS.PATIENTS_LIST;
  return api.get(url);
}

/**
 * Fetch district analytics for admin dashboard
 */
export async function fetchDistrictAnalytics() {
  return api.get(ENDPOINTS.ADMIN_ANALYTICS_DISTRICTS);
}

/**
 * Fetch system overview metrics for admin dashboard
 */
export async function fetchAdminOverview() {
  return api.get(ENDPOINTS.ADMIN_ANALYTICS_OVERVIEW);
}
