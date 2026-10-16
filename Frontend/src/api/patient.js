import { api } from './client.js';
import { ENDPOINTS } from './endpoints.js';

export const fetchPatientProfile = async () => {
  return api.get(ENDPOINTS.PATIENT_PROFILE_ME);
};

export const updatePatientProfile = async (updateData) => {
  return api.patch(ENDPOINTS.PATIENT_PROFILE_ME, updateData);
};

export const claimPatientRecord = async ({ patientId, claimCode, phone, dateOfBirth }) => {
  return api.post(ENDPOINTS.PATIENT_CLAIM, { patientId, claimCode, phone, dateOfBirth });
};
