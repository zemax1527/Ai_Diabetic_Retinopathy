/**
 * Email Service for e-Netra AI / Drishti (SIH26038).
 * Powered by Resend with CommonJS architecture and isolated Demo mode.
 *
 * CONTACT PRIVACY & SECURITY POLICY:
 * - All email addresses are UNVERIFIED. Neither email confirmation nor OTP verification
 *   is implemented in the current system.
 * - Under no circumstances may sensitive account information (passwords, claim codes,
 *   clinical diagnoses, retinal images) be dispatched via email.
 * - Live notification mode is disabled by default (NOTIFICATION_MODE=demo).
 * - In demo mode (NOTIFICATION_MODE=demo or EMAIL_PROVIDER=demo), NEVER make external network calls.
 * - Never log raw API keys, full email addresses, passwords, subject lines, or full payloads.
 * - Always catch errors and return an explicit result object rather than throwing.
 */

const { Resend } = require('resend');
const { maskEmail } = require('../utils/mask.util');

let resendClient = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    resendClient = new Resend(process.env.RESEND_API_KEY.trim());
  }
  return resendClient;
}

/**
 * Resets cached Resend client instance (primarily for isolated unit tests).
 */
function resetClient() {
  resendClient = null;
}

/**
 * Sends an email or simulates delivery in demo mode.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body fallback
 * @returns {Promise<{ success: boolean, mode: string, id?: string, error?: string }>}
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { success: false, mode: 'invalid', error: 'Invalid recipient email address' };
  }

  const notificationMode = (process.env.NOTIFICATION_MODE || 'demo').trim().toLowerCase();
  const rawEmailProv = process.env.EMAIL_PROVIDER ? process.env.EMAIL_PROVIDER.trim().toLowerCase() : '';
  const emailProvider = rawEmailProv && rawEmailProv !== 'undefined'
    ? rawEmailProv
    : (notificationMode === 'live' ? 'resend' : 'demo');

  // 1. Validate EMAIL_PROVIDER explicitly: reject any unsupported provider
  if (emailProvider !== 'demo' && emailProvider !== 'resend') {
    console.error(`[EmailService:UNSUPPORTED] Unsupported email provider "${emailProvider}".`);
    return {
      success: false,
      mode: 'unsupported',
      error: `Unsupported email provider: ${emailProvider}`
    };
  }

  // 2. Use Resend only when NOTIFICATION_MODE=live and EMAIL_PROVIDER=resend
  if (notificationMode === 'live' && emailProvider === 'resend') {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_API_KEY.trim()) {
      console.error(`[EmailService:CONFIG_ERROR] RESEND_API_KEY is not configured for live email delivery to ${maskEmail(to)}.`);
      return {
        success: false,
        mode: 'resend',
        error: 'RESEND_API_KEY is not configured for live email delivery'
      };
    }

    try {
      const client = getResendClient();
      if (!client) {
        console.error(`[EmailService:CONFIG_ERROR] Failed to initialize Resend client for ${maskEmail(to)}.`);
        return {
          success: false,
          mode: 'resend',
          error: 'Failed to initialize Resend client'
        };
      }

      const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const response = await client.emails.send({
        from: fromAddress,
        to: to.trim(),
        subject,
        html,
        text: text || ''
      });

      if (response.error) {
        console.error(`[EmailService:ERROR] Resend API rejected message to ${maskEmail(to)}:`, response.error.message || response.error);
        return {
          success: false,
          mode: 'resend',
          error: response.error.message || 'Resend delivery failed'
        };
      }

      const emailId = response.data?.id || `resend-${Date.now()}`;
      console.log(`[EmailService:LIVE] Email dispatched successfully to ${maskEmail(to)} (id: ${emailId})`);
      return {
        success: true,
        mode: 'resend',
        id: emailId
      };
    } catch (err) {
      console.error(`[EmailService:EXCEPTION] Exception during email delivery to ${maskEmail(to)}:`, err.message);
      return {
        success: false,
        mode: 'resend',
        error: err.message
      };
    }
  }

  // 3. Demo mode: simulate delivery (zero external network calls, log only masked recipient & mock id)
  const mockId = `demo-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  console.log(`[EmailService:DEMO] Simulating email delivery to ${maskEmail(to)} (id: ${mockId})`);
  return {
    success: true,
    mode: 'demo',
    id: mockId
  };
}

module.exports = {
  sendEmail,
  resetClient
};
