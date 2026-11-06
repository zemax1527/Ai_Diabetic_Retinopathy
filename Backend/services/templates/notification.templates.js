/**
 * Notification templates for e-Netra AI / Drishti (SIH26038).
 * Generates HTML, plaintext, and SMS messages for transactional notifications.
 *
 * CONTACT PRIVACY & SECURITY POLICY:
 * - All recipient contacts are UNVERIFIED. Neither email confirmation nor phone OTP
 *   verification exists in the current system.
 * - Under no circumstances may sensitive account information (passwords, claim codes,
 *   clinical diagnoses, retinal images) be dispatched via notifications.
 * - Always escape user-provided inputs to prevent HTML and SMS injection.
 * - Sanitize and limit admin rejection reasons.
 * - Live notification mode is disabled by default (NOTIFICATION_MODE=demo).
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeSmsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

function sanitizeRejectionReason(reason, maxLength = 250) {
  // Validate maxLength: accept only integers >= 3; otherwise use 250
  const validLimit = Number.isInteger(maxLength) && maxLength >= 3 ? maxLength : 250;

  const fallbackMessage = 'Application criteria were not met or credentials could not be verified.';

  let candidate = '';
  if (!reason || typeof reason !== 'string') {
    candidate = fallbackMessage;
  } else {
    // Strip script/style blocks, HTML tags, and control characters
    const cleaned = reason
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();

    candidate = cleaned || fallbackMessage;
  }

  if (candidate.length <= validLimit) {
    return candidate;
  }
  return candidate.slice(0, validLimit - 3) + '...';
}

function getRecipientName(fullName) {
  if (!fullName) return 'User';
  if (typeof fullName === 'string') return fullName.trim() || 'User';
  if (fullName.firstName) {
    return `${fullName.firstName}${fullName.lastName ? ' ' + fullName.lastName : ''}`.trim();
  }
  return 'User';
}

function roleToLabel(role) {
  switch (role) {
    case 'healthcare_worker':
      return 'Healthcare Worker';
    case 'doctor':
      return 'Doctor';
    case 'patient':
      return 'Patient';
    case 'admin':
      return 'Administrator';
    default:
      return 'User';
  }
}

/**
 * Common HTML wrapper layout
 */
