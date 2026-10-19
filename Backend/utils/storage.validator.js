/**
 * Storage and Clinical Image URL Validator
 * SEC-09: Enforce secure image storage contracts, strict hostname verification,
 * and protocol sanitization for retinal fundus images and XAI artifacts.
 */

// Approved Cloudinary host patterns: official delivery domains res.cloudinary.com or sharded res-[1-5].cloudinary.com
function isApprovedCloudinaryHost(hostname) {
  if (typeof hostname !== 'string') return false
  const lower = hostname.toLowerCase()
  return /^res(-[1-5])?\.cloudinary\.com$/.test(lower)
}

// Approved Azure Blob host patterns: <account>.blob.core.windows.net
function isApprovedAzureBlobHost(hostname) {
  const suffix = '.blob.core.windows.net'
  if (hostname.endsWith(suffix)) {
    const account = hostname.slice(0, -suffix.length)
    // Azure storage account names: 3-24 lowercase letters and numbers
    return /^[a-z0-9]{3,24}$/.test(account)
  }
  return false
}

// Development / Test loopback host patterns
function isLoopbackHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  )
}

// Test environment domain check (e.g., test fixtures using cloudinary.test or *.test)
function isAllowedTestHost(hostname) {
  if (process.env.NODE_ENV === 'production') return false
  return (
    hostname === 'cloudinary.test' ||
    hostname.endsWith('.test') ||
    hostname === 'local.test'
  )
}

/**
 * Validates a hostname against standard DNS rules (RFC 1035 / RFC 1123):
 * - Total length <= 253 chars
 * - At least 2 labels (domain + TLD)
 * - Each label: 1 to 63 chars, [a-z0-9] at boundaries, [a-z0-9-] in between
 * - No empty labels (no consecutive dots or leading/trailing dots)
 * - TLD cannot be purely numeric
 */
function isValidDnsHostname(hostname) {
  if (typeof hostname !== 'string' || !hostname || hostname.length > 253) return false
  const labels = hostname.split('.')
  if (labels.length < 2) return false
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) {
      return false
    }
  }
  // TLD cannot be purely numeric
  if (/^[0-9]+$/.test(labels[labels.length - 1])) {
    return false
  }
  return true
}

/**
 * Matches a hostname against a single ALLOWED_IMAGE_HOSTS pattern.
 * - Wildcard '*.domain.com' strictly matches subdomains of domain.com only (e.g. sub.domain.com).
 * - Root domain 'domain.com' is NOT matched by '*.domain.com'.
 * - Must match complete DNS-label boundaries and valid DNS labels.
 * - Exact patterns without '*.' match only identical valid hostnames.
 * - Malformed wildcard patterns (e.g. '*example.com', '*.*', trailing dots) are rejected safely.
 */
function matchesCustomAllowedHost(hostname, rawPattern) {
  if (!rawPattern || typeof rawPattern !== 'string' || !hostname || typeof hostname !== 'string') return false
  const pattern = rawPattern.trim().toLowerCase()
  const host = hostname.trim().toLowerCase()
  if (!pattern || !host) return false

  // Validate the hostname itself first against RFC DNS rules
  if (!isValidDnsHostname(host)) return false

  if (pattern.startsWith('*.')) {
    const root = pattern.slice(2)
    // Root must be a valid DNS hostname structure (e.g., example.com, pacs.hospital.org)
    if (!isValidDnsHostname(root)) {
      return false
    }

    const suffix = '.' + root
    if (host.endsWith(suffix)) {
      const prefix = host.slice(0, -suffix.length)
      if (!prefix) return false
      const prefixLabels = prefix.split('.')
      for (const l of prefixLabels) {
        if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(l)) {
          return false
        }
      }
      return true
    }
    return false
  }

  // Reject malformed patterns containing wildcards anywhere else
  if (pattern.includes('*')) {
    return false
  }

  // Exact pattern must also be a valid DNS hostname
  if (!isValidDnsHostname(pattern)) {
    return false
  }

  return host === pattern
}

