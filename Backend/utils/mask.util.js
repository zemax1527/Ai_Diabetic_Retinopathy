/**
 * Privacy and PII masking utilities.
 * Ensures email addresses, phone numbers, and secrets are never logged in plaintext.
 */

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[none]';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return '***';

  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '[none]';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  return '*'.repeat(Math.max(4, clean.length - 4)) + clean.slice(-4);
}

module.exports = {
  maskEmail,
  maskPhone
};