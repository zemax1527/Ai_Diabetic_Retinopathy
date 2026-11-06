/**
 * SMS Service for e-Netra AI / Drishti (SIH26038).
 * Supports Demo mode and modular pluggable provider structure (e.g. MSG91).
 *
 * CONTACT PRIVACY & SECURITY POLICY:
 * - All recipient phone numbers are UNVERIFIED. Neither SMS OTP nor phone verification
 *   is implemented in the current system.
 * - Under no circumstances may sensitive account information (passwords, claim codes,
 *   clinical diagnoses, retinal images) be dispatched via SMS.
 * - Live notification mode is disabled by default (NOTIFICATION_MODE=demo).
 * - In demo mode (NOTIFICATION_MODE=demo or SMS_PROVIDER=demo), NEVER make external network calls.
 * - Never log raw phone numbers, passwords, claim codes, or full message bodies.
 * - Always catch errors and return an explicit result object rather than throwing.
 */

const { maskPhone } = require('../utils/mask.util');

/**
 * Sends an SMS message or simulates dispatch in demo mode.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Short text message
 * @returns {Promise<{ success: boolean, provider: string, id?: string, error?: string }>}
 */
async function sendSms({ to, message }) {
  if (!to || typeof to !== 'string') {
    return { success: false, provider: 'none', error: 'Recipient phone number is required' };
  }

  const cleanPhone = to.trim();
  if (cleanPhone.length < 7) {
    return { success: false, provider: 'none', error: 'Invalid recipient phone number length' };
  }
  if (typeof message !== 'string' || !message.trim()) {
  return {
    success: false,
    provider: 'none',
    error: 'A valid SMS message is required'
  };
}

 const notificationMode = (process.env.NOTIFICATION_MODE || 'demo').trim().toLowerCase();
const smsProvider = (process.env.SMS_PROVIDER || 'demo').trim().toLowerCase();
  const isDemo = smsProvider === 'demo' || notificationMode === 'demo';

  if (isDemo) {
    const mockId = `demo-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[SmsService:DEMO] Simulating SMS dispatch to ${maskPhone(cleanPhone)} (chars: ${message ? message.length : 0}, id: ${mockId})`);
    return {
      success: true,
      provider: 'demo',
      id: mockId
    };
  }

  // Live provider: MSG91 (not yet implemented with real API gateway)
  if (smsProvider === 'msg91') {
    console.error(`[SmsService:UNSUPPORTED] MSG91 SMS provider integration is not yet implemented.`);
    return {
      success: false,
      provider: 'msg91',
      error: 'MSG91 SMS provider integration is not yet implemented'
    };
  }

  // Any other unsupported or unknown live provider
  console.error(`[SmsService:UNSUPPORTED] Unsupported SMS provider "${smsProvider}".`);
  return {
    success: false,
    provider: smsProvider,
    error: `Unsupported SMS provider: ${smsProvider}`
  };
}

module.exports = {
  sendSms
};
