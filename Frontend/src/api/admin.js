import { api } from './client.js';
import { ENDPOINTS } from './endpoints.js';

export const fetchPendingVerifications = async () => {
  return api.get(ENDPOINTS.ADMIN_PENDING_VERIFICATIONS);
};

export const fetchVerificationDetails = async (userId) => {
  return api.get(ENDPOINTS.ADMIN_VERIFICATION_DETAILS(userId));
};

export const approveApplicant = async (userId) => {
  return api.patch(ENDPOINTS.ADMIN_APPROVE_APPLICANT(userId));
};

export const rejectApplicant = async (userId, reason) => {
  return api.patch(ENDPOINTS.ADMIN_REJECT_APPLICANT(userId), { reason });
};