function wrapHtml(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; color: #ffffff; padding: 20px 24px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .badge-box { background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
    .badge-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; }
    .badge-value { font-size: 16px; font-weight: 700; color: #0f172a; font-family: monospace; margin-top: 4px; }
    .footer { padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>e-Netra AI / Drishti</h1>
      <p>AI-Powered Tele-Ophthalmology &amp; Retinopathy Screening</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated notification from the Drishti platform sent to your registered contact. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Patient Self-Registration
 */
function patientSelfRegistration({ fullName, loginId }) {
  const name = getRecipientName(fullName);
  const safeName = escapeHtml(name);
  const safeLoginId = escapeHtml(loginId);
  const safeSmsLoginId = sanitizeSmsText(loginId);

  const subject = 'Welcome to Drishti – Your Patient ID';
  const html = wrapHtml(subject, `
    <p>Dear ${safeName},</p>
    <p>Welcome to <strong>e-Netra AI / Drishti</strong>. Your patient account has been created successfully.</p>
    <div class="badge-box">
      <div class="badge-label">Your Patient / Login ID</div>
      <div class="badge-value">${safeLoginId}</div>
    </div>
    <p>Please keep this Patient ID for visiting clinics, participating in vision screenings, or logging in to your patient portal.</p>
    <p>Stay healthy,<br>The Drishti Healthcare Team</p>
  `);

  const text = `Dear ${name},\n\nWelcome to e-Netra AI / Drishti. Your patient account has been created successfully.\n\nYour Patient / Login ID: ${loginId}\n\nPlease keep this Patient ID for visiting clinics or logging in to your patient portal.\n\nStay healthy,\nThe Drishti Healthcare Team`;
  const sms = `Welcome to Drishti! Your Patient ID is ${safeSmsLoginId}. Use this ID to access your portal or present it at your clinic.`;

  return { subject, html, text, sms };
}

/**
 * 2. Staff Application Received (HCW / Doctor)
 */
function staffApplicationReceived({ fullName, role }) {
  const name = getRecipientName(fullName);
  const roleLabel = roleToLabel(role);
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleLabel);
  const safeSmsRole = sanitizeSmsText(roleLabel);

  const subject = `Drishti – ${roleLabel} Verification Application Received`;
  const html = wrapHtml(subject, `
    <p>Dear ${safeName},</p>
    <p>Thank you for registering as a <strong>${safeRole}</strong> on the e-Netra AI / Drishti platform.</p>
    <p>Your application and credentials have been received and are currently pending verification by our clinical administration team.</p>
    <p>Once your account is verified, you will receive an approval notice along with your official Login ID to access clinical workflows.</p>
    <p>Regards,<br>Drishti Administration</p>
  `);

  const text = `Dear ${name},\n\nThank you for registering as a ${roleLabel} on the e-Netra AI / Drishti platform.\n\nYour application and credentials have been received and are currently pending administrator review.\n\nYou will receive an approval notice along with your official Login ID once verified.\n\nRegards,\nDrishti Administration`;
  const sms = `Drishti: Your ${safeSmsRole} registration has been received and is pending administrator review. You will be notified once verified.`;

  return { subject, html, text, sms };
}

/**
 * 3. Google Profile Completion
 */
function googleProfileCompletion({ fullName, role, loginId }) {
  const name = getRecipientName(fullName);
  const roleLabel = roleToLabel(role);
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleLabel);
  const isPatient = role === 'patient';
  const safeSmsLoginId = sanitizeSmsText(loginId);
  const safeSmsRole = sanitizeSmsText(roleLabel);

  const subject = isPatient
    ? 'Drishti – Profile Completed Successfully'
    : `Drishti – ${roleLabel} Credentials Submitted`;

  const bodyHtml = isPatient
    ? `
      <p>Dear ${safeName},</p>
      <p>Your Google-linked patient profile has been set up successfully on e-Netra AI / Drishti.</p>
      <div class="badge-box">
        <div class="badge-label">Your Patient / Login ID</div>
        <div class="badge-value">${escapeHtml(loginId)}</div>
      </div>
      <p>You can now use your patient portal to track screening history and view consultations.</p>
    `
    : `
      <p>Dear ${safeName},</p>
      <p>Your professional profile details for the <strong>${safeRole}</strong> role have been submitted for administrator review.</p>
      <p>You will be notified once our team completes credential verification.</p>
    `;

  const html = wrapHtml(subject, bodyHtml + '<p>Regards,<br>The Drishti Team</p>');
  const text = isPatient
    ? `Dear ${name},\n\nYour Google-linked patient profile has been set up successfully.\nYour Patient / Login ID: ${loginId}\n\nRegards,\nThe Drishti Team`
    : `Dear ${name},\n\nYour ${roleLabel} profile details have been submitted for administrator review.\n\nRegards,\nThe Drishti Team`;
  const sms = isPatient
    ? `Drishti: Your profile setup is complete. Your Patient ID is ${safeSmsLoginId}.`
    : `Drishti: Your ${safeSmsRole} profile details have been submitted for administrator verification.`;

  return { subject, html, text, sms };
}

/**
 * 4. Admin Verification Approval
 */
function adminApproval({ fullName, role, loginId }) {
  const name = getRecipientName(fullName);
  const roleLabel = roleToLabel(role);
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleLabel);
  const safeLoginId = escapeHtml(loginId);
  const safeSmsLoginId = sanitizeSmsText(loginId);
  const safeSmsRole = sanitizeSmsText(roleLabel);

  const subject = `Drishti Account Verified – Your ${roleLabel} Login ID`;
  const html = wrapHtml(subject, `
    <p>Dear ${safeName},</p>
    <p>Congratulations! Your application for the <strong>${safeRole}</strong> role has been verified and approved by a Drishti administrator.</p>
    <div class="badge-box">
      <div class="badge-label">Your Official Login ID</div>
      <div class="badge-value">${safeLoginId}</div>
    </div>
    <p>You may now log in to the portal using your credentials and assigned Login ID to access clinical and outreach workflows.</p>
    <p>Warm regards,<br>Drishti Clinical Administration</p>
  `);

  const text = `Dear ${name},\n\nCongratulations! Your application for the ${roleLabel} role has been approved by a Drishti administrator.\n\nYour Official Login ID: ${loginId}\n\nYou may now log in to the portal using your credentials.\n\nWarm regards,\nDrishti Clinical Administration`;
  const sms = `Drishti: Your ${safeSmsRole} account is approved! Your Login ID is ${safeSmsLoginId}. You may now log in to the portal.`;

  return { subject, html, text, sms };
}