/**
 * Validates a single image URL against secure storage policy.
 *
 * @param {string} urlString - URL string to validate
 * @param {Object} [options]
 * @param {boolean} [options.allowEmpty=true] - Whether null/empty values are accepted as omitted
 * @returns {{ valid: boolean, url?: string, provider?: string, hostname?: string, reason?: string }}
 */
function validateImageUrl(urlString, options = {}) {
  const allowEmpty = options.allowEmpty !== false

  if (urlString === undefined || urlString === null || urlString === '') {
    if (allowEmpty) {
      return { valid: true, url: '', provider: 'unknown' }
    }
    return { valid: false, reason: 'Image URL cannot be empty' }
  }

  if (typeof urlString !== 'string') {
    return { valid: false, reason: 'Image URL must be a string' }
  }

  const trimmed = urlString.trim()
  if (!trimmed) {
    if (allowEmpty) {
      return { valid: true, url: '', provider: 'unknown' }
    }
    return { valid: false, reason: 'Image URL cannot be blank' }
  }

  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, reason: 'Malformed URL structure' }
  }

  // 1. Reject embedded credentials (e.g., https://user:pass@host/path)
  if (parsed.username || parsed.password) {
    return { valid: false, reason: 'Embedded credentials in URL are prohibited' }
  }

  // 2. Reject dangerous schemes
  const protocol = parsed.protocol.toLowerCase()
  const dangerousProtocols = ['javascript:', 'data:', 'file:', 'ftp:', 'blob:', 'mailto:', 'vbscript:']
  if (dangerousProtocols.includes(protocol)) {
    return { valid: false, reason: `Dangerous URL scheme prohibited: ${protocol}` }
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const hostname = parsed.hostname.toLowerCase()

  // 3. Protocol enforcement: Require HTTPS in production; permit HTTP only for loopback/test in dev
  if (protocol === 'http:') {
    if (isProduction) {
      return { valid: false, reason: 'Insecure HTTP protocol is prohibited in production' }
    }
    const isLocalOrTest = isLoopbackHost(hostname) || isAllowedTestHost(hostname)
    if (!isLocalOrTest) {
      return { valid: false, reason: 'Insecure HTTP protocol is only permitted for local test hosts' }
    }
  } else if (protocol !== 'https:') {
    return { valid: false, reason: `Unsupported protocol scheme: ${protocol}. Only HTTPS is permitted.` }
  }

  // 4. Hostname validation and Provider resolution
  let provider = null

  if (isApprovedCloudinaryHost(hostname)) {
    provider = 'cloudinary'
  } else if (isApprovedAzureBlobHost(hostname)) {
    provider = 'azure_blob'
  } else if (isLoopbackHost(hostname) || isAllowedTestHost(hostname)) {
    provider = 'local'
  } else {
    // Check custom configured allowed image hosts
    const customAllowed = process.env.ALLOWED_IMAGE_HOSTS
      ? process.env.ALLOWED_IMAGE_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
      : []

    const matchesCustom = customAllowed.some((pattern) => matchesCustomAllowedHost(hostname, pattern))

    if (matchesCustom) {
      provider = 'external_secure'
    }
  }

  // Disallow untrusted external hosts that do not match an approved policy
  if (!provider) {
    return {
      valid: false,
      reason: `Hostname "${hostname}" is not recognized as an approved medical image storage provider`
    }
  }

  return {
    valid: true,
    url: parsed.href,
    provider,
    hostname
  }
}

/**
 * Validates and normalizes all screening image URLs in a screening payload.
 *
 * Checks all explicitly supplied candidates across canonical keys and aliases:
 * - Empty string candidates (or whitespace-only) are treated as omitted optional values.
 * - If ANY explicitly supplied candidate is invalid, validation FAILS (cannot be silently ignored).
 * - If multiple valid candidates are provided, the highest-precedence candidate wins.
 *
 * @param {Object} rawImages - Object containing image URLs or arrays of candidate URLs
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   sanitizedImages?: { originalUrl: string, heatmapUrl: string, gradcamUrl: string, lesionOverlayUrl: string },
 *   storageProvider?: 'azure_blob' | 'cloudinary' | 'local' | 'external_secure' | 'mixed' | 'unknown',
 *   providers?: { originalUrl?: string, heatmapUrl?: string, gradcamUrl?: string, lesionOverlayUrl?: string }
 * }}
 */
