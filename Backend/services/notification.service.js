/**
 * Central Notification Service for e-Netra AI / Drishti (SIH26038).
 * Orchestrates Email and SMS dispatches across all domain lifecycle events.
 *
 * CONTACT PRIVACY & SECURITY POLICY:
 * - All email addresses and phone numbers in User and Profile models are UNVERIFIED.
 *   Neither email verification nor SMS OTP verification exists in the current system.
 * - Under no circumstances may sensitive account information (passwords, plaintext credentials,
 *   claim codes, claim code hashes, retinal images, AI diagnoses, or clinical findings)
 *   be dispatched through email or SMS notifications.
 * - Live notification mode is disabled by default (NOTIFICATION_MODE=demo).
 *
 * SAFETY & RESILIENCE RULES:
 * - Centralizes error handling so notification failures NEVER break controller business logic.
 * - Isolates channels synchronously and asynchronously so failures in one channel never block the other.
 * - Prevents unhandled promise rejections by settling promises safely via Promise.allSettled.
 * - A failed email channel must never mark a successful SMS channel as failed, and vice versa.
 * - Preserves separate emailResult and smsResult objects.
 * - Missing recipient contacts remain a successful skip, clearly identified with skipped: true.
 * - Enforces error privacy: never exposes raw provider exception messages, API keys, or full payloads.
 * - Dispatches asynchronously without stalling caller database operations.
 */

const emailService = require('./email.service');
const smsService = require('./sms.service');
const templates = require('./templates/notification.templates');
const { maskEmail, maskPhone } = require('../utils/mask.util');

/**
 * Internal dispatcher for email and SMS channels.
 * Runs channels concurrently with Promise.allSettled to prevent unhandled rejections.
 *
 * @param {Object} options
 * @param {string} [options.email] - Recipient email address
 * @param {string} [options.phone] - Recipient phone number
 * @param {Object} options.template - Rendered template { subject, html, text, sms }
 * @param {string} options.eventName - Name of domain event for logging
 * @returns {Promise<{ success: boolean, skipped: boolean, emailResult: Object|null, smsResult: Object|null }>}
 */
