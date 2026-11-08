/**
 * Indian Mobile Phone Normalization & Validation Utility.
 * Follows TRAI National Numbering Plan specifications for Indian mobile numbers.
 *
 * Normalization behavior:
 * - 10-digit mobile number: '9876543210' -> '919876543210'
 * - Leading 0 (trunk code): '09876543210' -> '919876543210'
 * - International prefix:   '+91 98765 43210' -> '919876543210'
 * - Country code prefix:    '919876543210' -> '919876543210'
 *
 * Security & PII:
 * - Never logs phone numbers.
 * - Rejects non-string and malformed inputs.
 */

// Permitted characters in raw phone input: digits, whitespace, hyphens/dashes, parentheses, dots, plus
const PERMITTED_CHARS_REGEX = /^[+\d\s\-–—().]+$/;

// Valid Indian mobile subscriber number: 10 digits starting with 6, 7, 8, or 9
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Normalizes an Indian mobile phone number to 12-digit E.164 format (91XXXXXXXXXX).
 *
 * @param {string} rawPhone - Raw input phone number
 * @returns {string|null} - Normalized 12-digit string '91XXXXXXXXXX' or null if invalid
 */
function normalizeIndianPhone(rawPhone) {
  if (typeof rawPhone !== 'string') {
    return null;
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return null;
  }

  // Reject inputs with invalid characters (letters, symbols, etc.)
  if (!PERMITTED_CHARS_REGEX.test(trimmed)) {
    return null;
  }

  // If '+' is present:
  if (trimmed.includes('+')) {
    const plusCount = (trimmed.match(/\+/g) || []).length;
    if (plusCount !== 1) {
      return null;
    }

    const plusIndex = trimmed.indexOf('+');
    // No digits may appear before the '+'
    if (trimmed.slice(0, plusIndex).replace(/\D/g, '') !== '') {
      return null;
    }

    // Country code following '+' must be 91
    const digitsAfterPlus = trimmed.slice(plusIndex).replace(/\D/g, '');
    if (!digitsAfterPlus.startsWith('91')) {
      return null;
    }
  }

  // Extract all digits
  const digits = trimmed.replace(/\D/g, '');
  let mobile;

  if (digits.length === 10) {
    // 10-digit mobile number
    mobile = digits;
  } else if (digits.length === 11) {
    // 11 digits: must start with leading '0' trunk prefix
    if (digits[0] !== '0') {
      return null;
    }
    mobile = digits.slice(1);
  } else if (digits.length === 12) {
    // 12 digits: must start with '91' country code
    if (!digits.startsWith('91')) {
      return null;
    }
    mobile = digits.slice(2);
  } else {
    // Any other length is invalid
    return null;
  }

  // First digit of the 10-digit mobile number must be 6, 7, 8, or 9
  if (!INDIAN_MOBILE_REGEX.test(mobile)) {
    return null;
  }

  return `91${mobile}`;
}

/**
 * Validates whether an input is a valid Indian mobile phone number.
 *
 * @param {string} rawPhone - Raw input phone number
 * @returns {boolean} - true if valid Indian mobile phone, false otherwise
 */
function isValidIndianPhone(rawPhone) {
  return normalizeIndianPhone(rawPhone) !== null;
}

module.exports = {
  normalizeIndianPhone,
  isValidIndianPhone
};
