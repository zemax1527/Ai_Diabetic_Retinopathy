import { api } from './client.js';
import { ENDPOINTS } from './endpoints.js';

export const registerUser = async (formData) => {
  return api.post(ENDPOINTS.AUTH_REGISTER, formData);
};

export const loginUser = async (credentials) => {
  return api.post(ENDPOINTS.AUTH_LOGIN, credentials);
};

export const logoutUser = async () => {
  return api.post(ENDPOINTS.AUTH_LOGOUT);
};

export const checkEmailAvailability = async (email) => {
  return api.post(ENDPOINTS.AUTH_CHECK_EMAIL, { email });
};
