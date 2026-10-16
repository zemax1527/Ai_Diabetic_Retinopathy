/**
 * Shared formatting utilities.
 */

/** Format an ISO date string to a human-readable date */
export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Format an ISO date string to date + time */
export function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Return a relative time string ("2 hours ago", "just now") */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—'
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7)  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  return formatDate(isoString)
}

/** Calculate age from a date-of-birth ISO string */
export function calculateAge(dobIso) {
  if (!dobIso) return null
  const dob = new Date(dobIso)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

/** Format confidence 0–1 as a percentage string */
export function formatConfidence(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

/** Format a file size in bytes to a human-readable string */
export function formatFileSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Suppress small counts per analytics privacy requirement */
export function suppressSmallCount(value, threshold = 5) {
  if (value == null) return '—'
  return value < threshold ? '<5' : value.toLocaleString('en-IN')
}
