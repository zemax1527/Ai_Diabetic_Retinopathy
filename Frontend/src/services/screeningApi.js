/**
 * Screening API Service
 * 
 * Direct communication between React Frontend and AI Developer API.
 * Target Endpoint: POST ${AI_API_BASE_URL}/api/v1/screening/screen
 * Content-Type: multipart/form-data (Browser automatically generates boundary)
 * 
 * Architectural Rule:
 * React Frontend -> AI Developer API (No backend proxy, no MongoDB storage, no fake endpoints)
 */

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://10.162.237.115:8000';
export const SCREENING_ENDPOINT = `${AI_API_BASE_URL}/api/v1/screening/screen`;

/**
 * Directly submit a fundus image to the AI screening API.
 * 
 * @param {Object} params
 * @param {string} params.userId - Logged in user's ID
 * @param {File|Blob} params.file - Fundus retinal image file
 * @param {string} params.language - Selected language (e.g. 'English', 'Marathi', 'Hindi')
 * @returns {Promise<Object>} AI API response data
 */
export async function screenFundusImage({ userId, file, language = 'English' }) {
  if (!userId) {
    throw new Error('Unable to identify the logged-in user. Please log in again.');
  }

  if (!file) {
    throw new Error('Please upload or capture a fundus image before submitting.');
  }

  // Construct multipart/form-data payload
  const formData = new FormData();
  formData.append('user_id', String(userId).trim());
  formData.append('file', file);
  formData.append('language', language || 'English');

  console.log('[Drishti AI API] Sending request to:', SCREENING_ENDPOINT);
  console.log('[Drishti AI API] Payload:', { userId, fileName: file.name, fileSize: file.size, language });

  // Use an AbortController with a 120-second timeout for deep learning inference
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 120000);

  try {
    const response = await fetch(SCREENING_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Note: Do NOT manually set 'Content-Type' header.
      // The browser must automatically set it along with the unique boundary.
    });

    clearTimeout(timeoutId);
    console.log('[Drishti AI API] HTTP status received:', response.status);

    if (!response.ok) {
      let errorMessage = `AI service returned error ${response.status}.`;
      try {
        const errorData = await response.json();
        console.error('[Drishti AI API] Error payload:', errorData);
        if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If response is not JSON
        if (response.status === 404) {
          errorMessage = `Screening endpoint not found at ${SCREENING_ENDPOINT}.`;
        } else if (response.status === 413) {
          errorMessage = 'The image file is too large. Please upload an image under 15MB.';
        } else if (response.status === 422 || response.status === 400) {
          errorMessage = 'Please upload a valid retinal fundus image file.';
        } else if (response.status >= 500) {
          errorMessage = 'Screening service encountered an internal error. Please try again.';
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log('[Drishti AI API] Successfully received screening response:', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Drishti AI API] Request timed out after 120 seconds.');
      throw new Error(
        `Screening request timed out after 2 minutes. The AI server at ${AI_API_BASE_URL} took too long to complete model evaluation.`
      );
    }

    // Network / CORS failure
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[Drishti AI API] Network failure:', error);
      throw new Error(
        `Unable to reach AI screening service at ${SCREENING_ENDPOINT}. Please check if the service is online and CORS is enabled.`
      );
    }

    throw error;
  }
}
