/**
 * Application-wide constants.
 * Change values here; do not scatter magic numbers through components.
 */

// --- Mock mode ---
/** True when running with mock data adapter */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

// --- Image upload limits ---
/** Maximum fundus image upload size in bytes (10 MB) */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

/** Accepted MIME types for fundus image upload */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']

/** Minimum image resolution (px) to accept on the client side */
export const MIN_IMAGE_DIMENSION_PX = 400

// --- Screening wizard ---
/** Maximum upload/retake attempts before offering "Flag for manual review" */
export const MAX_QUALITY_RETRIES = 3

// --- AI result ---
/** Below this confidence (0–1) show the "Low model confidence" warning */
export const LOW_CONFIDENCE_THRESHOLD = 0.6

// --- Analytics ---
/** Cell counts below this value are displayed as "<5" in analytics tables */
export const SMALL_COUNT_THRESHOLD = 5

// --- Polling ---
/** Base polling interval in ms for AI processing status */
export const POLLING_INTERVAL_MS = 3000

/** Polling timeout after which the "take too long" message appears (ms) */
export const POLLING_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 20

// --- Toasts ---
/** Auto-dismiss for success/info toasts (ms) */
export const TOAST_DURATION_MS = 4000

/** Auto-dismiss for error toasts (ms) — longer so users can read them */
export const TOAST_ERROR_DURATION_MS = 8000