/**
 * 5. Admin Verification Rejection
 */
function adminRejection({ fullName, role, reason }) {
  const name = getRecipientName(fullName);
  const roleLabel = roleToLabel(role);
  const cleanReason = sanitizeRejectionReason(reason);
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleLabel);
  const safeReason = escapeHtml(cleanReason);
  const safeSmsReason = sanitizeSmsText(cleanReason);
  const safeSmsRole = sanitizeSmsText(roleLabel);

  const subject = `Drishti – ${roleLabel} Verification Status Update`;
  const html = wrapHtml(subject, `
    <p>Dear ${safeName},</p>
    <p>Thank you for your interest in joining the e-Netra AI / Drishti clinical platform as a <strong>${safeRole}</strong>.</p>
    <p>After reviewing your submitted credentials, our administration team was unable to approve your application at this time.</p>
    <div class="badge-box" style="border-left-color: #ef4444;">
      <div class="badge-label" style="color: #991b1b;">Review Remarks</div>
      <p style="margin: 4px 0 0; font-size: 14px; color: #334155;">${safeReason}</p>
    </div>
    <p>If you believe this was an error or wish to provide updated documentation, please contact your state medical coordinator or platform administrator.</p>
    <p>Regards,<br>Drishti Administration</p>
  `);

  const text = `Dear ${name},\n\nYour application for the ${roleLabel} role could not be approved at this time.\n\nReview Remarks: ${cleanReason}\n\nIf you have questions, please contact platform administration.\n\nRegards,\nDrishti Administration`;
  const sms = `Drishti: Your ${safeSmsRole} verification was not approved. Remarks: ${safeSmsReason}`;

  return { subject, html, text, sms };
}

/**
 * 6. Field Patient Outreach Registration (SMS only)
 */
function fieldPatientRegistration({ fullName, patientId }) {
  const safePatientId = sanitizeSmsText(patientId || 'your patient record');

  // Field outreach patients do not have email accounts initially. SMS notification only.
  const sms = `Welcome to Drishti Outreach Camp! Your Patient ID is ${safePatientId}. Please retain the physical screening slip issued by the health worker.`;

  return {
    subject: 'Drishti Outreach Registration',
    html: wrapHtml('Drishti Outreach Registration', `<p>Welcome to Drishti Outreach Camp. Your Patient ID is <strong>${escapeHtml(safePatientId)}</strong>.</p>`),
    text: `Welcome to Drishti Outreach Camp. Your Patient ID is ${safePatientId}.`,
    sms
  };
}

/**
 * 7. Patient Record Claimed
 */
function patientRecordClaimed({ fullName, patientId }) {
  const name = getRecipientName(fullName);
  const safeName = escapeHtml(name);
  const safePatientId = escapeHtml(patientId);
  const safeSmsPatientId = sanitizeSmsText(patientId);

  const subject = 'Drishti – Outreach Screening Record Linked Successfully';
  const html = wrapHtml(subject, `
    <p>Dear ${safeName},</p>
    <p>Your outreach screening record (Patient ID: <strong>${safePatientId}</strong>) has been successfully claimed and linked to your Drishti account.</p>
    <p>All past camp screening sessions and future follow-up consultations associated with this record are now available in your patient dashboard.</p>
    <p>Stay healthy,<br>The Drishti Healthcare Team</p>
  `);

  const text = `Dear ${name},\n\nYour outreach screening record (${patientId}) has been successfully claimed and linked to your Drishti account.\n\nYou can now view your past camp screening sessions in your dashboard.\n\nStay healthy,\nThe Drishti Healthcare Team`;
  const sms = `Drishti: Outreach record ${safeSmsPatientId} has been successfully claimed and linked to your patient account.`;

  return { subject, html, text, sms };
}

module.exports = {
  escapeHtml,
  sanitizeSmsText,
  sanitizeRejectionReason,
  patientSelfRegistration,
  staffApplicationReceived,
  googleProfileCompletion,
  adminApproval,
  adminRejection,
  fieldPatientRegistration,
  patientRecordClaimed
};
