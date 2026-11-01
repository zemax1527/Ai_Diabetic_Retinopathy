/**
 * Centralized native JavaScript / CommonJS schema validation library.
 * Zero external dependencies.
 *
 * Implements strict type checking, bounds enforcement, allowed enums,
 * explicit field allowlisting, and rejection of protected/unexpected fields.
 */

const PROTECTED_FIELDS = Object.freeze([
  'role',
  'claimStatus',
  'claimCodeHash',
  'isActive',
  'verificationStatus',
  'userId',
  'patientId',
  'loginId',
  '_id',
  'createdAt',
  'updatedAt'
]);

function string(opts = {}) {
  return {
    type: 'string',
    validate(val, path = 'field') {
      const label = opts.label || path;
      if (val === undefined || val === null) {
        if (opts.required) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: opts.default !== undefined ? opts.default : undefined };
      }

      if (typeof val !== 'string') {
        return { valid: false, error: opts.message || `${label} must be a string`, path };
      }

      const processed = opts.trim ? val.trim() : val;

      if (opts.required && processed === '') {
        return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
      }

      if (processed === '' && !opts.required) {
        return { valid: true, value: opts.default !== undefined ? opts.default : '' };
      }

      if (opts.min !== undefined && processed.length < opts.min) {
        return { valid: false, error: opts.message || `${label} must be at least ${opts.min} characters`, path };
      }

      if (opts.max !== undefined && processed.length > opts.max) {
        return { valid: false, error: opts.message || `${label} must not exceed ${opts.max} characters`, path };
      }

      if (opts.enum && !opts.enum.includes(processed)) {
        return { valid: false, error: opts.message || `Invalid ${label}. Allowed: ${opts.enum.join(', ')}`, path };
      }

      if (opts.pattern && !opts.pattern.test(processed)) {
        return { valid: false, error: opts.message || `Invalid format for ${label}`, path };
      }

      return { valid: true, value: processed };
    }
  };
}

function integer(opts = {}) {
  return {
    type: 'integer',
    validate(val, path = 'field') {
      const label = opts.label || path;
      if (val === undefined || val === null || val === '') {
        if (opts.required) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: opts.default !== undefined ? opts.default : undefined };
      }

      // Strict type check: do not silently coerce booleans, objects, arrays
      if (typeof val === 'boolean' || typeof val === 'object' || Array.isArray(val)) {
        return { valid: false, error: opts.message || `${label} must be an integer`, path };
      }

      let num = val;
      if (typeof val === 'string') {
        if (opts.coerce) {
          if (!/^-?\d+$/.test(val.trim())) {
            return { valid: false, error: opts.message || `${label} must be an integer`, path };
          }
          num = parseInt(val.trim(), 10);
        } else {
          return { valid: false, error: opts.message || `${label} must be an integer`, path };
        }
      }

      if (typeof num !== 'number' || isNaN(num) || !Number.isFinite(num) || !Number.isInteger(num)) {
        return { valid: false, error: opts.message || `${label} must be an integer`, path };
      }

      if (opts.min !== undefined && num < opts.min) {
        return { valid: false, error: opts.message || `${label} must be at least ${opts.min}`, path };
      }

      if (opts.max !== undefined && num > opts.max) {
        return { valid: false, error: opts.message || `${label} must be at most ${opts.max}`, path };
      }

      return { valid: true, value: num };
    }
  };
}

function number(opts = {}) {
  return {
    type: 'number',
    validate(val, path = 'field') {
      const label = opts.label || path;
      if (val === undefined || val === null || val === '') {
        if (opts.required) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: opts.default !== undefined ? opts.default : undefined };
      }

      if (typeof val === 'boolean' || typeof val === 'object' || Array.isArray(val)) {
        return { valid: false, error: opts.message || `${label} must be a number`, path };
      }

      let num = val;
      if (typeof val === 'string') {
        if (opts.coerce) {
          if (!/^-?\d+(\.\d+)?$/.test(val.trim())) {
            return { valid: false, error: opts.message || `${label} must be a number`, path };
          }
          num = parseFloat(val.trim());
        } else {
          return { valid: false, error: opts.message || `${label} must be a number`, path };
        }
      }

      if (typeof num !== 'number' || isNaN(num) || !Number.isFinite(num)) {
        return { valid: false, error: opts.message || `${label} must be a number`, path };
      }

      if (opts.min !== undefined && num < opts.min) {
        return { valid: false, error: opts.message || `${label} must be at least ${opts.min}`, path };
      }

      if (opts.max !== undefined && num > opts.max) {
        return { valid: false, error: opts.message || `${label} must be at most ${opts.max}`, path };
      }

      return { valid: true, value: num };
    }
  };
}