async function dispatchNotification({ email, phone, template, eventName }) {
  const result = {
    success: true,
    skipped: false,
    emailResult: null,
    smsResult: null
  };

  let emailAttempted = false;
  let smsAttempted = false;

  try {
    const channelTasks = [];

    // 1. Email channel
    const hasEmailTemplate = Boolean(template && template.subject && template.html);
    if (hasEmailTemplate) {
      if (email && typeof email === 'string' && email.trim().includes('@')) {
        emailAttempted = true;
        // Wrap in async IIFE to isolate synchronous throws from halting remaining channels
        channelTasks.push({
          channel: 'email',
          promise: (async () => {
            return await emailService.sendEmail({
              to: email.trim(),
              subject: template.subject,
              html: template.html,
              text: template.text
            });
          })()
        });
      } else {
        result.emailResult = {
          success: true,
          skipped: true,
          reason: 'No valid recipient email address provided'
        };
      }
    }

    // 2. SMS channel
    const hasSmsTemplate = Boolean(template && template.sms);
    if (hasSmsTemplate) {
      if (phone && typeof phone === 'string' && phone.trim().length >= 7) {
        smsAttempted = true;
        // Wrap in async IIFE to isolate synchronous throws from halting remaining channels
        channelTasks.push({
          channel: 'sms',
          promise: (async () => {
            return await smsService.sendSms({
              to: phone.trim(),
              message: template.sms
            });
          })()
        });
      } else {
        result.smsResult = {
          success: true,
          skipped: true,
          reason: 'No valid recipient phone number provided'
        };
      }
    }

    // If neither channel was attempted because contacts were missing
    if (!emailAttempted && !smsAttempted) {
      result.skipped = true;
      result.success = true;
      console.log(`[NotificationService:SKIPPED] No recipient contacts available for event "${eventName}". Safely skipped.`);
      return result;
    }

    // Execute attempted channels concurrently
    const settled = await Promise.allSettled(channelTasks.map((t) => t.promise));

    settled.forEach((outcome, index) => {
      const channel = channelTasks[index].channel;

      if (outcome.status === 'fulfilled') {
        const raw = outcome.value;
        const isValid = raw && typeof raw === 'object' && typeof raw.success === 'boolean';

        if (isValid) {
          if (channel === 'email') {
            result.emailResult = raw;
          } else {
            result.smsResult = raw;
          }
        } else {
          // Provider returned missing, null, or malformed result object
          console.error(`[NotificationService:ERROR] Invalid result object received from ${channel} provider during "${eventName}"`);
          if (channel === 'email') {
            result.emailResult = { success: false, error: 'Email notification failed' };
          } else {
            result.smsResult = { success: false, error: 'SMS notification failed' };
          }
        }
      } else {
        // Promise rejected: enforce safe generic error and never leave result null
        console.error(`[NotificationService:ERROR] Channel rejection occurred in ${channel} during "${eventName}"`);
        if (channel === 'email') {
          result.emailResult = { success: false, error: 'Email notification failed' };
        } else {
          result.smsResult = { success: false, error: 'SMS notification failed' };
        }
      }
    });

    // Ensure attempted channels never remain null
    if (emailAttempted && !result.emailResult) {
      result.emailResult = { success: false, error: 'Email notification failed' };
    }
    if (smsAttempted && !result.smsResult) {
      result.smsResult = { success: false, error: 'SMS notification failed' };
    }

    // Determine overall success:
    // All attempted channels must succeed; failure or rejection in any attempted channel sets success to false.
    let anyAttemptedFailed = false;
    if (emailAttempted && (!result.emailResult || result.emailResult.success === false)) {
      anyAttemptedFailed = true;
    }
    if (smsAttempted && (!result.smsResult || result.smsResult.success === false)) {
      anyAttemptedFailed = true;
    }

    result.success = !anyAttemptedFailed;

    console.log(
      `[NotificationService:EVENT] "${eventName}" processed (success: ${result.success}). email: ${maskEmail(email)}, phone: ${maskPhone(phone)}`
    );
  } catch (err) {
    // Top-level catch ensures caller never receives an unhandled error
    console.error(`[NotificationService:ERROR] Unexpected error during "${eventName}"`);
    result.success = false;

    // Mark only attempted channels as failed if their result has not already been assigned
    if (emailAttempted && !result.emailResult) {
      result.emailResult = { success: false, error: 'Email notification failed' };
    }
    if (smsAttempted && !result.smsResult) {
      result.smsResult = { success: false, error: 'SMS notification failed' };
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN EVENT NOTIFICATION DISPATCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Patient Self-Registration
 */
async function sendPatientRegistrationNotice({ email, phone, fullName, loginId }) {
  try {
    const template = templates.patientSelfRegistration({ fullName, loginId });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'PATIENT_SELF_REGISTRATION'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendPatientRegistrationNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 2. Staff Application Received (HCW / Doctor)
 */
async function sendStaffApplicationReceivedNotice({ email, phone, fullName, role }) {
  try {
    const template = templates.staffApplicationReceived({ fullName, role });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'STAFF_APPLICATION_RECEIVED'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendStaffApplicationReceivedNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 3. Google Profile Completion
 */
async function sendProfileCompletionNotice({ email, phone, fullName, role, loginId }) {
  try {
    const template = templates.googleProfileCompletion({ fullName, role, loginId });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'PROFILE_COMPLETION'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendProfileCompletionNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 4. Admin Verification Approval
 */
async function sendStaffApprovalNotice({ email, phone, fullName, role, loginId }) {
  try {
    const template = templates.adminApproval({ fullName, role, loginId });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'STAFF_VERIFICATION_APPROVED'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendStaffApprovalNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 5. Admin Verification Rejection
 */
async function sendStaffRejectionNotice({ email, phone, fullName, role, reason }) {
  try {
    const template = templates.adminRejection({ fullName, role, reason });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'STAFF_VERIFICATION_REJECTED'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendStaffRejectionNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 6. Field Patient Outreach Registration (SMS only if phone available)
 */
async function sendFieldPatientRegistrationNotice({ phone, fullName, patientId }) {
  try {
    const template = templates.fieldPatientRegistration({ fullName, patientId });
    return await dispatchNotification({
      phone,
      template,
      eventName: 'FIELD_PATIENT_REGISTERED'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendFieldPatientRegistrationNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

/**
 * 7. Patient Record Claimed
 */
async function sendPatientRecordClaimedNotice({ email, phone, fullName, patientId }) {
  try {
    const template = templates.patientRecordClaimed({ fullName, patientId });
    return await dispatchNotification({
      email,
      phone,
      template,
      eventName: 'PATIENT_RECORD_CLAIMED'
    });
  } catch (err) {
    console.error('[NotificationService:ERROR] sendPatientRecordClaimedNotice unexpected exception');
    return { success: false, error: 'Notification dispatch failed', emailResult: null, smsResult: null };
  }
}

module.exports = {
  dispatchNotification,
  sendPatientRegistrationNotice,
  sendStaffApplicationReceivedNotice,
  sendProfileCompletionNotice,
  sendStaffApprovalNotice,
  sendStaffRejectionNotice,
  sendFieldPatientRegistrationNotice,
  sendPatientRecordClaimedNotice
};