function validateScreeningImages(rawImages = {}) {
  const fields = [
    { key: 'originalUrl', aliases: ['originalUrl', 'original_url', 'original', 'fundusImage'] },
    { key: 'heatmapUrl', aliases: ['heatmapUrl', 'heatmap_url', 'heatmap', 'heatmapImage'] },
    { key: 'gradcamUrl', aliases: ['gradcamUrl', 'gradcam_url', 'gradcam', 'overlay_url'] },
    { key: 'lesionOverlayUrl', aliases: ['lesionOverlayUrl', 'lesion_overlay_url', 'lesionOverlay', 'overlay_url'] }
  ]

  const sanitized = {
    originalUrl: '',
    heatmapUrl: '',
    gradcamUrl: '',
    lesionOverlayUrl: ''
  }

  const providers = {}
  const activeProviders = new Set()

  for (const field of fields) {
    const candidates = []

    // 1. If an array was explicitly provided under field.key, inspect each entry in order
    if (Array.isArray(rawImages[field.key])) {
      for (let i = 0; i < rawImages[field.key].length; i++) {
        const val = rawImages[field.key][i]
        if (val !== undefined && val !== null) {
          candidates.push({ key: `${field.key}[${i}]`, value: val })
        }
      }
    } else {
      // 2. Otherwise collect from rawImages matching aliases in strict precedence order
      for (const alias of field.aliases) {
        if (rawImages[alias] !== undefined && rawImages[alias] !== null) {
          if (Array.isArray(rawImages[alias])) {
            for (let i = 0; i < rawImages[alias].length; i++) {
              const val = rawImages[alias][i]
              if (val !== undefined && val !== null) {
                candidates.push({ key: `${alias}[${i}]`, value: val })
              }
            }
          } else {
            candidates.push({ key: alias, value: rawImages[alias] })
          }
        }
      }
    }

    let resolvedUrl = ''
    let resolvedProvider = null

    for (const { key: candidateKey, value: rawVal } of candidates) {
      if (typeof rawVal !== 'string') {
        return {
          valid: false,
          error: `Invalid screening image URL for ${field.key} (from ${candidateKey}): Image URL must be a string`
        }
      }

      const trimmed = rawVal.trim()
      if (trimmed === '') {
        // Blank or whitespace-only is valid as an omitted optional value
        continue
      }

      // Non-empty URL: MUST be valid according to secure storage policy
      const result = validateImageUrl(trimmed, { allowEmpty: false })
      if (!result.valid) {
        return {
          valid: false,
          error: `Invalid screening image URL for ${field.key} (from ${candidateKey}): ${result.reason}`
        }
      }

      // First valid non-empty candidate in precedence order becomes the resolved URL
      if (!resolvedUrl) {
        resolvedUrl = result.url
        resolvedProvider = result.provider
      }
    }

    sanitized[field.key] = resolvedUrl
    if (resolvedProvider) {
      providers[field.key] = resolvedProvider
      activeProviders.add(resolvedProvider)
    }
  }

  let storageProvider = 'unknown'
  if (activeProviders.size === 1) {
    storageProvider = activeProviders.values().next().value
  } else if (activeProviders.size > 1) {
    storageProvider = 'mixed'
  }

  return {
    valid: true,
    sanitizedImages: sanitized,
    storageProvider,
    providers
  }
}

module.exports = {
  validateImageUrl,
  validateScreeningImages,
  matchesCustomAllowedHost,
  isValidDnsHostname,
  isApprovedCloudinaryHost,
  isApprovedAzureBlobHost,
  isLoopbackHost,
  isAllowedTestHost
}