function date(opts = {}) {
  return {
    type: 'date',
    validate(val, path = 'field') {
      const label = opts.label || path;

      if (val === undefined || val === null || val === '') {
        if (opts.required) {
          return {
            valid: false,
            error: opts.requiredMessage || opts.message || `${label} is required`,
            path
          };
        }

        return {
          valid: true,
          value: opts.default !== undefined ? opts.default : undefined
        };
      }

      if (
        typeof val === 'boolean' ||
        Array.isArray(val) ||
        (typeof val === 'object' && !(val instanceof Date))
      ) {
        return {
          valid: false,
          error: opts.message || `Invalid ${label}`,
          path
        };
      }

      let d;

      if (val instanceof Date) {
        d = new Date(val.getTime());
      } else {
        // Accept only strict YYYY-MM-DD input
        if (typeof val !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return {
            valid: false,
            error: opts.message || `Invalid ${label}`,
            path
          };
        }

        const [year, month, day] = val.split('-').map(Number);

        d = new Date(Date.UTC(year, month - 1, day));

        // Reject impossible calendar dates
        if (
          d.getUTCFullYear() !== year ||
          d.getUTCMonth() !== month - 1 ||
          d.getUTCDate() !== day
        ) {
          return {
            valid: false,
            error: opts.message || `Invalid ${label}`,
            path
          };
        }
      }

      if (isNaN(d.getTime())) {
        return {
          valid: false,
          error: opts.message || `Invalid ${label}`,
          path
        };
      }

      if (opts.minYear !== undefined && d.getUTCFullYear() < opts.minYear) {
        return {
          valid: false,
          error: opts.message || `${label} year cannot be earlier than ${opts.minYear}`,
          path
        };
      }

      if (opts.pastOnly && d.getTime() > Date.now()) {
        return {
          valid: false,
          error: opts.futureMessage || opts.message || `${label} cannot be in the future`,
          path
        };
      }

      return { valid: true, value: d };
    }
  };
}


function objectId(opts = {}) {
  return {
    type: 'objectId',
    validate(val, path = 'id') {
      const label = opts.label || path;
      if (val === undefined || val === null || val === '') {
        if (opts.required !== false) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: undefined };
      }

      if (typeof val !== 'string' || !/^[0-9a-fA-F]{24}$/.test(val.trim())) {
        return { valid: false, error: opts.message || `Invalid ${label}`, path };
      }

      return { valid: true, value: val.trim() };
    }
  };
}

function boolean(opts = {}) {
  return {
    type: 'boolean',
    validate(val, path = 'field') {
      const label = opts.label || path;
      if (val === undefined || val === null) {
        if (opts.required) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: opts.default !== undefined ? opts.default : undefined };
      }

      if (typeof val !== 'boolean') {
        return { valid: false, error: opts.message || `${label} must be a boolean`, path };
      }

      return { valid: true, value: val };
    }
  };
}

function object(schemaMap = {}, opts = {}) {
  const allowUnknown = opts.allowUnknown === true;
  const disallowProtected = opts.disallowProtected !== false;

  return {
    type: 'object',
    validate(val, path = 'object') {
      const label = opts.label || path;
      if (val === undefined || val === null) {
        if (opts.required) {
          return { valid: false, error: opts.requiredMessage || opts.message || `${label} is required`, path };
        }
        return { valid: true, value: opts.default !== undefined ? opts.default : undefined };
      }

      if (typeof val !== 'object' || Array.isArray(val)) {
        return { valid: false, error: opts.message || `${label} must be an object`, path };
      }

      // Check for protected or unknown fields
      const incomingKeys = Object.keys(val);
      for (const key of incomingKeys) {
        if (disallowProtected && PROTECTED_FIELDS.includes(key) && !schemaMap.hasOwnProperty(key)) {
          return {
            valid: false,
            error: `Modifying protected field '${key}' is not permitted`,
            path: key
          };
        }

        if (!allowUnknown && !schemaMap.hasOwnProperty(key)) {
          return {
            valid: false,
            error: `Unknown field '${key}' is not permitted`,
            path: key
          };
        }
      }

      const sanitized = {};
      for (const key of Object.keys(schemaMap)) {
        const fieldValidator = schemaMap[key];
        const res = fieldValidator.validate(val[key], key);
        if (!res.valid) {
          return res;
        }
        if (res.value !== undefined) {
          sanitized[key] = res.value;
        }
      }

      return { valid: true, value: sanitized };
    }
  };
}

module.exports = {
  string,
  integer,
  number,
  date,
  objectId,
  boolean,
  object,
  PROTECTED_FIELDS
};
