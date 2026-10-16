/**
 * API Client — fetch wrapper
 *
 * - credentials: "include"  (HTTP-only cookie sessions)
 * - CSRF header placeholder (marked clearly)
 * - Normalizes errors into ApiError instances
 * - Does NOT store tokens in localStorage/sessionStorage
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function buildUrl(base, path) {
  if (!base) return path
  const cleanBase = base.replace(/\/+$/, '')
  let cleanPath = path.startsWith('/') ? path : `/${path}`

  // Prevent duplicate /api if both base and path specify /api
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4) // keeps leading slash
  }

  return `${cleanBase}${cleanPath}`
}

/**
 * Normalized API error thrown by the client
 */
export class ApiError extends Error {
  constructor(status, message, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Core fetch wrapper.
 *
 * @param {string} path
 * @param {RequestInit & { json?: unknown; multipart?: FormData }} [options]
 * @returns {Promise<unknown>}
 */
export async function apiRequest(path, options = {}) {
  const { json, multipart, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)

  // --- Bearer token (JWT in localStorage) ---
  // Attached automatically when the backend returns a token in the response body.
  // For cookie-based auth this block is never reached (no token in storage).
  const storedToken = localStorage.getItem('drishti_auth_token')
  if (storedToken) {
    headers.set('Authorization', `Bearer ${storedToken}`)
  }
  // -------------------------------------------

  // --- CSRF header placeholder ---
  // TODO: replace with the actual CSRF token header when the backend is ready.
  // The backend must provide the token (e.g. in a non-HTTP-only cookie or a meta tag).
  // NEVER read it from localStorage or hardcode it.
  // Example: headers.set('X-CSRF-Token', getCsrfTokenFromMeta())
  // --------------------------------

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    fetchOptions.body = JSON.stringify(json)
  }

  if (multipart !== undefined) {
    // Do NOT set Content-Type; the browser sets it with the boundary
    fetchOptions.body = multipart
  }

  let response
  try {
    const fullUrl = buildUrl(BASE_URL, path)
    response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      credentials: 'include', // HTTP-only cookie auth
    })
  } catch (networkError) {
    // Log technical detail in dev only; never expose to user
    if (import.meta.env.DEV) console.error('[API] Network error:', networkError)
    throw new ApiError(0, 'Network error. Check your connection and try again.', null)
  }

  if (!response.ok) {
    let errorData = null
    try { errorData = await response.json() } catch (_) { /* ignore */ }

    if (import.meta.env.DEV) {
      console.error(`[API] ${response.status} ${path}`, errorData)
    }

    const message = errorData?.message ?? defaultMessageForStatus(response.status)
    throw new ApiError(response.status, message, errorData)
  }

  // 204 No Content
  if (response.status === 204) return null

  return response.json()
}

function defaultMessageForStatus(status) {
  switch (status) {
    case 401: return 'Your session has expired. Please sign in again.'
    case 403: return 'You don\'t have permission to perform this action.'
    case 404: return 'The requested resource was not found.'
    case 429: return 'Too many requests. Please wait a moment and try again.'
    case 500: return 'A server error occurred. Please try again or contact support.'
    default:  return 'An unexpected error occurred. Please try again.'
  }
}

// Convenience methods
export const api = {
  get:    (path, opts)  => apiRequest(path, { method: 'GET', ...opts }),
  post:   (path, json, opts)  => apiRequest(path, { method: 'POST', json, ...opts }),
  patch:  (path, json, opts)  => apiRequest(path, { method: 'PATCH', json, ...opts }),
  put:    (path, json, opts)  => apiRequest(path, { method: 'PUT', json, ...opts }),
  delete: (path, opts)  => apiRequest(path, { method: 'DELETE', ...opts }),
  upload: (path, formData, opts) => apiRequest(path, { method: 'POST', multipart: formData, ...opts }),
}
